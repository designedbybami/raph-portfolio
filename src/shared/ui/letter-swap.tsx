"use client";

import { motion, type Transition } from "motion/react";

type StaggerFrom = "first" | "last" | "center" | number;

interface LetterSwapProps {
  label: string;
  reverse?: boolean;
  staggerDuration?: number;
  staggerFrom?: StaggerFrom;
  transition?: Transition;
  className?: string;
  // Controlled mode: drive the swap from an ancestor's hover state instead of this element's own pointer-over, so several elements can react as one.
  hovered?: boolean;
}

const NBSP = " ";

function getStaggerDelay(index: number, total: number, staggerFrom: StaggerFrom, staggerDuration: number) {
  if (staggerFrom === "first") return index * staggerDuration;
  if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
  if (staggerFrom === "center") return Math.abs((total - 1) / 2 - index) * staggerDuration;
  return Math.abs(staggerFrom - index) * staggerDuration;
}

const DEFAULT_TRANSITION: Transition = { type: "spring", duration: 0.7 };

export function LetterSwap({
  label,
  reverse = true,
  staggerDuration = 0.03,
  staggerFrom = "first",
  transition = DEFAULT_TRANSITION,
  className,
  hovered,
}: LetterSwapProps) {
  const letters = label.split("");
  const controlled = hovered !== undefined;

  return (
    <motion.span
      initial="rest"
      {...(controlled ? { animate: hovered ? "hover" : "rest" } : { whileHover: "hover" })}
      className={`relative inline-block overflow-hidden ${className ?? ""}`}
    >
      <span aria-hidden className="invisible flex">
        {letters.map((letter, index) => (
          <span key={index}>{letter === " " ? NBSP : letter}</span>
        ))}
      </span>

      <span className="absolute inset-0 flex">
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            className="relative inline-block"
            variants={{ rest: { top: 0 }, hover: { top: reverse ? "-100%" : "100%" } }}
            transition={{
              ...transition,
              delay: getStaggerDelay(index, letters.length, staggerFrom, staggerDuration),
            }}
          >
            {letter === " " ? NBSP : letter}
          </motion.span>
        ))}
      </span>

      <span className="absolute inset-0 flex">
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            className="relative inline-block"
            variants={{ rest: { top: reverse ? "100%" : "-100%" }, hover: { top: 0 } }}
            transition={{
              ...transition,
              delay: getStaggerDelay(index, letters.length, staggerFrom, staggerDuration),
            }}
          >
            {letter === " " ? NBSP : letter}
          </motion.span>
        ))}
      </span>
    </motion.span>
  );
}
