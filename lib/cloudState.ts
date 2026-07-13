"use client";

import type { AppState } from "./db";

const syncEventName = "family-state-updated";
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pullInFlight = false;
let lastPullAt = 0;

export type CloudSyncResult = "uploaded" | "downloaded" | "fresh" | "empty" | "failed";

async function waitForIdle(maxWaitMs = 3000) {
  const startedAt = Date.now();
  while (pullInFlight && Date.now() - startedAt < maxWaitMs) {
    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }
  return !pullInFlight;
}

function sharedState(state: AppState): AppState {
  return {
    ...state,
    currentUser: null,
    cloud_updated_at: state.cloud_updated_at ?? new Date().toISOString(),
    users: state.users.map((user) => ({
      ...user,
      avatar: typeof user.avatar === "string" && user.avatar.startsWith("data:image") && user.avatar.length > 250_000 ? "👤" : user.avatar
    }))
  };
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
    const result = await saveCloudStateNow(state);
    if (result !== "uploaded") console.warn("Cloud sync save failed");
  }, 250);
}

export async function saveCloudStateNow(state: AppState): Promise<CloudSyncResult> {
  if (typeof window === "undefined") return "failed";
  try {
    const response = await fetch("/api/sync/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: sharedState(state) })
    });
    if (!response.ok) {
      console.warn("Cloud sync save failed", response.status, await response.text());
      return "failed";
    }
    return "uploaded";
  } catch (error) {
    console.warn("Cloud sync save failed", error);
    return "failed";
  }
}

export async function pullCloudStateToLocal(
  localState: AppState,
  storageKey: string,
  normalize: (state: AppState) => AppState,
  options?: { force?: boolean }
): Promise<CloudSyncResult> {
  if (typeof window === "undefined" || pullInFlight) return "failed";
  if (!options?.force && Date.now() - lastPullAt < 15000) return "fresh";

  pullInFlight = true;
  lastPullAt = Date.now();
  try {
    const response = await fetch("/api/sync/state", { cache: "no-store" });
    if (!response.ok) return "failed";

    const payload = await response.json();
    if (!payload?.state) return "empty";

    const nextState = normalize({
      ...(payload.state as AppState),
      currentUser: localState.currentUser
    });
    const nextJson = JSON.stringify(nextState);
    if (window.localStorage.getItem(storageKey) === nextJson) return "fresh";

    window.localStorage.setItem(storageKey, nextJson);
    dispatchStateUpdate(nextState);
    window.location.reload();
    return "downloaded";
  } catch (error) {
    console.warn("Cloud sync load failed", error);
    return "failed";
  } finally {
    pullInFlight = false;
  }
}

export async function syncCloudStateNow(
  localState: AppState,
  storageKey: string,
  normalize: (state: AppState) => AppState
): Promise<CloudSyncResult> {
  if (typeof window === "undefined") return "failed";
  const ready = await waitForIdle();
  if (!ready) return "failed";
  pullInFlight = true;
  lastPullAt = Date.now();
  try {
    const response = await fetch("/api/sync/state", { cache: "no-store" });
    if (!response.ok) return "failed";

    const payload = await response.json();
    const localTime = Date.parse(localState.cloud_updated_at ?? "1970-01-01T00:00:00.000Z");
    const cloudRawState = payload?.state as AppState | null;

    if (!cloudRawState) {
      return await saveCloudStateNow(localState);
    }

    const cloudTime = Date.parse(cloudRawState.cloud_updated_at ?? payload.updated_at ?? "1970-01-01T00:00:00.000Z");
    const nextState = normalize({ ...cloudRawState, currentUser: localState.currentUser });
    const nextJson = JSON.stringify(nextState);
    const localJson = window.localStorage.getItem(storageKey);

    if (cloudTime > localTime && localJson !== nextJson) {
      window.localStorage.setItem(storageKey, nextJson);
      dispatchStateUpdate(nextState);
      window.location.reload();
      return "downloaded";
    }

    if (localTime > cloudTime || localJson !== nextJson) {
      return await saveCloudStateNow(localState);
    }

    return "fresh";
  } catch (error) {
    console.warn("Cloud sync failed", error);
    return "failed";
  } finally {
    pullInFlight = false;
  }
}
