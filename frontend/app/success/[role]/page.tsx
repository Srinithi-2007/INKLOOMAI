import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { LinkButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Link from "next/link";

export default function SuccessPage({
  params,
}: {
  params: { role: string };
}) {
  const role = params.role as string;
  const isBrand = role === "brand";

  return (
    <main className="page-shell">
      <Header />

      <div className="mt-4 flex flex-col gap-6 items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint/40 text-success">
          <Icon name="check" size={32} />
        </div>
        <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
          Account Created
        </h1>
        <p className="max-w-[384px] text-sm leading-[22px] text-muted">
          Your {role} account is ready. You can now access your workspace.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[360px]">
          <LinkButton
            href={isBrand ? "/brand" : "/freelancer"}
            showArrow
          >
            Go to {isBrand ? "Brand Dashboard" : "Freelancer Dashboard"}
          </LinkButton>
          <LinkButton href="/" variant="outline">
            Back to Home
          </LinkButton>
        </div>
      </div>

      <Footer />
    </main>
  );
}