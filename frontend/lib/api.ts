const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  role: "brand" | "freelancer";
  isVerified: boolean;
  orgName?: string;
  brandName?: string;
  industry?: string;
  website?: string;
  size?: string;
  about?: string;
  specialization?: string;
  portfolio?: string;
  bio?: string;
  createdAt: string;
}

export interface ApiCampaign {
  id: string;
  name: string;
  objective: string;
  status: "draft" | "active" | "completed";
  date: string;
  dateLabel: string;
  channels: string[];
  creatorIds: string[];
  brandId: string;
  brandName?: string;
  brief: CampaignBrief;
  aiPass: number;
  submissionsDone: number;
  submissionsTotal: number;
  cover: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignBrief {
  contentRequirements: string;
  guidelines: string;
  aspectRatio: string;
  audioGuidelines: string;
}

export interface ApiAssignment {
  id: string;
  campaignId: string;
  campaignName: string;
  freelancerId: string;
  freelancerName: string;
  brandId: string;
  brandName: string;
  status: string;
  brief: CampaignBrief;
  dueDate: string;
  deliverables: string[];
  compensation: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSubmission {
  id: string;
  assignmentId: string;
  campaignId: string;
  freelancerId: string;
  brandId: string;
  title: string;
  body: string;
  format: string;
  attachedAssets: any[];
  charCount: number;
  wordCount: number;
  readingTimeSeconds: number;
  status:
    | "Draft"
    | "AI Review Pending"
    | "AI Review Completed"
    | "Submitted for Brand Approval"
    | "Revision Requested"
    | "Resubmitted"
    | "Approved"
    | "Rejected";
  version: string;
  previousContentSnapshot: string;
  contentSnapshot: string;
  feedback: {
    reviewerName?: string;
    reviewerRole?: string;
    timestamp?: string;
    note?: string;
    suggestions?: string[];
  } | null;
  milestones: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiReview {
  id: string;
  submissionId: string;
  campaignId: string;
  freelancerId: string;
  brandId: string;
  title: string;
  platform: string;
  auditScore: number;
  integrityScore: number;
  criticalRisk: number;
  factMatch: number;
  decision: "pending" | "approved" | "revision" | "rejected";
  findings: ApiFinding[];
  aiResult?: {
    integrityScore: number;
    auditScore: number;
    criticalRisk: number;
    toneDrift: number;
    factMatch: number;
    whisperConfidence: number;
    gateThreshold: number;
    hasDisclaimer: boolean;
    originalContent: string;
    sanitizedContent: string;
    toneFit: { label: string; detail: string; fit: number };
    transcript: { before: string; flagged: string | null; after: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiFinding {
  id: string;
  title: string;
  rule: string;
  claim: string;
  suggestion: string;
  confidence: number;
  resolved: boolean;
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const errorData = (await res.json()) as { error?: string };
      if (errorData.error) message = errorData.error;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

// Auth
export function authRegister(data: {
  fullName: string;
  email: string;
  password: string;
  role: "brand" | "freelancer";
  orgName?: string;
  brandName?: string;
  industry?: string;
  website?: string;
  size?: string;
  about?: string;
  specialization?: string;
  portfolio?: string;
  bio?: string;
}) {
  return request<{ success: boolean; user: ApiUser; token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function authLogin(data: {
  email: string;
  password: string;
  role?: "brand" | "freelancer";
}) {
  return request<{ success: boolean; user: ApiUser; token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function authLogout() {
  return request<{ success: boolean }>("/api/auth/logout", { method: "POST" });
}

export function authMe() {
  return request<{ user: ApiUser }>("/api/auth/me");
}

export function listFreelancers() {
  return request<{ users: ApiUser[] }>("/api/auth/users");
}

// Campaigns
export function listCampaigns() {
  return request<{ campaigns: ApiCampaign[] }>("/api/campaigns");
}

export function getCampaign(id: string) {
  return request<{ campaign: ApiCampaign }>(`/api/campaigns/${id}`);
}

export function createCampaign(data: {
  name: string;
  objective: string;
  status?: string;
  date: string;
  dateLabel?: string;
  channels?: string[];
  creatorIds?: string[];
  brief?: any;
  cover?: string;
}) {
  return request<{ campaign: ApiCampaign; message: string }>("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCampaign(id: string, data: any) {
  return request<{ campaign: ApiCampaign; message: string }>(`/api/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCampaign(id: string) {
  return request<{ message: string }>(`/api/campaigns/${id}`, { method: "DELETE" });
}

// Assignments
export function listAssignments() {
  return request<{ assignments: ApiAssignment[] }>("/api/assignments");
}

export function createAssignment(data: {
  campaignId: string;
  freelancerId: string;
  brief?: any;
  dueDate?: string;
  deliverables?: string[];
  compensation?: string;
}) {
  return request<{ assignment: ApiAssignment; message: string }>("/api/assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAssignmentStatus(id: string, status: string) {
  return request<{ assignment: ApiAssignment; message: string }>(
    `/api/assignments/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    }
  );
}

// Submissions
export function listSubmissions() {
  return request<{ submissions: ApiSubmission[] }>("/api/submissions");
}

export function getSubmission(id: string) {
  return request<{ submission: ApiSubmission }>(`/api/submissions/${id}`);
}

export function createSubmission(data: {
  assignmentId: string;
  campaignId: string;
  title: string;
  body: string;
  format?: string;
  attachedAssets?: any[];
  status?: string;
  version?: string;
  contentSnapshot?: string;
}) {
  return request<{ submission: ApiSubmission; message: string }>("/api/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function submitForApproval(id: string) {
  return request<{ submission: ApiSubmission; message: string }>(
    `/api/submissions/${id}/submit`,
    { method: "PUT" }
  );
}

export function approveSubmission(id: string) {
  return request<{ submission: ApiSubmission; message: string }>(
    `/api/submissions/${id}/approve`,
    { method: "PUT" }
  );
}

export function requestRevision(id: string, data: { note: string; suggestions?: string[]; reviewerName?: string }) {
  return request<{ submission: ApiSubmission; revision: any; message: string }>(
    `/api/submissions/${id}/revision-requested`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export function resubmitSubmission(id: string, data: { body: string; title?: string; contentSnapshot?: string }) {
  return request<{ submission: ApiSubmission; message: string }>(
    `/api/submissions/${id}/resubmit`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

// Reviews
export function runAIReview(data: {
  submissionId: string;
  brandGuidelines?: string;
  campaignTitle?: string;
  platform?: string;
}) {
  return request<{ review: ApiReview; submission: any; message: string }>("/api/reviews/ai-review", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listReviews() {
  return request<{ reviews: ApiReview[] }>("/api/reviews");
}

export function getReview(id: string) {
  return request<{ review: ApiReview }>(`/api/reviews/${id}`);
}

export function reviewDecision(
  id: string,
  decision: "approved" | "revision" | "rejected",
  note?: string
) {
  return request<{ review: ApiReview; message: string }>(
    `/api/reviews/${id}/decision`,
    { method: "PUT", body: JSON.stringify({ decision, note }) }
  );
}

// Health
export function healthCheck() {
  return request<{ status: string }>("/api/health");
}