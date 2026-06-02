import { useState, useRef, useEffect } from "react";
import { X, PenLine, Type, RotateCcw, Check, Loader2 } from "lucide-react";

/**
 * SignatureModal — e-sign modal with two modes:
 *   - drawn: HTML5 Canvas drawing pad
 *   - typed: typed name rendered in italic font
 *
 * Props:
 *   open, onClose, onSign(signatureType, signatureData, signerName)
 *   approvalTitle (string)
 *   loading (bool)
 */
export default function SignatureModal({ open, onClose, onSign, approvalTitle, loading }) {
  const [mode, setMode] = useState("typed"); // drawn | typed
  const [typedName, setTypedName] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const canvasRef = useRef(null);
  const lastPos = useRef(null);

  useEffect(() => {
    if (!open) { setTypedName(""); setHasDrawing(false); }
  }, [open]);

  useEffect(() => {
    if (mode === "drawn" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = "#05080F";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawing(false);
    }
  }, [mode]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#E8EAF2";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawing(true);
  };

  const endDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#05080F";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const handleSign = () => {
    if (mode === "drawn") {
      if (!hasDrawing) return;
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSign("drawn", dataUrl, null);
    } else {
      if (!typedName.trim()) return;
      onSign("typed", typedName.trim(), typedName.trim());
    }
  };

  const canSubmit = mode === "drawn" ? hasDrawing : typedName.trim().length >= 2;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-[#0D0F1A] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Tanda Tangan Digital</h2>
            <p className="mt-0.5 text-xs text-[color:var(--kti-text-dim)] line-clamp-1">{approvalTitle}</p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[color:var(--kti-text-dim)] hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("typed")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
              mode === "typed" ? "border-[rgba(124,104,225,0.45)] bg-[rgba(124,104,225,0.18)] text-white" : "border-white/10 text-[color:var(--kti-text-dim)] hover:text-white"
            }`}
          >
            <Type className="size-4" /> Ketik Nama
          </button>
          <button
            onClick={() => setMode("drawn")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
              mode === "drawn" ? "border-[rgba(78,203,175,0.45)] bg-[rgba(78,203,175,0.18)] text-white" : "border-white/10 text-[color:var(--kti-text-dim)] hover:text-white"
            }`}
          >
            <PenLine className="size-4" /> Gambar
          </button>
        </div>

        {/* Content */}
        {mode === "typed" ? (
          <div className="space-y-3">
            <label className="block text-xs text-[color:var(--kti-text-dim)]">Ketikkan nama lengkap Anda sebagai tanda tangan</label>
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Nama lengkap Anda..."
              className="kti-focus w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-xl italic font-semibold text-white tracking-wide placeholder:text-white/20 placeholder:not-italic placeholder:font-normal placeholder:text-sm placeholder:tracking-normal"
              style={{ fontFamily: "Georgia, serif" }}
            />
            {typedName.length > 1 && (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                <p className="text-xs text-[color:var(--kti-text-faint)] mb-2">Preview tanda tangan:</p>
                <p className="text-2xl italic font-semibold text-white" style={{ fontFamily: "Georgia, serif" }}>{typedName}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[color:var(--kti-text-dim)]">Gambar tanda tangan Anda di bawah ini</label>
              <button onClick={clearCanvas} className="flex items-center gap-1 text-xs text-[color:var(--kti-text-dim)] hover:text-white">
                <RotateCcw className="size-3" /> Hapus
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={480}
              height={180}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
              className="w-full touch-none cursor-crosshair rounded-xl border border-white/12"
              style={{ background: "#05080F", display: "block" }}
            />
            {!hasDrawing && (
              <p className="text-center text-xs text-[color:var(--kti-text-faint)]">Gambar tanda tangan di atas</p>
            )}
          </div>
        )}

        {/* Legal notice */}
        <p className="mt-4 text-[11px] text-[color:var(--kti-text-faint)] leading-relaxed">
          Dengan menandatangani, Anda menyetujui bahwa tanda tangan digital ini memiliki kekuatan hukum yang sama dengan tanda tangan fisik untuk keperluan internal KTI.
        </p>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSign}
            disabled={!canSubmit || loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[rgba(78,203,175,0.18)] border border-[rgba(78,203,175,0.4)] py-3 text-sm font-medium text-white hover:bg-[rgba(78,203,175,0.28)] disabled:opacity-50 transition-colors"
          >
            {loading ? <><Loader2 className="size-4 animate-spin" /> Menyimpan...</> : <><Check className="size-4" /> Tandatangani</>}
          </button>
          <button onClick={onClose} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-[color:var(--kti-text-dim)] hover:text-white">Batal</button>
        </div>
      </div>
    </div>
  );
}
