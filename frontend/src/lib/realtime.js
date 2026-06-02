/**
 * realtime.js — lightweight WebSocket client with auto-reconnect (Phase 15)
 *
 * Usage:
 *   const client = new RealtimeClient({ getToken: () => localStorage.getItem("kti_token") });
 *   client.on("notification", (data) => { ... });
 *   client.on("topic", (msg) => { ... });
 *   client.on("open", () => {});
 *   client.on("close", () => {});
 *   client.subscribe("project:abc");
 *   client.connect();
 *   ...
 *   client.disconnect();
 *
 * Reconnection: exponential backoff capped at 30s. Auto-resubscribes on reopen.
 */

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const PING_INTERVAL_MS = 25000;

function buildWsUrl() {
  const base = process.env.REACT_APP_BACKEND_URL || "";
  if (!base) return null;
  return base.replace(/^http/, "ws") + "/api/ws/notifications";
}

export class RealtimeClient {
  constructor({ getToken } = {}) {
    this._getToken = getToken || (() => localStorage.getItem("kti_token"));
    this._listeners = new Map(); // kind -> Set<fn>
    this._ws = null;
    this._connected = false;
    this._stopped = false;
    this._backoff = MIN_BACKOFF_MS;
    this._topics = new Set();
    this._pingTimer = null;
    this._reconnectTimer = null;
  }

  on(kind, fn) {
    if (!this._listeners.has(kind)) this._listeners.set(kind, new Set());
    this._listeners.get(kind).add(fn);
    return () => this.off(kind, fn);
  }

  off(kind, fn) {
    this._listeners.get(kind)?.delete(fn);
  }

  _emit(kind, payload) {
    const set = this._listeners.get(kind);
    if (!set) return;
    set.forEach((fn) => {
      try { fn(payload); } catch (e) { console.error(`[realtime] ${kind} listener err:`, e); }
    });
  }

  isConnected() {
    return this._connected;
  }

  subscribe(topic) {
    this._topics.add(topic);
    this._send({ action: "subscribe", topic });
  }

  unsubscribe(topic) {
    this._topics.delete(topic);
    this._send({ action: "unsubscribe", topic });
  }

  _send(obj) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      try { this._ws.send(JSON.stringify(obj)); } catch (_e) { /* noop */ }
    }
  }

  connect() {
    this._stopped = false;
    this._open();
  }

  disconnect() {
    this._stopped = true;
    clearTimeout(this._reconnectTimer);
    clearInterval(this._pingTimer);
    if (this._ws) {
      try { this._ws.close(); } catch (_e) { /* noop */ }
      this._ws = null;
    }
    this._connected = false;
  }

  _open() {
    const token = this._getToken();
    if (!token) return; // no auth, do not attempt
    const baseUrl = buildWsUrl();
    if (!baseUrl) return;
    const url = `${baseUrl}?token=${encodeURIComponent(token)}`;

    try {
      this._ws = new WebSocket(url);
    } catch (e) {
      console.error("[realtime] WS construct failed:", e);
      this._scheduleReconnect();
      return;
    }

    this._ws.onopen = () => {
      this._connected = true;
      this._backoff = MIN_BACKOFF_MS;
      // Resubscribe to any topics from before reconnect
      this._topics.forEach((topic) => this._send({ action: "subscribe", topic }));
      // start heartbeat
      clearInterval(this._pingTimer);
      this._pingTimer = setInterval(() => this._send({ action: "ping" }), PING_INTERVAL_MS);
      this._emit("open");
    };

    this._ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (_e) {
        return;
      }
      const kind = msg.kind || "unknown";
      // Always emit on "*" for generic listeners
      this._emit("*", msg);
      this._emit(kind, msg.data ?? msg);
      // Also emit "topic" event with full msg (topic events have .topic field)
      if (msg.topic) this._emit("topic", msg);
    };

    this._ws.onerror = (e) => {
      // log but rely on close handler for reconnect logic
      console.warn("[realtime] WS error", e?.message || e);
    };

    this._ws.onclose = () => {
      this._connected = false;
      clearInterval(this._pingTimer);
      this._emit("close");
      if (!this._stopped) this._scheduleReconnect();
    };
  }

  _scheduleReconnect() {
    clearTimeout(this._reconnectTimer);
    const wait = this._backoff + Math.floor(Math.random() * 500); // small jitter
    this._reconnectTimer = setTimeout(() => this._open(), wait);
    this._backoff = Math.min(this._backoff * 2, MAX_BACKOFF_MS);
  }
}

// Singleton (most apps want one persistent connection across the SPA)
export const realtime = new RealtimeClient();
