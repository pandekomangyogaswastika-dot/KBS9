import { useEffect, useRef } from "react";
import { track } from "@/lib/analyticsTracker";

/**
 * useCardTracking — emits "view" event when card enters viewport
 * and returns a click handler to emit "click" event.
 *
 *  @param {string} targetType  e.g. "portfolio" | "case-study" | "product" | "partner"
 *  @param {Object} item        item with id and/or slug
 *  @param {Object} options     { threshold }
 */
export function useCardTracking(targetType, item, options = {}) {
  const ref = useRef(null);
  const threshold = options.threshold ?? 0.4;

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return undefined;
    let fired = false;
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired) {
            fired = true;
            track({
              event_type: "view",
              target_type: targetType,
              target_id: item?.id,
              target_slug: item?.slug,
            });
            obs.unobserve(node);
          }
        }
      },
      { threshold }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [targetType, item?.id, item?.slug, threshold]);

  const onClick = () => {
    track({
      event_type: "click",
      target_type: targetType,
      target_id: item?.id,
      target_slug: item?.slug,
    });
  };

  return { ref, onClick };
}
