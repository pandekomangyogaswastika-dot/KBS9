import { useEffect, useState } from "react";
import "./discovery.css";
import { DiscoveryClient } from "./DiscoveryClient";
import { DiscoveryAdmin } from "./DiscoveryAdmin";
import { DiscoveryInvalid } from "./DiscoveryInvalid";

const parseDiscoveryPath = (pathname) => {
  // Supported paths:
  //   /discovery                              → admin (list + create)
  //   /discovery/admin                        → admin
  //   /discovery/<uuid>                       → client session
  //   /discovery/<uuid>/anything              → client session (ignore trailing)
  if (!pathname || pathname === "/discovery" || pathname === "/discovery/") {
    return { mode: "admin" };
  }
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (segments[0] !== "discovery") return { mode: "invalid" };
  if (segments.length === 1) return { mode: "admin" };
  const second = segments[1];
  if (second === "admin") return { mode: "admin" };
  // UUID v4 detection (relaxed: just length & dashes)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(second)) {
    return { mode: "client", sessionId: second };
  }
  return { mode: "invalid" };
};

export const DiscoveryApp = () => {
  const [route, setRoute] = useState(() => parseDiscoveryPath(window.location.pathname));

  useEffect(() => {
    const handle = () => setRoute(parseDiscoveryPath(window.location.pathname));
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(parseDiscoveryPath(path));
  };

  return (
    <div className="discovery-root discovery-bg-grain" data-testid="discovery-app-root">
      {route.mode === "client" && (
        <DiscoveryClient sessionId={route.sessionId} onNavigate={navigate} />
      )}
      {route.mode === "admin" && <DiscoveryAdmin onNavigate={navigate} />}
      {route.mode === "invalid" && <DiscoveryInvalid onNavigate={navigate} />}
    </div>
  );
};

export default DiscoveryApp;
