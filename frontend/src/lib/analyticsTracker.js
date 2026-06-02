/**
 * Lightweight analytics tracker for card UX events.
 *
 *  - Generates a stable anonymous session id per browser tab/session.
 *  - Batches events client-side and flushes via /api/analytics/events/batch.
 *  - Suppresses duplicate "view" events for the same target within the same session.
 *  - Safe-fail: never throws into the rendering tree.
 */
import { api } from "@/lib/apiClient";

const SESSION_KEY = "kti_analytics_sid";
const FLUSH_INTERVAL_MS = 4000;
const MAX_BATCH = 30;
const VIEW_DEDUP_KEY = "kti_view_dedup";

const TYPES = ["view", "click", "cta", "hover"];

function getSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function getViewDedup() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(VIEW_DEDUP_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveViewDedup(set) {
  try {
    sessionStorage.setItem(VIEW_DEDUP_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

let queue = [];
let flushTimer = null;

async function flush() {
  if (!queue.length) return;
  const events = queue.splice(0, MAX_BATCH);
  try {
    await api.post("/analytics/events/batch", { events });
  } catch {
    // Silent fail — analytics shouldn't break UX
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Track a single analytics event.
 * @param {Object} event { event_type, target_type, target_id?, target_slug?, path?, meta? }
 */
export function track(event) {
  if (typeof window === "undefined" || !event) return;
  const type = TYPES.includes(event.event_type) ? event.event_type : "view";
  const sid = getSessionId();
  const path = event.path || window.location.pathname;

  // De-dupe views per session: same target_type+target_slug+path
  if (type === "view") {
    const key = `${event.target_type}|${event.target_slug || event.target_id || ""}|${path}`;
    const dedup = getViewDedup();
    if (dedup.has(key)) return;
    dedup.add(key);
    saveViewDedup(dedup);
  }

  queue.push({
    event_type: type,
    target_type: event.target_type,
    target_id: event.target_id || null,
    target_slug: event.target_slug || null,
    path,
    session_id: sid,
    referrer: document.referrer || null,
    meta: event.meta || null,
  });

  if (queue.length >= MAX_BATCH) {
    flush();
  } else {
    scheduleFlush();
  }
}

// Flush on visibility change (when user leaves the page)
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && queue.length) flush();
  });
  window.addEventListener("beforeunload", () => {
    if (queue.length) {
      // Use sendBeacon for reliability on unload
      try {
        const blob = new Blob(
          [JSON.stringify({ events: queue.splice(0, MAX_BATCH) })],
          { type: "application/json" }
        );
        const url = `${
          process.env.REACT_APP_BACKEND_URL ||
          (typeof window !== "undefined" ? window.location.origin : "")
        }/api/analytics/events/batch`;
        navigator.sendBeacon(url, blob);
      } catch {
        // ignore
      }
    }
  });
}
