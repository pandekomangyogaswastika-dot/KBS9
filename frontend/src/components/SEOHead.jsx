import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * SEOHead Component - Phase 11.A Basic SEO Foundation
 * 
 * Comprehensive SEO meta tags management:
 * - Title and description
 * - Open Graph tags (Facebook, LinkedIn)
 * - Twitter Card tags
 * - Schema.org JSON-LD structured data
 * - Canonical URLs
 * - hreflang alternate language tags
 * 
 * @param {string} title - Page title (will be appended with site name)
 * @param {string} description - Meta description
 * @param {string} image - OG image URL (absolute URL)
 * @param {string} type - OG type (website, article, etc)
 * @param {object} schema - Schema.org structured data object
 * @param {string} canonical - Canonical URL (optional, defaults to current path)
 * @param {boolean} noindex - If true, adds noindex meta tag
 * @param {object} article - Article-specific metadata (publishedTime, modifiedTime, author, section, tags)
 */
export default function SEOHead({
  title = "Kubus Teknologi Indonesia",
  description = "Kubus Teknologi Indonesia (KTI) — Solusi teknologi enterprise untuk transformasi digital bisnis Anda. Konsultasi IT, development, dan implementasi sistem terintegrasi.",
  image,
  type = "website",
  schema,
  canonical,
  noindex = false,
  article,
}) {
  const location = useLocation();
  const { i18n } = useTranslation();
  
  const BASE_URL = "https://kbs9-production.preview.emergentagent.com";
  const SITE_NAME = "Kubus Teknologi Indonesia";
  const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`; // TODO: Add default OG image to public folder
  
  // Construct full title
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  
  // Construct canonical URL
  const canonicalUrl = canonical || `${BASE_URL}${location.pathname}`;
  
  // Image URL (use provided or default)
  const ogImage = image || DEFAULT_IMAGE;
  
  // Current language
  const currentLang = i18n.language || "id";
  const alternateLang = currentLang === "id" ? "en" : "id";
  
  // Construct alternate URL (same path, different language)
  // In a real implementation, you might have language-specific routes
  const alternateUrl = `${BASE_URL}${location.pathname}`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Language Alternates */}
      <link rel="alternate" hrefLang={currentLang} href={canonicalUrl} />
      <link rel="alternate" hrefLang={alternateLang} href={alternateUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={currentLang === "id" ? "id_ID" : "en_US"} />
      <meta property="og:locale:alternate" content={alternateLang === "id" ? "id_ID" : "en_US"} />
      
      {/* Article-specific OG tags */}
      {article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
          {article.tags && article.tags.map((tag, i) => (
            <meta key={i} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {/* Add your Twitter handle if available */}
      {/* <meta name="twitter:site" content="@kubusteknologi" /> */}
      {/* <meta name="twitter:creator" content="@kubusteknologi" /> */}
      
      {/* Schema.org JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

/**
 * Helper functions to generate common Schema.org structures
 */

export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kubus Teknologi Indonesia",
  alternateName: "KTI",
  url: "https://kbs9-production.preview.emergentagent.com",
  logo: "https://kbs9-production.preview.emergentagent.com/logo.png",
  description: "Solusi teknologi enterprise untuk transformasi digital bisnis Anda",
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Sales",
    availableLanguage: ["Indonesian", "English"],
  },
  sameAs: [
    // Add social media profiles here
    // "https://www.linkedin.com/company/kubus-teknologi",
    // "https://twitter.com/kubusteknologi",
  ],
});

export const createWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Kubus Teknologi Indonesia",
  url: "https://kbs9-production.preview.emergentagent.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://kbs9-production.preview.emergentagent.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
});

export const createServiceSchema = (service) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: service.title_id,
  description: service.description_id,
  provider: {
    "@type": "Organization",
    name: "Kubus Teknologi Indonesia",
  },
  areaServed: {
    "@type": "Country",
    name: "Indonesia",
  },
});

export const createArticleSchema = (article) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: article.title,
  description: article.excerpt || article.description,
  image: article.image || "https://kbs9-production.preview.emergentagent.com/og-image.png",
  datePublished: article.created_at,
  dateModified: article.updated_at || article.created_at,
  author: {
    "@type": "Person",
    name: article.author || "KTI Team",
  },
  publisher: {
    "@type": "Organization",
    name: "Kubus Teknologi Indonesia",
    logo: {
      "@type": "ImageObject",
      url: "https://kbs9-production.preview.emergentagent.com/logo.png",
    },
  },
});

export const createBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
