"use client";

import { useCallback, useEffect, useState } from "react";
import { listReviews, reviewDecision, type ApiReview } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

export default function BrandReviewsPage() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<ApiReview | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  const loadReviews = useCallback(async () => {
    setError(null);
    try {
      const result = await listReviews();
      setReviews(result.reviews);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load reviews."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function decide(
    review: ApiReview,
    decision: "approved" | "revision" | "rejected",
    note?: string
  ) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await reviewDecision(review.id, decision, note);
      setRevisionTarget(null);
      setRevisionNote("");
      setNotice(
        decision === "revision"
          ? "Revision request sent to the freelancer."
          : `Submission ${decision}.`
      );
      await loadReviews();
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Could not save your decision."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="mt-4 flex flex-col items-center justify-center py-20">
          <div className="h-8 w-32 animate-pulse rounded bg-mist" />
        </div>
      </main>
    );
  }

  const pending = reviews.filter((review) => review.decision === "pending");
  const approved = reviews.filter((review) => review.decision === "approved");
  const revision = reviews.filter((review) => review.decision === "revision");
  const rejected = reviews.filter((review) => review.decision === "rejected");

  return (
    <main className="page-shell">
      <div className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.55px] text-accent">
              Reviews & Approvals
            </span>
          </div>
          <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
            Content Review Studio
          </h1>
          <p className="text-sm leading-[22px] text-muted">
            AI findings support your decision. Only your explicit action can approve or reject content.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-lg border border-[#d8ead8] bg-[#d1fae5] p-3 text-sm text-[#065f46]">
            {notice}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <StatusCount label="Pending" count={pending.length} />
          <StatusCount label="Approved" count={approved.length} />
          <StatusCount label="Revisions" count={revision.length} />
          <StatusCount label="Rejected" count={rejected.length} />
        </div>

        {pending.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="check" size={32} className="mx-auto mb-3 text-success" />
            <h2 className="text-sm font-semibold text-ink">No pending reviews</h2>
            <p className="text-xs text-muted">
              AI-analyzed submissions awaiting a brand decision appear here.
            </p>
          </div>
        ) : (
          pending.map((review) => (
            <article key={review.id} className="card flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">{review.title}</h2>
                  <p className="text-xs text-muted">
                    Compliance score {review.auditScore}/100 · Critical risks {review.criticalRisk}
                  </p>
                </div>
                <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-accent">
                  Human decision required
                </span>
              </div>

              {review.aiResult?.originalContent && (
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-accent">
                    Read submitted content
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-lavender/50 p-3 text-sm text-ink">
                    {review.aiResult.originalContent}
                  </pre>
                </details>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                <Score label="Integrity" value={review.integrityScore} />
                <Score label="Fact match" value={review.factMatch} />
                <Score label="Tone fit" value={review.aiResult?.toneFit.fit ?? 0} />
              </div>

              {review.findings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold text-ink-body">AI findings</h3>
                  {review.findings.map((finding) => (
                    <div key={finding.id} className="rounded-lg bg-lavender/50 px-3 py-2">
                      <p className="text-xs font-semibold text-accent">
                        {finding.rule}: {finding.title}
                      </p>
                      <p className="mt-1 text-sm text-ink">{finding.claim}</p>
                      <p className="mt-1 text-xs text-muted">
                        Suggested correction: {finding.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={busy}
                  loading={busy}
                  onClick={() => void decide(review, "approved")}
                  className="flex-1"
                >
                  <Icon name="check" size={14} /> Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setRevisionTarget(review);
                    setRevisionNote("");
                  }}
                  className="flex-1"
                >
                  <Icon name="pen" size={14} /> Request revision
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={() => void decide(review, "rejected")}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </article>
          ))
        )}

        {revisionTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={() => setRevisionTarget(null)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="revision-title"
              className="card w-full max-w-lg p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="revision-title" className="text-base font-semibold text-ink">
                Request a revision
              </h2>
              <p className="mt-1 text-sm text-muted">
                Explain what the freelancer should change in “{revisionTarget.title}”.
              </p>
              <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-ink">
                Revision reason
                <textarea
                  className="field-input h-auto py-2"
                  rows={5}
                  maxLength={2000}
                  value={revisionNote}
                  onChange={(event) => setRevisionNote(event.target.value)}
                  required
                />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth={false}
                  onClick={() => setRevisionTarget(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  fullWidth={false}
                  disabled={busy || revisionNote.trim().length < 3}
                  loading={busy}
                  onClick={() =>
                    void decide(revisionTarget, "revision", revisionNote.trim())
                  }
                >
                  Send revision request
                </Button>
              </div>
            </section>
          </div>
        )}

        <RecentDecisions reviews={approved} label="Recently approved" />
        <RecentDecisions reviews={revision} label="Revision requested" />
        <RecentDecisions reviews={rejected} label="Rejected" />
      </div>
    </main>
  );
}

function StatusCount({ label, count }: { label: string; count: number }) {
  return (
    <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink">
      {label}: {count}
    </span>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-lavender/50 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}/100</p>
    </div>
  );
}

function RecentDecisions({
  reviews,
  label,
}: {
  reviews: ApiReview[];
  label: string;
}) {
  if (reviews.length === 0) return null;
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-xs font-semibold text-ink">{label}</h2>
      <ul className="divide-y divide-[#ebe4f7]">
        {reviews.map((review) => (
          <li key={review.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-ink">{review.title}</span>
            <span className="text-xs text-muted">{review.decision}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
