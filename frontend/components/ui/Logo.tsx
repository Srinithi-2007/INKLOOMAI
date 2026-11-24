import Link from "next/link";

export default function Logo({
  href = "/",
  dark = false,
}: {
  href?: string;
  dark?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="Inkloom AI home">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm ${
        dark ? "bg-emerald-600 shadow-emerald-950/40" : "bg-primary"
      }`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 20c4-1 6-5 8-9s4-7 8-7c0 4-2 8-6 12s-8 4-10 4z" />
        </svg>
      </span>
      <span className={`font-heading text-[17px] font-semibold tracking-[-0.3px] ${dark ? "text-white" : "text-ink"}`}>
        Inkloom AI
      </span>
    </Link>
  );
}