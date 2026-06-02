import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center" style={{ background: "var(--kti-space-950, #05060A)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#7C68E1" }} data-testid="auth-loading" />
      </div>
    );
  }
  if (!user) return <Navigate to="/portal/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/portal/coming-soon" replace />;
  return children;
}
