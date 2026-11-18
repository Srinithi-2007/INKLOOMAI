"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import { Button } from "./Button";

type ModalType = "privacy" | "terms" | null;

export default function Footer() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <footer className="mt-12 flex flex-col items-center gap-4 border-t border-[#ebe4f7] pt-8 text-center">
      <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted">
        <Link href="/#features" className="hover:text-accent">
          Features
        </Link>
        <Link href="/#how-it-works" className="hover:text-accent">
          How it works
        </Link>
        <button
          type="button"
          onClick={() => setActiveModal("privacy")}
          className="hover:text-accent focus:outline-none"
        >
          Privacy
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("terms")}
          className="hover:text-accent focus:outline-none"
        >
          Terms
        </button>
      </nav>
      <p className="text-xs text-muted">© 2026 Inkloom AI. All rights reserved.</p>
      <p className="max-w-md text-[11px] text-[#9b96ab]">
        Email verification and delivery are not configured. Account, campaign, and review data use the backend.
      </p>
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setActiveModal(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-modal-title"
            className="card w-full max-w-lg p-5 text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="footer-modal-title" className="text-base font-semibold capitalize text-ink">
                {activeModal}
              </h2>
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
            </div>
            <p className="mt-3 text-sm text-muted">
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