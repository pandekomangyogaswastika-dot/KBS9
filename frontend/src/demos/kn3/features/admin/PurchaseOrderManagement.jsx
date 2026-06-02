import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Eye,
} from "lucide-react";
import axios from "../../services/apiClient";
import { formatCurrency } from "../../utils/formatters";

/**
 * PurchaseOrderManagement
 * 
 * Manage Purchase Orders for inbound receiving workflow.
 * Create PO → Auto-create inbound tasks → Staff scan & receive.
 */
export default function PurchaseOrderManagement({ user }) {
  const [pos, setPos] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_contact: "",
    warehouse_id: "",
    items: [],
    expected_delivery_date: "",
    notes: "",
    created_by: user?.name || "Admin"
  });
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: 0,
    unit: "meter",
    price: 0
  });

  useEffect(() => {
    fetchPOs();
    fetchMasterData();
  }, []);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/purchase-orders");
      setPos(response.data);
    } catch (error) {
      console.error("Error fetching POs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        axios.get("/api/products"),
        axios.get("/api/warehouses")
      ]);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  const handleCreatePO = async () => {
    if (!formData.supplier_name || !formData.warehouse_id) {
      alert("Supplier name dan warehouse wajib diisi");
      return;
    }
    if (formData.items.length === 0) {
      alert("Tambahkan minimal 1 item");
      return;
    }

    try {
      await axios.post("/api/purchase-orders", formData);
      alert("Purchase Order berhasil dibuat & inbound tasks telah dibuat otomatis!");
      setShowCreateForm(false);
      setFormData({
        supplier_name: "",
        supplier_contact: "",
        warehouse_id: "",
        items: [],
        expected_delivery_date: "",
        notes: "",
        created_by: user?.name || "Admin"
      });
      fetchPOs();
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal membuat PO");
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.quantity <= 0) {
      alert("Pilih produk dan masukkan qty valid");
      return;
    }
    const product = products.find(p => p.id === newItem.product_id);
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...newItem,
          price: newItem.price > 0 ? newItem.price : product?.price || 0
        }
      ]
    });
    setNewItem({ product_id: "", quantity: 0, unit: "meter", price: 0 });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleViewDetail = async (poId) => {
    try {
      const response = await axios.get(`/api/purchase-orders/${poId}`);
      setSelectedPO(response.data);
    } catch (error) {
      alert("Gagal load PO detail");
    }
  };

  const handleCancelPO = async (poId) => {
    if (!confirm("Yakin ingin membatalkan PO ini?")) return;

    try {
      await axios.post(`/api/purchase-orders/${poId}/cancel`);
      alert("PO berhasil dibatalkan");
      fetchPOs();
      setSelectedPO(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal cancel PO");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
      receiving: { label: "Receiving", cls: "bg-blue-100 text-blue-700" },
      completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
      partial: { label: "Partial", cls: "bg-orange-100 text-orange-700" },
      cancelled: { label: "Cancelled", cls: "bg-gray-200 text-gray-500" },
    };
    const b = statusMap[status] || { label: status, cls: "bg-gray-200 text-gray-700" };
    return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${b.cls}`}>{b.label}</span>;
  };

  return (
    <div data-testid="po-management-panel">
      {/* Top bar */}
      <div className="section-card mb-3">
        <div className="section-head">
          <div className="flex items-center gap-2 min-w-0">
            <span className="kicker">Purchasing</span>
            <h2 data-testid="panel-title">Purchase Orders</h2>
          </div>
          <button data-testid="create-po-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="primary-button">
            <Plus size={13} /> {showCreateForm ? "Tutup Form" : "Buat PO"}
          </button>
        </div>
      </div>

      {/* Create Form - collapsible */}
      {showCreateForm && (
        <div data-testid="create-po-form" className="section-card mb-3">
          <div className="section-head">
            <h2 className="text-[13px] font-bold">Buat Purchase Order Baru</h2>
          </div>
          <div className="section-body space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-semibold text-[#6B6B73] mb-1">Supplier Name *</label>
                <input data-testid="supplier-name-input" type="text" value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="field" placeholder="PT Supplier Textile" />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-[#6B6B73] mb-1">Supplier Contact</label>
                <input data-testid="supplier-contact-input" type="text" value={formData.supplier_contact}
                  onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                  className="field" placeholder="081234567890" />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-[#6B6B73] mb-1">Warehouse *</label>
                <select data-testid="warehouse-select" value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className="field">
                  <option value="">Pilih Warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-[#6B6B73] mb-1">Expected Delivery</label>
                <input data-testid="delivery-date-input" type="date" value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  className="field" />
              </div>
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-[#6B6B73] mb-1">Notes</label>
              <textarea data-testid="po-notes-input" value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="field" rows="2" placeholder="Catatan tambahan..." />
            </div>

            {/* Add Item row */}
            <div className="bg-[#FAFBFC] rounded-md border border-[#EFF0F2] p-2.5">
              <p className="text-[10.5px] font-bold uppercase text-[#6B6B73] mb-2">Tambah Item</p>
              <div className="grid grid-cols-[1fr_80px_60px_100px_auto] gap-2">
                <select data-testid="item-product-select" value={newItem.product_id}
                  onChange={(e) => setNewItem({ ...newItem, product_id: e.target.value })}
                  className="field">
                  <option value="">Pilih Produk</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
                <input data-testid="item-qty-input" type="number" placeholder="Qty"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                  className="field" />
                <input data-testid="item-unit-input" type="text" placeholder="Unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="field" />
                <input data-testid="item-price-input" type="number" placeholder="Harga"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                  className="field" />
                <button data-testid="add-item-button" onClick={handleAddItem}
                  className="primary-button !px-3">
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Items list */}
            {formData.items.length > 0 && (
              <div className="rounded-md border border-[#EFF0F2] overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px_30px] px-2.5 py-1.5 bg-[#FAFBFC] text-[10px] font-bold uppercase text-[#6B6B73] border-b border-[#EFF0F2]">
                  <span>Produk</span><span>Qty</span><span>Harga</span><span></span>
                </div>
                {formData.items.map((item, i) => {
                  const p = products.find(p => p.id === item.product_id);
                  return (
                    <div key={i} data-testid={`po-item-row-${i}`} className="grid grid-cols-[1fr_80px_80px_30px] items-center px-2.5 py-1.5 border-b border-[#EFF0F2] last:border-0 text-[11.5px]">
                      <span className="truncate">{p?.sku} — {p?.name}</span>
                      <span className="font-semibold">{item.quantity} {item.unit}</span>
                      <span>{formatCurrency(item.price)}</span>
                      <button data-testid={`remove-item-${i}`} onClick={() => handleRemoveItem(i)} className="text-red-400 hover:text-red-600">
                        <XCircle size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button data-testid="submit-po-button" onClick={handleCreatePO}
                className="flex-1 primary-button justify-center">
                Buat PO & Auto-create Inbound Tasks
              </button>
              <button data-testid="cancel-form-button"
                onClick={() => { setShowCreateForm(false); setFormData({ supplier_name: "", supplier_contact: "", warehouse_id: "", items: [], expected_delivery_date: "", notes: "", created_by: user?.name || "Admin" }); }}
                className="secondary-button">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-panel: PO table + detail */}
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        {/* PO Table */}
        <div className="section-card">
          <div className="overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_120px_90px_60px] px-3 py-1.5 bg-[#FAFBFC] text-[10px] font-bold uppercase text-[#6B6B73] border-b border-[#EFF0F2]">
              <span>Nomor</span><span>Supplier</span><span>Gudang</span><span>Items</span><span>Status</span>
            </div>
            {loading ? (
              <div className="py-8 text-center text-[12px] text-[#6B6B73]">Loading...</div>
            ) : pos.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-[#6B6B73]">
                <Package className="mx-auto mb-2 text-gray-300" size={28} />
                <p>Belum ada Purchase Order</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EFF0F2] max-h-[560px] overflow-y-auto">
                {pos.map((po) => (
                  <div key={po.id} data-testid={`po-card-${po.id}`}
                    className={`grid grid-cols-[60px_1fr_120px_90px_60px] items-center px-3 py-2.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors ${selectedPO?.id === po.id ? 'bg-[#EFF4FF] border-l-2 border-[#007AFF]' : ''}`}
                    onClick={() => handleViewDetail(po.id)}>
                    <p data-testid={`po-number-${po.id}`} className="text-[12px] font-bold text-[#007AFF]">{po.po_number}</p>
                    <div className="min-w-0">
                      <p data-testid={`po-supplier-${po.id}`} className="text-[11.5px] font-semibold truncate">{po.supplier_name}</p>
                      <p className="text-[10.5px] text-[#6B6B73]">{formatCurrency(po.total_amount)}</p>
                    </div>
                    <p className="text-[11px] text-[#3C3C43] truncate">{po.warehouse_name}</p>
                    <p className="text-[11.5px] text-[#6B6B73]">{po.items?.length || 0} item</p>
                    {getStatusBadge(po.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PO Detail Panel */}
        {selectedPO ? (
          <div className="section-card self-start">
            <div className="section-head">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-[#0058CC]">{selectedPO.po_number}</p>
                <div className="mt-0.5">{getStatusBadge(selectedPO.status)}</div>
              </div>
              <button className="icon-button" onClick={() => setSelectedPO(null)}><XCircle size={14} /></button>
            </div>
            <div className="section-body space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <div className="rounded-md border border-[#EFF0F2] bg-[#FAFBFC] p-2">
                  <p className="text-[10px] text-[#6B6B73] uppercase font-semibold mb-0.5">Supplier</p>
                  <p className="font-semibold">{selectedPO.supplier_name}</p>
                  <p className="text-[10.5px] text-[#6B6B73]">{selectedPO.supplier_contact}</p>
                </div>
                <div className="rounded-md border border-[#EFF0F2] bg-[#FAFBFC] p-2">
                  <p className="text-[10px] text-[#6B6B73] uppercase font-semibold mb-0.5">Gudang</p>
                  <p className="font-semibold">{selectedPO.warehouse_name}</p>
                  <p className="text-[10.5px] text-[#6B6B73]">{selectedPO.warehouse_city}</p>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-md border border-[#EFF0F2] overflow-hidden">
                <div className="px-2.5 py-1.5 bg-[#FAFBFC] text-[10px] font-bold uppercase text-[#6B6B73] border-b border-[#EFF0F2]">Items ({selectedPO.items?.length || 0})</div>
                {selectedPO.items?.map((item, i) => (
                  <div key={i} className="px-2.5 py-1.5 border-b border-[#EFF0F2] last:border-0 text-[11px]">
                    <div className="flex justify-between">
                      <p className="font-semibold truncate">{item.sku}</p>
                      <p className="font-bold">{formatCurrency(item.subtotal || 0)}</p>
                    </div>
                    <p className="text-[10.5px] text-[#6B6B73]">
                      Expected: {item.quantity} {item.unit} · Rcv: {item.received_qty || 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* Inbound Tasks */}
              {selectedPO.inbound_tasks?.length > 0 && (
                <div className="rounded-md border border-[#EFF0F2] overflow-hidden">
                  <div className="px-2.5 py-1.5 bg-[#FAFBFC] text-[10px] font-bold uppercase text-[#6B6B73] border-b border-[#EFF0F2]">Inbound Tasks</div>
                  {selectedPO.inbound_tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#EFF0F2] last:border-0">
                      <div>
                        <p className="text-[11.5px] font-semibold">{task.sku}</p>
                        <p className="text-[10.5px] text-[#6B6B73]">Rcv: {task.received_qty || 0}/{task.expected_qty}</p>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-1.5">
                {selectedPO.status === 'completed' && (
                  <button data-testid="view-receiving-goods-doc"
                    onClick={() => window.open(`/api/inbound/po/${selectedPO.id}/receiving-goods-document`, '_blank')}
                    className="primary-button justify-center">
                    <FileText size={13} /> Receiving Goods Document
                  </button>
                )}
                {['pending', 'receiving'].includes(selectedPO.status) && (
                  <button data-testid="cancel-po-button"
                    onClick={() => handleCancelPO(selectedPO.id)}
                    className="danger-button justify-center">
                    Cancel PO
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="section-card flex items-center justify-center min-h-[200px] border-dashed">
            <div className="text-center p-6">
              <FileText size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-[12px] text-[#6B6B73]">Pilih PO untuk lihat detail</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
