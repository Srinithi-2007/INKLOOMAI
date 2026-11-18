"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { RoleSlug } from "@/lib/roles";

export default function RoleGuard({
  role,
  children,
}: {
  role: RoleSlug;
  children: ReactNode;
}) {
  const { currentUser, initializationError, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    if (!currentUser) {
      router.replace("/role?intent=signin");
      return;
    }
    if (currentUser.role !== role) {
      router.replace(currentUser.role === "brand" ? "/brand" : "/freelancer");
    }
  }, [currentUser, isInitialized, role, router]);

  if (!isInitialized) {
    return (
      <main className="page-shell">
        <div className="mt-4 flex flex-col items-center justify-center py-20">
          <div className="h-8 w-32 animate-pulse rounded bg-mist" />
        </div>
      </main>
    );
  }

  if (initializationError) {
    return (
      <main className="page-shell">
        <div role="alert" className="mt-4 rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]">
          {initializationError}
        </div>
      </main>
    );
  }

  if (!currentUser || currentUser.role !== role) return null;
  return children;
}
