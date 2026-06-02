/**
 * Lightweight API client for the Garment Serial Tracking demo.
 * Endpoints are public (no auth) so we use a plain fetch.
 */
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const BASE = `${BACKEND_URL}/api/demos/garment-serial`;

async function _request(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export function fetchSerialList({ status = "all", search = "" } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const query = params.toString() ? `?${params.toString()}` : "";
  return _request(`/serial-list${query}`);
}

export function fetchSerialTrace(serial) {
  return _request(`/serial-trace?serial=${encodeURIComponent(serial)}`);
}

export function fetchDemoMeta() {
  return _request(`/meta`);
}
