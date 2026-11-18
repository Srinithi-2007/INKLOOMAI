"use client";

import { useCallback, useEffect, useState } from "react";
import { createAssignment, listCampaigns, listFreelancers, type ApiCampaign, type ApiUser } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

export default function BrandFreelancersPage() {
  const [freelancers, setFreelancers] = useState<ApiUser[]>([]);
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [campaignByFreelancer, setCampaignByFreelancer] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyFreelancer, setBusyFreelancer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [freelancerResult, campaignResult] = await Promise.all([
        listFreelancers(),
        listCampaigns(),
      ]);
      setFreelancers(freelancerResult.users);
      setCampaigns(campaignResult.campaigns);
      setCampaignByFreelancer((current) => {
        const next = { ...current };
        for (const freelancer of freelancerResult.users) {
          if (!next[freelancer.id] && campaignResult.campaigns[0]) {
            next[freelancer.id] = campaignResult.campaigns[0].id;
          }
        }
        return next;
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load freelancers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function assign(freelancerId: string) {
    const campaignId = campaignByFreelancer[freelancerId];
    if (!campaignId) return;
    setBusyFreelancer(freelancerId);
    setError(null);
    setNotice(null);
    try {
      await createAssignment({ campaignId, freelancerId });
      setNotice("Freelancer assigned to the campaign.");
    } catch (assignmentError) {
      setError(
        assignmentError instanceof Error
          ? assignmentError.message
          : "Could not assign freelancer."
      );
    } finally {
      setBusyFreelancer(null);
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

  return (
    <main className="page-shell">
      <div className="mt-4 flex flex-col gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.55px] text-accent">
            Creator Network
          </span>
          <h1 className="mt-2 text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
            Freelancers
          </h1>
          <p className="mt-1 text-sm leading-[22px] text-muted">
            Assign a freelancer to one of your campaigns. They will only see campaigns assigned to their account.
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
        {campaigns.length === 0 && (
          <div className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]">
            Create a campaign before assigning freelancers.
          </div>
        )}

        {freelancers.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="users" size={32} className="mx-auto mb-3 text-accent" />
            <h2 className="text-base font-semibold text-ink">No freelancers found</h2>
            <p className="mt-1 text-sm text-muted">
              Freelancer accounts will be listed here once registered.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {freelancers.map((freelancer) => (
              <article key={freelancer.id} className="card flex flex-col gap-3 p-5">
                <div>
                  <h2 className="text-base font-semibold text-ink">{freelancer.fullName}</h2>
                  <p className="text-sm text-muted">{freelancer.email}</p>
                  <p className="mt-1 text-xs text-accent">
                    {freelancer.specialization || "Freelancer"}
                  </p>
                  {freelancer.bio && (
                    <p className="mt-2 text-sm text-ink-body">{freelancer.bio}</p>
                  )}
                </div>
                <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                  Assign to campaign
                  <select
                    className="field-input"
                    value={campaignByFreelancer[freelancer.id] || ""}
                    onChange={(event) =>
                      setCampaignByFreelancer((current) => ({
                        ...current,
                        [freelancer.id]: event.target.value,
                      }))
                    }
                    disabled={campaigns.length === 0}
                  >
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  disabled={!campaignByFreelancer[freelancer.id] || busyFreelancer === freelancer.id}
                  loading={busyFreelancer === freelancer.id}
                  onClick={() => void assign(freelancer.id)}
                >
                  Assign freelancer
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
