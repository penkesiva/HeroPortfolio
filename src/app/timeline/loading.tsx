"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function TimelineLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dusk-950 text-parchment-muted">
      <DotLottieReact
        src="/animations/loader_cat_idle.lottie"
        autoplay
        loop
        className="h-28 w-28"
      />
      <p className="text-sm">Loading your timeline…</p>
    </div>
  );
}
