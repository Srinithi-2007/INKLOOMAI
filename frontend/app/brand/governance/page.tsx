"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { getGovernanceAnalytics, type GovernanceAnalytics } from "@/lib/api";

export default function GovernanceAnalyticsPage() {
  const [data, setData] = useState<GovernanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await getGovernanceAnalytics();
      setData(res.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load governance analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="page-shell">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-44 rounded-xl bg-mist animate-pulse mb-3" />
          <p className="text-sm text-muted">Aggregating governance intelligence...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mt-4 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0ebfa] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.55px] text-accent">
                Brand Intelligence
              </span>
            </div>
            <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink mt-1">
              Governance & Compliance Analytics
            </h1>
            <p className="text-sm text-muted">
              Real-time compliance scores, policy violations, risk distribution, and audit history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              fullWidth={false}
              onClick={loadData}
              className="!h-9 !min-h-[36px] px-3 text-xs"
            >
              <Icon name="refresh" size={14} className="mr-1.5" />
              Refresh Analytics
            </Button>
            <Link
              href="/brand/dna"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Icon name="sparkles" size={14} className="mr-1.5" />
              Edit Brand DNA
            </Link>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="card p-4">
                <span className="text-xs font-medium text-muted">Average Compliance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {data.averageComplianceScore}%
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      data.averageComplianceScore >= 85
                        ? "text-green-600"
                        : data.averageComplianceScore >= 70
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {data.averageComplianceScore >= 85 ? "Healthy" : "Attention"}
                  </span>
                </div>
                <span className="text-[11px] text-muted">Target threshold &ge; 85%</span>
              </div>

              <div className="card p-4">
                <span className="text-xs font-medium text-muted">Content Integrity</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {data.averageIntegrityScore}%
                  </span>
                  <span className="text-[11px] font-semibold text-accent">Fact & Tone</span>
                </div>
                <span className="text-[11px] text-muted">Gemini cross-validation</span>
              </div>

              <div className="card p-4">
                <span className="text-xs font-medium text-muted">Approval Rate</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {data.approvalRate}%
                  </span>
                  <span className="text-[11px] text-muted">
                    ({data.decisions.approved} approved)
                  </span>
                </div>
                <span className="text-[11px] text-muted">
                  Rejections: {data.rejectionRate}%
                </span>
              </div>

              <div className="card p-4">
                <span className="text-xs font-medium text-muted">Revision Frequency</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {data.revisionFrequency}%
                  </span>
                  <span className="text-[11px] text-muted">of submissions</span>
                </div>
                <span className="text-[11px] text-muted">
                  Total Reviews: {data.totalReviews}
                </span>
              </div>
            </div>

            {/* Risk Distribution & Recurring Violations */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Risk Distribution */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-ink">Risk Distribution</h2>
                  <span className="text-xs text-muted">AI Guardrail Evaluation</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      Low Risk (Passable)
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {data.riskDistribution.Low} reviews
                    </span>
                  </div>
                  <div className="w-full bg-[#f0ebfa] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{
                        width: `${
                          data.totalReviews > 0
                            ? Math.round((data.riskDistribution.Low / data.totalReviews) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Medium Risk (Tone Drift / Minor Claims)
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {data.riskDistribution.Medium} reviews
                    </span>
                  </div>
                  <div className="w-full bg-[#f0ebfa] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${
                          data.totalReviews > 0
                            ? Math.round((data.riskDistribution.Medium / data.totalReviews) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      High Risk (Banned Terms / Critical Violations)
                    </span>
                    <span className="text-xs font-bold text-ink">
                      {data.riskDistribution.High} reviews
                    </span>
                  </div>
                  <div className="w-full bg-[#f0ebfa] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all"
                      style={{
                        width: `${
                          data.totalReviews > 0
                            ? Math.round((data.riskDistribution.High / data.totalReviews) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recurring Violations */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-ink">Top Recurring Policy Findings</h2>
                  <span className="text-xs text-muted">Frequency Rank</span>
                </div>
                {data.recurringViolations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600 mb-2">
                      <Icon name="check" size={20} />
                    </span>
                    <p className="text-xs font-semibold text-ink">Zero recurring violations detected</p>
                    <p className="text-[11px] text-muted">All submissions conform strictly to your Brand DNA.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f0ebfa]">
                    {data.recurringViolations.map((v: { rule: string; count: number }, i: number) => (
                      <div key={v.rule} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-lavender text-[11px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="truncate text-xs font-medium text-ink">{v.rule}</span>
                        </div>
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 shrink-0">
                          {v.count} {v.count === 1 ? "occurrence" : "occurrences"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Platform Performance Breakdown */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-ink">Platform Breakdown & Compliance</h2>
                <span className="text-xs text-muted">Channel Performance</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f0ebfa] text-muted">
                      <th className="pb-3 font-semibold">Channel</th>
                      <th className="pb-3 font-semibold">Submissions</th>
                      <th className="pb-3 font-semibold">Approved</th>
                      <th className="pb-3 font-semibold">Compliance Score</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f1fc]">
                    {data.platformBreakdown.map((p: { platform: string; submissions: number; approved: number; complianceScore: number }) => (
                      <tr key={p.platform} className="hover:bg-canvas/50">
                        <td className="py-3 font-semibold text-ink flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-lavender text-primary">
                            <Icon name="globe" size={12} />
                          </span>
                          {p.platform}
                        </td>
                        <td className="py-3 text-ink-body">{p.submissions}</td>
                        <td className="py-3 text-ink-body">{p.approved}</td>
                        <td className="py-3 font-semibold text-ink">{p.complianceScore}%</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              p.complianceScore >= 85
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {p.complianceScore >= 85 ? "Optimal" : "Monitor"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Audit Trail */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-ink">Recent Governance Audit Trail</h2>
                <Link href="/brand/reviews" className="text-xs font-semibold text-accent hover:underline">
                  View All Reviews &rarr;
                </Link>
              </div>
              {data.auditTrail.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">No review audits on record.</div>
              ) : (
                <div className="divide-y divide-[#f0ebfa]">
                  {data.auditTrail.map((audit: { id: string; decision: string; timestamp: string; auditScore: number }) => (
                    <div key={audit.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            audit.decision === "approved"
                              ? "bg-green-50 text-green-600"
                              : audit.decision === "rejected"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <Icon name={audit.decision === "approved" ? "check" : "shield"} size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">
                            Review Audit #{audit.id.slice(-6)}
                          </p>
                          <p className="text-[11px] text-muted">
                            {new Date(audit.timestamp).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold text-ink">{audit.auditScore}/100</p>
                          <p className="text-[10px] text-muted">Audit Score</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            audit.decision === "approved"
                              ? "bg-green-100 text-green-800"
                              : audit.decision === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {audit.decision}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
