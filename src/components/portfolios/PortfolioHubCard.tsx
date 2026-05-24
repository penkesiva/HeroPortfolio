"use client";

import { useState } from "react";
import Link from "next/link";
import { DefaultAvatarThumb } from "@/components/DefaultAvatarImage";
import { PortfolioVisibilityToggle, PortfolioVisibilityBadge } from "@/components/PortfolioVisibilityToggle";
import { isDefaultAvatar } from "@/lib/defaultAvatar";
import type { DbPortfolioProfile } from "@/types/database";

type Props = {
  portfolio: DbPortfolioProfile;
  photoSrc?: string | null;
};

export function PortfolioHubCard({ portfolio, photoSrc = null }: Props) {
  const [isPublic, setIsPublic] = useState(portfolio.is_public ?? false);

  const subtitle =
    portfolio.portfolio_kind === "child" && portfolio.grade != null
      ? portfolio.grade === 0
        ? "Kindergarten"
        : `Grade ${portfolio.grade}`
      : portfolio.is_primary
        ? "Main portfolio"
        : "Personal portfolio";

  return (
    <div className="group flex flex-col rounded-2xl border border-dusk-700/90 bg-dusk-900/60 p-6 shadow transition hover:border-umber-500/40 hover:bg-dusk-900/80">
      <Link href={`/portfolios/${portfolio.id}`} className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {photoSrc && !isDefaultAvatar(photoSrc) ? (
            <img
              src={photoSrc}
              alt={portfolio.display_name}
              className="size-12 shrink-0 rounded-full object-cover ring-2 ring-dusk-600"
            />
          ) : photoSrc && isDefaultAvatar(photoSrc) ? (
            <div className="size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-dusk-600">
              <DefaultAvatarThumb alt={portfolio.display_name} />
            </div>
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-dusk-800 text-xl ring-2 ring-dusk-600">
              {portfolio.portfolio_kind === "child" ? "🧒" : "📁"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-parchment group-hover:text-umber-200">
                {portfolio.display_name}
              </p>
              <PortfolioVisibilityBadge isPublic={isPublic} />
            </div>
            <p className="text-xs text-parchment-muted">{subtitle}</p>
          </div>
        </div>

        <p className="text-xs font-medium text-umber-400 group-hover:text-umber-300">
          View portfolio →
        </p>
      </Link>

      <PortfolioVisibilityToggle
        portfolioUserId={portfolio.id}
        isPublic={isPublic}
        onIsPublicChange={setIsPublic}
        variant="card"
      />
    </div>
  );
}
