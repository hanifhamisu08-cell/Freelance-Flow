// Typed API client for the SPA frontend.

export type SessionUser = { id: string; email: string; name: string; role: string };

export type ClientListItem = {
  id: string;
  name: string;
  contactEmail: string | null;
  dashboardSlug: string;
  projectTitle: string | null;
  projectSummary: string | null;
  createdAt: string;
  eventCount: number;
  requestCount: number;
  insightCount: number;
  actionCount: number;
  lastActivity: string | null;
};

export type TrackerEvent = {
  id: string;
  createdAt: string;
  path: string | null;
  eventType: string;
  referrer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export type Metrics = {
  total: number;
  last24h: number;
  last7d: number;
  hourly: { ts: string; count: number }[];
  topPages: { path: string; count: number }[];
  lastEvent: string | null;
};

export type Insight = {
  id: string;
  clientId: string;
  kind: string;
  title: string;
  body: string;
  severity: string;
  createdAt: string;
};

export type AutopilotAction = {
  id: string;
  clientId: string;
  type: string;
  title: string;
  detail: string;
  status: string;
  autoMode: boolean;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
};

export type Report = {
  id: string;
  clientId: string;
  title: string;
  period: string;
  bodyMd: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
};

export type ImprovementRequest = {
  id: string;
  clientId: string;
  message: string;
  status: string;
  createdAt: string;
};

export type Stats = {
  autopilotEngaged: boolean;
  hoursSaved: number;
  autoHandled: number;
  awaitingReview: number;
  insightCount: number;
  reportCount: number;
  eventCount: number;
  pendingRequests: number;
  clientCount: number;
};

export type ClientDetail = {
  client: {
    id: string;
    name: string;
    contactEmail: string | null;
    dashboardSlug: string;
    projectTitle: string | null;
    projectSummary: string | null;
    createdAt: string;
  };
  privacy: Record<string, boolean>;
  events: TrackerEvent[];
  metrics: Metrics;
  requests: ImprovementRequest[];
  insights: Insight[];
  actions: AutopilotAction[];
  reports: Report[];
};

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
        ? { "X-CSRF-TOKEN": document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')!.content }
        : {}),
      ...(init?.headers || {}),
    },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: string }).error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  me: () => req<{ user: SessionUser | null }>("/api/auth/me"),
  register: (email: string, password: string, name: string) =>
    req<{ user: SessionUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    req<{ user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => req("/api/auth/logout", { method: "POST" }),

  listClients: () => req<{ clients: ClientListItem[] }>("/api/clients"),
  createClient: (data: { name: string; contactEmail?: string; projectTitle?: string; projectSummary?: string }) =>
    req<{ client: ClientDetail["client"] & { privacySettings: unknown[] } }>("/api/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getClient: (id: string) => req<{ client: ClientDetail["client"]; privacy: Record<string, boolean>; events: TrackerEvent[]; metrics: Metrics; requests: ImprovementRequest[]; insights: Insight[]; actions: AutopilotAction[]; reports: Report[] }>(`/api/clients/${id}`),
  updateClient: (id: string, data: Partial<{ name: string; contactEmail: string; projectTitle: string; projectSummary: string }>) =>
    req<{ client: ClientDetail["client"] }>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getPrivacy: (id: string) => req<{ fields: { key: string; label: string; visible: boolean }[] }>(`/api/clients/${id}/privacy`),
  updatePrivacy: (id: string, fields: Record<string, boolean>) =>
    req<{ fields: { key: string; label: string; visible: boolean }[] }>(`/api/clients/${id}/privacy`, { method: "PATCH", body: JSON.stringify({ fields }) }),
  listRequests: (id: string) => req<{ requests: ImprovementRequest[] }>(`/api/clients/${id}/requests`),
  createRequest: (id: string, message: string) =>
    req<{ request: ImprovementRequest }>(`/api/clients/${id}/requests`, { method: "POST", body: JSON.stringify({ message }) }),
  setRequestStatus: (id: string, rid: string, status: string) =>
    req<{ request: ImprovementRequest }>(`/api/clients/${id}/requests/${rid}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  getPublic: (slug: string) => req<{ client: { name: string; projectTitle: string | null; projectSummary: string | null }; privacy: Record<string, boolean>; metrics: Metrics; topPages: { path: string; count: number }[] }>(`/api/public/${slug}`),
  submitPublicRequest: (slug: string, message: string) =>
    req(`/api/public/${slug}/request`, { method: "POST", body: JSON.stringify({ message }) }),
  track: (slug: string, path: string) =>
    req("/api/track", { method: "POST", body: JSON.stringify({ slug, path, event_type: "page_view" }) }),

  generateInsight: (id: string) =>
    req<{ insight: Insight; degraded: boolean }>(`/api/insights/generate/${id}`, { method: "POST" }),

  listAutopilot: () => req<{ actions: AutopilotAction[]; clients: { id: string; name: string }[] }>("/api/autopilot"),
  runAutopilot: () => req<{ created: AutopilotAction[]; degraded: boolean }>("/api/autopilot", { method: "POST" }),
  updateAction: (id: string, status: string) =>
    req<{ action: AutopilotAction }>(`/api/autopilot/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  listReports: () => req<{ reports: Report[] }>("/api/reports"),
  draftReport: (clientId: string, period?: string) =>
    req<{ report: Report | null; degraded?: boolean; message?: string }>("/api/reports", { method: "POST", body: JSON.stringify({ clientId, period }) }),
  getReport: (id: string) => req<{ report: Report; clientName: string }>(`/api/reports/${id}`),
  updateReport: (id: string, data: { status?: string; bodyMd?: string }) =>
    req<{ report: Report }>(`/api/reports/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getStats: () => req<Stats>("/api/stats"),
  seed: () => req<{ ok: boolean; seeded: number }>("/api/seed", { method: "POST" }),
};
