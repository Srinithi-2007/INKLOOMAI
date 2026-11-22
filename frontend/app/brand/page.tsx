"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listCampaigns,
  listSubmissions,
  listReviews,
  listFreelancers,
  healthCheck,
  type ApiCampaign,
  type ApiReview,
  type ApiSubmission,
  type ApiUser,
} from "@/lib/api";
import Icon, { type IconName } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";

export default function BrandOverviewPage() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [freelancers, setFreelancers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [campaignsRes, submissionsRes, reviewsRes, freelancersRes, healthRes] =
          await Promise.all([
            listCampaigns(),
            listSubmissions(),
            listReviews(),
            listFreelancers(),
            healthCheck(),
          ]);

        setCampaigns(campaignsRes.campaigns);
        setSubmissions(submissionsRes.submissions);
        setReviews(reviewsRes.reviews);
        setFreelancers(freelancersRes.users);
        if (healthRes.status !== "ok") {
          setError("Backend health check did not report a ready service.");
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pendingReviews = reviews.filter((r) => r.decision === "pending").length;
  const approvedCount = reviews.filter((r) => r.decision === "approved").length;

  if (loading) {
    return (
      <main className="page-shell">
        <div className="mt-4 flex flex-col items-center justify-center py-20">
          <div className="h-8 w-32 rounded bg-mist animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.55px] text-accent">
              Brand Workspace
            </span>
          </div>
          <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
            Hello, {currentUser?.fullName || "Brand Admin"}
          </h1>
          <p className="text-sm leading-[22px] text-muted">
            Manage your brand campaigns, review submissions, and approve content.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card p-4">
            <span className="text-xs font-medium text-muted">Campaigns</span>
            <span className="font-heading text-2xl font-semibold text-ink">{campaigns.length}</span>
            <span className="text-xs text-muted">
              {campaigns.filter((c) => c.status === "active").length} active
            </span>
          </div>
          <div className="card p-4">
            <span className="text-xs font-medium text-muted">Freelancers</span>
            <span className="font-heading text-2xl font-semibold text-ink">{freelancers.length}</span>
            <span className="text-xs text-muted">Available creators</span>
          </div>
          <div className="card p-4">
            <span className="text-xs font-medium text-muted">Pending Reviews</span>
            <span className="font-heading text-2xl font-semibold text-ink">{pendingReviews}</span>
            <span className="text-xs text-muted">Awaiting your decision</span>
          </div>
          <div className="card p-4">
            <span className="text-xs font-medium text-muted">Approved</span>
            <span className="font-heading text-2xl font-semibold text-ink">{approvedCount}</span>
            <span className="text-xs text-muted">Final sign-off</span>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <LinkButtonCard
            icon="briefcase"
            title="Create Campaign"
            hint="Launch a new brand campaign"
            href="/brand/campaigns"
          />
          <LinkButtonCard
            icon="check"
            title="Review Submissions"
            hint={`${pendingReviews} pending your decision`}
            href="/brand/reviews"
          />
          <LinkButtonCard
            icon="users"
            title="Manage Freelancers"
            hint="Assign creators to campaigns"
            href="/brand/freelancers"
          />
          <LinkButtonCard
            icon="sparkles"
            title="Brand DNA & Guidelines"
            hint="Voice, pillars, banned words & rules"
            href="/brand/dna"
          />
          <LinkButtonCard
            icon="bar-chart"
            title="Governance Analytics"
            hint="Compliance health & audit trail"
            href="/brand/governance"
          />
        </section>

        {/* Recent Submissions */}
        {submissions.length > 0 || reviews.length > 0 ? (
          <section className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">Recent Activity</h2>
              <Link href="/brand/reviews" className="text-[12px] font-semibold text-accent hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-[#ebe4f7]">
              {[...submissions, ...reviews]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || b.updatedAt).getTime() -
                    new Date(a.createdAt || a.updatedAt).getTime()
                )
                .slice(0, 6)
                .map((item) => {
                  const status =
                    "decision" in item
                      ? item.decision === "pending"
                        ? "Pending"
                        : item.decision
                      : item.status;
                  return (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lavender text-primary">
                        <Icon name="pen" size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.title || "Untitled"}
                        </p>
                        <p className="truncate text-xs text-muted">
                          Campaign {item.campaignId}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {status}
                    </span>
                  </div>
                  );
                })}
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-[#ebe4f7] bg-lavender/50 p-8 text-center">
            <Icon name="sparkles" size={32} className="mx-auto mb-3 text-accent" />
            <h3 className="text-base font-semibold text-ink">No data yet</h3>
            <p className="text-sm text-muted">
              Create your first campaign to get started.
            </p>
            <LinkButton href="/brand/campaigns" className="mt-4">
              Create Campaign
            </LinkButton>
          </div>
        )}
      </div>
    </main>
  );
}

function LinkButtonCard({
  icon,
  title,
  hint,
  href,
}: {
  icon: IconName;
  title: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card p-4 hover:shadow-card transition-shadow"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender text-primary mb-3">
        <Icon name={icon} size={16} />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="text-xs text-muted">{hint}</p>
    </Link>
  );
}