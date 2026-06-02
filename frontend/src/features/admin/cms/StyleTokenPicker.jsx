/**
 * StyleTokenPicker — inline color + font selector for styled-bilingual fields.
 * Appears as a small toolbar below the text input.
 */
import { Palette, Type } from "lucide-react";

export const KTI_COLORS = [
  { key: "white",         label: "White",        css: "rgba(255,255,255,0.90)" },
  { key: "dim",           label: "Dim",          css: "rgba(255,255,255,0.55)" },
  { key: "violet",        label: "Violet",       css: "#7C68E1" },
  { key: "violet-light",  label: "Violet Light", css: "#A78BFA" },
  { key: "teal",          label: "Teal",         css: "#2DE2B6" },
  { key: "amber",         label: "Amber",        css: "#F5BE6C" },
  { key: "coral",         label: "Coral",        css: "#FF6B8A" },
];

export const KTI_FONTS = [
  { key: "sans",    label: "Body (Space Grotesk)",  className: "font-sans" },
  { key: "display", label: "Display (Syne)",        className: "font-display" },
  { key: "mono",    label: "Mono (Space Mono)",     className: "font-mono-kti" },
];

export default function StyleTokenPicker({ style = {}, onChange }) {
  const set = (key, val) => onChange({ ...style, [key]: val === style[key] ? undefined : val });

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
      {/* Color swatches */}
      <div className="flex items-center gap-1.5">
        <Palette className="size-3 text-white/30" />
        {KTI_COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            title={c.label}
            onClick={() => set("color", c.key)}
            className={`size-4 rounded-full ring-offset-1 ring-offset-[#0B0D17] transition-all hover:scale-110 ${
              style.color === c.key ? "ring-2 ring-white/70" : "ring-0"
            }`}
            style={{ background: c.css }}
          />
        ))}
      </div>

      {/* Font preset buttons */}
      <div className="flex items-center gap-1.5">
        <Type className="size-3 text-white/30" />
        {KTI_FONTS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => set("font", f.key)}
            title={f.label}
            className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
              style.font === f.key
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/70"
            } ${f.className}`}
          >
            Aa
          </button>
        ))}
      </div>

      {/* Clear */}
      {(style.color || style.font) && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="ml-auto text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          reset
        </button>
      )}
    </div>
  );
}
