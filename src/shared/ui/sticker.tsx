"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode, RefObject } from "react";

// Draggable card, bounded to boundsRef via dragConstraints.
export function Sticker({
  children,
  boundsRef,
  rotate = 0,
  className,
  style,
}: {
  children: ReactNode;
  boundsRef: RefObject<HTMLElement | null>;
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      drag
      dragConstraints={boundsRef}
      dragElastic={0.15}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 400, bounceDamping: 24 }}
      initial={{ rotate }}
      whileDrag={{ scale: 1.05, rotate: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`absolute z-10 cursor-grab touch-none active:cursor-grabbing ${className ?? ""}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}
