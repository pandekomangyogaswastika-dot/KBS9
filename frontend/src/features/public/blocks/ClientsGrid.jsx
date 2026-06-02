import { motion } from "framer-motion";
import { LogoChip } from "@/components/decor";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

export default function ClientsGrid({ items = [] }) {
  return (
    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="clients-grid">
      {items.map((c) => (
        <motion.div key={c.id} variants={fadeUp} data-testid={`client-chip-${c.id}`}>
          <LogoChip name={c.name} />
        </motion.div>
      ))}
    </motion.div>
  );
}
