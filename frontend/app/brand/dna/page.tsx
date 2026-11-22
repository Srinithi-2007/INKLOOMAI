"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrandDna, updateBrandDna, type BrandDnaSettings } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import RoleGuard from "@/components/auth/RoleGuard";

export default function BrandDnaPage() {
  return (
    <RoleGuard role="brand">
      <BrandDnaContent />
    </RoleGuard>
  );
}

function BrandDnaContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Form State
  const [brandName, setBrandName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [corePillarsText, setCorePillarsText] = useState("");
  const [preferredTermsText, setPreferredTermsText] = useState("");
  const [bannedTermsText, setBannedTermsText] = useState("");
  const [approvedClaimsText, setApprovedClaimsText] = useState("");
  const [visualGuidelines, setVisualGuidelines] = useState("");
  const [linkedinRule, setLinkedinRule] = useState("");
  const [twitterRule, setTwitterRule] = useState("");
  const [instagramRule, setInstagramRule] = useState("");
  const [youtubeRule, setYoutubeRule] = useState("");
  const [additionalRulesText, setAdditionalRulesText] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getBrandDna();
        const dna = res.brandDna;
        setBrandName(dna.brandName || "");
        setOrgName(dna.orgName || "");
        setIndustry(dna.industry || "");
        setWebsite(dna.website || "");
        setAbout(dna.about || "");
        setBrandVoice(dna.brandVoice || "");
        setCorePillarsText((dna.corePillars || []).join("\n"));
        setPreferredTermsText((dna.preferredTerms || []).join(", "));
        setBannedTermsText((dna.bannedTerms || []).join(", "));
        setApprovedClaimsText((dna.approvedClaims || []).join("\n"));
        setVisualGuidelines(dna.visualGuidelines || "");
        setLinkedinRule(dna.platformRules?.LinkedIn || "");
        setTwitterRule(dna.platformRules?.Twitter || "");
        setInstagramRule(dna.platformRules?.Instagram || "");
        setYoutubeRule(dna.platformRules?.YouTube || "");
        setAdditionalRulesText((dna.additionalRules || []).join("\n"));
        if (dna.updatedAt) setLastSaved(new Date(dna.updatedAt).toLocaleTimeString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Brand DNA");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function handleFieldChange(setter: (val: string) => void, val: string) {
    setter(val);
    setDirty(true);
    setNotice(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) {
      setError("Brand Name cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const splitLines = (t: string) =>
      t
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

    const splitCommas = (t: string) =>
      t
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const payload: Partial<BrandDnaSettings> = {
      brandName: brandName.trim(),
      orgName: orgName.trim(),
      industry: industry.trim(),
      website: website.trim(),
      about: about.trim(),
      brandVoice: brandVoice.trim(),
      corePillars: splitLines(corePillarsText),
      preferredTerms: splitCommas(preferredTermsText),
      bannedTerms: splitCommas(bannedTermsText),
      approvedClaims: splitLines(approvedClaimsText),
      visualGuidelines: visualGuidelines.trim(),
      platformRules: {
        LinkedIn: linkedinRule.trim(),
        Twitter: twitterRule.trim(),
        Instagram: instagramRule.trim(),
        YouTube: youtubeRule.trim(),
      },
      additionalRules: splitLines(additionalRulesText),
    };

    try {
      const res = await updateBrandDna(payload);
      setDirty(false);
      setNotice("Brand DNA guidelines saved successfully and applied to active campaigns.");
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Brand DNA");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="mt-8 flex flex-col items-center justify-center py-20">
          <div className="h-8 w-40 animate-pulse rounded bg-mist" />
          <p className="mt-3 text-xs text-muted">Loading brand identity & guardrails...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <form onSubmit={handleSave} className="mt-4 flex flex-col gap-6">
        {/* Header Banner */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.55px] text-accent">
                Brand DNA & Governance
              </span>
            </div>
            <Link href="/brand" className="text-xs font-medium text-muted hover:text-accent">
              ← Back to Overview
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
                Brand DNA Settings
              </h1>
              <p className="text-sm leading-[22px] text-muted">
                Define your voice, core pillars, terminology, banned words, and platform rules.
                AI compliance reviews automatically evaluate content against these guidelines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {dirty && (
                <span className="rounded-full bg-[#fef3f2] px-2.5 py-1 text-xs font-medium text-[#b42318]">
                  Unsaved changes
                </span>
              )}
              {lastSaved && !dirty && (
                <span className="text-xs text-muted">Last saved at {lastSaved}</span>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Brand DNA"}
              </Button>
            </div>
          </div>
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

        {/* Section 1: Brand Identity */}
        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 border-b border-mist pb-3">
            <Icon name="briefcase" size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-ink">Brand Identity</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brand-name" className="text-xs font-semibold text-ink">Brand Name *</label>
              <input
                id="brand-name"
                type="text"
                value={brandName}
                onChange={(e) => handleFieldChange(setBrandName, e.target.value)}
                placeholder="e.g. Acme Enterprise"
                required
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="org-name" className="text-xs font-semibold text-ink">Organization / Legal Name</label>
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(e) => handleFieldChange(setOrgName, e.target.value)}
                placeholder="e.g. Acme Technologies Inc."
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="industry" className="text-xs font-semibold text-ink">Industry</label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => handleFieldChange(setIndustry, e.target.value)}
                placeholder="e.g. Cloud Security & AI Infrastructure"
                className="field-input mt-1"
              />
            </div>
            <div>
              <label htmlFor="website" className="text-xs font-semibold text-ink">Website URL</label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => handleFieldChange(setWebsite, e.target.value)}
                placeholder="https://example.com"
                className="field-input mt-1"
              />
            </div>
          </div>
          <div>
            <label htmlFor="about" className="text-xs font-semibold text-ink">Brand Description / Mission</label>
            <textarea
              id="about"
              value={about}
              onChange={(e) => handleFieldChange(setAbout, e.target.value)}
              placeholder="Explain what your brand stands for, your target demographic, and market positioning..."
              rows={2}
              className="field-input mt-1 h-auto py-2"
            />
          </div>
        </section>

        {/* Section 2: Tone of Voice & Personality */}
        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 border-b border-mist pb-3">
            <Icon name="sparkles" size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-ink">Voice & Tone Guardrails</h2>
          </div>
          <div>
            <label htmlFor="brand-voice" className="text-xs font-semibold text-ink">Tone of Voice Description</label>
            <textarea
              id="brand-voice"
              value={brandVoice}
              onChange={(e) => handleFieldChange(setBrandVoice, e.target.value)}
              placeholder="e.g. Authoritative, approachable, enterprise-grade, objective. Confident without being arrogant. Educational and clear."
              rows={3}
              className="field-input mt-1 h-auto py-2"
            />
            <p className="mt-1 text-xs text-muted">
              Gemini evaluates content drafts against this tone description to detect and score tone drift.
            </p>
          </div>
          <div>
            <label htmlFor="core-pillars" className="text-xs font-semibold text-ink">Core Brand Pillars (One per line)</label>
            <textarea
              id="core-pillars"
              value={corePillarsText}
              onChange={(e) => handleFieldChange(setCorePillarsText, e.target.value)}
              placeholder="Zero Trust Security&#10;Verifiable Compliance&#10;Creator Empowerment"
              rows={3}
              className="field-input mt-1 h-auto py-2"
            />
          </div>
        </section>

        {/* Section 3: Guardrails & Terminology */}
        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 border-b border-mist pb-3">
            <Icon name="shield" size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-ink">Vocabulary & Safety Guardrails</h2>
          </div>
          <div>
            <label htmlFor="preferred-terms" className="text-xs font-semibold text-ink">Preferred Terminology (Comma-separated)</label>
            <input
              id="preferred-terms"
              type="text"
              value={preferredTermsText}
              onChange={(e) => handleFieldChange(setPreferredTermsText, e.target.value)}
              placeholder="enterprise-ready, deterministic, automated governance, certified"
              className="field-input mt-1"
            />
            <p className="mt-1 text-xs text-muted">Words and phrases that creators are actively encouraged to use.</p>
          </div>
          <div>
            <label htmlFor="banned-terms" className="text-xs font-semibold text-[#b42318]">Banned Words & Phrases (Comma-separated) *</label>
            <input
              id="banned-terms"
              type="text"
              value={bannedTermsText}
              onChange={(e) => handleFieldChange(setBannedTermsText, e.target.value)}
              placeholder="unhackable, 100% guarantee, magic, foolproof, instant riches"
              className="field-input mt-1 border-[#f4c7c3] focus:border-[#b42318]"
            />
            <p className="mt-1 text-xs text-muted">
              Any mention of these phrases triggers an immediate critical risk flag in AI compliance audits.
            </p>
          </div>
          <div>
            <label htmlFor="approved-claims" className="text-xs font-semibold text-ink">Approved Enterprise Claims (One per line)</label>
            <textarea
              id="approved-claims"
              value={approvedClaimsText}
              onChange={(e) => handleFieldChange(setApprovedClaimsText, e.target.value)}
              placeholder="Inkloom AI automates brand compliance across multi-channel campaigns.&#10;SOC2 Type II certified infrastructure.&#10;Trusted by over 50 enterprise brand teams."
              rows={3}
              className="field-input mt-1 h-auto py-2"
            />
            <p className="mt-1 text-xs text-muted">
              Verified statements used to calculate factual integrity and fact match scores.
            </p>
          </div>
        </section>

        {/* Section 4: Visual & Content Guidelines */}
        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 border-b border-mist pb-3">
            <Icon name="pen" size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-ink">Visual & Style Guidelines</h2>
          </div>
          <div>
            <label htmlFor="visual-guidelines" className="text-xs font-semibold text-ink">Visual Style, Formatting & Color Palette</label>
            <textarea
              id="visual-guidelines"
              value={visualGuidelines}
              onChange={(e) => handleFieldChange(setVisualGuidelines, e.target.value)}
              placeholder="Primary Brand Color: #7C3AED (Sovereign Violet). Use rounded cards (rounded-xl), high-contrast sans-serif typography. Keep hero graphics clean with minimal clutter."
              rows={2}
              className="field-input mt-1 h-auto py-2"
            />
          </div>
          <div>
            <label htmlFor="additional-rules" className="text-xs font-semibold text-ink">Additional Brand Rules & Disclaimers (One per line)</label>
            <textarea
              id="additional-rules"
              value={additionalRulesText}
              onChange={(e) => handleFieldChange(setAdditionalRulesText, e.target.value)}
              placeholder="Always include standard regulatory disclaimer on ROI projections.&#10;Do not disparage named competitors.&#10;Include official registration link in all event promotional posts."
              rows={3}
              className="field-input mt-1 h-auto py-2"
            />
          </div>
        </section>

        {/* Section 5: Platform-Specific Guidelines */}
        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 border-b border-mist pb-3">
            <Icon name="check" size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-ink">Platform-Specific Rules</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="linkedin-rule" className="text-xs font-semibold text-ink">LinkedIn Rules</label>
              <textarea
                id="linkedin-rule"
                value={linkedinRule}
                onChange={(e) => handleFieldChange(setLinkedinRule, e.target.value)}
                placeholder="Professional hook, 2-3 paragraphs, 3 relevant hashtags, call to action with webinar/article link."
                rows={2}
                className="field-input mt-1 h-auto py-2"
              />
            </div>
            <div>
              <label htmlFor="twitter-rule" className="text-xs font-semibold text-ink">Twitter / X Rules</label>
              <textarea
                id="twitter-rule"
                value={twitterRule}
                onChange={(e) => handleFieldChange(setTwitterRule, e.target.value)}
                placeholder="Hook tweet under 250 characters, follow-up thread for insights, 1 hashtag maximum."
                rows={2}
                className="field-input mt-1 h-auto py-2"
              />
            </div>
            <div>
              <label htmlFor="instagram-rule" className="text-xs font-semibold text-ink">Instagram Rules</label>
              <textarea
                id="instagram-rule"
                value={instagramRule}
                onChange={(e) => handleFieldChange(setInstagramRule, e.target.value)}
                placeholder="Visual-first carousel or Reel caption, friendly voice, clean emojis, link in bio callout."
                rows={2}
                className="field-input mt-1 h-auto py-2"
              />
            </div>
            <div>
              <label htmlFor="youtube-rule" className="text-xs font-semibold text-ink">YouTube Rules</label>
              <textarea
                id="youtube-rule"
                value={youtubeRule}
                onChange={(e) => handleFieldChange(setYoutubeRule, e.target.value)}
                placeholder="Detailed video description with timestamps, verified sponsor disclaimer, and social links."
                rows={2}
                className="field-input mt-1 h-auto py-2"
              />
            </div>
          </div>
        </section>

        {/* Sticky Submit Footer */}
        <div className="card flex items-center justify-between p-4">
          <span className="text-xs text-muted">
            All changes are saved to MongoDB Atlas and applied to active campaign compliance checks.
          </span>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Brand DNA"}
          </Button>
        </div>
      </form>
    </main>
  );
}
