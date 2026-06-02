/**
 * InventoryStockView — WMS Stock Tab
 * Shows live inventory balances (product × warehouse) with:
 * - Warehouse filter pills
 * - Low-stock highlighting
 * - Movement history side panel on row click
 * - Initial stock form
 */
import { useEffect, useState } from "react";
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  BarChart2, Plus, X, History, Layers, MapPin, RefreshCw, Search,
} from "lucide-react";
import axios from "../../services/apiClient";

const formatQty = (v) => {
  if (v === undefined || v === null) return "0";
  return Number(v).toLocaleString("id-ID", { maximumFractionDigits: 2 });
};
const formatCurrency = (v) =>
  `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const MOV_TYPE_MAP = {
  initial_stock:       { label: "Initial Stock",       color: "text-gray-600",  dot: "bg-gray-400" },
  inbound_receiving:   { label: "Inbound Receiving",   color: "text-green-700", dot: "bg-green-500" },
  outbound_dispatch:   { label: "Outbound Dispatch",   color: "text-red-600",   dot: "bg-red-500" },
  transfer_out:        { label: "Transfer Out",        color: "text-orange-600",dot: "bg-orange-400" },
  transfer_in:         { label: "Transfer In",         color: "text-blue-600",  dot: "bg-blue-500" },
  cycle_count_adjust:  { label: "Cycle Count Adj.",    color: "text-purple-600",dot: "bg-purple-400" },
};

export default function InventoryStockView({ warehouses = [], products = [], user }) {
  const [balances, setBalances]       = useState([]);
  const [movements, setMovements]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);   // { product_id, product_name, sku }
  const [history, setHistory]         = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [stockForm, setStockForm]     = useState({
    product_id: "", warehouse_id: "", quantity: 0, unit: "meter",
    batch: "", lot: "", roll_id: "",
  });
  const [submitting, setSubmitting]   = useState(false);
  const [tab, setTab]                 = useState("balances"); // balances | ledger

  useEffect(() => { fetchBalances(); }, []);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const [b, m] = await Promise.all([
        axios.get("/api/inventory/balances"),
        axios.get("/api/inventory/movements"),
      ]);
      setBalances(b.data);
      setMovements(m.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchHistory = async (productId) => {
    setHistLoading(true);
    try {
      const r = await axios.get(`/api/history/${productId}`);
      setHistory(r.data);
    } catch { setHistory([]); }
    finally { setHistLoading(false); }
  };

  const handleRowClick = (row) => {
    if (selectedRow?.id === row.id) { setSelectedRow(null); setHistory([]); return; }
    setSelectedRow(row);
    fetchHistory(row.product_id);
  };

  const handleAddInitialStock = async () => {
    if (!stockForm.product_id || !stockForm.warehouse_id || stockForm.quantity <= 0)
      return alert("Produk, gudang, dan qty wajib diisi");
    setSubmitting(true);
    try {
      await axios.post("/api/inventory/initial-stock", stockForm);
      setShowStockForm(false);
      setStockForm({ product_id: "", warehouse_id: "", quantity: 0, unit: "meter", batch: "", lot: "", roll_id: "" });
      fetchBalances();
    } catch (e) { alert(e.response?.data?.detail || "Gagal tambah stok"); }
    finally { setSubmitting(false); }
  };

  const filteredBalances = balances
    .filter(b => warehouseFilter === "all" || b.warehouse_id === warehouseFilter)
    .filter(b => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.sku?.toLowerCase().includes(q) ||
        b.product_name?.toLowerCase().includes(q) ||
        b.warehouse_name?.toLowerCase().includes(q) ||
        b.warehouse_city?.toLowerCase().includes(q)
      );
    });

  const filteredMovements = movements
    .filter(m => warehouseFilter === "all" || m.warehouse_id === warehouseFilter)
    .filter(m => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const prod = balances.find(b => b.product_id === m.product_id);
      return (
        prod?.sku?.toLowerCase().includes(q) ||
        prod?.product_name?.toLowerCase().includes(q) ||
        m.source_document?.toLowerCase().includes(q)
      );
    });

  // Stock status
  const stockStatus = (b) => {
    if (b.available_qty <= 0) return "empty";
    if (b.available_qty < 100) return "low";
    return "ok";
  };

  const ROW_CLASSES = {
    ok:    "hover:bg-[#FAFBFC]",
    low:   "bg-amber-50 hover:bg-amber-100",
    empty: "bg-red-50 hover:bg-red-100",
  };

  const STATUS_BADGE = {
    ok:    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700">OK</span>,
    low:   <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 flex items-center gap-1"><AlertTriangle size={9} />Rendah</span>,
    empty: <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">Habis</span>,
  };

  // Summary cards
  const totalOnHand   = filteredBalances.reduce((s, b) => s + (b.on_hand_qty || 0), 0);
  const totalAvail    = filteredBalances.reduce((s, b) => s + (b.available_qty || 0), 0);
  const totalReserved = filteredBalances.reduce((s, b) => s + (b.reserved_qty || 0), 0);
  const lowCount      = filteredBalances.filter(b => stockStatus(b) === "low").length;

  return (
    <div data-testid="inventory-stock-view" className="flex flex-col gap-3">

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total On Hand",  value: formatQty(totalOnHand),   icon: Layers,      color: "text-[#007AFF]", bg: "bg-[#EFF4FF]" },
          { label: "Available",      value: formatQty(totalAvail),    icon: TrendingUp,  color: "text-[#34C759]", bg: "bg-green-50" },
          { label: "Reserved",       value: formatQty(totalReserved), icon: TrendingDown,color: "text-[#FF9500]", bg: "bg-orange-50" },
          { label: "Stok Rendah",    value: lowCount,                 icon: AlertTriangle,color:"text-red-500",   bg: "bg-red-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border border-[#EFF0F2] p-3 flex items-center gap-2.5 ${bg}`}>
            <div className={`rounded-lg p-1.5 ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-[10px] text-[#6B6B73] font-semibold uppercase">{label}</p>
              <p className={`text-[16px] font-bold leading-tight ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 rounded-lg border border-[#E5E5EA] bg-white px-3 py-2">
        <Search size={14} className="text-[#6B6B73]" />
        <input
          type="text"
          data-testid="inventory-search-input"
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#8E8E93]"
          placeholder="Cari SKU, nama produk, gudang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="text-[#6B6B73] hover:text-black">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Warehouse filter + tabs + actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Warehouse pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto" data-testid="inventory-warehouse-filters">
          <button onClick={() => setWarehouseFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${warehouseFilter === "all" ? "bg-[#007AFF] text-white" : "bg-white border border-[#E5E5EA] text-[#6B6B73] hover:border-[#007AFF]"}`}>
            Semua Gudang
          </button>
          {warehouses.map(wh => (
            <button key={wh.id} onClick={() => setWarehouseFilter(wh.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${warehouseFilter === wh.id ? "bg-[#007AFF] text-white" : "bg-white border border-[#E5E5EA] text-[#6B6B73] hover:border-[#007AFF]"}`}>
              <MapPin size={9} className="inline mr-1" />{wh.city}
            </button>
          ))}
        </div>
        {/* View tab toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-[#E5E5EA] p-0.5 bg-white">
          <button onClick={() => setTab("balances")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${tab === "balances" ? "bg-[#007AFF] text-white" : "text-[#6B6B73]"}`}>
            <BarChart2 size={11} /> Stok
          </button>
          <button onClick={() => setTab("ledger")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${tab === "ledger" ? "bg-[#007AFF] text-white" : "text-[#6B6B73]"}`}>
            <History size={11} /> Ledger
          </button>
        </div>
        <button onClick={() => fetchBalances()} className="p-1.5 rounded-lg border border-[#E5E5EA] text-[#6B6B73] hover:bg-[#FAFBFC]">
          <RefreshCw size={13} />
        </button>
        {["admin", "manager"].includes(user?.role) && (
          <button onClick={() => setShowStockForm(!showStockForm)}
            className="flex items-center gap-1.5 rounded-lg bg-[#34C759] hover:bg-[#28A745] text-white px-3 py-1.5 text-[12px] font-semibold">
            <Plus size={12} /> Tambah Stok
          </button>
        )}
      </div>

      {/* Add stock form */}
      {showStockForm && (
        <div className="rounded-xl border border-[#E5E5EA] bg-white p-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[12px] font-bold">Tambah Initial Stock</p>
            <button onClick={() => setShowStockForm(false)}><X size={13} className="text-[#6B6B73]" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold text-[#6B6B73] mb-1">Produk *</label>
              <select value={stockForm.product_id} onChange={e => setStockForm({ ...stockForm, product_id: e.target.value })} className="field">
                <option value="">Pilih produk...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#6B6B73] mb-1">Gudang *</label>
              <select value={stockForm.warehouse_id} onChange={e => setStockForm({ ...stockForm, warehouse_id: e.target.value })} className="field">
                <option value="">Pilih gudang...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#6B6B73] mb-1">Qty *</label>
              <input type="number" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: parseFloat(e.target.value) || 0 })} className="field" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#6B6B73] mb-1">Unit</label>
              <input type="text" value={stockForm.unit} onChange={e => setStockForm({ ...stockForm, unit: e.target.value })} className="field" placeholder="meter" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#6B6B73] mb-1">Batch</label>
              <input type="text" value={stockForm.batch} onChange={e => setStockForm({ ...stockForm, batch: e.target.value })} className="field" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#6B6B73] mb-1">Lot</label>
              <input type="text" value={stockForm.lot} onChange={e => setStockForm({ ...stockForm, lot: e.target.value })} className="field" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddInitialStock} disabled={submitting}
              className="flex-1 bg-[#34C759] hover:bg-[#28A745] text-white rounded-lg px-4 py-2 text-[12px] font-semibold disabled:opacity-50">
              Simpan Stok
            </button>
            <button onClick={() => setShowStockForm(false)} className="secondary-button">Batal</button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT — 2 panel */}
      <div className={`grid gap-3 ${selectedRow ? "lg:grid-cols-[1fr_300px]" : ""}`}>

        {/* BALANCES TABLE */}
        {tab === "balances" && (
          <div className="bg-white rounded-xl border border-[#EFF0F2] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="bg-[#FAFBFC] border-b border-[#EFF0F2]">
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">SKU</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Produk</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Gudang</th>
                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">On Hand</th>
                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Reserved</th>
                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Available</th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF0F2]">
                  {loading && (
                    <tr><td colSpan={7} className="text-center py-8 text-[12px] text-[#6B6B73]">Loading...</td></tr>
                  )}
                  {!loading && filteredBalances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10">
                        <Package size={28} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-[12px] text-[#6B6B73]">Tidak ada data stok</p>
                      </td>
                    </tr>
                  )}
                  {filteredBalances.map((b) => {
                    const st = stockStatus(b);
                    const isSelected = selectedRow?.id === b.id;
                    return (
                      <tr key={b.id}
                        data-testid={`balance-row-${b.id}`}
                        onClick={() => handleRowClick(b)}
                        className={`cursor-pointer transition-colors ${ROW_CLASSES[st]} ${isSelected ? "ring-1 ring-inset ring-[#007AFF]" : ""}`}>
                        <td className="px-3 py-2 font-bold text-[#007AFF]">{b.sku}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{b.product_name}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{b.warehouse_name}</p>
                          <p className="text-[10px] text-[#8E8E93]">{b.warehouse_city}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-bold">{formatQty(b.on_hand_qty)}</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          <div className="flex items-center justify-end gap-1">
                            <span className={b.reserved_qty > 0 ? "text-[#FF9500]" : "text-[#8E8E93]"}>
                              {formatQty(b.reserved_qty)}
                            </span>
                            {b.reserved_qty > 0 && (
                              <span className="text-[9px] px-1 py-0.5 bg-orange-100 text-[#FF9500] rounded font-bold">
                                RESERVED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-[#34C759] font-bold">{formatQty(b.available_qty)}</td>
                        <td className="px-3 py-2">{STATUS_BADGE[st]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEDGER TABLE */}
        {tab === "ledger" && (
          <div className="bg-white rounded-xl border border-[#EFF0F2] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="bg-[#FAFBFC] border-b border-[#EFF0F2]">
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Waktu</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Tipe</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Produk</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Gudang</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Batch/Lot</th>
                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Qty</th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73]">Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF0F2]">
                  {filteredMovements.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-[12px] text-[#6B6B73]">Tidak ada data pergerakan stok</td></tr>
                  )}
                  {filteredMovements.slice(0, 60).map((m) => {
                    const mt = MOV_TYPE_MAP[m.movement_type] || { label: m.movement_type, color: "text-gray-600", dot: "bg-gray-400" };
                    const prod = balances.find(b => b.product_id === m.product_id);
                    return (
                      <tr key={m.id} data-testid={`movement-row-${m.id}`} className="hover:bg-[#FAFBFC] transition-colors">
                        <td className="px-3 py-2 text-[10.5px] text-[#6B6B73] whitespace-nowrap">{formatDate(m.timestamp)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mt.dot}`} />
                            <span className={`text-[10.5px] font-semibold ${mt.color}`}>{mt.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-[#007AFF]">{prod?.sku || m.product_id}</p>
                        </td>
                        <td className="px-3 py-2 text-[10.5px] text-[#6B6B73]">
                          {balances.find(b => b.warehouse_id === m.warehouse_id)?.warehouse_name || m.warehouse_id}
                        </td>
                        <td className="px-3 py-2 text-[10.5px] text-[#6B6B73]">
                          {[m.batch, m.lot, m.roll_id].filter(Boolean).join(" · ") || "-"}
                        </td>
                        <td className={`px-3 py-2 text-right font-bold ${m.quantity < 0 ? "text-red-600" : "text-green-700"}`}>
                          {m.quantity > 0 ? "+" : ""}{formatQty(m.quantity)}
                        </td>
                        <td className="px-3 py-2 text-[10.5px] text-[#007AFF]">{m.source_document || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RIGHT: Product History Panel */}
        {selectedRow && tab === "balances" && (
          <div className="bg-white rounded-xl border border-[#EFF0F2] overflow-hidden self-start">
            <div className="px-3 py-2 border-b border-[#EFF0F2] bg-[#FAFBFC] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#007AFF] uppercase">{selectedRow.sku}</p>
                <p className="text-[11.5px] font-semibold truncate max-w-[200px]">{selectedRow.product_name}</p>
              </div>
              <button onClick={() => { setSelectedRow(null); setHistory([]); }} className="text-[#6B6B73] hover:text-black"><X size={13} /></button>
            </div>
            {/* Mini balance summary */}
            <div className="grid grid-cols-3 divide-x divide-[#EFF0F2] border-b border-[#EFF0F2]">
              <div className="p-2 text-center">
                <p className="text-[9px] uppercase font-bold text-[#6B6B73]">On Hand</p>
                <p className="text-[13px] font-bold">{formatQty(selectedRow.on_hand_qty)}</p>
              </div>
              <div className="p-2 text-center">
                <p className="text-[9px] uppercase font-bold text-[#6B6B73]">Reserved</p>
                <p className="text-[13px] font-bold text-[#FF9500]">{formatQty(selectedRow.reserved_qty)}</p>
              </div>
              <div className="p-2 text-center">
                <p className="text-[9px] uppercase font-bold text-[#6B6B73]">Available</p>
                <p className="text-[13px] font-bold text-green-600">{formatQty(selectedRow.available_qty)}</p>
              </div>
            </div>
            
            {/* Reserved Info Card */}
            {selectedRow.reserved_qty > 0 && (
              <div className="m-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-[#FF9500] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#FF9500]">Material Direserve</p>
                    <p className="text-[10px] text-[#6B6B73] mt-1">
                      <span className="font-bold">{formatQty(selectedRow.reserved_qty)}</span> {selectedRow.unit || 'unit'} dari stok ini sedang direserve untuk sales order yang belum dikonfirmasi.
                    </p>
                    <p className="text-[9px] text-[#8E8E93] mt-1.5 italic">
                      Reserved material akan otomatis dilepas jika order dibatalkan atau expired.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* History */}
            <div className="px-3 py-2 border-b border-[#EFF0F2] bg-[#FAFBFC]">
              <p className="text-[10px] font-bold uppercase text-[#6B6B73]">Riwayat Pergerakan</p>
            </div>
            {histLoading ? (
              <div className="py-6 text-center text-[12px] text-[#6B6B73]">Loading...</div>
            ) : history.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#6B6B73]">Belum ada riwayat</div>
            ) : (
              <div className="divide-y divide-[#EFF0F2] max-h-[360px] overflow-y-auto">
                {history.map((m) => {
                  const mt = MOV_TYPE_MAP[m.movement_type] || { label: m.movement_type, color: "text-gray-600", dot: "bg-gray-400" };
                  return (
                    <div key={m.id} className="px-3 py-2 hover:bg-[#FAFBFC]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mt.dot}`} />
                          <span className={`text-[10.5px] font-semibold ${mt.color}`}>{mt.label}</span>
                        </div>
                        <span className={`text-[12px] font-bold ${m.quantity < 0 ? "text-red-600" : "text-green-700"}`}>
                          {m.quantity > 0 ? "+" : ""}{formatQty(m.quantity)}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8E8E93] mt-0.5">{formatDate(m.timestamp)} · {m.source_document || ""}</p>
                      {m.batch && <p className="text-[10px] text-[#6B6B73]">Batch: {m.batch}{m.lot ? ` · Lot: ${m.lot}` : ""}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warehouse structure collapsible */}
      {warehouses.length > 0 && (
        <details className="rounded-xl border border-[#EFF0F2] bg-white overflow-hidden">
          <summary className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#6B6B73] cursor-pointer select-none hover:bg-[#FAFBFC] flex items-center gap-2">
            <MapPin size={12} /> Struktur Gudang (Zone · Rack · Bin)
          </summary>
          <div className="border-t border-[#EFF0F2] p-3 grid gap-3 lg:grid-cols-3">
            {warehouses.map(wh => (
              <div key={wh.id} className="rounded-md border border-[#EFF0F2] p-2.5">
                <p className="text-[10px] font-bold uppercase text-[#0058CC] mb-1">{wh.code} — {wh.name}</p>
                <div className="grid grid-cols-3 gap-1">
                  {(wh.zones || []).flatMap(z => z.racks.flatMap(r => r.bins)).map(bin => (
                    <div key={bin.id} className="rounded border border-[#EFF0F2] bg-[#FAFBFC] px-1.5 py-1">
                      <p className="text-[10px] font-semibold">{bin.code}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
