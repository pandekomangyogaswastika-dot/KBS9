import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Zap, Users as UsersIcon, Shield } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useFetch } from "@/lib/apiClient";

function bil(obj, lang) {
  if (!obj) return null;
  return lang.startsWith("en") ? obj.en : obj.id;
}

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();

  const { data: settings } = useFetch("/settings");

  const heroTitle  = bil(settings?.about_title, lang)  || (lang.startsWith("en") ? "About Kubus Teknologi Indonesia" : "Tentang Kubus Teknologi Indonesia");
  const heroBody   = bil(settings?.about_body, lang)   || (lang.startsWith("en")
    ? "We are a team of passionate engineers and consultants dedicated to building enterprise software that truly solves business problems."
    : "Kami adalah tim engineer dan konsultan yang passionate dalam membangun software enterprise yang benar-benar menyelesaikan masalah bisnis.");
  const missionTitle = lang.startsWith("en") ? "Our Mission" : "Misi Kami";
  const visionTitle  = lang.startsWith("en") ? "Our Vision"  : "Visi Kami";
  const missionBody  = bil(settings?.about_mission, lang) || (lang.startsWith("en")
    ? "Empowering businesses through technology. We build custom software solutions that drive efficiency, enable growth, and deliver measurable ROI."
    : "Memberdayakan bisnis melalui teknologi. Kami membangun solusi software custom yang meningkatkan efisiensi, mendorong pertumbuhan, dan memberikan ROI yang terukur.");
  const visionBody   = bil(settings?.about_vision, lang)  || (lang.startsWith("en")
    ? "To be Indonesia's most trusted technology partner, known for delivering enterprise-grade solutions that stand the test of time."
    : "Menjadi mitra teknologi paling terpercaya di Indonesia, dikenal karena menghadirkan solusi enterprise-grade yang tahan uji waktu.");

  const values = [
    {
      icon: Target,
      title: { id: "Fokus pada Solusi", en: "Solution-Focused" },
      desc: { id: "Kami tidak hanya membangun software, tapi menyelesaikan masalah bisnis Anda.", en: "We don't just build software, we solve your business problems." },
    },
    {
      icon: Zap,
      title: { id: "Inovasi Berkelanjutan", en: "Continuous Innovation" },
      desc: { id: "Terus belajar dan mengadopsi teknologi terbaru untuk memberikan nilai maksimal.", en: "Continuously learning and adopting the latest tech to deliver maximum value." },
    },
    {
      icon: UsersIcon,
      title: { id: "Partnership Jangka Panjang", en: "Long-term Partnership" },
      desc: { id: "Kami adalah mitra, bukan vendor. Sukses Anda adalah sukses kami.", en: "We are partners, not vendors. Your success is our success." },
    },
    {
      icon: Shield,
      title: { id: "Kualitas & Keamanan", en: "Quality & Security" },
      desc: { id: "Standar enterprise di setiap baris kode. Keamanan data adalah prioritas utama.", en: "Enterprise standards in every line of code. Data security is our top priority." },
    },
  ];

  return (
    <div data-testid="about-page">
      <SEOHead
        title={`${heroTitle} - Kubus Teknologi Indonesia`}
        description={heroBody}
        type="website"
      />
      
      {/* Hero */}
      <section className="kti-container py-24">
        <div className="max-w-4xl mx-auto text-center">
          <p className="kti-eyebrow mb-6">{t("sections.origin")}</p>
          <h1 className="kti-heading-1 mb-6">{heroTitle}</h1>
          <p className="text-xl text-white/70 leading-relaxed">{heroBody}</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="kti-container pb-24">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="kti-card p-8">
            <h2 className="font-display text-2xl mb-4">{missionTitle}</h2>
            <p className="text-white/70 leading-relaxed">{missionBody}</p>
          </div>
          <div className="kti-card p-8">
            <h2 className="font-display text-2xl mb-4">{visionTitle}</h2>
            <p className="text-white/70 leading-relaxed">{visionBody}</p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="kti-container pb-24">
        <div className="text-center mb-12">
          <h2 className="kti-heading-2 mb-4">
            {lang.startsWith("en") ? "Our Core Values" : "Nilai-Nilai Kami"}
          </h2>
          <p className="text-white/60">
            {lang.startsWith("en")
              ? "The principles that guide every decision we make"
              : "Prinsip yang memandu setiap keputusan kami"}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, idx) => (
            <div key={idx} className="kti-card p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 mb-4">
                <val.icon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="font-display text-lg mb-2">
                {lang.startsWith("en") ? val.title.en : val.title.id}
              </h3>
              <p className="text-sm text-white/60">
                {lang.startsWith("en") ? val.desc.en : val.desc.id}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="kti-container pb-24">
        <div className="kti-card p-12 text-center">
          <h2 className="kti-heading-2 mb-4">
            {lang.startsWith("en") ? "Meet Our Team" : "Kenali Tim Kami"}
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            {lang.startsWith("en")
              ? "We're a diverse team of engineers, designers, and consultants who love building great software."
              : "Kami adalah tim engineer, designer, dan konsultan yang beragam dan passionate dalam membangun software berkualitas."}
          </p>
          <Button onClick={() => navigate('/team')} size="lg">
            {lang.startsWith("en") ? "View Team" : "Lihat Tim"}
          </Button>
        </div>
      </section>
    </div>
  );
}

