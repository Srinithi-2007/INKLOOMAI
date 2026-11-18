"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/ui/Logo";
import Icon from "@/components/ui/Icon";
import RoleGuard from "@/components/auth/RoleGuard";

const BRAND_NAV = [
  { label: "Overview", href: "/brand", icon: "shield" },
  { label: "Campaigns", href: "/brand/campaigns", icon: "briefcase" },
  { label: "Reviews", href: "/brand/reviews", icon: "check" },
  { label: "Freelancers", href: "/brand/freelancers", icon: "users" },
] as const;

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLogoutError(null);
    try {
      await logout();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Could not sign out."
      );
    }
  }

  return (
    <RoleGuard role="brand">
      <div className="min-h-screen bg-canvas bg-brand-pattern">
      <header className="fixed inset-x-0 top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#f0ebfa] bg-white">
        <div className="flex items-center gap-4 pl-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-lavender/40 md:hidden"
          >
            <Icon name="menu" size={18} />
          </button>
          <Logo href="/" />
        </div>

        <div className="hidden md:flex items-center gap-5">
          <nav aria-label="Main Navigation" className="flex items-center gap-1">
            {BRAND_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex h-12 w-[200px] items-center gap-3 rounded-lg p-3.5 text-sm transition-colors text-ink-body hover:bg-brand-50"
              >
                <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 pr-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-sm text-muted">
                {currentUser.fullName} ({currentUser.role})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-lavender/40"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
          ) : (
            <Link href="/role?intent=signin" className="text-sm font-medium text-accent hover:underline">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-y-0 left-0 w-[280px] bg-white border-r border-[#f0ebfa] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#f0ebfa]">
              <Logo href="/" />
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              {BRAND_NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-11 w-full items-center gap-3 rounded-lg p-3 text-sm transition-colors text-ink-body hover:bg-brand-50"
                >
                  <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-[#f0ebfa]">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-sm text-accent hover:bg-lavender/40"
              >
                <Icon name="x" size={16} /> Sign Out
              </button>
            </div>
          </div>
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <main className="px-4 pb-10 pt-[136px] md:pl-[calc(280px+2rem)] md:pr-8 md:pt-[96px]">
        <div className="mx-auto w-full max-w-[1144px]">{children}</div>
      </main>
      {logoutError && (
        <div role="alert" className="fixed bottom-4 right-4 z-50 rounded-lg border border-[#f4c7c3] bg-white p-3 text-sm text-[#b42318] shadow-card">
          {logoutError}
        </div>
      )}
      </div>
    </RoleGuard>
  );
}