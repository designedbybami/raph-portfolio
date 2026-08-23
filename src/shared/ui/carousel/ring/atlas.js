import * as THREE from "three";

// Cell aspect matches the plane's real 4:5 portrait so nothing is distorted.
const CELL_H = 512;
const CELL_W = Math.round(CELL_H * 0.8);

const loadOnce = (src, priority) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    // Before src, or the request is already away. Without it the canvas is tainted and WebGL refuses to upload it.
    img.crossOrigin = "anonymous";
    if (priority) img.fetchPriority = priority;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });

// A cold Sanity transform can drop the connection before it finishes; the retry lands on the cached result.
const load = (src, priority) => loadOnce(src, priority).catch(() => loadOnce(src, priority));

/**
 * Packs every image into one texture, because ESSL 1.00 cannot index an array
 * of samplers with a non-constant index. Returns synchronously with the sheet
 * blank so the caller has something to bind on frame one; `first` settles once
 * cell 0 is on the texture, `ready` once all are. Neither rejects, so one bad
 * path leaves a blank cell rather than stranding the entry.
 */
export function buildAtlas(files, onProgress) {
  const cols = Math.ceil(Math.sqrt(files.length));
  const rows = Math.ceil(files.length / cols);

  const canvas = document.createElement("canvas");
  canvas.width = cols * CELL_W;
  canvas.height = rows * CELL_H;
  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);
  // The shader flips each cell itself, so leave the sheet as drawn.
  texture.flipY = false;
  // The shader writes straight to the framebuffer with no encoding step, so decoding on read would wash everything out.
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  const paint = (img, i) => {
    const x = (i % cols) * CELL_W;
    const y = Math.floor(i / cols) * CELL_H;

    // Cover fit: fill the cell, crop the overflow, never squash.
    const scale = Math.max(CELL_W / img.width, CELL_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, CELL_W, CELL_H); // clip, or an oversized image bleeds
    ctx.clip();
    ctx.drawImage(img, x + (CELL_W - dw) / 2, y + (CELL_H - dh) / 2, dw, dh);
    ctx.restore();
  };

  let settled = 0;
  const tick = () => onProgress?.(settled / files.length);

  const fetchInto = (i, priority) =>
    load(/^https?:\/\//.test(files[i]) ? files[i] : `/${files[i]}`, priority)
      .then((img) => paint(img, i))
      .catch((err) => console.warn("[atlas]", err.message))
      .finally(() => {
        settled++;
        tick();
      });

  // Cell 0 is the seed's own art, so it jumps the queue and uploads on arrival.
  const first = fetchInto(0, "high").then(() => {
    texture.needsUpdate = true;
  });

  // One upload for the rest: marking dirty per image re-sends the whole sheet.
  const ready = Promise.all([
    first,
    ...files.slice(1).map((_, k) => fetchInto(k + 1, "low")),
  ]).then(() => {
    texture.needsUpdate = true;
  });

  tick();
  return { texture, grid: [cols, rows], count: files.length, first, ready };
}
