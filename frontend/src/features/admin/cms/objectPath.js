// Tiny immutable dot-path get/set for nested form state (e.g. "contact.social.linkedin").
export function getPath(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, path, val) {
  const keys = path.split(".");
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = cur[k];
    cur[k] = next == null ? {} : Array.isArray(next) ? [...next] : { ...next };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = val;
  return clone;
}
