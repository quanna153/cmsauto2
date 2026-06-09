import Link from "next/link";

type BrandTone = "light" | "dark";
type BrandSize = "sm" | "md" | "hero";

const markSizes: Record<BrandSize, string> = {
  sm: "size-10",
  md: "size-12",
  hero: "size-14"
};

const wordSizes: Record<BrandSize, string> = {
  sm: "text-[1.75rem]",
  md: "text-[2.2rem]",
  hero: "text-[2.8rem] sm:text-[3.3rem]"
};

export function CoinRadarMark({ size = "sm" }: { size?: BrandSize }) {
  return (
    <svg className={`${markSizes[size]} shrink-0 drop-shadow-[0_0_16px_rgba(0,159,77,0.2)]`} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="coinradar-mark-green" x1="10" x2="55" y1="8" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="1" stopColor="#009f4d" />
        </linearGradient>
      </defs>
      <path d="M32 7a25 25 0 1 0 0 50" fill="none" stroke="#009f4d" strokeLinecap="round" strokeWidth="5" />
      <path d="M32 57a25 25 0 0 0 22-13" fill="none" stroke="#101311" strokeLinecap="round" strokeWidth="5" />
      <path d="M31 17a15 15 0 1 0 0 30" fill="none" stroke="url(#coinradar-mark-green)" strokeLinecap="round" strokeWidth="5" />
      <path d="M34 17a15 15 0 0 1 12 14" fill="none" stroke="#009f4d" strokeLinecap="round" strokeWidth="5" />
      <path d="M38 8a32 32 0 0 1 18 13" fill="none" stroke="#009f4d" strokeLinecap="round" strokeWidth="5" />
      <path d="M41 19a20 20 0 0 1 9 20" fill="none" stroke="#009f4d" strokeLinecap="round" strokeWidth="5" />
      <path d="M37 31 52 17" fill="none" stroke="#009f4d" strokeLinecap="round" strokeWidth="4" />
      <circle cx="35" cy="32" r="5" fill="#ffffff" stroke="#009f4d" strokeWidth="4" />
      <circle cx="54" cy="15" r="4.5" fill="#009f4d" />
      <circle cx="25" cy="33" r="12" fill="url(#coinradar-mark-green)" />
      <path
        d="M28.5 24.5h-5.2a7.8 7.8 0 0 0 0 15.6h5.2M22.2 21.8v4.4M27.6 21.8v4.4M22.2 38.3v4.4M27.6 38.3v4.4"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="square"
        strokeWidth="3.5"
      />
    </svg>
  );
}

export function CoinRadarWordmark({ size = "sm", tone = "light" }: { size?: BrandSize; tone?: BrandTone }) {
  const coinColor = tone === "dark" ? "text-white" : "text-[#101311]";

  return (
    <span className={`${wordSizes[size]} whitespace-nowrap font-extrabold leading-none tracking-normal`}>
      <span className={coinColor}>Coin</span>
      <span className="text-[#009f4d]">Radar</span>
    </span>
  );
}

export function CoinRadarLogo({
  className = "",
  href,
  size = "sm",
  tone = "light"
}: {
  className?: string;
  href: string;
  size?: BrandSize;
  tone?: BrandTone;
}) {
  return (
    <Link aria-label="CoinRadar" className={`inline-flex shrink-0 items-center gap-2.5 ${className}`} href={href}>
      <CoinRadarMark size={size} />
      <CoinRadarWordmark size={size} tone={tone} />
    </Link>
  );
}
