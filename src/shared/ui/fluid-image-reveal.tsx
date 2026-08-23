"use client";

import { gsap } from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";

const CAMERA_FOV = 35;
const PLANE_SEGMENTS = 128;

const vertexShader = `
varying vec2 vUv;

void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 clipPosition = projectionMatrix * viewPosition;
    gl_Position = clipPosition;
    vUv = uv;
}
`;

// Ported from originkit.dev's Fluid Image Reveal (`BlobReveal`) — an organic blob mask that grows from the center, revealing the image through it.
const fragmentShader = `
varying vec2 vUv;
uniform float uProgress;
uniform vec2 uSize;           // Container size in pixels
uniform vec2 uImageSize;      // Image dimensions, for aspect-correct cropping
uniform sampler2D uTexture;
uniform int uBlobCount;
uniform float uFitCover;      // 1 = cover (fill+crop), 0 = contain (fit+letterbox)
#define PI 3.1415926538
#define TWO_PI 6.28318530718

// Angle-based noise so the blob edge looks organic rather than a perfect circle.
float noise(vec2 point) {
    float angle = atan(point.y, point.x) + uProgress * PI;
    float w0 = (cos(angle) + 1.0) / 2.0;
    float w1 = (sin(2.0 * angle) + 1.0) / 2.0;
    float w2 = (cos(3.0 * angle) + 1.0) / 2.0;
    return (w0 + w1 + w2) / 3.0;
}

float softMax(float a, float b, float k) {
    return log(exp(k * a) + exp(k * b)) / k;
}

// Blends two SDFs into one shape instead of a hard union.
float softMin(float a, float b, float k) {
    return -softMax(-a, -b, k);
}

float circleSDF(vec2 pos, float rad) {
    float amt = 0.5 + sin(uProgress * 0.2) * 0.25;
    return length(pos) + noise(pos) * rad * amt;
}

void main() {
    vec4 bg = vec4(0.0);

    vec2 coverUV = vUv;
    if (uSize.x > 0.0 && uSize.y > 0.0 && uImageSize.x > 0.0 && uImageSize.y > 0.0) {
        float containerAspect = uSize.x / uSize.y;
        float imageAspect = uImageSize.x / uImageSize.y;
        vec2 scale = vec2(1.0);
        if (uFitCover > 0.5) {
            if (containerAspect > imageAspect) scale.y = imageAspect / containerAspect;
            else scale.x = containerAspect / imageAspect;
        } else {
            if (containerAspect > imageAspect) scale.x = containerAspect / imageAspect;
            else scale.y = imageAspect / containerAspect;
        }
        coverUV = (vUv - 0.5) * scale + 0.5;
    }

    vec4 texture = texture2D(uTexture, coverUV);
    if (uFitCover < 0.5 &&
        (coverUV.x < 0.0 || coverUV.x > 1.0 || coverUV.y < 0.0 || coverUV.y > 1.0)) {
        texture = vec4(0.0);
    }

    vec2 coords = vUv * uSize;
    vec2 center = vec2(0.5) * uSize;

    // Eased progress + full-diagonal radius so the mask always ends up covering the frame.
    float t = pow(uProgress, 2.5);
    float maxDim = sqrt(uSize.x * uSize.x + uSize.y * uSize.y);
    float rad = t * maxDim;

    float circle = circleSDF(coords - center, rad);
    float k = 50.0 / max(uSize.x, uSize.y);

    int extraBlobs = uBlobCount - 1;
    for (int i = 0; i < 20; i++) {
        if (i >= extraBlobs) break;
        float idx = float(i);
        float total = float(extraBlobs);

        // Evenly spaced around the center with a per-blob pseudo-random jitter.
        float baseAngle = idx * TWO_PI / max(total, 1.0);
        float jitter = fract(sin(idx * 127.1 + 311.7) * 43758.5453) * 0.5 - 0.25;
        float angle = baseAngle + jitter;
        float distRatio = 0.25 + 0.2 * fract(sin(idx * 43.3) * 12345.6);
        vec2 offset = vec2(cos(angle), sin(angle)) * distRatio * min(uSize.x, uSize.y);

        float blobDist = length(coords - center - offset);
        float blobNoise = noise(coords - center - offset) * rad * 0.4;
        circle = softMin(circle, blobDist + blobNoise, k);
    }

    circle = step(circle, rad);
    gl_FragColor = mix(bg, texture, circle);
}
`;

function cameraDistance(height: number, fov: number): number {
  const h = Math.max(height, 1);
  const r = (fov * Math.PI) / 360;
  return h / 2 / Math.tan(r) || 1;
}

function fitCamera(camera: PerspectiveCamera, width: number, height: number) {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  camera.aspect = w / h;
  camera.fov = CAMERA_FOV;
  camera.position.set(0, 0, cameraDistance(h, camera.fov));
  camera.updateProjectionMatrix();
}

type Ease = "linear" | "easeIn" | "easeOut" | "easeInOut";
type Fit = "cover" | "contain";

const NAMED_EASES: Record<Ease, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

function cubicBezierEase(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (p: number) => {
    let t = p;
    for (let i = 0; i < 8; i++) {
      const x = sampleX(t) - p;
      const d = dX(t);
      if (Math.abs(x) < 1e-4 || Math.abs(d) < 1e-6) break;
      t -= x / d;
    }
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return sampleY(t);
  };
}

interface FluidImageRevealProps {
  src: string;
  fit?: Fit;
  blobCount?: number;
  // Only the hero itself is ever fed into this component, always above the fold on mount, so unlike the upstream component this always plays once and never resets.
  duration?: number;
  delay?: number;
  ease?: Ease;
  // Painted behind the transparent parts of the mask. Opaque by default so this can sit over the real <img> and hide it until the blob has revealed it.
  background?: string;
  style?: CSSProperties;
  className?: string;
  onReady?: () => void;
  // WebGL context creation can throw (unsupported/exhausted); the caller falls back to a plain <img>.
  onUnavailable?: () => void;
}

export function FluidImageReveal({
  src,
  fit = "cover",
  blobCount = 20,
  duration = 1.8,
  delay = 0,
  ease = "easeOut",
  background = "#000",
  style,
  className,
  onReady,
  onUnavailable,
}: FluidImageRevealProps) {
  // Latest-ref pattern: callers pass inline arrows, and a changing identity in a dep array here would tear down the GPU context and restart the reveal mid-flight.
  const onReadyRef = useRef(onReady);
  const onUnavailableRef = useRef(onUnavailable);
  // No dep array: re-runs every render, and being declared first it lands before the effects below read the refs on the same commit.
  useEffect(() => {
    onReadyRef.current = onReady;
    onUnavailableRef.current = onUnavailable;
  });

  const easeFn = useMemo(() => {
    const b = NAMED_EASES[ease] ?? NAMED_EASES.easeOut;
    return cubicBezierEase(b[0], b[1], b[2], b[3]);
  }, [ease]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const meshRef = useRef<Mesh<PlaneGeometry, ShaderMaterial> | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafIdRef = useRef<number | null>(null);
  const renderingRef = useRef(false);
  const startedRef = useRef(false);

  const [textureReady, setTextureReady] = useState(false);

  const initThree = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    } catch (error) {
      console.warn("[fluid-image-reveal] WebGL unavailable, skipping the reveal:", error);
      onUnavailableRef.current?.();
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 2000);
    fitCamera(camera, width, height);

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const geometry = new PlaneGeometry(width, height, PLANE_SEGMENTS, PLANE_SEGMENTS);
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uProgress: { value: 0 },
        uSize: { value: new Vector2(width, height) },
        uImageSize: { value: new Vector2(1, 1) },
        uTexture: { value: null },
        uBlobCount: { value: Math.min(20, Math.max(1, Math.round(blobCount))) },
        uFitCover: { value: fit === "contain" ? 0 : 1 },
      },
    });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    meshRef.current = mesh;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilding the mesh mid-reveal would restart it; blobCount/fit only matter at init.
  }, []);

  const renderOnce = useCallback(() => {
    // Nothing paints before the tween starts. Otherwise the texture load (and the ResizeObserver's first fire) draw uProgress 0, a visible speck that then sits frozen for the whole delay before the reveal picks it up.
    if (!startedRef.current) return;
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  const startLoop = useCallback(() => {
    renderingRef.current = true;
    const loop = () => {
      renderOnce();
      rafIdRef.current = renderingRef.current ? requestAnimationFrame(loop) : null;
    };
    if (rafIdRef.current == null) rafIdRef.current = requestAnimationFrame(loop);
  }, [renderOnce]);

  const stopLoop = useCallback(() => {
    renderingRef.current = false;
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const resize = useCallback(
    (width: number, height: number) => {
      if (!cameraRef.current || !rendererRef.current || !meshRef.current) return;
      fitCamera(cameraRef.current, width, height);
      rendererRef.current.setSize(width, height, false);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = new PlaneGeometry(width, height, PLANE_SEGMENTS, PLANE_SEGMENTS);
      meshRef.current.material.uniforms.uSize.value.set(width, height);
      renderOnce();
    },
    [renderOnce],
  );

  useEffect(() => {
    initThree();
    return () => {
      stopLoop();
      const mesh = meshRef.current;
      if (mesh) {
        mesh.geometry.dispose();
        mesh.material.uniforms.uTexture.value?.dispose();
        mesh.material.dispose();
      }
      sceneRef.current?.clear();
      // Deliberately not forceContextLoss(): it kills the context permanently, and Strict Mode's remount reuses this same canvas, so the second init gets a dead one. dispose() frees the GL resources; the context goes with the canvas.
      rendererRef.current?.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      meshRef.current = null;
    };
  }, [initThree, stopLoop]);

  useEffect(() => {
    if (!meshRef.current) return;
    setTextureReady(false);
    new TextureLoader().load(
      src,
      (texture) => {
        const material = meshRef.current?.material;
        if (!material) return;
        const w = texture.image?.width || 1;
        const h = texture.image?.height || 1;
        material.uniforms.uImageSize.value.set(w, h);
        material.uniforms.uTexture.value = texture;
        setTextureReady(true);
        renderOnce();
      },
      undefined,
      () => {
        // Usually CORS: a texture fetch can't reuse a plain <img>'s cached response, so the caller's image needs crossOrigin="anonymous" too.
        console.warn("[fluid-image-reveal] texture failed, skipping the reveal:", src);
        onUnavailableRef.current?.();
      },
    );
  }, [src, renderOnce]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      const size = sizeRef.current;
      if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) {
        sizeRef.current = { width, height };
        resize(width, height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [resize]);

  useEffect(() => {
    if (!textureReady || !meshRef.current) return;
    const material = meshRef.current.material;
    // The loop only starts with the tween, so the delay costs no frames.
    const tween = gsap.to(material.uniforms.uProgress, {
      value: 1,
      duration,
      delay,
      ease: easeFn,
      onStart: () => {
        startedRef.current = true;
        startLoop();
      },
      onUpdate: renderOnce,
      onComplete: () => {
        renderOnce();
        stopLoop();
        onReadyRef.current?.();
      },
    });
    return () => {
      tween.kill();
      stopLoop();
      startedRef.current = false;
    };
  }, [textureReady, duration, delay, easeFn, renderOnce, startLoop, stopLoop]);

  // Decorative: the caller keeps the real <img> underneath, which carries the alt text.
  return (
    <div ref={containerRef} aria-hidden="true" className={className} style={style}>
      <canvas ref={canvasRef} className="block h-full w-full" style={{ background }} />
    </div>
  );
}
