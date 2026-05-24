import Image from "next/image";
import {
  DEFAULT_AVATAR_DARK,
  DEFAULT_AVATAR_LIGHT,
} from "@/lib/defaultAvatar";

type Props = {
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Theme-aware default hero image — swaps via `data-theme` CSS, no flash on load. */
export function DefaultAvatarImage({
  alt,
  className = "object-cover",
  sizes,
  priority,
}: Props) {
  return (
    <>
      <Image
        src={DEFAULT_AVATAR_DARK}
        alt={alt}
        fill
        className={`${className} default-avatar-img default-avatar-img-dark`}
        sizes={sizes}
        priority={priority}
      />
      <Image
        src={DEFAULT_AVATAR_LIGHT}
        alt=""
        aria-hidden
        fill
        className={`${className} default-avatar-img default-avatar-img-light`}
        sizes={sizes}
        priority={priority}
      />
    </>
  );
}

type ThumbProps = {
  alt: string;
  className?: string;
};

/** Small circular default avatar (account menu, editor preview). */
export function DefaultAvatarThumb({ alt, className = "size-full object-cover object-center" }: ThumbProps) {
  return (
    <span className="relative block size-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- theme swap via CSS */}
      <img
        src={DEFAULT_AVATAR_DARK}
        alt={alt}
        className={`absolute inset-0 ${className} default-avatar-img default-avatar-img-dark`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- theme swap via CSS */}
      <img
        src={DEFAULT_AVATAR_LIGHT}
        alt=""
        aria-hidden
        className={`absolute inset-0 ${className} default-avatar-img default-avatar-img-light`}
      />
    </span>
  );
}
