/**
 * DemoPage.jsx — route wrapper untuk /demo/kn3?session=xxx
 * Validates session lalu load KN3DemoApp.
 */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import KN3DemoApp from "@/demos/kn3/KN3DemoApp";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function DemoPage({ appSlug }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session");

  const [status, setStatus] = useState("loading"); // loading | valid | expired | invalid
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("invalid");
      return;
    }
    fetch(`${BACKEND_URL}/api/demo/sessions/${sessionId}`)
      .then((res) => {
        if (res.status === 410) return Promise.reject({ type: "expired" });
        if (!res.ok) return Promise.reject({ type: "invalid" });
        return res.json();
      })
      .then((data) => {
        setSessionData(data);
        setStatus("valid");
      })
      .catch((err) => {
        setStatus(err?.type || "invalid");
      });
  }, [sessionId]);

  const handleExit = () => navigate("/cases");

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Memuat demo...</p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-900/40 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sesi Demo Berakhir</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Sesi demo Anda sudah kedaluwarsa. Mulai sesi baru untuk mencoba lagi.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleExit}
              className="px-4 py-2 text-sm text-neutral-300 border border-neutral-700 rounded-lg hover:bg-neutral-800"
            >
              Kembali ke Studi Kasus
            </button>
            <button
              onClick={() => navigate("/cases")}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
            >
              Mulai Demo Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-white mb-2">Sesi Tidak Valid</h2>
          <p className="text-neutral-400 text-sm mb-6">Session ID tidak ditemukan atau tidak valid.</p>
          <button
            onClick={handleExit}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
          >
            Kembali ke Studi Kasus
          </button>
        </div>
      </div>
    );
  }

  return (
    <KN3DemoApp
      sessionId={sessionId}
      sessionData={sessionData}
      onExit={handleExit}
      autoStartTour={true}
    />
  );
}
