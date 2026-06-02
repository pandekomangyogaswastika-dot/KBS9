/**
 * Tour Definitions untuk Smart Guidelines
 *
 * Setiap step bisa punya:
 *   - target:    string testid (`"foo-bar"`) ATAU CSS selector (`"[data-testid^='order-card-']"`)
 *   - title, content, placement: "top"|"bottom"|"left"|"right"|"center"
 *   - before:    testid/selector dari elemen yang HARUS DI-KLIK SEBELUM step ini (auto-navigate)
 *   - optional:  bila true → kalau target tidak ada, auto-skip ke step berikutnya
 *   - waitMs:    override polling timeout (default 2500)
 *
 * roles:        daftar role yang boleh melihat tour ini di menu Help & Tours.
 */

export const TOURS = {
  // =====================================================================
  // Tour 1 - Create Sales Order  (admin, sales)
  // =====================================================================
  createSalesOrder: {
    id: "create-sales-order",
    name: "Create Sales Order",
    description: "Panduan step-by-step membuat sales order dari POS",
    roles: ["admin", "sales"],
    steps: [
      {
        before: "nav-sales-button",
        target: "nav-sales-button",
        title: "Buka Sales POS",
        content: "Mulai dari menu Sales POS di sidebar. Tour akan otomatis membuka halaman ini.",
        placement: "right",
      },
      {
        target: "customer-select",
        title: "Pilih Customer",
        content: "Pilih customer dari dropdown. Jika belum ada, gunakan form 'Buat Customer' di bawahnya.",
        placement: "left",
      },
      {
        target: "product-grid",
        title: "Pilih Produk",
        content: "Klik salah satu produk di grid POS untuk menambahkannya ke keranjang dengan qty default 1 meter.",
        placement: "top",
      },
      {
        target: "cart-panel",
        title: "Review Keranjang",
        content: "Keranjang menampilkan semua produk yang dipilih beserta total. Anda bisa adjust qty atau hapus item.",
        placement: "left",
      },
      {
        target: "submit-sales-order-button",
        title: "Submit Order",
        content: "Klik 'Reserve & Submit' untuk membuat sales order. Status awal: Waiting Approval.",
        placement: "top",
      },
    ],
  },

  // =====================================================================
  // Tour 2 - Approve Sales Order  (admin, manager)
  // =====================================================================
  approveOrder: {
    id: "approve-order",
    name: "Approve Sales Order",
    description: "Cara approve sales order yang masuk",
    roles: ["admin", "manager"],
    steps: [
      {
        before: "nav-orders-button",
        target: "nav-orders-button",
        title: "Buka Menu Orders",
        content: "Buka modul Orders dari sidebar untuk melihat semua sales order.",
        placement: "right",
      },
      {
        before: "tab-list",
        target: "tab-list",
        title: "Tab Order List",
        content: "Pilih tab Order List untuk melihat daftar order yang masih perlu diproses.",
        placement: "bottom",
      },
      {
        target: "orders-search-input",
        title: "Cari Order (Opsional)",
        content: "Gunakan search untuk filter cepat berdasarkan nomor order, customer, atau produk.",
        placement: "bottom",
      },
      {
        target: "[data-testid^='order-card-']",
        title: "Pilih Order",
        content: "Klik salah satu order pada tabel untuk membuka detail di panel kanan.",
        placement: "right",
        optional: true,
      },
      {
        target: "order-detail-panel",
        title: "Review & Approve",
        content: "Cek detail order (customer, items, total). Jika status 'Waiting Approval', tombol Approve akan muncul di panel ini.",
        placement: "left",
        optional: true,
      },
    ],
  },

  // =====================================================================
  // Tour 3 - Process Inbound  (admin, warehouse)
  // =====================================================================
  processInbound: {
    id: "process-inbound",
    name: "Process Inbound Receipt",
    description: "Cara menerima barang masuk dari supplier",
    roles: ["admin", "warehouse"],
    steps: [
      {
        before: "nav-operations-button",
        target: "nav-operations-button",
        title: "Buka WMS",
        content: "Buka modul WMS dari sidebar untuk masuk ke warehouse operations.",
        placement: "right",
      },
      {
        before: "wms-tab-inbound",
        target: "wms-tab-inbound",
        title: "Tab Inbound",
        content: "Pilih tab Inbound untuk melihat task receiving dari Purchase Order.",
        placement: "bottom",
      },
      {
        target: "[data-testid^='inbound-task-']",
        title: "Pilih Task PO",
        content: "Klik PO/task yang barangnya sudah datang dan siap diterima. Panel scan akan muncul di kanan.",
        placement: "right",
        optional: true,
      },
      {
        title: "Scan & Submit Receipt",
        content: "Pada panel scan: input qty diterima, batch/lot/roll (opsional), lalu klik Submit. Anda juga bisa pakai kamera untuk scan barcode.",
        placement: "center",
      },
    ],
  },

  // =====================================================================
  // Tour 4 - Process Outbound  (admin, warehouse)
  // =====================================================================
  processOutbound: {
    id: "process-outbound",
    name: "Process Outbound Fulfillment",
    description: "Cara fulfill sales order dari warehouse",
    roles: ["admin", "warehouse"],
    steps: [
      {
        before: "nav-operations-button",
        target: "nav-operations-button",
        title: "Buka WMS",
        content: "Masuk ke modul WMS dari sidebar.",
        placement: "right",
      },
      {
        before: "wms-tab-outbound",
        target: "wms-tab-outbound",
        title: "Tab Outbound",
        content: "Pilih tab Outbound untuk melihat semua task picking dari sales order yang sudah di-confirm.",
        placement: "bottom",
      },
      {
        target: "[data-testid^='outbound-task-']",
        title: "Pilih Outbound Task",
        content: "Klik salah satu task untuk membuka panel pick & dispatch.",
        placement: "right",
        optional: true,
      },
      {
        title: "Pick & Dispatch",
        content: "Pada panel pick: input qty yang dipick + detail batch/lot, lalu klik 'Submit Pick'. Jika qty sudah penuh, tombol 'Dispatch' akan aktif untuk mengirim order.",
        placement: "center",
      },
    ],
  },

  // =====================================================================
  // Tour 5 - Inventory Management  (admin, warehouse, manager)
  // =====================================================================
  inventoryManagement: {
    id: "inventory-management",
    name: "Manage Inventory Stock",
    description: "Cara cek dan kelola inventory stock",
    roles: ["admin", "warehouse", "manager"],
    steps: [
      {
        before: "nav-operations-button",
        target: "nav-operations-button",
        title: "Buka WMS",
        content: "Mulai dari modul WMS di sidebar.",
        placement: "right",
      },
      {
        before: "wms-tab-stok",
        target: "wms-tab-stok",
        title: "Tab Stok",
        content: "Pilih tab Stok untuk melihat inventory balance semua produk di setiap warehouse.",
        placement: "bottom",
      },
      {
        target: "inventory-stock-view",
        title: "Overview Stok",
        content: "Halaman ini menampilkan ringkasan: Total On Hand, Available, Reserved, dan jumlah stok rendah. Data real-time per warehouse.",
        placement: "top",
      },
      {
        target: "inventory-search-input",
        title: "Search Produk",
        content: "Gunakan search untuk filter cepat berdasarkan SKU, nama produk, atau nama gudang.",
        placement: "bottom",
      },
      {
        target: "inventory-warehouse-filters",
        title: "Filter per Warehouse",
        content: "Klik pill gudang untuk filter stock pada warehouse tertentu saja. 'Semua Gudang' menampilkan total agregat.",
        placement: "bottom",
      },
    ],
  },

  // =====================================================================
  // Tour 6 - Admin Master Data  (admin)
  // =====================================================================
  adminMasterData: {
    id: "admin-master-data",
    name: "Manage Master Data",
    description: "Cara menambah produk, customer, warehouse baru",
    roles: ["admin"],
    steps: [
      {
        before: "nav-admin-button",
        target: "nav-admin-button",
        title: "Buka Admin Panel",
        content: "Modul Admin hanya bisa diakses oleh role Admin. Tour otomatis akan membuka halamannya.",
        placement: "right",
      },
      {
        before: "admin-tab-products-button",
        target: "admin-tab-products-button",
        title: "Tab Products",
        content: "Pilih tab Products untuk mengelola master produk. Tersedia juga tab Customer, Warehouse, UOM, Templates, Permissions, Audit, Users.",
        placement: "bottom",
      },
      {
        before: "toggle-admin-create-form-button",
        target: "toggle-admin-create-form-button",
        title: "Tampilkan Form Create",
        content: "Klik tombol ini untuk membuka form 'Create Product'. Klik lagi untuk menyembunyikan.",
        placement: "bottom",
      },
      {
        target: "admin-product-sku-input",
        title: "Isi Detail Produk",
        content: "Isi field SKU, nama, kategori, varian, warna, motif, grade, supplier, base unit, dan harga. Semua field wajib.",
        placement: "right",
        optional: true,
      },
      {
        target: "admin-create-product-button",
        title: "Simpan Produk",
        content: "Klik 'Simpan Product' untuk menyimpan ke master data. Produk akan langsung tersedia di POS dan inventory.",
        placement: "top",
        optional: true,
      },
    ],
  },

  // =====================================================================
  // Tour 7 - Order Dashboard  (admin, manager, sales)
  // =====================================================================
  orderDashboard: {
    id: "order-dashboard",
    name: "Order Dashboard & Analytics",
    description: "Cara gunakan dashboard untuk monitoring orders",
    roles: ["admin", "manager", "sales"],
    steps: [
      {
        before: "nav-orders-button",
        target: "nav-orders-button",
        title: "Buka Menu Orders",
        content: "Buka modul Orders dari sidebar.",
        placement: "right",
      },
      {
        before: "tab-dashboard",
        target: "tab-dashboard",
        title: "Tab Dashboard",
        content: "Pilih tab 'Dashboard & Analytics' untuk melihat ringkasan performa orders.",
        placement: "bottom",
      },
      {
        target: "dashboard-metric-revenue",
        title: "Key Metrics",
        content: "Kartu Revenue menampilkan total pendapatan dalam timeframe terpilih (7/30/90 hari). Di sebelahnya ada Pending, Expiring, dan Avg Order.",
        placement: "bottom",
      },
      {
        target: "dashboard-top-customers",
        title: "Top Customers",
        content: "Lihat customer mana yang paling banyak order dan total revenue mereka.",
        placement: "right",
      },
      {
        target: "dashboard-status-distribution",
        title: "Status Distribution",
        content: "Progress bar menampilkan distribusi orders per status. Berguna untuk mengidentifikasi bottleneck di flow approval/fulfillment.",
        placement: "left",
      },
    ],
  },
};

/**
 * Mengembalikan daftar tour yang boleh dilihat oleh role tertentu.
 */
export function getToursForRole(role) {
  if (!role) return [];
  const normalized = String(role).toLowerCase();
  return Object.entries(TOURS)
    .filter(([, tour]) => {
      if (!Array.isArray(tour.roles) || tour.roles.length === 0) return true;
      return tour.roles.includes(normalized);
    })
    .map(([key, tour]) => ({ key, ...tour }));
}

export function isTourCompleted(tourId) {
  return localStorage.getItem(`tour_completed_${tourId}`) === "true";
}

export function isTourSkipped(tourId) {
  return localStorage.getItem(`tour_skipped_${tourId}`) === "true";
}

export function resetTour(tourId) {
  localStorage.removeItem(`tour_completed_${tourId}`);
  localStorage.removeItem(`tour_skipped_${tourId}`);
}
