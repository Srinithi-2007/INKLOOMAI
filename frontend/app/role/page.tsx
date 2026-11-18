import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Icon from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import Link from "next/link";

const roles = [
  {
    slug: "freelancer",
    title: "I'm a Freelancer",
    audience: "Content Creators, Designers & Copywriters",
    description:
      "Create content, collaborate with brands, receive AI-powered feedback, and manage your projects seamlessly.",
    badge: "Creator Hub",
    features: [
      "Manage creative projects & deliverables",
      "Work with multiple verified brands",
      "Receive instant AI content feedback",
      "Track revisions, escrow & approvals",
    ],
    cta: "Continue as Freelancer",
    signInCta: "Sign In as Freelancer",
  },
  {
    slug: "brand",
    title: "I'm a Brand",
    audience: "Marketing Teams, Founders & Agencies",
    description:
      "Manage your brand identity, launch campaigns, collaborate with vetted creators, and orchestrate compliant releases.",
    badge: "Brand Suite",
    features: [
      "Define brand DNA and tone guardrails",
      "Launch campaigns with vetted creators",
      "Invite freelancers into shared rooms",
      "Run compliant, auditable approvals",
    ],
    cta: "Continue as Brand",
    signInCta: "Sign In as Brand",
  },
];

export default function RolePage({
  searchParams,
}: {
  searchParams?: { intent?: string; mode?: string };
}) {
  const isSignInIntent = searchParams?.intent === "signin" || searchParams?.mode === "signin";

  return (
    <main className="page-shell bg-canvas bg-auth-pattern px-4">
      <Header />

      <div className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
            {isSignInIntent ? "Sign In to Inkloom AI" : "Welcome to Inkloom AI"}
          </h1>
          <p className="text-sm leading-[22px] text-muted">
            {isSignInIntent
              ? "Select your account type to continue to your tailored workspace and governance dashboard."
              : "Choose how you want to use Inkloom AI. We'll personalize your workspace and governance guardrails based on your role."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {roles.map((r) => {
            const targetHref = isSignInIntent
              ? `/auth/${r.slug}?mode=signin`
              : `/auth/${r.slug}`;
            const buttonText = isSignInIntent ? r.signInCta : r.cta;

            return (
              <article
                key={r.slug}
                className="relative rounded-xl bg-gradient-to-r from-primary to-lilac p-[2px]"
              >
                <div className="flex h-full flex-col gap-3 rounded-[10px] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-primary">
                      <Icon name={r.slug === "freelancer" ? "pen" : "briefcase"} size={20} />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold tracking-[0.24px] text-accent">
                        {r.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl font-semibold tracking-[-0.5px] text-ink">{r.title}</h2>
                    <p className="text-xs font-medium tracking-[0.24px] text-muted">{r.audience}</p>
                  </div>

                  <p className="text-sm leading-5 text-muted">{r.description}</p>

                  <ul className="flex flex-col gap-2 pt-1">
                    {r.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/30 text-success">
                          <Icon name="check" size={11} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <LinkButton href={targetHref} variant="soft" showArrow>
                      {buttonText}
                    </LinkButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="rounded-xl border border-[#ebe4f7] bg-white/70 p-4 text-center">
          {isSignInIntent ? (
            <p className="text-xs text-muted">
              Need to create a new account?{" "}
              <Link href="/role" className="font-semibold text-accent hover:underline">
                Register here
              </Link>
            </p>
          ) : (
            <p className="text-xs text-muted">
              Already have an account? Sign in as{" "}
              <Link href="/auth/freelancer?mode=signin" className="font-semibold text-accent hover:underline">
                Freelancer
              </Link>{" "}
              or{" "}
              <Link href="/auth/brand?mode=signin" className="font-semibold text-accent hover:underline">
                Brand
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <LinkButton href="/" variant="outline" fullWidth={false} className="px-4">
          ← Back to landing page
        </LinkButton>
      </div>

      <Footer />
    </main>
  );
}