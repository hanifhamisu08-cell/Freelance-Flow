// Shared constants for FreeDash / FreelanceFlow

// Per-field privacy controls. Each field the client-facing dashboard can show
// is toggleable by the freelancer. (PRD: "per-field privacy controls")
export const PRIVACY_FIELDS = [
  { key: "project_title", label: "Project title", default: true },
  { key: "project_summary", label: "Project summary", default: true },
  { key: "event_count", label: "Live event count", default: true },
  { key: "activity_chart", label: "Activity timeline", default: true },
  { key: "top_pages", label: "Top visited pages", default: true },
  { key: "last_seen", label: "Last activity time", default: true },
  { key: "improvement_form", label: "Improvement request form", default: true },
] as const;

export type PrivacyFieldKey = (typeof PRIVACY_FIELDS)[number]["key"];

export const AUTOPilot_TYPES = [
  { key: "draft_report", label: "Draft weekly report" },
  { key: "send_request", label: "Draft improvement request reply" },
  { key: "flag_anomaly", label: "Flag traffic anomaly" },
  { key: "schedule_nudge", label: "Schedule client nudge" },
] as const;
