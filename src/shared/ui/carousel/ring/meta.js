import gsap from "gsap";

/**
 * The two lockups either side of the ring, both reading the front-facing card.
 * Changing card melts one set of words into the next: two stacked copies, one
 * blurring out as the other blurs in, run through an alpha threshold so their
 * soft edges cross the cut as one shape rather than crossfading.
 *
 * A word that is not changing is held on a third row outside the filtered
 * subtree, because anything inside the threshold gets thresholded whether it
 * moves or not and would visibly thicken. All three rows always hold both
 * words: the row is what positions the other one.
 */

const SIDES = ["left", "right"];
const SLOTS = 2;

const slotsOf = (row) => row?.firstElementChild?.children;

// One word's share of a morph, f = 1 present, 0 gone. Opacity falls slower than the blur climbs, so the word still carries alpha into its smear for the threshold to weld against. Per word, so a held one can be left alone.
function fade(el, f, blur) {
  if (!el) return;
  if (f >= 1) {
    el.style.filter = "none";
    el.style.opacity = "1";
  } else if (f <= 0) {
    // Cleared, not just hidden: a spent word should not hold a 100px blur.
    el.style.filter = "none";
    el.style.opacity = "0";
  } else {
    el.style.filter = `blur(${Math.min(blur / f - blur, 100)}px)`;
    el.style.opacity = `${Math.pow(f, 0.4)}`;
  }
}

function createGroup(side, groups, params) {
  const m = { t: 1 };
  // Rewritten every change rather than trading places, since a word can move between the filtered rows and the steady one and leave a stale row behind.
  let prev = ["", ""];
  let moving = [false, false];

  const draw = () => {
    const g = groups[side];
    if (!g) return;
    const out = slotsOf(g.layers[0]);
    const into = slotsOf(g.layers[1]);
    const held = slotsOf(g.plain);
    const t = m.t;

    for (let j = 0; j < SLOTS; j++) {
      if (moving[j]) {
        fade(out?.[j], 1 - t, params.nameBlur);
        fade(into?.[j], t, params.nameBlur);
        if (held?.[j]) held[j].style.opacity = "0";
      } else {
        if (out?.[j]) out[j].style.opacity = "0";
        if (into?.[j]) into[j].style.opacity = "0";
        if (held?.[j]) held[j].style.opacity = "1";
      }
    }

    // Off at rest: the threshold hardens glyph edges at this size.
    if (g.goo) {
      g.goo.style.filter =
        t >= 1 ? "none" : `url(#name-goo) blur(${params.nameSoften}px)`;
    }
  };

  // parts[0] is the leading slot, parts[1] the trailing one. Which of those is the big half depends on the side and is decided in style() below.
  const set = (parts) => {
    const g = groups[side];
    if (!g?.layers[0] || !g.layers[1] || !g.plain) return;
    gsap.killTweensOf(m);

    // Finish any morph in flight first, so the comparison below is against what is actually on screen.
    m.t = 1;
    draw();

    const next = [parts[0] ?? "", parts[1] ?? ""];
    moving = [next[0] !== prev[0], next[1] !== prev[1]];

    const out = slotsOf(g.layers[0]);
    const into = slotsOf(g.layers[1]);
    const held = slotsOf(g.plain);
    for (let j = 0; j < SLOTS; j++) {
      if (out?.[j]) out[j].textContent = prev[j];
      if (into?.[j]) into[j].textContent = next[j];
      if (held?.[j]) held[j].textContent = next[j];
    }
    prev = next;

    // Card changed but this group did not, so there is nothing to melt.
    if (!moving[0] && !moving[1]) {
      m.t = 1;
      draw();
      return;
    }

    m.t = 0;
    draw();
    gsap.to(m, {
      t: 1,
      duration: params.nameMorphTime,
      ease: params.nameEase,
      onUpdate: draw,
    });
  };

  return { m, set };
}

/**
 * refs: DOM handed over from the component, `groups` being the shape the JSX
 * populates, one entry per side. projects is the same list the ring was built
 * from, looked up by index for the front-facing card's labels.
 */
export function createMeta(refs, params, projects) {
  const { groups, list, loader, cut, live } = refs;
  const left = createGroup("left", groups, params);
  const right = createGroup("right", groups, params);

  // Only the alpha row does any work; colour passes straight through.
  const setThreshold = () => {
    cut?.setAttribute(
      "values",
      `1 0 0 0 0
       0 1 0 0 0
       0 0 1 0 0
       0 0 0 ${params.nameEdge} ${-params.nameEdge * params.nameCut}`,
    );
  };

  // Band state is passed in, not read, so this stays a pure function of it.
  const style = ({ textK, tight, viewW }) => {
    // Everything downstream derives from this: box height, filter region, offset.
    const bigVw = params.nameSize * textK * (tight ? params.tightName : 1);
    const big = `${bigVw}vw`;
    const small = `${params.idxSize * textK}vw`;
    // The category reuses the title's size role but reads smaller than it.
    const category = `${bigVw * 0.85}vw`;
    // Unquoted: nameFont/idxFont are CSS custom properties (var(...)), and quoting a var() call makes it a literal (bogus) font name instead of a substitution.
    const displayFace = `${params.nameFont}, ui-sans-serif, system-ui, sans-serif`;
    const paragraphFace = `${params.idxFont}, ui-sans-serif, system-ui, sans-serif`;
    const titleWeight = `${params.nameWeight}`;
    const paragraphWeight = `${params.idxWeight}`;
    const categoryWeight = `${params.categoryWeight}`;
    // Roomy: the filter region is measured off this box and blur needs room.
    const h = bigVw * 3;

    for (const side of SIDES) {
      const g = groups[side];
      if (!g?.box) continue;
      const isRight = side === "right";

      // No room for two lockups in the tight band, so only the name survives.
      const corner = tight && !isRight;
      if (tight && isRight) {
        g.box.style.display = "none";
        continue;
      }
      g.box.style.display = "";

      g.box.style.width = `${corner ? params.tightMetaWidth : params.metaWidth}vw`; // prettier-ignore
      g.box.style.height = `${h}vw`;

      if (corner) {
        // The box is 3x the type's height, so drop it by the difference or the words sit half a box high.
        const boxPx = (h * viewW) / 100;
        const emPx = (bigVw * viewW) / 100;
        g.box.style.top = "auto";
        g.box.style.left = "auto";
        g.box.style.right = `${params.tightNameRight}px`;
        g.box.style.bottom = `${params.tightNameBottom + emPx * 0.5 - boxPx * 0.5}px`;
        g.box.style.transform = "none";
      } else if (isRight) {
        // Bottom-anchored, or a long title column runs into this lockup.
        g.box.style.top = "auto";
        g.box.style.bottom = `${params.metaBottom}vh`;
        g.box.style.transform = "none";
        g.box.style.left = "auto";
        g.box.style.right = `${params.metaRight}vw`;
      } else {
        // Cleared rather than set, so the class on the element takes it back.
        g.box.style.top = "";
        g.box.style.bottom = "";
        g.box.style.transform = "";
        // Anchored to its own edge so the fixed-width half of the pair sits against the margin, which is also what stops a morph shifting rows.
        g.box.style.left = `${params.metaLeft}vw`;
        g.box.style.right = "auto";
      }

      // All three rows must agree exactly or a word jumps between them.
      for (const layer of [...g.layers, g.plain]) {
        if (!layer) continue;
        layer.style.justifyContent =
          corner || isRight ? "flex-end" : "flex-start";
        const row = layer.firstElementChild;
        row.style.gap = `${isRight ? params.metaGapR : params.metaGapL}vw`;
        const [lead, trail] = row.children;
        // The left lead slot's index number is no longer shown; its morph still runs underneath, so nothing needs resyncing.
        lead.style.display = corner || !isRight ? "none" : "";
        // lead: the category (right, paragraph font, bold) or the hidden index number (left, paragraph font, normal weight).
        lead.style.fontFamily = paragraphFace;
        lead.style.fontSize = isRight ? category : small;
        lead.style.fontWeight = isRight ? categoryWeight : paragraphWeight;
        // trail: the year, or the title in our display font (no lowercase glyphs, so forced uppercase below).
        trail.style.fontFamily = isRight ? paragraphFace : displayFace;
        trail.style.fontSize = isRight ? small : big;
        trail.style.fontWeight = isRight ? paragraphWeight : titleWeight;
        trail.style.textTransform = isRight ? "none" : "uppercase";
      }
    }

    // Set here too, so all the type moves as one piece across a breakpoint.
    if (list) list.style.fontSize = `${params.listSize * textK}vw`;
    if (loader) {
      loader.style.bottom = `${params.loaderBottom}vh`;
      loader.style.fontFamily = paragraphFace;
      loader.style.fontSize = small;
      loader.style.fontWeight = paragraphWeight;
    }

    setThreshold();
  };

  const show = (i) => {
    const p = projects[i];
    if (!p) return;
    left.set(["", p.name]);
    right.set([p.type, p.year]);
    // Groups are aria-hidden, so the card is announced once from here.
    if (live) live.textContent = `${p.name}. ${p.type}, ${p.year}.`;
  };

  const dispose = () => {
    gsap.killTweensOf(left.m);
    gsap.killTweensOf(right.m);
  };

  return { show, style, setThreshold, dispose };
}
