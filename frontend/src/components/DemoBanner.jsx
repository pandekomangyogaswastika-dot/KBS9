/**
 * DemoBanner.jsx — Banner yang tampil di atas demo WMS.
 * Menampilkan: label demo, nama user, sisa waktu, tombol Exit + CTA Konsultasi.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, MessageSquare, Sparkles, X } from "lucide-react";

export default function DemoBanner({ sessionId, sessionData, onExit }) {
  const [remainingMinutes, setRemainingMinutes] = useState(null);
  const [showCTA, setShowCTA] = useState(false);
  const navigate = useNavigate();

  // Hitung sisa waktu dari sessionData
  useEffect(() => {
    if (!sessionData?.expires_at) return;
    const update = () => {
      const expires = new Date(sessionData.expires_at);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expires - now) / 60000));
      setRemainingMinutes(diff);
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [sessionData]);

  // Tampilkan CTA konsultasi setelah 2 menit
  useEffect(() => {
    const t = setTimeout(() => setShowCTA(true), 120000);
    return () => clearTimeout(t);
  }, []);

  const handleExit = () => {
    if (onExit) onExit();
    else navigate("/cases");
  };

  const handleConsultation = () => {
    navigate("/#contact");
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 border-b border-indigo-700 flex-shrink-0">
      {/* Label demo */}
      <div className="flex items-center gap-1.5 text-indigo-200 text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-semibold text-white">MODE DEMO</span>
        <span className="text-indigo-300">— Smart WMS Platform</span>
      </div>

      {/* User name */}
      {sessionData?.name && (
        <span className="text-xs text-indigo-300 border-l border-indigo-700 pl-3">
          Halo, <span className="text-white font-medium">{sessionData.name}</span>
        </span>
      )}

      {/* Sisa waktu */}
      {remainingMinutes !== null && (
        <div className="flex items-center gap-1 text-xs text-indigo-300 border-l border-indigo-700 pl-3">
          <Clock className="w-3 h-3" />
          <span>
            {remainingMinutes > 0
              ? `Sesi berakhir dalam ${remainingMinutes} menit`
              : <span className="text-red-400 font-semibold">Sesi habis</span>}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* CTA Konsultasi (muncul setelah 2 menit) */}
      {showCTA && (
        <div
          data-testid="demo-cta-consultation"
          className="flex items-center gap-2 mr-2 animate-fade-in"
        >
          <span className="text-xs text-indigo-200 hidden sm:block">
            Tertarik dengan solusi ini?
          </span>
          <button
            onClick={handleConsultation}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-full transition-colors shadow-lg"
          >
            <MessageSquare className="w-3 h-3" />
            Konsultasi Gratis
          </button>
          <button
            onClick={() => setShowCTA(false)}
            className="text-indigo-400 hover:text-indigo-200 transition-colors"
            aria-label="Tutup banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Exit button */}
      <button
        data-testid="demo-exit-button"
        onClick={handleExit}
        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-300 hover:text-white hover:bg-indigo-700 rounded transition-colors border border-indigo-700"
      >
        <LogOut className="w-3 h-3" />
        Keluar Demo
      </button>
    </div>
  );
}
