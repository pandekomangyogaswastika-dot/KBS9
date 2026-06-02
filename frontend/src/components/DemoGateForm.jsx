/**
 * DemoGateForm.jsx — Form gating sebelum user bisa akses demo.
 * Mengumpulkan: nama, email, perusahaan.
 * Membuat demo session → redirect ke /demo/kn3?session=xxx
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, PlayCircle, Shield, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function DemoGateForm({ caseTitle, appSlug = "kn3", onClose }) {
  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nama dan email wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Track demo access request with analytics
      const res = await fetch(`${BACKEND_URL}/api/demo/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_slug: caseTitle,
          demo_slug: appSlug,
          user_name: form.name,
          user_email: form.email,
          user_company: form.company,
        }),
      });
      if (!res.ok) throw new Error("Gagal membuat sesi demo.");
      const data = await res.json();
      
      // Navigate to demo with session tracking
      navigate(data.data.demo_url);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="demo-gate-form"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-900/60 flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Coba Demo Gratis</h2>
          <p className="text-sm text-neutral-400">
            {caseTitle || "Demo Interaktif"}
          </p>
        </div>

        {/* Fitur demo highlights */}
        <div className="flex gap-4 mb-6 p-3 bg-neutral-800/50 rounded-xl">
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-xs text-neutral-300">Data terisolasi, aman</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-neutral-300">Akses 90 menit penuh</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Nama Lengkap *</label>
            <input
              data-testid="demo-gate-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Masukkan nama Anda"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Email Kerja *</label>
            <input
              data-testid="demo-gate-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="nama@perusahaan.com"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Perusahaan (opsional)</label>
            <input
              data-testid="demo-gate-company"
              type="text"
              value={form.company}
              onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              placeholder="Nama perusahaan Anda"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            data-testid="demo-gate-submit"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan demo...</>
            ) : (
              <><PlayCircle className="w-4 h-4" /> Mulai Demo Sekarang</>
            )}
          </button>

          <p className="text-xs text-center text-neutral-500" data-testid="demo-gate-privacy-notice">
            Data Anda aman dan hanya digunakan untuk sesi demo. Lihat{" "}
            <Link to="/privacy-policy" className="underline hover:text-neutral-300 transition-colors">
              Kebijakan Privasi
            </Link>{" "}
            kami.
          </p>
        </form>
      </div>
    </div>
  );
}
