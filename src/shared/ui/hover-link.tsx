"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

// One hover source of truth for a Link whose contents (icon, thumbnail, text) need to animate together, instead of each child self-detecting its own pointer-over independently.
export function HoverLink({
  href,
  className,
  onTapStart,
  onHoverStart,
  onActivate,
  children,
}: {
  href: string;
  className?: string;
  // Fires once, on touch-down specifically, e.g. for haptics. Not fired for mouse.
  onTapStart?: () => void;
  onHoverStart?: () => void;
  // Fires on activation by any pointer kind, unlike onTapStart.
  onActivate?: () => void;
  children: (hovered: boolean) => ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      className={className}
      onClick={onActivate}
      onPointerEnter={() => {
        setHovered(true);
        onHoverStart?.();
      }}
      onPointerDown={(event) => {
        setHovered(true);
        if (event.pointerType === "touch") onTapStart?.();
      }}
      onPointerUp={(event) => {
        if (event.pointerType === "touch") setHovered(false);
      }}
      onPointerCancel={() => setHovered(false)}
      onPointerLeave={() => setHovered(false)}
    >
      {children(hovered)}
    </Link>
  );
}

// Same contract for destinations next/link can't own: mailto, external sites.
export function HoverAnchor({
  href,
  external,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  children: (hovered: boolean) => ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerEnter={() => setHovered(true)}
      onPointerDown={() => setHovered(true)}
      onPointerUp={(event) => {
        if (event.pointerType === "touch") setHovered(false);
      }}
      onPointerCancel={() => setHovered(false)}
      onPointerLeave={() => setHovered(false)}
    >
      {children(hovered)}
    </a>
  );
}
