import { Quote } from "lucide-react";

export default function BlockTestimonials({ data = {} }) {
  const { testimonials = [] } = data;

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section data-testid="block-testimonials" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className="rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8"
        >
          <Quote className="size-10 text-[color:var(--kti-indigo)] opacity-30" />
          <p className="mt-4 text-base leading-relaxed text-white">
            {testimonial.quote}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {testimonial.avatar && (
              <img
                src={testimonial.avatar}
                alt={testimonial.author}
                className="size-12 rounded-full border border-white/10 object-cover"
              />
            )}
            <div>
              <p className="font-semibold text-white">{testimonial.author}</p>
              <p className="text-xs text-[color:var(--kti-text-dim)]">
                {testimonial.role}
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
