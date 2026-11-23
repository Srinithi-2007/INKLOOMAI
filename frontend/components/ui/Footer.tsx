"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import { Button } from "./Button";

type ModalType = "privacy" | "terms" | null;

export default function Footer({ dark = false }: { dark?: boolean }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <footer className={`mt-16 flex flex-col items-center gap-4 border-t pt-8 text-center transition-colors ${
      dark ? "border-white/[0.08]" : "border-[#ebe4f7]"
    }`}>
      <nav aria-label="Footer Navigation" className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] ${
        dark ? "text-slate-400" : "text-muted"
      }`}>
        <Link href="/#features" className={dark ? "hover:text-violet-300 transition-colors" : "hover:text-accent"}>
          Features
        </Link>
        <Link href="/#how-it-works" className={dark ? "hover:text-violet-300 transition-colors" : "hover:text-accent"}>
          How it works
        </Link>
        <button
          type="button"
          onClick={() => setActiveModal("privacy")}
          className={`${dark ? "hover:text-violet-300" : "hover:text-accent"} focus:outline-none transition-colors`}
        >
          Privacy
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("terms")}
          className={`${dark ? "hover:text-violet-300" : "hover:text-accent"} focus:outline-none transition-colors`}
        >
          Terms
        </button>
      </nav>
      <p className={`text-xs ${dark ? "text-slate-500" : "text-muted"}`}>© 2026 Inkloom AI. All rights reserved.</p>
      <p className={`max-w-md text-[11px] ${dark ? "text-slate-500/80" : "text-[#9b96ab]"}`}>
        Email verification and delivery are not configured. Account, campaign, and review data use the backend.
      </p>
      {activeModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
            dark ? "bg-black/70" : "bg-black/40 backdrop-blur-sm"
          }`}
          role="presentation"
          onClick={() => setActiveModal(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-modal-title"
            className={`w-full max-w-lg p-6 text-left rounded-2xl border ${
              dark
                ? "border-white/10 bg-[#0d0920] text-white shadow-2xl"
                : "card border-[#ebe4f7] bg-white text-ink shadow-card"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="footer-modal-title" className={`text-base font-semibold capitalize ${dark ? "text-white" : "text-ink"}`}>
                {activeModal}
              </h2>
              {dark ? (
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => setActiveModal(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                >
                  <Icon name="x" size={14} />
                </button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  fullWidth={false}
                  aria-label="Close dialog"
                  onClick={() => setActiveModal(null)}
                  className="!min-h-9 px-3"
                >
                  <Icon name="x" size={14} />
                </Button>
              )}
            </div>
            <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-slate-300" : "text-muted"}`}>
              {activeModal === "privacy"
                ? "Privacy policy details have not been published for this MVP. Do not enter sensitive personal or confidential information."
                : "Terms of service have not been published for this MVP. This application is provided for evaluation and demonstration."}
            </p>
          </section>
        </div>
      )}
    </footer>
  );
}