"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

// One hover source of truth for a Link whose contents (icon, thumbnail, text) need to animate together, instead of each child self-detecting its own pointer-over independently.
export function HoverLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: (hovered: boolean) => ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children(hovered)}
    </a>
  );
}
