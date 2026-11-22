"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createSubmission,
  listAssignments,
  listSubmissions,
  resubmitSubmission,
  runAIReview,
  submitForApproval,
  updateAssignmentStatus,
  uploadFile,
  listFiles,
  deleteFile,
  type ApiAssignment,
  type ApiSubmission,
  type ApiAsset,
} from "@/lib/api";
import Icon from "@/components/ui/Icon";

export default function FreelancerDashboardPage() {
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [assignmentResult, submissionResult] = await Promise.all([
        listAssignments(),
        listSubmissions(),
      ]);
      setAssignments(assignmentResult.assignments);
      setSubmissions(submissionResult.submissions);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your workspace."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.55px] text-accent">
              Creator Workspace
            </span>
          </div>
          <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
            My Assignments
          </h1>
          <p className="text-sm leading-[22px] text-muted">
            Accept campaigns, save drafts, and submit content for brand review.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]"
          >
            {error}
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="briefcase" size={32} className="mx-auto mb-3 text-accent" />
            <h2 className="text-base font-semibold text-ink">No assignments yet</h2>
            <p className="mt-1 text-sm text-muted">
              Campaigns assigned by a brand will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                submission={submissions.find(
                  (item) => item.assignmentId === assignment.id
                )}
                onChanged={loadData}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function AssignmentCard({
  assignment,
  submission,
  onChanged,
}: {
  assignment: ApiAssignment;
  submission?: ApiSubmission;
  onChanged: () => Promise<void>;
}) {
  const [title, setTitle] = useState(submission?.title ?? "");
  const [body, setBody] = useState(submission?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<ApiAsset[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const editable = !submission || submission.status === "Draft" || submission.status === "Revision Requested";

  useEffect(() => {
    async function loadAttachments() {
      try {
        const res = await listFiles({ assignmentId: assignment.id });
        setAssets(res.assets);
      } catch (_) {}
    }
    loadAttachments();
  }, [assignment.id]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setUploadError(null);
    try {
      const res = await uploadFile(file, {
        category: "submission_attachment",
        assignmentId: assignment.id,
        campaignId: assignment.campaignId,
        submissionId: submission?.id,
        name: file.name,
      });
      setAssets((prev) => [res.asset, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  }

  async function handleDeleteFile(assetId: string) {
    try {
      await deleteFile(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to remove file");
    }
  }

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The action could not be completed."
      );
    } finally {
      setBusy(false);
      await onChanged();
    }
  }

  async function saveDraft() {
    await perform(async () => {
      await createSubmission({
        assignmentId: assignment.id,
        campaignId: assignment.campaignId,
        title,
        body,
        format: assignment.deliverables[0] || "",
      });
    });
  }

  async function analyze(submissionId: string) {
    await perform(async () => {
      await runAIReview({ submissionId });
    });
  }

  async function submitDraft() {
    if (!submission) return;
    await perform(async () => {
      await submitForApproval(submission.id);
      await runAIReview({ submissionId: submission.id });
    });
  }

  async function resubmit() {
    if (!submission) return;
    await perform(async () => {
      await resubmitSubmission(submission.id, { title, body });
      await runAIReview({ submissionId: submission.id });
    });
  }

  return (
    <article className="card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-ink">{assignment.campaignName}</h2>
          <p className="text-xs text-muted">
            {assignment.brandName} · Due {assignment.dueDate || "Not specified"}
          </p>
        </div>
        <span className="rounded-full bg-lavender px-2.5 py-1 text-xs font-medium text-accent">
          {submission?.status || assignment.status}
        </span>
      </div>

      <div className="grid gap-3 rounded-lg bg-lavender/50 p-4 text-sm sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted">Requirements</h3>
          <p className="mt-1 whitespace-pre-wrap text-ink">
            {assignment.brief?.contentRequirements || "No specific content requirements."}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted">Brand guidelines</h3>
          <p className="mt-1 whitespace-pre-wrap text-ink">
            {assignment.brief?.guidelines || "No specific brand guidelines provided."}
          </p>
        </div>
      </div>

      {submission?.feedback?.note && (
        <div
          role="status"
          className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]"
        >
          <strong>Revision requested:</strong> {submission.feedback.note}
        </div>
      )}

      {submission?.status === "Approved" && (
        <p className="text-sm font-medium text-success">This content was approved by the brand.</p>
      )}
      {submission?.status === "Rejected" && (
        <p className="text-sm font-medium text-danger">This content was rejected by the brand.</p>
      )}
      {submission?.status === "AI Review Completed" && (
        <p className="text-sm text-muted">AI analysis is complete; waiting for the brand decision.</p>
      )}
      {submission?.status === "Submitted for Brand Approval" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void analyze(submission.id)}
          className="self-start text-sm font-semibold text-accent hover:underline disabled:opacity-60"
        >
          Retry AI analysis
        </button>
      )}

      {editable && assignment.status === "assigned" && !submission ? (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void perform(async () => {
              await updateAssignmentStatus(assignment.id, "accepted");
            })
          }
          className="btn-primary"
        >
          Accept assignment
        </button>
      ) : editable &&
        ["accepted", "in-draft", "revision-requested", "resubmitted"].includes(
          assignment.status
        ) ? (
        <>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Draft title
            <input
              className="field-input"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Draft content
            <textarea
              className="field-input h-auto py-2"
              rows={7}
              maxLength={50000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
            />
          </label>

          {/* Persistent File Attachments */}
          <div className="flex flex-col gap-2 rounded-xl border border-[#ebe4f7] bg-canvas/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Icon name="paperclip" size={14} className="text-accent" />
                Attached Assets & Media ({assets.length})
              </span>
              <label className="cursor-pointer text-xs font-semibold text-accent hover:underline flex items-center gap-1">
                <span>{uploadingFile ? "Uploading..." : "+ Attach File"}</span>
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingFile || busy}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                />
              </label>
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-600">{uploadError}</p>
            )}

            {assets.length === 0 ? (
              <p className="text-[11px] text-muted italic">
                No files attached. Attach supporting images, copy docs, or PDF proofs (max 10MB).
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-2 rounded-lg border border-[#e4dcf5] bg-white px-2.5 py-1 text-xs text-ink shadow-2xs"
                  >
                    <Icon name="paperclip" size={12} className="text-muted" />
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-accent hover:underline truncate max-w-[140px]"
                      title={asset.originalName}
                    >
                      {asset.name || asset.originalName}
                    </a>
                    <span className="text-[10px] text-muted">
                      ({(asset.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(asset.id)}
                      className="text-muted hover:text-red-500 transition-colors ml-1"
                      title="Remove attachment"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {submission?.status === "Revision Requested" ? (
              <button
                type="button"
                disabled={busy || !title.trim() || !body.trim()}
                onClick={() => void resubmit()}
                className="btn-primary"
              >
                Resubmit & run AI analysis
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy || !title.trim() || !body.trim()}
                  onClick={() => void saveDraft()}
                  className="btn-outline"
                >
                  Save draft
                </button>
                {submission?.status === "Draft" && (
                  <button
                    type="button"
                    disabled={busy || !title.trim() || !body.trim()}
                    onClick={() => void submitDraft()}
                    className="btn-primary"
                  >
                    Submit & run AI analysis
                  </button>
                )}
              </>
            )}
          </div>
        </>
      ) : null}

      {error && (
        <div role="alert" className="text-sm text-[#b42318]">
          {error}
        </div>
      )}
    </article>
  );
}
