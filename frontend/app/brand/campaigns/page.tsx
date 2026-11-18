"use client";

import { useCallback, useEffect, useState } from "react";
import { createCampaign, listCampaigns, deleteCampaign, type ApiCampaign } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Link from "next/link";

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [date, setDate] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [contentRequirements, setContentRequirements] = useState("");
  const [guidelines, setGuidelines] = useState("");

  const loadCampaigns = useCallback(async () => {
    setError(null);
    try {
      const res = await listCampaigns();
      setCampaigns(res.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCampaign({
        name,
        objective,
        date,
        channels,
        brief: { contentRequirements, guidelines, aspectRatio: "1:1", audioGuidelines: "" },
      });
      setOpen(false);
      setName("");
      setObjective("");
      setDate("");
      setChannels([]);
      setContentRequirements("");
      setGuidelines("");
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this campaign?")) return;
    setError(null);
    try {
      await deleteCampaign(id);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete campaign");
    }
  }

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
              Campaigns
            </span>
          </div>
          <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
            Campaign Management
          </h1>
          <p className="text-sm leading-[22px] text-muted">
            Create and manage brand campaigns. Assign freelancers and track submissions.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button onClick={() => setOpen(true)}>Create Campaign</Button>
          <Link href="/brand" className="text-xs font-medium text-muted hover:text-accent">
            ← Back to overview
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.length > 0 ? (
            campaigns.map((c) => (
              <div key={c.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === "active" ? "bg-mint/30 text-success" : "bg-mist text-accent"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-muted line-clamp-2">{c.objective}</p>
                <p className="text-xs text-muted">Deadline: {c.date}</p>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Icon name="briefcase" size={12} />
                  <span>{c.channels.join(", ") || "No platforms selected"}</span>
                </div>
                {c.brief.guidelines && (
                  <p className="line-clamp-2 text-xs text-muted">
                    Guidelines: {c.brief.guidelines}
                  </p>
                )}
                <div className="mt-auto flex gap-2">
                  <Button
                    variant="outline"
                    fullWidth={false}
                    onClick={() => handleDelete(c.id)}
                    className="text-[#b42318] border-[#f4c7c3] hover:bg-[#fef3f2]"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-8 text-center">
              <Icon name="briefcase" size={32} className="mx-auto mb-3 text-accent" />
              <h3 className="text-sm font-semibold text-ink">No campaigns yet</h3>
              <p className="text-xs text-muted">
                Create your first campaign to begin collaborating with freelancers.
              </p>
            </div>
          )}
        </div>

        {/* Create Campaign Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-base font-semibold text-ink mb-4">Create New Campaign</h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink">Campaign Name</label>
                  <input
                    className="field-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Launch 2025"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink">Objective</label>
                  <input
                    className="field-input"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="e.g. Brand Awareness & Signups"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink">Due Date</label>
                  <input
                    className="field-input"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink">Channels (comma-separated)</label>
                  <input
                    className="field-input"
                    value={channels.join(", ")}
                    onChange={(e) => setChannels(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="TikTok, Instagram Reels, YouTube Shorts"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink">Content Requirements</label>
                  <textarea
                    className="field-input h-auto py-2"
                    value={contentRequirements}
                    onChange={(e) => setContentRequirements(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink">Guidelines</label>
                  <textarea
                    className="field-input h-auto py-2"
                    value={guidelines}
                    onChange={(e) => setGuidelines(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Campaign</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}