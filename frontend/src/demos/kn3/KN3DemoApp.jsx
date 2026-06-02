/**
 * KN3DemoApp.jsx — Wrapper untuk KN3 WMS Demo yang diembed di dalam KBS5.
 *
 * Menggunakan struktur asli App.js dari repo KN3, dengan modifikasi minimal:
 * 1. Menerima props {sessionId, sessionData, onExit} dari DemoPage
 * 2. Bypass LoginScreen — session sudah dibuat via DemoGateForm
 * 3. Menambahkan DemoBanner di bagian atas
 * 4. services/apiClient.js tetap menggunakan /api/demo/kn3
 */
import { useState, useEffect } from "react";
import "./App.css";
import { MetricCard, Sidebar, TopBar } from "./components/CoreWidgets";
import { formatQty } from "./utils/formatters";
import { SalesPortal } from "./features/sales/SalesPortal";
import OrdersView from "./features/orders/OrdersView";
import OperationsView from "./features/wms/OperationsView";
import DocumentsView from "./features/documents/DocumentsView";
import AdminView from "./features/admin/AdminView";
import DetailDrawer from "./components/DetailDrawer";
import TourMenu from "./components/TourMenu";
import OnboardingPanel from "./components/OnboardingPanel";
import { PAGE_META, GUIDANCE_MAP, buildNavigation } from "./config/navigationConfig";
import { useAppActions } from "./hooks/useAppActions";
import ManagerDashboard from "./features/manager/ManagerDashboard";
import PurchaseOrderManagement from "./features/admin/PurchaseOrderManagement";
import EscalationManagement from "./features/manager/EscalationManagement";
import GuidedTour from "./components/GuidedTour";
import DemoBanner from "../../components/DemoBanner";
import {
  Archive, Boxes, Building2, Clock3, PackageCheck, Sparkles, Warehouse,
} from "lucide-react";
import { setAuthToken } from "./services/apiClient";

export default function KN3DemoApp({ sessionId, sessionData, onExit, autoStartTour = false }) {
  // --- Auth: inject session token, skip LoginScreen ---
  const [token, setToken] = useState(sessionId || "");
  const [user, setUser] = useState({
    id: "demo_admin_01",
    name: sessionData?.name || "Admin Demo",
    email: sessionData?.email || "admin@demo.wms",
    role: "admin",
  });

  // --- State (identik dengan App.js original) ---
  const [activeView, setActiveView] = useState("sales");
  const [data, setData] = useState({ products: [], customers: [], orders: [], warehouses: [], metrics: {} });
  const [movements, setMovements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [permissions, setPermissions] = useState({ matrix: {}, actions: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilters, setAuditFilters] = useState({ actor: "", module: "", action: "", date_from: "", date_to: "" });
  const [activeTour, setActiveTour] = useState(null);
  const [showTourMenu, setShowTourMenu] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [activeDetail, setActiveDetail] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("Sistem siap. Stok reservation dikunci 3 hari.");
  const [lastDocument, setLastDocument] = useState(null);
  const [lastLabel, setLastLabel] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Actions hook (identik dengan App.js original) ---
  const actions = useAppActions({
    user, token, auditFilters, selectedCustomer, selectedAddress, cart, data,
    setUser, setToken, setActiveView, setNotice, setOnboarding, setShowOnboarding,
    setData, setTemplates, setUoms, setMovements, setTasks, setUsers, setPermissions, setAuditLogs,
    setSelectedCustomer, setSelectedAddress, setSelectedProduct, setBreakdown,
    setCart, setLastDocument, setLastLabel, setPreviewHtml,
    setActiveDetail, setLoading,
  });

  const {
    showMetricDetail, loadAll,
    inspectProduct, addToCart, createCustomer, submitOrder, mutateOrder,
    payInvoice, releaseReservation, generateDocument, generateLabel,
    adminCreate, adminPatch, adminDelete, importMaster, exportMaster,
    updatePermissions, seedDemo, previewTemplate, refreshAudit,
    createInboundTask, createOutboundTasks, scanTask, advanceTask,
  } = actions;

  // --- Init on mount: set token + load data ---
  useEffect(() => {
    if (sessionId) {
      setAuthToken(sessionId);
      loadAll().then(() => {
        if (autoStartTour) {
          setTimeout(() => {
            const TOUR_DEFS = require("./data/tourDefinitions").TOUR_DEFINITIONS;
            const salesTour = TOUR_DEFS?.find(t => t.id === "sales");
            if (salesTour) setActiveTour(salesTour);
          }, 1200);
        }
      });
    }
  }, [sessionId]); // eslint-disable-line

  const nav = buildNavigation(user?.role);
  const pageMeta = PAGE_META[activeView] || { kicker: "Workspace", title: "Smart WMS" };
  const guidance = GUIDANCE_MAP[activeView];

  return (
    <div
      className="kbs5-demo-embedded"
      style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}
    >
      {/* KBS5 Demo Banner — session info + countdown + exit */}
      <div style={{ flexShrink: 0 }}>
        <DemoBanner sessionId={sessionId} sessionData={sessionData} onExit={onExit} />
      </div>

      {/* KN3 original app shell — CSS classes identik dengan App.js */}
      <div
        className="app-shell layout-grid"
        style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Sidebar
          items={nav}
          activeId={activeView}
          onSelect={setActiveView}
          user={user}
          onLogout={onExit}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="app-main">
          <TopBar
            title={pageMeta.title}
            kicker={pageMeta.kicker}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            onSync={loadAll}
            syncing={loading}
            notice={notice}
            infoCta={guidance ? { label: guidance.label, onClick: () => setActiveView(guidance.target) } : null}
          />
          <main id="main-content" className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-5 md:py-5">
            <section data-testid="metrics-row" className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 no-print">
              <MetricCard testId="metric-products" icon={Archive} label="Produk Aktif" value={data.metrics?.products || 0} tone="rgba(0,122,255,.12)" hint="Buka katalog" onClick={() => showMetricDetail("products")} />
              <MetricCard testId="metric-available" icon={Boxes} label="Available Qty" value={formatQty(data.metrics?.available_qty)} tone="rgba(52,199,89,.14)" hint="Lihat stok" onClick={() => showMetricDetail("available")} />
              <MetricCard testId="metric-reserved" icon={Clock3} label="Reserved Qty" value={formatQty(data.metrics?.reserved_qty)} tone="rgba(175,82,222,.14)" hint="Buka orders" onClick={() => showMetricDetail("reserved")} />
              <MetricCard testId="metric-orders" icon={PackageCheck} label="Active Orders" value={data.metrics?.active_orders || 0} tone="rgba(255,149,0,.14)" hint="Control room" onClick={() => showMetricDetail("orders")} />
              <MetricCard testId="metric-warehouses" icon={Warehouse} label="Gudang" value={data.metrics?.warehouses || 0} tone="rgba(60,60,67,.10)" hint="Buka WMS" onClick={() => showMetricDetail("warehouses")} />
            </section>

            <div className="md:hidden mt-3">
              <div data-testid="system-notice-mobile" className="info-ribbon">
                <Sparkles size={13} className="ribbon-icon" />
                <span>{notice}</span>
              </div>
            </div>

            <DetailDrawer
              detail={activeDetail}
              onClose={() => setActiveDetail(null)}
              onNavigate={(target) => { setActiveView(target); setActiveDetail(null); }}
            />

            {showOnboarding && (
              <OnboardingPanel
                onboarding={onboarding}
                onDismiss={() => setShowOnboarding(false)}
                onUpdate={setOnboarding}
              />
            )}

            <div className="mt-4 md:mt-5">
              {activeView === "admin" && (
                <AdminView
                  data={data} users={users} uoms={uoms} templates={templates}
                  permissions={permissions} previewHtml={previewHtml}
                  auditLogs={auditLogs} auditFilters={auditFilters}
                  setAuditFilters={setAuditFilters}
                  onAdminCreate={adminCreate} onAdminPatch={adminPatch}
                  onAdminDelete={adminDelete} onImportMaster={importMaster}
                  onExportMaster={exportMaster} onUpdatePermissions={updatePermissions}
                  onPreviewTemplate={previewTemplate} onRefreshAudit={refreshAudit}
                  onShowDetail={setActiveDetail} onSeedDemo={seedDemo}
                />
              )}
              {activeView === "reports" && <ManagerDashboard token={token} />}
              {activeView === "sales" && (
                <SalesPortal
                  data={data} selectedProduct={selectedProduct} breakdown={breakdown}
                  onInspect={inspectProduct} onAdd={addToCart} cart={cart}
                  setCart={setCart} selectedCustomer={selectedCustomer}
                  setSelectedCustomer={setSelectedCustomer}
                  selectedAddress={selectedAddress}
                  setSelectedAddress={setSelectedAddress}
                  onCreateCustomer={createCustomer} onSubmitOrder={submitOrder}
                  search={search} setSearch={setSearch} onShowDetail={setActiveDetail}
                />
              )}
              {activeView === "orders" && (
                <OrdersView
                  orders={data.orders || []} onShowDetail={setActiveDetail}
                  onApprove={(id) => mutateOrder(`/sales-orders/${id}/approve`, (o) => `${o.number} approved.`)}
                  onConfirm={(id) => mutateOrder(`/sales-orders/${id}/confirm`, (o) => `${o.number} confirmed.`)}
                  onCancel={(id) => mutateOrder(`/sales-orders/${id}/cancel`, (o) => `${o.number} dibatalkan, stok unlock.`)}
                  onPay={payInvoice} onGenerateDocument={generateDocument}
                  onReleaseReservation={releaseReservation}
                />
              )}
              {activeView === "purchasing" && <PurchaseOrderManagement user={user} />}
              {activeView === "operations" && (
                <OperationsView
                  data={data} movements={movements} tasks={tasks}
                  onGenerateLabel={generateLabel}
                  onCreateInboundTask={createInboundTask}
                  onCreateOutboundTasks={createOutboundTasks}
                  onScanTask={scanTask} onAdvanceTask={advanceTask}
                  onShowDetail={setActiveDetail} token={token} user={user}
                />
              )}
              {activeView === "escalations" && <EscalationManagement user={user} />}
              {activeView === "documents" && (
                <DocumentsView
                  templates={templates} lastDocument={lastDocument} lastLabel={lastLabel}
                  onGenerateLabel={generateLabel} products={data.products || []}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Guided Tour Component */}
      {activeTour && (
        <GuidedTour
          isActive={true}
          onClose={() => setActiveTour(null)}
          steps={activeTour.steps}
          tourId={activeTour.id}
          onComplete={() => setActiveTour(null)}
        />
      )}

      {/* Floating Help / Tour Menu */}
      <TourMenu
        userRole={user?.role}
        showMenu={showTourMenu}
        onToggleMenu={() => setShowTourMenu(!showTourMenu)}
        onSelectTour={(tour) => {
          setActiveTour(tour);
          setShowTourMenu(false);
        }}
      />
    </div>
  );
}
