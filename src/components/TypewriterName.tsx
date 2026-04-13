"use client";

import { useEffect, useState } from "react";

const CHAR_MS = 82;
/** Brief pause after hero fades in so typing reads as a second beat */
const START_DELAY_MS = 320;

type Props = {
  text: string;
  className?: string;
};

export function TypewriterName({ text, className }: Props) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    if (!text) {
      setDone(true);
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      setDone(true);
      return;
    }

    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      let i = 0;
      intervalId = window.setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(intervalId);
          intervalId = 0;
          setDone(true);
        }
      }, CHAR_MS);
    }, START_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [text]);

  return (
    <span className={className}>
      <span aria-hidden="true">{shown}</span>
      {!done ? (
        <span
          className="ml-0.5 inline-block h-[0.95em] w-0.5 translate-y-px animate-pulse bg-parchment align-middle"
          aria-hidden
        />
      ) : null}
      <span className="sr-only">{text}</span>
    </span>
  );
}
