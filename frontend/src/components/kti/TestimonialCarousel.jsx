import StyledText from "@/components/StyledText";
import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

export default function TestimonialCarousel({ items }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  if (!items || items.length === 0) return null;

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="kti-container py-24" data-testid="testimonial-carousel">
      <div className="text-center mb-12">
        <p className="kti-eyebrow mb-4">Testimonials</p>
        <h2 className="kti-heading-2">
          {lang.startsWith("en") ? "What Our Clients Say" : "Kata Klien Kami"}
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {items.map((testimonial) => (
          <Card
            key={testimonial.id}
            className="kti-card p-8 relative"
            data-testid={`testimonial-${testimonial.id}`}
          >
            {/* Quote icon */}
            <div className="absolute top-6 right-6 opacity-10">
              <Quote className="h-12 w-12" />
            </div>

            {/* Rating */}
            {testimonial.rating && (
              <div className="mb-4">{renderStars(testimonial.rating)}</div>
            )}

            {/* Quote */}
            <blockquote className="leading-relaxed mb-6 relative z-10 text-white/80">
              "<StyledText value={testimonial.quote} lang={lang} as="span" />"
            </blockquote>

            {/* Person */}
            <div className="flex items-center gap-4">
              {testimonial.photo_url ? (
                <Avatar className="h-12 w-12">
                  <img
                    src={testimonial.photo_url}
                    alt={testimonial.person_name}
                    className="object-cover"
                  />
                </Avatar>
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                  {testimonial.person_name.charAt(0)}
                </div>
              )}
              
              <div>
                <p className="font-medium">{testimonial.person_name}</p>
                <p className="text-sm text-white/60">
                  {lang.startsWith("en")
                    ? testimonial.person_role.en
                    : testimonial.person_role.id}
                </p>
                <p className="text-sm text-white/50">{testimonial.company}</p>
              </div>
            </div>

            {/* Video indicator */}
            {testimonial.video_url && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <a
                  href={testimonial.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {lang.startsWith("en") ? "Watch video testimonial →" : "Tonton video testimonial →"}
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
