import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Icon from "@/components/ui/Icon";
import HeroPolygonNetwork from "@/components/ui/HeroPolygonNetwork";
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
    <div className="relative min-h-screen bg-[#070510] text-white selection:bg-violet-600/40 selection:text-white">
      {/* Top Navbar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Header showNav dark />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Abstract Glowing 3D Polygon Network & Atmospheric Gradients */}
        <HeroPolygonNetwork />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
          {/* Pill Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-950/60 px-3.5 py-1 text-xs font-medium tracking-wide text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)] backdrop-blur-sm">
            <Icon name="sparkles" size={13} className="text-violet-400" />
            AI-Powered Brand Governance
          </span>

          {/* Main Headline */}
          <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-[54px] md:leading-[1.12]">
            Your Brand. Your Voice.
            <span className="mt-1 block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent">
              Perfectly Protected.
            </span>
          </h1>

          {/* Supporting Description */}
          <p className="mt-4 max-w-[480px] text-sm leading-relaxed text-slate-300/90 sm:text-base">
            Create, review, and manage content with AI-powered brand governance. Bring teams and creators together
            while keeping every asset impeccably on-brand.
          </p>

          {/* Call to Action Buttons */}
          <div className="mt-7 flex w-full max-w-[360px] flex-col gap-3">
            <Link
              href="/role"
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#8B5CF6] px-6 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] transition-all duration-200 hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#7C3AED] hover:shadow-[0_0_34px_rgba(124,58,237,0.6)] active:scale-[0.99]"
            >
              <span>Get Started</span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link
              href="#features"
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.03] px-6 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-violet-400/50 hover:bg-white/[0.08] active:scale-[0.99]"
            >
              <Icon name="compass" size={16} className="text-violet-300" />
              <span>Explore Features</span>
            </Link>
          </div>

          {/* Trust Indicator */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <span className="flex -space-x-2" aria-hidden="true">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#090518] bg-violet-600 text-[10px] font-semibold text-white shadow-sm">
                AC
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#090518] bg-indigo-600 text-[10px] font-semibold text-white shadow-sm">
                SK
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#090518] bg-emerald-600 text-[10px] font-semibold text-emerald-100 shadow-sm">
                BL
              </span>
            </span>
            <span>Trusted by 2,400+ governance leaders</span>
          </div>
        </div>
      </section>

      {/* Capabilities / Features Section */}
      <section id="features" className="relative mx-auto mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Capabilities</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Engineered for absolute fidelity
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="group relative flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40 hover:bg-white/[0.05] hover:shadow-[0_4px_24px_rgba(139,92,246,0.12)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-950/60 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-transform duration-300 group-hover:scale-105">
                <Icon name={f.icon} size={18} />
              </span>
              <h3 className="font-heading text-lg font-semibold tracking-tight text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section id="how-it-works" className="relative mx-auto mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Workflow</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            How Inkloom governs fast
          </h2>
        </div>

        <ol className="mt-8 flex flex-col">
          {steps.map((s, i) => (
            <li key={s.n} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]">
                  {s.n}
                </span>
                {i < steps.length - 1 && (
                  <span className="my-1.5 w-0.5 flex-1 rounded bg-violet-950 border-l border-violet-800/40" />
                )}
              </div>
              <div className={`flex flex-col gap-1 ${i < steps.length - 1 ? "pb-8" : ""}`}>
                <h3 className="pt-0.5 font-heading text-lg font-semibold tracking-tight text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Call to Action Section */}
      <section className="relative mx-auto mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-b from-violet-950/60 via-[#130b2c]/80 to-[#0c081e]/90 p-8 text-center text-white shadow-[0_0_50px_rgba(124,58,237,0.18)] backdrop-blur-xl sm:p-12">
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-violet-600/20 blur-2xl" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-fuchsia-600/20 blur-2xl" />
          <div className="relative flex flex-col items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-950/80 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Icon name="sparkles" size={20} />
            </span>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to protect your brand?
            </h2>
            <p className="max-w-[360px] text-sm leading-relaxed text-slate-300">
              Start with a free workspace and bring your team on-brand in minutes.
            </p>
            <div className="mt-3 w-full max-w-[320px]">
              <Link
                href="/role"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-violet-950 shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all hover:bg-slate-100 hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] active:scale-[0.99]"
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
