import { useState } from "react";
import { Play } from "lucide-react";

export default function BlockDemoEmbed({ data = {} }) {
  const { embedUrl, title, posterImage } = data;
  const [loaded, setLoaded] = useState(false);

  if (!embedUrl) {
    return null;
  }

  return (
    <section data-testid="block-demo-embed" className="space-y-4">
      {title && (
        <h3 className="font-display text-xl sm:text-2xl font-semibold text-white">
          {title}
        </h3>
      )}
      <div className="relative aspect-video overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5">
        {!loaded ? (
          <button
            onClick={() => setLoaded(true)}
            className="group absolute inset-0 flex items-center justify-center"
            style={posterImage ? {
              backgroundImage: `var(--kti-media-overlay-side), url(${posterImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : { background: 'var(--kti-space-900)' }}
          >
            <div className="grid size-20 place-items-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md transition-transform group-hover:scale-110">
              <Play className="size-8 text-white ml-1" />
            </div>
          </button>
        ) : (
          <iframe
            src={embedUrl}
            title={title || "Demo"}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </section>
  );
}
