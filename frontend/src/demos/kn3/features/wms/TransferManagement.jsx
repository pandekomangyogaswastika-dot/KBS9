import { useEffect, useState } from "react";
import {
  Truck,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Package,
  Warehouse,
  FileText,
  AlertCircle,
} from "lucide-react";
import axios from "../../services/apiClient";
import { formatQty } from "../../utils/formatters";

/**
 * TransferManagement
 * 
 * Panel untuk mengelola transfer antar gudang dengan workflow:
 * draft → waiting_approval → approved → picking → staging → dispatched → completed
 */
export default function TransferManagement({ user }) {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    source_warehouse_id: "",
    dest_warehouse_id: "",
    items: [],
    notes: ""
  });
  const [newItem, setNewItem] = useState({ product_id: "", qty: 0, unit: "meter" });

  useEffect(() => {
    fetchTransfers();
    fetchMasterData();
  }, [filterStatus]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const response = await axios.get(`/api/transfers${params}`);
      setTransfers(response.data);
    } catch (error) {
      console.error("Error fetching transfers:", error);
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

  const handleCreateTransfer = async () => {
    if (!formData.source_warehouse_id || !formData.dest_warehouse_id) {
      alert("Pilih gudang source dan destination");
      return;
    }
    if (formData.items.length === 0) {
      alert("Tambahkan minimal 1 item");
      return;
    }

    try {
      await axios.post("/api/transfers", {
        ...formData,
        requested_by: user?.name || "User"
      });
      alert("Transfer berhasil dibuat");
      setShowCreateForm(false);
      setFormData({ source_warehouse_id: "", dest_warehouse_id: "", items: [], notes: "" });
      fetchTransfers();
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal membuat transfer");
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.qty <= 0) {
      alert("Pilih produk dan masukkan qty valid");
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem }]
    });
    setNewItem({ product_id: "", qty: 0, unit: "meter" });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleApprove = async (transferId) => {
    try {
      await axios.post(`/api/transfers/${transferId}/approve`, {
        approved_by: user?.name || "Manager"
      });
      alert("Transfer diapprove");
      fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal approve");
    }
  };

  const handleReject = async (transferId) => {
    const reason = prompt("Alasan reject:");
    if (!reason) return;

    try {
      await axios.post(`/api/transfers/${transferId}/reject`, {
        rejected_by: user?.name || "Manager",
        reason
      });
      alert("Transfer direject");
      fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal reject");
    }
  };

  const handleUpdateStatus = async (transferId, newStatus) => {
    try {
      await axios.post(`/api/transfers/${transferId}/status`, {
        status: newStatus,
        updated_by: user?.name || "Warehouse"
      });
      alert(`Status diupdate ke ${newStatus}`);
      fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal update status");
    }
  };

  const handleCancel = async (transferId) => {
    if (!confirm("Yakin ingin membatalkan transfer ini?")) return;

    try {
      await axios.delete(`/api/transfers/${transferId}`);
      alert("Transfer dibatalkan");
      fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal cancel");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "Draft", className: "bg-gray-200 text-gray-700" },
      waiting_approval: { label: "Waiting Approval", className: "bg-yellow-100 text-yellow-700" },
      approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
      picking: { label: "Picking", className: "bg-purple-100 text-purple-700" },
      staging: { label: "Staging", className: "bg-indigo-100 text-indigo-700" },
      dispatched: { label: "Dispatched", className: "bg-orange-100 text-orange-700" },
      completed: { label: "Completed", className: "bg-green-100 text-green-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
      cancelled: { label: "Cancelled", className: "bg-gray-300 text-gray-600" },
    };

    const badge = statusMap[status] || { label: status, className: "bg-gray-200 text-gray-700" };
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div data-testid="transfer-management-panel" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#007AFF]/10">
            <Truck className="text-[#007AFF]" size={20} />
          </div>
          <div>
            <h2 data-testid="panel-title" className="text-lg font-semibold text-[#000000]">
              Transfer Antar Gudang
            </h2>
            <p data-testid="panel-subtitle" className="text-sm text-[#3C3C43]">
              Kelola perpindahan inventory antar warehouse
            </p>
          </div>
        </div>
        <button
          data-testid="create-transfer-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-full px-4 py-2 text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Buat Transfer
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "waiting_approval", "approved", "picking", "staging", "dispatched", "completed"].map((status) => (
          <button
            key={status}
            data-testid={`filter-status-${status}`}
            onClick={() => setFilterStatus(status)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
              filterStatus === status
                ? "bg-[#007AFF] text-white"
                : "bg-white border border-[#E5E5EA] text-[#3C3C43] hover:border-[#007AFF]"
            }`}
          >
            {status === "all" ? "Semua" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div data-testid="create-transfer-form" className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-md font-semibold mb-4">Buat Transfer Baru</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#3C3C43] mb-2">Gudang Asal</label>
              <select
                data-testid="source-warehouse-select"
                value={formData.source_warehouse_id}
                onChange={(e) => setFormData({ ...formData, source_warehouse_id: e.target.value })}
                className="w-full bg-white/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Pilih Gudang</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3C3C43] mb-2">Gudang Tujuan</label>
              <select
                data-testid="dest-warehouse-select"
                value={formData.dest_warehouse_id}
                onChange={(e) => setFormData({ ...formData, dest_warehouse_id: e.target.value })}
                className="w-full bg-white/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Pilih Gudang</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Item */}
          <div className="bg-[#F2F2F7] rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold mb-3">Tambah Item</h4>
            <div className="grid grid-cols-[1fr_100px_100px_auto] gap-2">
              <select
                data-testid="item-product-select"
                value={newItem.product_id}
                onChange={(e) => setNewItem({ ...newItem, product_id: e.target.value })}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Pilih Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                ))}
              </select>
              <input
                data-testid="item-qty-input"
                type="number"
                placeholder="Qty"
                value={newItem.qty}
                onChange={(e) => setNewItem({ ...newItem, qty: parseFloat(e.target.value) || 0 })}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                data-testid="item-unit-input"
                type="text"
                placeholder="Unit"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <button
                data-testid="add-item-button"
                onClick={handleAddItem}
                className="bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Items ({formData.items.length})</h4>
              <div className="space-y-2">
                {formData.items.map((item, index) => {
                  const product = products.find((p) => p.id === item.product_id);
                  return (
                    <div key={index} data-testid={`item-row-${index}`} className="flex items-center justify-between bg-white rounded-lg p-2 border border-[#E5E5EA]">
                      <span className="text-sm">{product?.sku} - {product?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatQty(item.qty)} {item.unit}</span>
                        <button
                          data-testid={`remove-item-${index}`}
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#3C3C43] mb-2">Catatan (opsional)</label>
            <textarea
              data-testid="transfer-notes-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-white/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] rounded-xl px-3 py-2 text-sm"
              rows="2"
            />
          </div>

          <div className="flex gap-2">
            <button
              data-testid="submit-transfer-button"
              onClick={handleCreateTransfer}
              className="flex-1 bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-full px-6 py-2.5 font-medium"
            >
              Buat Transfer
            </button>
            <button
              data-testid="cancel-form-button"
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ source_warehouse_id: "", dest_warehouse_id: "", items: [], notes: "" });
              }}
              className="flex-1 bg-white border border-[#E5E5EA] hover:border-[#007AFF] text-[#3C3C43] rounded-full px-6 py-2.5 font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Transfers List */}
      <div className="grid gap-3">
        {loading ? (
          <div className="text-center py-8 text-[#3C3C43]">Loading...</div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-8 text-[#3C3C43]">
            <AlertCircle size={48} className="mx-auto mb-2 text-gray-400" />
            <p>Tidak ada transfer</p>
          </div>
        ) : (
          transfers.map((transfer) => (
            <div
              key={transfer.id}
              data-testid={`transfer-card-${transfer.id}`}
              className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTransfer(transfer)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#007AFF]/10">
                    <Package className="text-[#007AFF]" size={18} />
                  </div>
                  <div>
                    <p data-testid={`transfer-code-${transfer.id}`} className="text-sm font-bold text-[#007AFF]">
                      {transfer.code}
                    </p>
                    <p data-testid={`transfer-route-${transfer.id}`} className="text-xs text-[#3C3C43]">
                      {transfer.source_warehouse_name} <ArrowRight size={12} className="inline" /> {transfer.dest_warehouse_name}
                    </p>
                  </div>
                </div>
                {getStatusBadge(transfer.status)}
              </div>

              <div className="text-xs text-[#3C3C43] space-y-1">
                <p><span className="font-semibold">Items:</span> {transfer.items?.length || 0}</p>
                <p><span className="font-semibold">Requested by:</span> {transfer.requested_by}</p>
                {transfer.approved_by && <p><span className="font-semibold">Approved by:</span> {transfer.approved_by}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedTransfer && (
        <div
          data-testid="transfer-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedTransfer(null)}
        >
          <div
            className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detail Transfer</h3>
                <button onClick={() => setSelectedTransfer(null)}>
                  <XCircle size={20} className="text-[#3C3C43]" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F2F2F7] rounded-lg p-3">
                    <p className="text-xs text-[#3C3C43] mb-1">Code</p>
                    <p className="font-semibold">{selectedTransfer.code}</p>
                  </div>
                  <div className="bg-[#F2F2F7] rounded-lg p-3">
                    <p className="text-xs text-[#3C3C43] mb-1">Status</p>
                    {getStatusBadge(selectedTransfer.status)}
                  </div>
                  <div className="bg-[#F2F2F7] rounded-lg p-3">
                    <p className="text-xs text-[#3C3C43] mb-1">Gudang Asal</p>
                    <p className="font-semibold text-sm">{selectedTransfer.source_warehouse_name}</p>
                  </div>
                  <div className="bg-[#F2F2F7] rounded-lg p-3">
                    <p className="text-xs text-[#3C3C43] mb-1">Gudang Tujuan</p>
                    <p className="font-semibold text-sm">{selectedTransfer.dest_warehouse_name}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedTransfer.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#F2F2F7] rounded-lg p-2">
                        <div>
                          <p className="text-sm font-semibold">{item.sku} - {item.product_name}</p>
                        </div>
                        <p className="text-sm font-bold">{formatQty(item.qty)} {item.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedTransfer.status === "waiting_approval" && user?.role === "manager" && (
                    <>
                      <button
                        data-testid="approve-transfer-button"
                        onClick={() => handleApprove(selectedTransfer.id)}
                        className="flex items-center gap-2 bg-[#34C759] hover:bg-[#28A745] text-white rounded-full px-4 py-2 text-sm font-medium"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        data-testid="reject-transfer-button"
                        onClick={() => handleReject(selectedTransfer.id)}
                        className="flex items-center gap-2 bg-[#FF3B30] hover:bg-[#DC3545] text-white rounded-full px-4 py-2 text-sm font-medium"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                  {selectedTransfer.status === "approved" && (
                    <button
                      data-testid="start-picking-button"
                      onClick={() => handleUpdateStatus(selectedTransfer.id, "picking")}
                      className="bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-full px-4 py-2 text-sm font-medium"
                    >
                      Start Picking
                    </button>
                  )}
                  {selectedTransfer.status === "picking" && (
                    <button
                      data-testid="move-to-staging-button"
                      onClick={() => handleUpdateStatus(selectedTransfer.id, "staging")}
                      className="bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-full px-4 py-2 text-sm font-medium"
                    >
                      Move to Staging
                    </button>
                  )}
                  {selectedTransfer.status === "staging" && (
                    <button
                      data-testid="dispatch-button"
                      onClick={() => handleUpdateStatus(selectedTransfer.id, "dispatched")}
                      className="bg-[#007AFF] hover:bg-[#0056B3] text-white rounded-full px-4 py-2 text-sm font-medium"
                    >
                      Dispatch
                    </button>
                  )}
                  {selectedTransfer.status === "dispatched" && (
                    <button
                      data-testid="complete-transfer-button"
                      onClick={() => handleUpdateStatus(selectedTransfer.id, "completed")}
                      className="bg-[#34C759] hover:bg-[#28A745] text-white rounded-full px-4 py-2 text-sm font-medium"
                    >
                      Complete Transfer
                    </button>
                  )}
                  {!["completed", "rejected", "cancelled"].includes(selectedTransfer.status) && (
                    <button
                      data-testid="cancel-transfer-button"
                      onClick={() => handleCancel(selectedTransfer.id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-full px-4 py-2 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
