"use client";

import { useCallback, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";

// trophy plays most often; rocket variants appear occasionally
const ANIMATIONS = [
  { src: "/animations/trophy.lottie",       weight: 5 },
  { src: "/animations/hero_rocket.lottie",  weight: 2 },
  { src: "/animations/rocket_launch.lottie", weight: 2 },
];

// Pause between animations (ms)
const PAUSE_MS = 2200;

function pickNext(current: string): string {
  const pool = ANIMATIONS.flatMap((a) =>
    // exclude the animation that just finished to avoid immediate repeats
    a.src !== current ? Array<string>(a.weight).fill(a.src) : [],
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

// Start with trophy so the first load is always the hero animation
const INITIAL = "/animations/trophy.lottie";

export function HomeLottie() {
  const [src, setSrc] = useState(INITIAL);
  // track src in a ref so the callback closure is always up to date
  const srcRef = useRef(src);
  srcRef.current = src;

  const onLoad = useCallback((instance: DotLottie | null) => {
    if (!instance) return;
    instance.addEventListener("complete", () => {
      window.setTimeout(() => {
        const next = pickNext(srcRef.current);
        setSrc(next);
      }, PAUSE_MS);
    });
  }, []);

  const flipped = src === "/animations/hero_rocket.lottie";

  return (
    <DotLottieReact
      key={src}
      src={src}
      autoplay
      dotLottieRefCallback={onLoad}
      className="h-full w-full"
      style={flipped ? { transform: "scaleX(-1)" } : undefined}
    />
  );
}
