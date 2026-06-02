import { FileText, Play } from "lucide-react";

export default function MediaThumb({ asset, className = "" }) {
  if (!asset) return null;
  if (asset.kind === "image") {
    return (
      <img
        src={asset.url}
        alt={asset.alt?.id || asset.original_name || ""}
        loading="lazy"
        data-testid="media-thumb"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  if (asset.kind === "video") {
    return (
      <div className={`grid h-full w-full place-items-center bg-black/40 ${className}`}>
        <Play className="size-7 text-white/70" />
      </div>
    );
  }
  return (
    <div className={`grid h-full w-full place-items-center bg-white/5 ${className}`}>
      <FileText className="size-7 text-white/60" />
    </div>
  );
}
