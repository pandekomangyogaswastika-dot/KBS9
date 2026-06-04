import "@/i18n";
import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import PublicLayout from "@/components/PublicLayout";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/features/admin/ProtectedRoute";
import { LiveChatWidget } from "@/components/LiveChatWidget";

const HomePage = lazy(() => import("@/features/public/HomePage"));
const ServicesPage = lazy(() => import("@/features/public/pages/ServicesPage"));
const ServiceDetailPage = lazy(() => import("@/features/public/pages/ServiceDetailPage"));
const CasesPage = lazy(() => import("@/features/public/pages/CasesPage"));
const CaseDetailPage = lazy(() => import("@/features/public/pages/CaseDetailPage"));
const TechPage = lazy(() => import("@/features/public/pages/TechPage"));
const TeamPage = lazy(() => import("@/features/public/pages/TeamPage"));
const BlogPage = lazy(() => import("@/features/public/pages/BlogPage"));
const BlogDetailPage = lazy(() => import("@/features/public/pages/BlogDetailPage"));
const CareerPage = lazy(() => import("@/features/public/pages/CareerPage"));
const CareerDetailPage = lazy(() => import("@/features/public/pages/CareerDetailPage"));
const ContactPage = lazy(() => import("@/features/public/pages/ContactPage"));
// Phase 19: Content Completion pages
const FaqPage = lazy(() => import("@/features/public/pages/FaqPage"));
const PricingPage = lazy(() => import("@/features/public/pages/PricingPage"));
const AboutPage = lazy(() => import("@/features/public/pages/AboutPage"));
const ResourcesPage = lazy(() => import("@/features/public/pages/ResourcesPage"));
const ResourceDetailPage = lazy(() => import("@/features/public/pages/ResourceDetailPage"));
const LegalPage = lazy(() => import("@/features/public/pages/LegalPage"));
const PortalComingSoon = lazy(() => import("@/features/portal/PortalComingSoon"));
// Phase 20: Portfolio / Case Studies / Products
const PortfolioPage = lazy(() => import("@/features/public/pages/PortfolioPage"));
const PortfolioDetailPage = lazy(() => import("@/features/public/pages/PortfolioDetailPage"));
const CaseStudiesPage = lazy(() => import("@/features/public/pages/CaseStudiesPage"));
const CaseStudyDetailPage = lazy(() => import("@/features/public/pages/CaseStudyDetailPage"));
const ProductsPage = lazy(() => import("@/features/public/pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("@/features/public/pages/ProductDetailPage"));

const LoginPage = lazy(() => import("@/features/portal/auth/LoginPage"));

// Admin / Staff portal
const AdminLayout = lazy(() => import("@/features/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/features/admin/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("@/features/admin/pages/AdminUsers"));
const AdminLeads = lazy(() => import("@/features/admin/pages/AdminLeads"));
const MediaLibrary = lazy(() => import("@/features/admin/pages/MediaLibrary"));
const CmsResourcePage = lazy(() => import("@/features/admin/pages/CmsResourcePage"));
const CmsSettings = lazy(() => import("@/features/admin/pages/CmsSettings"));
const AdminAssessments = lazy(() => import("@/features/admin/pages/AdminAssessments"));
const AdminProjects = lazy(() => import("@/features/admin/pages/AdminProjects"));
const StaffMessages = lazy(() => import("@/features/admin/pages/StaffMessages"));
const StaffClients = lazy(() => import("@/features/admin/pages/StaffClients"));
const AdminAiConversations = lazy(() => import("@/features/admin/pages/AdminAiConversations"));
const AdminAnalytics = lazy(() => import("@/features/admin/pages/AdminAnalytics"));
const AdminSeoDashboard = lazy(() => import("@/features/admin/pages/AdminSeoDashboard"));
const AdminIntegrations = lazy(() => import("@/features/admin/pages/AdminIntegrations"));
const AdminEmailOutbox = lazy(() => import("@/features/admin/pages/AdminEmailOutbox"));
const AdminDemoSessions = lazy(() => import("@/features/admin/pages/AdminDemoSessions"));
const CmsHubPage = lazy(() => import("@/features/admin/pages/CmsHubPage"));
const DemoConfigPage = lazy(() => import("@/features/admin/DemoConfigPage"));
const DemoAnalyticsPage = lazy(() => import("@/features/admin/DemoAnalyticsPage"));
const SystemRecoveryPage = lazy(() => import("@/features/admin/pages/SystemRecoveryPage"));

// Client portal
const ClientLayout = lazy(() => import("@/features/portal/client/ClientLayout"));
const ClientDashboard = lazy(() => import("@/features/portal/client/ClientDashboard"));
const ClientProjects = lazy(() => import("@/features/portal/client/ClientProjects"));
const ClientProjectDetail = lazy(() => import("@/features/portal/client/ClientProjectDetail"));
const ClientInvoices = lazy(() => import("@/features/portal/client/ClientInvoices"));
const ClientMessages = lazy(() => import("@/features/portal/client/ClientMessages"));
const ClientAssistant = lazy(() => import("@/features/portal/client/ClientAssistant"));

const ClientAssessments = lazy(() => import("@/features/portal/client/ClientAssessments"));
const ClientDetailPage = lazy(() => import("@/features/admin/pages/ClientDetailPage"));
const AssessmentClient = lazy(() => import("@/features/assessment/AssessmentClient"));
const AssessmentTaking = lazy(() => import("@/features/assessment/AssessmentV2Taking"));
const DemoPage = lazy(() => import("@/features/demo/DemoPage"));
const GarmentSerialDemoApp = lazy(() => import("@/demos/garment-serial/GarmentSerialDemoApp"));

function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 pt-24 text-center">
      <div>
        <div className="font-display text-6xl font-semibold kti-gradient-text">404</div>
        <p className="mt-4 kti-text-dim">Lost in space. Halaman tidak ditemukan.</p>
        <Link to="/" data-testid="notfound-home" className="kti-focus mt-6 inline-block rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/5">Kembali ke Beranda</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
            <ScrollToTop />
            <Suspense fallback={<div style={{ background: "#05060A", minHeight: "100vh" }} />}>
              <Routes>
              {/* Public site */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:slug" element={<ServiceDetailPage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/cases/:slug" element={<CaseDetailPage />} />
                <Route path="/tech" element={<TechPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogDetailPage />} />
                <Route path="/career" element={<CareerPage />} />
                <Route path="/career/:slug" element={<CareerDetailPage />} />
                <Route path="/contact" element={<ContactPage />} />
                {/* Phase 19: New public pages */}
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/resources/:slug" element={<ResourceDetailPage />} />
                <Route path="/privacy-policy" element={<LegalPage />} />
                <Route path="/terms-of-service" element={<LegalPage />} />
                {/* Phase 20: Portfolio / Case Studies / Products */}
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/portfolio/:slug" element={<PortfolioDetailPage />} />
                <Route path="/case-studies" element={<CaseStudiesPage />} />
                <Route path="/case-studies/:slug" element={<CaseStudyDetailPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Auth */}
              <Route path="/portal/login" element={<LoginPage />} />
              <Route path="/portal/coming-soon" element={<PortalComingSoon />} />
              <Route path="/assessment/:token" element={<AssessmentClient />} />
              <Route path="/demo/kn3" element={<DemoPage appSlug="kn3" />} />
              <Route path="/demo/garment-serial" element={<GarmentSerialDemoApp />} />

              {/* Admin + Staff portal */}
              <Route
                path="/portal/admin"
                element={(
                  <ProtectedRoute roles={["admin", "staff"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                )}
              >
                <Route index element={<AdminDashboard />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="demo-sessions" element={<AdminDemoSessions />} />
                <Route path="demo-config" element={<DemoConfigPage />} />
                <Route path="demo-analytics" element={<DemoAnalyticsPage />} />
                <Route path="media" element={<MediaLibrary />} />
                <Route path="cms" element={<CmsHubPage />} />
                <Route path="cms/:resource" element={<CmsResourcePage />} />
                <Route path="settings" element={<CmsSettings />} />
                <Route path="assessments" element={<AdminAssessments />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="messages" element={<StaffMessages />} />
                <Route path="clients" element={<StaffClients />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="ai-conversations" element={<AdminAiConversations />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="seo" element={<AdminSeoDashboard />} />
                <Route
                  path="settings/integrations"
                  element={(
                    <ProtectedRoute roles={["admin"]}>
                      <AdminIntegrations />
                    </ProtectedRoute>
                  )}
                />
                <Route path="settings/email-outbox" element={<AdminEmailOutbox />} />
                <Route path="recovery" element={<SystemRecoveryPage />} />
                <Route
                  path="users"
                  element={(
                    <ProtectedRoute roles={["admin"]}>
                      <AdminUsers />
                    </ProtectedRoute>
                  )}
                />
              </Route>

              {/* Client portal */}
              <Route element={(
                <ProtectedRoute roles={["client"]}>
                  <ClientLayout />
                </ProtectedRoute>
              )}>
                <Route path="/portal/dashboard" element={<ClientDashboard />} />
                <Route path="/portal/projects" element={<ClientProjects />} />
                <Route path="/portal/projects/:id" element={<ClientProjectDetail />} />
                <Route path="/portal/invoices" element={<ClientInvoices />} />
                <Route path="/portal/messages" element={<ClientMessages />} />
                <Route path="/portal/assistant" element={<ClientAssistant />} />
                <Route path="/portal/assessments" element={<ClientAssessments />} />
                <Route path="/portal/assessments/:sessionId" element={<AssessmentTaking />} />
              </Route>
            </Routes>
            {/* Live Chat Widget - available on all pages */}
            <LiveChatWidget />
          </Suspense>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
    </div>
  );
}

export default App;
