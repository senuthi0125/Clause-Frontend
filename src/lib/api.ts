import type {
  AiAnalysisResponse,
  AiChatResponse,
  ApprovalListResponse,
  ConflictResult,
  Contract,
  ContractsResponse,
  DashboardStats,
  DraftResponse,
  Template,
  TemplatesResponse,
  Workflow,
} from "../types/api";

const API_BASE_URL =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail?: string }).detail)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export function buildContractsQuery(
  params: Record<string, string | number | undefined | null>
) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const suffix = search.toString();
  return suffix ? `?${suffix}` : "";
}

export const api = {
  health: () => request<{ status: string; database: string }>("/health"),

  getDashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),

  getContractsByType: () =>
    request<Array<{ type: string; count: number }>>(
      "/api/dashboard/contracts-by-type"
    ),

  getContractsByStatus: () =>
    request<Array<{ status: string; count: number }>>(
      "/api/dashboard/contracts-by-status"
    ),

  getExpiringSoon: () =>
    request<
      Array<{
        id: string;
        title: string;
        contract_type: string;
        end_date: string;
        days_remaining: number;
      }>
    >("/api/dashboard/expiring-soon"),

  getRecentActivity: () =>
    request<
      Array<{
        id: string;
        title: string;
        status: string;
        workflow_stage: string;
        updated_at: string;
      }>
    >("/api/dashboard/recent-activity"),

  listContracts: (query = "") =>
    request<ContractsResponse>(`/api/contracts/${query}`),

  getContract: (id: string) => request<Contract>(`/api/contracts/${id}`),

  createContract: (payload: Record<string, unknown>) =>
    request<Contract>("/api/contracts/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateContract: (id: string, payload: Record<string, unknown>) =>
    request<Contract>(`/api/contracts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteContract: (id: string) =>
    request<{ message: string }>(`/api/contracts/${id}`, {
      method: "DELETE",
    }),

  listTemplates: (query = "") =>
    request<TemplatesResponse>(`/api/templates/${query}`),

  getTemplate: (id: string) => request<Template>(`/api/templates/${id}`),

  createWorkflow: (payload: Record<string, unknown>) =>
    request<Workflow>("/api/workflows/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getWorkflow: (id: string) => request<Workflow>(`/api/workflows/${id}`),

  getContractWorkflows: (contractId: string) =>
    request<{ workflows: Workflow[] }>(`/api/workflows/contract/${contractId}`),

  advanceWorkflow: (id: string, comments?: string) =>
    request<Workflow>(`/api/workflows/${id}/advance`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    }),

  rejectWorkflow: (id: string, reason?: string) =>
    request<Workflow>(`/api/workflows/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getApprovalsByContract: (contractId: string) =>
    request<ApprovalListResponse>(`/api/approvals/contract/${contractId}`),

  analyzeText: (text: string) =>
    request<AiAnalysisResponse>("/api/ai/analyze/text", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  analyzeContract: (contractId: string) =>
    request<AiAnalysisResponse>(`/api/ai/analyze/${contractId}`, {
      method: "POST",
    }),

  generateDraft: (payload: Record<string, unknown>) =>
    request<DraftResponse>("/api/ai/generate-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  detectConflicts: (contractIds: string[]) =>
    request<ConflictResult>("/api/ai/conflicts", {
      method: "POST",
      body: JSON.stringify({ contract_ids: contractIds }),
    }),

  chat: (question: string, contractId?: string) =>
    request<AiChatResponse>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        question,
        contract_id: contractId || null,
      }),
    }),
};

export { API_BASE_URL, ApiError };