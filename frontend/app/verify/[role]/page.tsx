"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { isRoleSlug } from "@/lib/roles";

export default function VerifyPage({ params }: { params: { role: string } }) {
  const router = useRouter();
  const role = isRoleSlug(params.role) ? params.role : null;

  useEffect(() => {
    router.replace(role ? `/auth/${role}?mode=signin` : "/role");
  }, [role, router]);

  return (
    <main className="page-shell bg-canvas bg-auth-pattern px-4">
      <Header />
      <div className="mt-4 flex flex-col gap-2">
        <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
          Email verification is not configured
        </h1>
        <p className="text-sm leading-[22px] text-muted">
          This application does not send verification codes. Continue to sign in.
        </p>
      </div>
      <Footer />
    </main>
  );
}
