import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Icon from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
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
  { n: "1", title: "Set up your brand DNA", body: "Upload guidelines, establish tone sliders, and connect verified team and freelancer workspaces." },
  { n: "2", title: "Create inside shared rooms", body: "Creators draft collateral inside shared rooms while live heuristics highlight off-brand drift." },
  { n: "3", title: "Approve and export", body: "Gain executive sign-off with verifiable compliance timestamps and export ready-to-run assets." },
];

export default function LandingPage() {
  return (
    <main className="page-shell">
      <Header showNav />
      <section className="flex flex-col items-center gap-4 pt-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1 text-xs font-semibold tracking-[0.24px] text-accent shadow-soft">
          <Icon name="sparkles" size={14} />
          AI-Powered Brand Governance
        </span>
        <h1 className="font-heading text-[28px] font-semibold leading-9 tracking-[-0.7px] text-ink sm:text-[34px] sm:leading-[42px]">
          Your Brand. Your Voice.
          <span className="block text-accent">Perfectly Protected.</span>
        </h1>
        <p className="max-w-[384px] text-base leading-[26px] text-muted">
          Create, review, and manage content with AI-powered brand governance. Bring teams and creators together
          while keeping every asset impeccably on-brand.
        </p>
        <div className="mt-6 flex w-full max-w-[360px] flex-col gap-3">
          <LinkButton href="/role" showArrow>Get Started</LinkButton>
          <LinkButton href="#features" variant="outline">
            <Icon name="compass" size={15} />
            Explore Features
          </LinkButton>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-muted">
          <span className="flex -space-x-2" aria-hidden="true">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-canvas bg-lilac text-[10px] text-white">AC</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-canvas bg-accent text-[10px] text-white">SK</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-canvas bg-success text-[10px] text-mint">BL</span>
          </span>
          <span>Trusted by 2,400+ governance leaders</span>
        </div>
      </section>
      <section id="features" className="mt-16 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24px] text-accent">Capabilities</p>
          <h2 className="text-2xl font-semibold tracking-[-0.5px] text-ink">Engineered for absolute fidelity</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="card flex flex-col gap-3 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender text-primary">
                <Icon name={f.icon} size={18} />
              </span>
              <h3 className="text-lg font-semibold tracking-[-0.3px] text-ink">{f.title}</h3>
              <p className="text-sm leading-[22px] text-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mt-16 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24px] text-accent">Workflow</p>
          <h2 className="text-2xl font-semibold tracking-[-0.5px] text-ink">How Inkloom governs fast</h2>
        </div>
        <ol className="flex flex-col">
          {steps.map((s, i) => (
            <li key={s.n} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {s.n}
                </span>
                {i < steps.length - 1 && <span className="my-1 w-0.5 flex-1 rounded bg-mist" />}
              </div>
              <div className={`flex flex-col gap-1 ${i < steps.length - 1 ? "pb-8" : ""}`}>
                <h3 className="pt-1 text-lg font-semibold tracking-[-0.3px] text-ink">{s.title}</h3>
                <p className="text-sm leading-[22px] text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-6 text-center text-white sm:p-10">
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative flex flex-col items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Icon name="sparkles" size={18} />
          </span>
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.5px]">Ready to protect your brand?</h2>
          <p className="max-w-[320px] text-sm leading-[22px] text-white/85">
            Start with a free workspace and bring your team on-brand in minutes.
          </p>
          <div className="mt-2 w-full max-w-[320px]">
            <LinkButton href="/role" variant="outline" className="!border-white !bg-white !text-accent">
              Get Started
            </LinkButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}