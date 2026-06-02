import BlockHero from "@/components/content/blocks/BlockHero";
import BlockGallery from "@/components/content/blocks/BlockGallery";
import BlockCTA from "@/components/content/blocks/BlockCTA";
import BlockMetrics from "@/components/content/blocks/BlockMetrics";
import BlockFeatures from "@/components/content/blocks/BlockFeatures";
import BlockTestimonials from "@/components/content/blocks/BlockTestimonials";
import BlockDemoEmbed from "@/components/content/blocks/BlockDemoEmbed";

/**
 * Render individual block based on type
 * Uses explicit conditional rendering to avoid dynamic JSX component issues (TD-007)
 */
function renderBlock(block) {
  const { type, data } = block;

  if (type === "hero") return <BlockHero data={data} />;
  if (type === "gallery") return <BlockGallery data={data} />;
  if (type === "cta") return <BlockCTA data={data} />;
  if (type === "metrics") return <BlockMetrics data={data} />;
  if (type === "features") return <BlockFeatures data={data} />;
  if (type === "testimonials") return <BlockTestimonials data={data} />;
  if (type === "demoEmbed") return <BlockDemoEmbed data={data} />;

  console.warn(`Unknown block type: ${type}`);
  return null;
}

export default function BlocksRenderer({ blocks = [] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="py-16 text-center text-[color:var(--kti-text-dim)]">
        <p>No content blocks configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20">
      {blocks.map((block, index) => {
        const content = renderBlock(block);
        if (!content) return null;

        return (
          <div key={block.id || index} data-testid={`content-block-${block.type}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
