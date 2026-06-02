import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Layers3,
  Printer,
  Settings,
  ShoppingBag,
  Warehouse,
} from "lucide-react";

/**
 * Page metadata shown on the TopBar per active view.
 * Edit here to update kicker/title across the app (SSOT).
 */
export const PAGE_META = {
  admin:       { kicker: "Admin Workspace",  title: "Master Data & Audit" },
  sales:       { kicker: "Sales Workspace",  title: "Katalog POS & Reservation" },
  orders:      { kicker: "Order Control",    title: "Dashboard · Approval · Invoice · Receipt" },
  purchasing:  { kicker: "Purchasing",       title: "Purchase Order & Receiving" },
  operations:  { kicker: "Warehouse",        title: "Stok · Inbound · Outbound · Transfer" },
  escalations: { kicker: "Escalation",       title: "Eskalasi Inbound & Outbound" },
  documents:   { kicker: "Documents",        title: "Print Center & Labels" },
};

/**
 * Smart guidance CTA shown next to TopBar.
 */
export const GUIDANCE_MAP = {
  admin:       { label: "Audit",       target: "admin" },
  sales:       { label: "Cari Produk", target: "sales" },
  orders:      { label: "Review",      target: "orders" },
  purchasing:  { label: "Buat PO",     target: "purchasing" },
  operations:  { label: "WMS",         target: "operations" },
  escalations: { label: "Resolve",     target: "escalations" },
  documents:   { label: "Print",       target: "documents" },
};

/**
 * Role-based menu visibility (allowlist per role).
 * - sales:     hanya akses pos / orders / documents
 * - warehouse: hanya akses operations / escalations / documents
 * - manager:   akses laporan, orders, purchasing, operations, escalations, documents
 * - admin:     akses semua menu (dengan tambahan admin & reports yang khusus role admin/manager)
 */
const ROLE_MENU_ALLOWLIST = {
  sales:     ["sales", "orders", "documents"],
  warehouse: ["operations", "escalations", "documents"],
  manager:   ["reports", "orders", "purchasing", "operations", "escalations", "documents"],
};

/**
 * Build the navigation array for a given user role.
 * Returns array of { id, label, icon } items, already filtered for the role.
 */
export function buildNavigation(userRole) {
  const items = [
    ...(userRole === "admin" ? [{ id: "admin", label: "Admin", icon: Settings }] : []),
    ...(["admin", "manager"].includes(userRole) ? [{ id: "reports", label: "Dashboard", icon: Layers3 }] : []),
    { id: "sales",       label: "Sales POS",  icon: ShoppingBag },
    { id: "orders",      label: "Orders",     icon: FileText },
    { id: "purchasing",  label: "Purchasing", icon: ClipboardList },
    { id: "operations",  label: "WMS",        icon: Warehouse },
    { id: "escalations", label: "Eskalasi",   icon: AlertTriangle },
    { id: "documents",   label: "Print Center", icon: Printer },
  ];
  const allowlist = ROLE_MENU_ALLOWLIST[userRole];
  if (!allowlist) return items; // admin & unknown roles → see everything
  return items.filter((item) => allowlist.includes(item.id));
}

/**
 * Default landing view per role after login.
 */
export function defaultViewForRole(role) {
  if (role === "admin")     return "admin";
  if (role === "warehouse") return "operations";
  if (role === "manager")   return "reports";
  return "sales";
}
