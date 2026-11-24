"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import Icon from "./Icon";
import { Button, LinkButton } from "./Button";
import NotificationBell from "./NotificationBell";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  right?: React.ReactNode;
  showNav?: boolean;
  dark?: boolean;
}

export default function Header({ right, showNav = false, dark = false }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <header className={`relative flex h-16 items-center justify-between border-b transition-colors ${
      dark ? "border-white/[0.08] bg-transparent" : "border-[#f0ebfa] bg-transparent"
    }`}>
      <Logo dark={dark} />

      {right ? (
        <div className="flex items-center gap-3">{right}</div>
      ) : showNav ? (
        <>
          <nav aria-label="Main Navigation" className="hidden shrink-0 items-center gap-3 sm:flex md:gap-5">
            <Link
              href="/#features"
              className={`whitespace-nowrap text-sm font-medium transition-colors ${
                dark ? "text-slate-300 hover:text-white" : "text-muted hover:text-accent"
              }`}
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className={`whitespace-nowrap text-sm font-medium transition-colors ${
                dark ? "text-slate-300 hover:text-white" : "text-muted hover:text-accent"
              }`}
            >
              How it works
            </Link>
            {currentUser ? (
              <>
                <Link
                  href={currentUser.role === "brand" ? "/brand" : "/freelancer"}
                  className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                    dark ? "text-emerald-400 hover:text-emerald-300 hover:underline" : "text-accent hover:underline"
                  }`}
                >
                  {currentUser.role === "brand" ? "Brand Dashboard" : "Freelancer Dashboard"}
                </Link>
                <NotificationBell dark={dark} />
                {dark ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-9 min-h-[36px] items-center justify-center rounded-lg border border-white/20 bg-transparent px-3.5 text-xs font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Button type="button" variant="outline" fullWidth={false} onClick={handleLogout} className="!h-9 !min-h-[36px] shrink-0 whitespace-nowrap px-3 text-xs shadow-none">
                    Sign Out
                  </Button>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/role?intent=signin"
                  className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                    dark ? "text-emerald-400 hover:text-emerald-300 hover:underline" : "text-accent hover:underline"
                  }`}
                >
                  Sign In
                </Link>
                {dark ? (
                  <Link
                    href="/role"
                    className="inline-flex h-9 min-h-[36px] items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-emerald-950/40 transition-all"
                  >
                    Get Started
                  </Link>
                ) : (
                  <LinkButton
                    href="/role"
                    variant="primary"
                    fullWidth={false}
                    className="!h-9 !min-h-[36px] shrink-0 whitespace-nowrap px-3.5 text-xs shadow-none"
                  >
                    Get Started
                  </LinkButton>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                dark
                  ? "border-white/15 bg-white/[0.05] text-white hover:bg-white/10"
                  : "border-[#e4dcf5] bg-white text-ink hover:bg-lavender/40"
              }`}
            >
              <Icon name={mobileMenuOpen ? "x" : "menu"} size={18} />
            </button>
          </div>

          {mobileMenuOpen && (
            <div
              className={`absolute left-0 right-0 top-16 z-50 flex flex-col gap-3 rounded-b-2xl border border-t-0 p-4 sm:hidden ${
                dark
                  ? "border-emerald-900/40 bg-[#07120B]/95 backdrop-blur-xl text-white shadow-2xl"
                  : "border-[#e4dcf5] bg-white text-ink shadow-card"
              }`}
              role="dialog"
              aria-label="Mobile Navigation Menu"
            >
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                  dark ? "text-slate-200 hover:bg-white/10" : "text-ink hover:bg-lavender/50"
                }`}
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                  dark ? "text-slate-200 hover:bg-white/10" : "text-ink hover:bg-lavender/50"
                }`}
              >
                How it works
              </Link>
              {currentUser ? (
                <>
                  <Link
                    href={currentUser.role === "brand" ? "/brand" : "/freelancer"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${
                      dark ? "text-emerald-400 hover:bg-white/10" : "text-accent hover:bg-lavender/50"
                    }`}
                  >
                    {currentUser.role === "brand" ? "Brand Dashboard" : "Freelancer Dashboard"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                      dark ? "text-slate-300 hover:bg-white/10" : "text-ink hover:bg-lavender/50"
                    }`}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/role?intent=signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${
                      dark ? "text-emerald-400 hover:bg-white/10" : "text-accent hover:bg-lavender/50"
                    }`}
                  >
                    Sign In
                  </Link>
                  {dark ? (
                    <Link
                      href="/role"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-950/40"
                    >
                      Get Started
                    </Link>
                  ) : (
                    <LinkButton
                      href="/role"
                      onClick={() => setMobileMenuOpen(false)}
                      variant="primary"
                    >
                      Get Started
                    </LinkButton>
                  )}
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`text-xs font-medium transition-colors ${
              dark ? "text-slate-400 hover:text-emerald-400" : "text-muted hover:text-accent"
            }`}
          >
            ← Home
          </Link>
        </div>
      )}
      {logoutError && (
        <div role="alert" className="absolute right-0 top-full z-50 mt-2 rounded-lg border border-[#f4c7c3] bg-white p-3 text-sm text-[#b42318] shadow-card">
          {logoutError}
        </div>
      )}
    </header>
  );
}