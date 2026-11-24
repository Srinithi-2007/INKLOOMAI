import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Icon from "@/components/ui/Icon";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import Link from "next/link";

const features = [
  {
    icon: "sparkles" as const,
    title: "AI-Powered Content Review",
    body: "Live heuristics check every draft against your tone and guidelines before it reaches approval.",
  },
  {
    icon: "shield" as const,
    title: "Brand DNA Management",
    body: "Store voice, tone sliders and approved language once, and apply them across every workspace.",
  },
  {
    icon: "users" as const,
    title: "Campaign Collaboration",
    body: "Brands and verified freelancers work inside shared rooms with clear roles and revision history.",
  },
  {
    icon: "check" as const,
    title: "Smart Approval Workflow",
    body: "Route drafts to the right reviewers and collect sign-off with timestamped compliance records.",
  },
];

const steps = [
  {
    n: "1",
    title: "Set up your brand DNA",
    body: "Upload guidelines, establish tone sliders, and connect verified team and freelancer workspaces.",
  },
  {
    n: "2",
    title: "Create inside shared rooms",
    body: "Creators draft collateral inside shared rooms while live heuristics highlight off-brand drift.",
  },
  {
    n: "3",
    title: "Approve and export",
    body: "Gain executive sign-off with verifiable compliance timestamps and export ready-to-run assets.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#040907] text-[#FDFCF7] selection:bg-emerald-600/30 selection:text-white">
      {/* Top Navbar */}
      <div className="relative z-30 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Header showNav dark />
      </div>

      {/* Hero Section — Balanced layout where text and animation complement each other without collision */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-14 sm:pb-24 lg:px-8 lg:pt-16 lg:pb-28">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Content Container — Dedicated negative space with 100% text contrast and readability */}
          <div className="flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left">
            {/* Pill Badge — Botanical nature-inspired badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-[#07190F] px-3.5 py-1 text-xs font-semibold tracking-wide text-emerald-300 shadow-sm shadow-emerald-950/40">
              <Icon name="sparkles" size={13} className="text-emerald-400" />
              AI-Powered Brand Governance
            </span>

            {/* Main Headline */}
            <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-[#FDFCF7] sm:text-5xl md:text-[52px] md:leading-[1.12]">
              Your Brand. Your Voice.
              <span
                className="mt-1 block"
                style={{
                  background: "linear-gradient(90deg, #34D399 0%, #2DD4BF 50%, #38BDF8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Perfectly Protected.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="mt-4 max-w-[480px] text-sm leading-relaxed text-slate-200 sm:text-base font-normal">
              Create, review, and manage content with AI-powered brand governance. Bring teams and creators together
              while keeping every asset impeccably on-brand.
            </p>

            {/* Call to Action Buttons */}
            <div className="mt-7 flex w-full max-w-[360px] flex-col gap-3 sm:max-w-md sm:flex-row sm:gap-4">
              <Link
                href="/role"
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition-all duration-200 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-950/70 active:scale-[0.99]"
              >
                <span>Get Started</span>
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                href="#features"
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-800/50 bg-[#08150E] px-6 text-sm font-medium text-[#E2E8F0] transition-all duration-200 hover:border-emerald-500/60 hover:bg-[#0E2216] active:scale-[0.99]"
              >
                <Icon name="compass" size={16} className="text-emerald-400" />
                <span>Explore Features</span>
              </Link>
            </div>

            {/* Trust Indicator */}
            <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-slate-300 sm:justify-start">
              <span className="flex -space-x-2" aria-hidden="true">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#040907] bg-emerald-700 text-[10px] font-semibold text-white shadow-sm">
                  AC
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#040907] bg-teal-700 text-[10px] font-semibold text-white shadow-sm">
                  SK
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#040907] bg-amber-700 text-[10px] font-semibold text-amber-100 shadow-sm">
                  BL
                </span>
              </span>
              <span>Trusted by 2,400+ governance leaders</span>
            </div>
          </div>

          {/* Right Column / Mobile Showcase — Pure, unfiltered animated canvas background showcase */}
          <div className="relative w-full lg:col-span-6">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#020508] shadow-2xl shadow-emerald-950/60 sm:aspect-[16/9] lg:h-[480px]">
              {/* Continuous looping Canvas Animated Background — STRICTLY NO blur, NO filters, NO overlays */}
              <AnimatedBackground
                fps={18}
                alignmentX={0.5}
                alignmentY={0.5}
                className="z-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities / Features Section — Solid nature-inspired opaque content containers */}
      <section id="features" className="relative mx-auto mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Capabilities</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#FDFCF7] sm:text-3xl">
            Engineered for absolute fidelity
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="group relative flex flex-col gap-3 rounded-2xl border border-emerald-900/40 bg-[#07120B] p-6 transition-all duration-300 hover:border-emerald-500/40 hover:bg-[#0A1810] hover:shadow-xl hover:shadow-emerald-950/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-[#040D08] text-emerald-400 shadow-sm shadow-emerald-950/30 transition-transform duration-300 group-hover:scale-105">
                <Icon name={f.icon} size={18} />
              </span>
              <h3 className="font-heading text-lg font-semibold tracking-tight text-[#FDFCF7]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Workflow Section — Nature-inspired structure and typography */}
      <section id="how-it-works" className="relative mx-auto mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Workflow</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#FDFCF7] sm:text-3xl">
            How Inkloom governs fast
          </h2>
        </div>

        <div className="mt-8 rounded-3xl border border-emerald-900/40 bg-[#07120B] p-6 sm:p-10 shadow-lg shadow-emerald-950/30">
          <ol className="flex flex-col">
            {steps.map((s, i) => (
              <li key={s.n} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-950/40">
                    {s.n}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="my-1.5 w-0.5 flex-1 rounded bg-emerald-950 border-l border-emerald-800/40" />
                  )}
                </div>
                <div className={`flex flex-col gap-1 ${i < steps.length - 1 ? "pb-8" : ""}`}>
                  <h3 className="pt-0.5 font-heading text-lg font-semibold tracking-tight text-[#FDFCF7]">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Call to Action Section — Luminous botanical focal container */}
      <section className="relative mx-auto mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-600/30 bg-gradient-to-b from-[#091810] via-[#0B1E13] to-[#07120B] p-8 text-center text-white shadow-2xl shadow-emerald-950/60 sm:p-12">
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-600/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="relative flex flex-col items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-[#040D08] text-emerald-300 shadow-md shadow-emerald-950/40">
              <Icon name="sparkles" size={20} />
            </span>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-[#FDFCF7] sm:text-3xl">
              Ready to protect your brand?
            </h2>
            <p className="max-w-[420px] text-sm leading-relaxed text-slate-200">
              Start with a free workspace and bring your team on-brand in minutes.
            </p>
            <div className="mt-3 w-full max-w-[320px]">
              <Link
                href="/role"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-950/40 transition-all hover:bg-emerald-50 active:scale-[0.99]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <Footer dark />
      </div>
    </div>
  );
}
