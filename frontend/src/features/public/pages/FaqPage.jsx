import { useState } from "react";
import { useTranslation } from "react-i18next";
import StyledText from "@/components/StyledText";
import { useFetch } from "@/lib/apiClient";
import PageHeader from "@/components/PageHeader";
import { ErrorView, EmptyView } from "@/components/StateViews";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// Skeleton loaders not needed for this page
import SEOHead from "@/components/SEOHead";

export default function FaqPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: faqs, loading, error, reload } = useFetch("/faq");
  const [category, setCategory] = useState("all");

  const categories = [
    { value: "all", label: { id: "Semua", en: "All" } },
    { value: "general", label: { id: "Umum", en: "General" } },
    { value: "pricing", label: { id: "Harga", en: "Pricing" } },
    { value: "technical", label: { id: "Teknis", en: "Technical" } },
    { value: "process", label: { id: "Proses", en: "Process" } },
  ];

  const filtered = category === "all" ? faqs : faqs?.filter((f) => f.category === category);

  return (
    <div data-testid="faq-page">
      <SEOHead
        title="FAQ - Frequently Asked Questions"
        description="Temukan jawaban untuk pertanyaan umum tentang layanan KTI, harga, proses, dan teknis."
        type="website"
      />
      <PageHeader
        eyebrow={t("sections.faq")}
        title="FAQ"
        intro="Pertanyaan yang Sering Diajukan"
      />
      
      <div className="kti-container pb-24">
        <Tabs value={category} onValueChange={setCategory} className="mb-12">
          <TabsList className="mb-8">
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {lang.startsWith("en") ? cat.label.en : cat.label.id}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading && <div className="space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-lg" />)}</div>}
        {error && <ErrorView message={error} onRetry={reload} />}
        {!loading && !error && (!filtered || filtered.length === 0) && <EmptyView message="Belum ada FAQ" />}
        
        {!loading && filtered && filtered.length > 0 && (
          <Accordion type="single" collapsible className="space-y-4">
            {filtered.map((faq, idx) => (
              <AccordionItem key={faq.id} value={faq.id} className="kti-card px-6">
                <AccordionTrigger className="py-6 text-left hover:no-underline">
                  <span className="font-display text-lg">
                    <StyledText value={faq.question} lang={lang} className="font-medium" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-white/70 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: lang.startsWith("en") ? faq.answer.en : faq.answer.id }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
