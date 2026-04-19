"use client";

import { useCallback } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";

const REPLAY_DELAY_MS = 2800;

export function HomeLottie() {
  const onLoad = useCallback((instance: DotLottie | null) => {
    if (!instance) return;
    instance.addEventListener("complete", () => {
      window.setTimeout(() => {
        instance.play();
      }, REPLAY_DELAY_MS);
    });
  }, []);

  return (
    <DotLottieReact
      src="/animations/trophy.lottie"
      autoplay
      dotLottieRefCallback={onLoad}
      className="h-full w-full"
    />
  );
}
