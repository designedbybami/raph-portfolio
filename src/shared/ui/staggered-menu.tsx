"use client";

import Link from "next/link";
import { gsap } from "gsap";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/shared/lib/use-hydrated";
import "./staggered-menu.css";

export interface StaggeredMenuItem {
  label: string;
  link?: string;
  ariaLabel?: string;
  // No destination yet, e.g. Shop before launch — rendered inert, same treatment as the desktop nav.
  disabled?: boolean;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  items: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  accentColor?: string;
  className?: string;
  closeOnClickAway?: boolean;
}

export function StaggeredMenu({
  position = "right",
  colors = ["#facc15"],
  items,
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  accentColor = "#facc15",
  className,
  closeOnClickAway = true,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLDivElement[]>([]);
  const iconRef = useRef<HTMLSpanElement>(null);
  const plusHRef = useRef<HTMLSpanElement>(null);
  const plusVRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [textLines, setTextLines] = useState(["Menu", "Close"]);

  // Portals to body: an ancestor's transform (motion.div wrappers etc.) would hijack position:fixed.
  const mounted = useHydrated();

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      const preLayers = preContainer ? Array.from(preContainer.querySelectorAll<HTMLDivElement>(".sm-prelayer")) : [];
      preLayerElsRef.current = preLayers;

      const offscreen = position === "left" ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
      gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      gsap.set(textInner, { yPercent: 0 });
    });
    return () => ctx.revert();
    // `mounted` is load-bearing: the panel is portaled, so on the first render it does not exist yet and the guard above bails before parking it off-screen.
  }, [position, mounted]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll<HTMLElement>(".sm-panel-itemLabel"));
    const numberEls = Array.from(panel.querySelectorAll<HTMLElement>(".sm-panel-list[data-numbering] .sm-panel-item"));
    const socialTitle = panel.querySelector<HTMLElement>(".sm-socials-title");
    const socialLinks = Array.from(panel.querySelectorAll<HTMLElement>(".sm-socials-link"));

    const offscreen = position === "left" ? -100 : 100;
    const layerStates = layers.map((el) => ({ el, start: offscreen }));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { "--sm-num-opacity": 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(panel, { xPercent: offscreen }, { xPercent: 0, duration: panelDuration, ease: "power4.out" }, panelInsertTime);

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 1, ease: "power4.out", stagger: { each: 0.1, from: "start" } },
        itemsStart,
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          { duration: 0.6, ease: "power2.out", "--sm-num-opacity": 1, stagger: { each: 0.08, from: "start" } },
          itemsStart + 0.1,
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: "power2.out" }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: { each: 0.08, from: "start" },
            onComplete: () => gsap.set(socialLinks, { clearProps: "opacity" }),
          },
          socialsStart + 0.04,
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    const activeTimeline = openTlRef.current;
    // A close may still be reversing the open timeline. Turning that same
    // timeline around preserves its current position and keeps panel state in
    // sync with the newly-open React state.
    if (busyRef.current && activeTimeline) {
      activeTimeline.eventCallback("onReverseComplete", null);
      activeTimeline.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      activeTimeline.play();
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback("onReverseComplete", null);
      tl.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  // Reverses the exact open timeline rather than a separate tween, so closing is always the literal mirror of opening, item-by-item, not just the panel sliding out.
  const playClose = useCallback(() => {
    const tl = openTlRef.current;
    if (!tl) return;
    busyRef.current = true;
    tl.eventCallback("onComplete", null);
    tl.eventCallback("onReverseComplete", () => {
      busyRef.current = false;
    });
    tl.reverse();
  }, []);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    spinTweenRef.current = opening
      ? gsap.to(icon, { rotate: 225, duration: 0.8, ease: "power4.out", overwrite: "auto" })
      : gsap.to(icon, { rotate: 0, duration: 0.35, ease: "power3.inOut", overwrite: "auto" });
  }, []);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? "Menu" : "Close";
    const targetLabel = opening ? "Close" : "Menu";
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === "Menu" ? "Close" : "Menu";
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const finalShift = ((seq.length - 1) / seq.length) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + seq.length * 0.07,
      ease: "power4.out",
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) playOpen();
    else playClose();
    animateIcon(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateText]);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    playClose();
    animateIcon(false);
    animateText(false);
  }, [playClose, animateIcon, animateText]);

  useLayoutEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && toggleBtnRef.current && !toggleBtnRef.current.contains(target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeOnClickAway, open, closeMenu]);

  // Same className as the toggle: the portal escapes the wrapper, so without it the overlay would still mount at breakpoints where the menu is hidden.
  const overlay = (
    <div
      className={className}
      style={{ ["--sm-accent" as string]: accentColor }}
      data-open={open || undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {colors.slice(0, 3).map((color, i) => (
          <div key={i} className="sm-prelayer" style={{ background: color }} />
        ))}
      </div>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        data-position={position}
        className="sm-panel flex flex-col overflow-y-auto bg-black px-6 pt-24 pb-8 text-white"
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={closeMenu}
          aria-label="Close menu"
          tabIndex={open ? 0 : -1}
          className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center text-white transition-colors hover:text-[var(--sm-accent)]"
        >
          <span className="sm-icon">
            <span className="sm-icon-line" style={{ rotate: "45deg" }} />
            <span className="sm-icon-line" style={{ rotate: "-45deg" }} />
          </span>
        </button>

        <ul className="flex flex-col gap-3" role="list" data-numbering={displayItemNumbering || undefined}>
          {items.map((item, idx) =>
            item.link && !item.disabled ? (
              <li className="sm-panel-itemWrap" key={item.label}>
                <Link
                  href={item.link}
                  aria-label={item.ariaLabel}
                  data-index={idx + 1}
                  onClick={closeMenu}
                  className="sm-panel-item relative inline-block pr-12 font-heading text-6xl leading-none transition-colors hover:text-[var(--sm-accent)]"
                >
                  <span className="sm-panel-itemLabel">{item.label}</span>
                </Link>
              </li>
            ) : (
              <li className="sm-panel-itemWrap" key={item.label}>
                <span
                  aria-disabled="true"
                  data-index={idx + 1}
                  className="sm-panel-item relative inline-block pr-12 font-heading text-6xl leading-none text-white/40"
                >
                  <span className="sm-panel-itemLabel">{item.label}</span>
                </span>
              </li>
            ),
          )}
        </ul>

        {displaySocials && socialItems.length > 0 && (
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <h3 className="sm-socials-title m-0 font-heading text-sm text-[var(--sm-accent)]">Socials</h3>
            <ul className="flex flex-row flex-wrap items-center gap-4" role="list">
              {socialItems.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm-socials-link inline-block font-heading text-base"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );

  return (
    <div className={className}>
      <button
        ref={toggleBtnRef}
        type="button"
        className="sm-toggle text-white"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="staggered-menu-panel"
        onClick={toggleMenu}
      >
        <span className="sm-toggle-textWrap font-heading text-lg leading-none" aria-hidden="true">
          <span ref={textInnerRef} className="sm-toggle-textInner">
            {textLines.map((line, i) => (
              <span className="sm-toggle-line" key={i}>
                {line}
              </span>
            ))}
          </span>
        </span>
        <span ref={iconRef} className="sm-icon">
          <span ref={plusHRef} className="sm-icon-line" />
          <span ref={plusVRef} className="sm-icon-line" />
        </span>
      </button>

      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
