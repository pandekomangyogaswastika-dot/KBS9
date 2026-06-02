/**
 * useKN3DemoActions.js — business logic hook untuk KN3 Demo.
 * Identik dengan KN3's useAppActions tapi:
 * - Tanpa login/logout (session sudah dihandle sebelumnya)
 * - Auto-init dengan sessionId
 * - API mengarah ke /api/demo/kn3/
 */
import { useCallback, useEffect } from "react";
import axios, { API, setAuthToken } from "../services/apiClient";
import { defaultViewForRole } from "../config/navigationConfig";
import { formatQty } from "../utils/formatters";

export function useKN3DemoActions(state) {
  const {
    sessionId, user, auditFilters, selectedCustomer, selectedAddress, cart, data,
    setActiveView, setNotice, setData, setTemplates, setUoms,
    setMovements, setTasks, setUsers, setPermissions, setAuditLogs,
    setSelectedCustomer, setSelectedAddress, setSelectedProduct, setBreakdown,
    setCart, setLastDocument, setLastLabel, setPreviewHtml,
    setActiveDetail, setLoading,
  } = state;

  // Set demo session token pada axios default headers
  useEffect(() => {
    if (sessionId) setAuthToken(sessionId);
  }, [sessionId]);

  const showMetricDetail = (type) => {
    const metric = data.metrics || {};
    const details = {
      products: { title: "Produk Aktif", body: "Klik ini membawa Anda ke Sales POS untuk inspect produk dan stok per gudang.", target: "sales", cta: "Buka Sales POS", facts: [{ label: "Total produk", value: metric.products || 0 }, { label: "Next step", value: "Review katalog & stock breakdown" }] },
      available: { title: "Available Stock", body: "Stok yang masih bisa dijual setelah reserved quantity dikurangi.", target: "sales", cta: "Lihat stok produk", facts: [{ label: "Available qty", value: formatQty(metric.available_qty) }, { label: "Guidance", value: "Prioritaskan item low stock" }] },
      reserved: { title: "Reserved Stock", body: "Stok yang sedang dibooking oleh sales order dan akan unlock jika expired/cancelled.", target: "orders", cta: "Review orders", facts: [{ label: "Reserved qty", value: formatQty(metric.reserved_qty) }, { label: "Kontrol", value: "Cek aging & approval" }] },
      orders: { title: "Active Orders", body: "Order aktif membutuhkan approval, confirmation, WMS fulfillment, atau payment simulation.", target: "orders", cta: "Buka order room", facts: [{ label: "Active orders", value: metric.active_orders || 0 }, { label: "Next step", value: "Approve/confirm jika pending" }] },
      warehouses: { title: "Gudang Aktif", body: "Klik untuk masuk WMS dan melihat struktur gudang, bins, task scan, dan movement ledger.", target: "operations", cta: "Buka WMS", facts: [{ label: "Jumlah gudang", value: metric.warehouses || 0 }, { label: "Guidance", value: "Review task scanner" }] },
    };
    setActiveDetail(details[type]);
    if (["products", "available"].includes(type)) setActiveView("sales");
    if (["reserved", "orders"].includes(type)) setActiveView("orders");
    if (type === "warehouses") setActiveView("operations");
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, tpls, uomResp] = await Promise.all([
        axios.get(`${API}/dashboard`).catch(() => ({ data: { products: [], customers: [], orders: [], warehouses: [], metrics: {} } })),
        axios.get(`${API}/document-templates`).catch(() => ({ data: [] })),
        axios.get(`${API}/uoms`).catch(() => ({ data: [] })),
      ]);
      setData({
        products: dash.data.products || [],
        customers: dash.data.customers || [],
        orders: dash.data.orders || [],
        warehouses: dash.data.warehouses || [],
        metrics: dash.data.metrics || {},
      });
      setTemplates(Array.isArray(tpls.data) ? tpls.data : []);
      setUoms(Array.isArray(uomResp.data) ? uomResp.data : []);
    } catch (err) {
      setNotice("Gagal memuat data demo.");
    } finally {
      setLoading(false);
    }
  }, [setData, setTemplates, setUoms, setLoading, setNotice]);

  // Init demo session — set token + load data
  const initDemo = useCallback(async () => {
    setAuthToken(sessionId);
    await loadAll();
  }, [sessionId, loadAll]);

  const loadTasks = useCallback(async () => {
    try {
      const [inboundRes, outboundRes] = await Promise.all([
        axios.get(`${API}/wms/inbound-tasks`).catch(() => ({ data: [] })),
        axios.get(`${API}/wms/outbound-tasks`).catch(() => ({ data: [] })),
      ]);
      setTasks([...(inboundRes.data || []), ...(outboundRes.data || [])]);
    } catch (_) {}
  }, [setTasks]);

  const loadMovements = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/inventory/movements`);
      setMovements(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
  }, [setMovements]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const params = Object.fromEntries(Object.entries(auditFilters).filter(([, v]) => v));
      const res = await axios.get(`${API}/admin/audit-logs`, { params });
      setAuditLogs(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
  }, [auditFilters, setAuditLogs]);

  // --- Product actions ---
  const createProduct = async (payload) => {
    await axios.post(`${API}/products`, payload);
    await loadAll();
    setNotice("Produk berhasil ditambahkan.");
  };
  const updateProduct = async (id, payload) => {
    await axios.put(`${API}/products/${id}`, payload);
    await loadAll();
    setNotice("Produk diperbarui.");
  };
  const deleteProduct = async (id) => {
    await axios.delete(`${API}/products/${id}`);
    await loadAll();
    setNotice("Produk dihapus.");
  };

  // --- Customer actions ---
  const createCustomer = async (payload) => {
    await axios.post(`${API}/customers`, payload);
    await loadAll();
    setNotice("Pelanggan ditambahkan.");
  };
  const updateCustomer = async (id, payload) => {
    await axios.put(`${API}/customers/${id}`, payload);
    await loadAll();
    setNotice("Pelanggan diperbarui.");
  };
  const deleteCustomer = async (id) => {
    await axios.delete(`${API}/customers/${id}`);
    await loadAll();
    setNotice("Pelanggan dihapus.");
  };

  // --- Warehouse actions ---
  const createWarehouse = async (payload) => {
    await axios.post(`${API}/warehouses`, payload);
    await loadAll();
    setNotice("Gudang ditambahkan.");
  };
  const updateWarehouse = async (id, payload) => {
    await axios.put(`${API}/warehouses/${id}`, payload);
    await loadAll();
    setNotice("Gudang diperbarui.");
  };
  const deleteWarehouse = async (id) => {
    await axios.delete(`${API}/warehouses/${id}`);
    await loadAll();
    setNotice("Gudang dihapus.");
  };

  // --- Cart & Order actions ---
  const addToCart = (item) => setCart(prev => {
    const existing = prev.find(c => c.product_id === item.product_id && c.warehouse_id === item.warehouse_id);
    if (existing) return prev.map(c => c.product_id === item.product_id && c.warehouse_id === item.warehouse_id ? { ...c, quantity: c.quantity + item.quantity } : c);
    return [...prev, item];
  });
  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));
  const clearCart = () => setCart([]);

  const saveOrder = async (payload) => {
    const res = await axios.post(`${API}/sales-orders`, payload);
    clearCart();
    await loadAll();
    setNotice(`Order ${res.data.number} berhasil dibuat.`);
    return res.data;
  };

  const confirmOrder = async (id) => {
    await axios.post(`${API}/sales-orders/${id}/confirm`);
    await loadAll();
    setNotice("Order dikonfirmasi.");
  };
  const approveOrder = async (id) => {
    await axios.post(`${API}/sales-orders/${id}/approve`);
    await loadAll();
    setNotice("Order disetujui.");
  };
  const cancelOrder = async (id) => {
    await axios.post(`${API}/sales-orders/${id}/cancel`);
    await loadAll();
    setNotice("Order dibatalkan.");
  };
  const rejectOrder = async (id) => {
    await axios.post(`${API}/sales-orders/${id}/reject`);
    await loadAll();
    setNotice("Order ditolak.");
  };
  const deliverOrder = async (id) => {
    await axios.post(`${API}/sales-orders/${id}/deliver`);
    await loadAll();
    setNotice("Order terkirim.");
  };
  const updateOrderStatus = async (id, status, note) => {
    await axios.patch(`${API}/sales-orders/${id}`, { status, note });
    await loadAll();
    setNotice(`Status order diperbarui ke ${status}.`);
  };

  // --- WMS actions ---
  const scanTask = async (taskId, scanData) => {
    await axios.post(`${API}/wms/tasks/${taskId}/scan`, scanData);
    await loadTasks();
    setNotice("Scan berhasil dicatat.");
  };
  const completeTask = async (taskId) => {
    await axios.post(`${API}/wms/tasks/${taskId}/complete`);
    await Promise.all([loadTasks(), loadAll()]);
    setNotice("Task WMS selesai.");
  };
  const receiveInbound = async (payload) => {
    const res = await axios.post(`${API}/inbound/receive`, payload);
    await Promise.all([loadTasks(), loadAll()]);
    setNotice("Barang masuk berhasil diproses.");
    return res.data;
  };
  const pickOutbound = async (payload) => {
    const res = await axios.post(`${API}/outbound/pick`, payload);
    await Promise.all([loadTasks(), loadAll()]);
    setNotice("Picking berhasil diproses.");
    return res.data;
  };

  // --- Admin actions ---
  const updatePermissions = async (matrix) => {
    await axios.put(`${API}/admin/permissions`, { matrix });
    const res = await axios.get(`${API}/admin/permissions`);
    setPermissions(res.data);
    setNotice("Permissions diperbarui.");
  };
  const updateUom = async (id, payload) => {
    await axios.put(`${API}/uoms/${id}`, payload);
    const res = await axios.get(`${API}/uoms`);
    setUoms(res.data);
    setNotice("UOM diperbarui.");
  };
  const createUom = async (payload) => {
    await axios.post(`${API}/uoms`, payload);
    const res = await axios.get(`${API}/uoms`);
    setUoms(res.data);
    setNotice("UOM ditambahkan.");
  };

  return {
    initDemo, loadAll, loadTasks, loadMovements, loadAuditLogs,
    showMetricDetail,
    createProduct, updateProduct, deleteProduct,
    createCustomer, updateCustomer, deleteCustomer,
    createWarehouse, updateWarehouse, deleteWarehouse,
    addToCart, removeFromCart, clearCart,
    saveOrder, confirmOrder, approveOrder, cancelOrder, rejectOrder,
    deliverOrder, updateOrderStatus,
    scanTask, completeTask, receiveInbound, pickOutbound,
    updatePermissions, updateUom, createUom,
    setLastDocument, setLastLabel, setPreviewHtml,
  };
}
