"use client";

import RoleGuard from "@/components/auth/RoleGuard";
import Header from "@/components/ui/Header";

export default function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="freelancer">
      <div className="mx-auto min-h-screen w-full max-w-[1120px] px-4">
        <Header showNav />
        {children}
      </div>
    </RoleGuard>
  );
}
