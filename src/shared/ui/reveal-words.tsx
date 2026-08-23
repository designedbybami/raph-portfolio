"use client";

import { motion } from "motion/react";

const WORD_STAGGER = 0.028;
const WORD_DURATION = 0.5;
const WORD_EASE = [0.22, 1, 0.36, 1] as const;

const WORD = {
  hidden: { opacity: 0, y: "0.4em", filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

// A paragraph's own words finish this long after its first word starts.
function paragraphDuration(wordCount: number) {
  return Math.max(0, wordCount - 1) * WORD_STAGGER + WORD_DURATION;
}

// Reveals each paragraph's words one at a time; a paragraph's own stagger doesn't begin until the previous paragraph has fully finished animating.
export function RevealParagraphs({
  paragraphs,
  className,
  paragraphClassName,
}: {
  paragraphs: string[];
  className?: string;
  paragraphClassName?: string;
}) {
  const tokenized = paragraphs.map((paragraph) => paragraph.split(/(\s+)/));
  const wordCounts = tokenized.map((tokens) => tokens.filter((token) => token.trim() !== "").length);

  const startDelays = wordCounts.map((_, index) =>
    wordCounts.slice(0, index).reduce((sum, count) => sum + paragraphDuration(count), 0),
  );

  return (
    <motion.div className={className} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
      {tokenized.map((words, paragraphIndex) => (
        <motion.p
          key={paragraphIndex}
          className={paragraphClassName}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: WORD_STAGGER, delayChildren: startDelays[paragraphIndex] } },
          }}
        >
          {words.map((word, wordIndex) =>
            word.trim() === "" ? (
              word
            ) : (
              <motion.span
                key={wordIndex}
                variants={WORD}
                transition={{ duration: WORD_DURATION, ease: WORD_EASE }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ),
          )}
        </motion.p>
      ))}
    </motion.div>
  );
}
