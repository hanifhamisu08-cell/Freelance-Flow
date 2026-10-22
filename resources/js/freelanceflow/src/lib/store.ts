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
  restoreNavigation: (state: unknown) => void;

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
    set({ user: u, selectedClientId: null, selectedSlug: null });
    // Auto-redirect based on role
    if (u?.role === "owner") {
      set({ view: "owner" });
    } else if (u) {
      set({ view: "dashboard" });
    } else {
      set({ view: "dashboard" });
    }
    if (typeof window !== "undefined") {
      const view = u?.role === "owner" ? "owner" : "dashboard";
      window.history.replaceState({ freelanceFlow: true, view }, "", window.location.pathname);
    }
  },

  view: "dashboard",
  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") window.history.pushState({ freelanceFlow: true, view: v }, "", window.location.pathname);
  },

  selectedClientId: null,
  selectedSlug: null,
  openClient: (id, slug, view = "client") => {
    set({ selectedClientId: id, selectedSlug: slug ?? null, view });
    if (typeof window !== "undefined") window.history.pushState({ freelanceFlow: true, view, selectedClientId: id, selectedSlug: slug ?? null }, "", window.location.pathname);
  },
  restoreNavigation: (state) => {
    const entry = state as { freelanceFlow?: boolean; view?: View; selectedClientId?: string; selectedSlug?: string | null } | null;
    if (!entry?.freelanceFlow || !entry.view) return;
    set({ view: entry.view, selectedClientId: entry.selectedClientId ?? null, selectedSlug: entry.selectedSlug ?? null });
  },

  refreshTick: 0,
  bump: () => set({ refreshTick: get().refreshTick + 1 }),

  toast: (msg, variant = "default") => {
    get()._toastFn?.(msg, variant);
  },
  _toastFn: null,
  setToastFn: (fn) => set({ _toastFn: fn }),
}));
