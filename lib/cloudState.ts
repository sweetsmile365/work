"use client";

import type { AppState } from "./db";

const syncEventName = "family-state-updated";
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pullInFlight = false;
let lastPullAt = 0;

function sharedState(state: AppState): AppState {
  return { ...state, currentUser: null };
}

function dispatchStateUpdate(state: AppState) {
  window.dispatchEvent(new CustomEvent<AppState>(syncEventName, { detail: state }));
}

export function subscribeToCloudStateUpdates(callback: (state: AppState) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    callback((event as CustomEvent<AppState>).detail);
  };
  window.addEventListener(syncEventName, handler);
  return () => window.removeEventListener(syncEventName, handler);
}

export function queueCloudStateSave(state: AppState) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {
    try {
      const response = await fetch("/api/sync/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: sharedState(state) })
      });
      if (!response.ok) console.warn("Cloud sync save failed", response.status, await response.text());
    } catch (error) {
      console.warn("Cloud sync save failed", error);
    }
  }, 600);
}

export async function pullCloudStateToLocal(
  localState: AppState,
  storageKey: string,
  normalize: (state: AppState) => AppState,
  options?: { force?: boolean }
) {
  if (typeof window === "undefined" || pullInFlight) return;
  if (!options?.force && Date.now() - lastPullAt < 15000) return;

  pullInFlight = true;
  lastPullAt = Date.now();
  try {
    const response = await fetch("/api/sync/state", { cache: "no-store" });
    if (!response.ok) return;

    const payload = await response.json();
    if (!payload?.state) return;

    const nextState = normalize({
      ...(payload.state as AppState),
      currentUser: localState.currentUser
    });
    const nextJson = JSON.stringify(nextState);
    if (window.localStorage.getItem(storageKey) === nextJson) return;

    window.localStorage.setItem(storageKey, nextJson);
    dispatchStateUpdate(nextState);
    window.location.reload();
  } catch (error) {
    console.warn("Cloud sync load failed", error);
  } finally {
    pullInFlight = false;
  }
}
