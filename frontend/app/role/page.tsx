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
    <div
      className="relative min-h-screen bg-cover bg-[position:38%_center] bg-no-repeat sm:bg-center selection:bg-[#6338D8]/20 selection:text-[#21183B]"
      style={{
        backgroundImage: "url('/images/role-selection-bg.jpg')",
      }}
    >
      {/* Soft White & Lavender Overlay (approx 86-88% opacity) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/88 via-[#F8F5FF]/86 to-[#EFE9FC]/89 backdrop-blur-[1.5px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-12 sm:px-6">
        <Header />

        <div className="mt-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-[#21183B]">
              {isSignInIntent ? "Sign In to Inkloom AI" : "Welcome to Inkloom AI"}
            </h1>
            <p className="text-sm leading-[22px] text-[#625B70]">
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
                  className="relative rounded-2xl border border-[#E4DCF5] bg-white p-6 shadow-[0_4px_24px_rgba(99,56,216,0.06)] transition-all duration-200 hover:border-[#C4B3F1] hover:shadow-[0_8px_30px_rgba(99,56,216,0.12)]"
                >
                  <div className="flex h-full flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E4DCF5] bg-[#F5F2FF] text-[#6338D8] shadow-sm">
                        <Icon name={r.slug === "freelancer" ? "pen" : "briefcase"} size={20} />
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full border border-[#E4DCF5]/70 bg-[#F5F2FF] px-3 py-1 text-xs font-semibold tracking-wide text-[#6338D8]">
                          {r.badge}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <h2 className="text-xl font-semibold tracking-[-0.5px] text-[#21183B]">{r.title}</h2>
                      <p className="text-xs font-medium tracking-[0.24px] text-[#625B70]">{r.audience}</p>
                    </div>

                    <p className="text-sm leading-5 text-[#625B70]">{r.description}</p>

                    <ul className="flex flex-col gap-2 pt-1">
                      {r.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-[#21183B]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8F8F0] text-[#16A34A]">
                            <Icon name="check" size={11} />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2">
                      <LinkButton
                        href={targetHref}
                        variant="soft"
                        showArrow
                        className="!bg-[#F0EBFF] !text-[#6338D8] !border !border-[#E4DCF5] hover:!bg-[#E5DAFC] transition-colors font-medium shadow-none"
                      >
                        {buttonText}
                      </LinkButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-xl border border-[#E4DCF5] bg-white/90 p-4 text-center shadow-sm backdrop-blur-sm">
            {isSignInIntent ? (
              <p className="text-xs text-[#625B70]">
                Need to create a new account?{" "}
                <Link href="/role" className="font-semibold text-[#6338D8] hover:underline">
                  Register here
                </Link>
              </p>
            ) : (
              <p className="text-xs text-[#625B70]">
                Already have an account? Sign in as{" "}
                <Link href="/auth/freelancer?mode=signin" className="font-semibold text-[#6338D8] hover:underline">
                  Freelancer
                </Link>{" "}
                or{" "}
                <Link href="/auth/brand?mode=signin" className="font-semibold text-[#6338D8] hover:underline">
                  Brand
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <LinkButton
            href="/"
            variant="outline"
            fullWidth={false}
            className="!border-[#E4DCF5] !bg-white !text-[#6338D8] hover:!bg-[#F5F2FF] px-4 shadow-sm"
          >
            ← Back to landing page
          </LinkButton>
        </div>

        <Footer />
      </div>
    </div>
  );
}
