"use client";

import { create } from "zustand";
import type { SessionUser } from "@/lib/client";

export type View =
  | "dashboard"
  | "client"
  | "client-settings"
  | "client-requests"
  | "client-public"
  | "intelligence"
  | "autopilot"
  | "reports"
  // Owner views
  | "owner"
  | "owner-finance"
  | "owner-invoices"
  | "owner-budget"
  | "owner-security"
  | "owner-bugs"
  | "owner-uptime"
  | "owner-requests";

type AppState = {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;

  view: View;
  setView: (v: View) => void;

  selectedClientId: string | null;
  selectedSlug: string | null;
  openClient: (id: string, slug?: string | null, view?: View) => void;

  // refresh signal — components increment to trigger refetches
  refreshTick: number;
  bump: () => void;

  // toast helper passthrough
  toast: (msg: string, variant?: "default" | "destructive") => void;
  _toastFn: ((msg: string, variant?: "default" | "destructive") => void) | null;
  setToastFn: (fn: (msg: string, variant?: "default" | "destructive") => void) => void;
};

export const useApp = create<AppState>((set, get) => ({
  user: null,
  setUser: (u) => {
    set({ user: u });
    // Auto-redirect based on role
    if (u?.role === "owner") {
      set({ view: "owner" });
    } else if (u) {
      set({ view: "dashboard" });
    }
  },

  view: "dashboard",
  setView: (v) => set({ view: v }),

  selectedClientId: null,
  selectedSlug: null,
  openClient: (id, slug, view = "client") =>
    set({ selectedClientId: id, selectedSlug: slug ?? null, view }),

  refreshTick: 0,
  bump: () => set({ refreshTick: get().refreshTick + 1 }),

  toast: (msg, variant = "default") => {
    get()._toastFn?.(msg, variant);
  },
  _toastFn: null,
  setToastFn: (fn) => set({ _toastFn: fn }),
}));