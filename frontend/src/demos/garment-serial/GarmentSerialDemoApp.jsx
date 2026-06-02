/**
 * GarmentSerialDemoApp.jsx
 * Root demo app untuk fitur Serial Tracking (extract dari `garmentyanathisfinal`).
 * Stateless: tidak perlu session id atau DB.
 */
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Github } from "lucide-react";
import SerialTrackingPanel from "./components/SerialTrackingPanel";

const REPO_URL =
  "https://github.com/pandekomangyogaswastika-dot/garmentyanathisfinal";

export default function GarmentSerialDemoApp() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50" data-testid="garment-serial-demo">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/cases")}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                data-testid="demo-exit-btn"
              >
                <ArrowLeft className="w-4 h-4" />
                Studi Kasus
              </button>
              <span className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Garment ERP — Serial Tracking Demo
                </span>
              </div>
            </div>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
              data-testid="demo-repo-link"
            >
              <Github className="w-4 h-4" />
              Source Repo
            </a>
          </div>
        </div>
      </header>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                Live Demo: Serial Tracking di Industri Garmen
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Telusuri setiap nomor serial dari Production Order → Vendor Shipment → Material
                Inspection → Production → Buyer Dispatch.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Read-only Demo
              </span>
              <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Hardcoded Sample Data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SerialTrackingPanel />
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-slate-400">
        Demo ini diekstrak dari modul Serial Tracking ERP garmen dan disederhanakan dengan data
        contoh hardcoded. Tidak ada operasi database mutasi.
      </footer>
    </div>
  );
}
