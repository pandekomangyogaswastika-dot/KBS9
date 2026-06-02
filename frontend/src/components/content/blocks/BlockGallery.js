import { useState } from "react";

export default function BlockGallery({ data = {} }) {
  const { images = [], layout = "grid" } = data;
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center text-[color:var(--kti-text-dim)] py-8">
        <p>No images in gallery</p>
      </div>
    );
  }

  const gridClass = layout === "masonry" 
    ? "columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6" 
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";

  return (
    <section data-testid="block-gallery" className="space-y-4">
      <div className={gridClass}>
        {images.map((img, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-[var(--kti-radius-soft)] border border-white/10 bg-white/5 cursor-pointer"
            onClick={() => setLightboxIndex(index)}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={img.url}
                alt={img.caption || `Gallery image ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-[image:var(--kti-media-overlay-top)] p-3">
                <p className="text-xs text-white/90">{img.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-4 top-4 size-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>
          <img
            src={images[lightboxIndex]?.url}
            alt={images[lightboxIndex]?.caption || ""}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </section>
  );
}
