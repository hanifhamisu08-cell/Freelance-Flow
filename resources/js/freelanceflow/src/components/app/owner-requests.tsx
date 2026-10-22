"use client";

import { useEffect, useState } from "react";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";

type Request = {
  id: string;
  message: string;
  status: string;
  clientName: string;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function OwnerRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/owner/requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = requests.filter((r) => r.status === "open");
  const resolved = requests.filter((r) => r.status === "resolved");

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-panel" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
          Improvement Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Feedback and suggestions from your projects
        </p>
      </div>

      <div className="flex gap-3">
        <div className="rounded-xl bg-panel px-4 py-2 text-center">
          <div className="text-xl font-bold text-amber-400" style={{ fontFamily: "Poppins" }}>
            {open.length}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</div>
        </div>
        <div className="rounded-xl bg-panel px-4 py-2 text-center">
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: "Poppins" }}>
            {resolved.length}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolved</div>
        </div>
      </div>

      <div className="space-y-2">
        {requests.length === 0 ? (
          <div className="rounded-xl bg-panel p-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">No requests yet</p>
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-panel p-4 transition-colors hover:bg-panel-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        r.status === "open"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-green-500/15 text-green-400"
                      }`}
                    >
                      {r.status === "open" ? (
                        <Clock className="h-2.5 w-2.5" />
                      ) : (
                        <CheckCircle className="h-2.5 w-2.5" />
                      )}
                      {r.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.clientName}</span>
                  </div>
                  <p className="text-sm text-foreground">{r.message}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {timeAgo(r.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}