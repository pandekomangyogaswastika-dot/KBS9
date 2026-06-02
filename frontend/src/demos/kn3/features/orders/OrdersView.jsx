import { useState } from "react";
import { BarChart2, FileText, Search, XCircle, Clock3, Truck, CreditCard, PackageX } from "lucide-react";
import { formatCurrency, formatQty } from "../../utils/formatters";
import { StatusPill } from "../../components/CoreWidgets";
import OrderDashboard from "./OrderDashboard";

export default function OrdersView({ 
  orders, 
  onApprove, 
  onConfirm, 
  onCancel, 
  onPay, 
  onGenerateDocument, 
  onShowDetail, 
  onReleaseReservation 
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  
  const sel = selectedOrder ? orders.find(o => o.id === selectedOrder) || orders[0] : null;
  
  const filteredOrders = orders
    .filter(o => statusFilter === "all" || o.status === statusFilter)
    .filter(o => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.sales_name?.toLowerCase().includes(q) ||
        o.items?.some(item => 
          item.sku?.toLowerCase().includes(q) || 
          item.product_name?.toLowerCase().includes(q)
        )
      );
    });
  
  const stats = {
    total: orders.length,
    reserved: orders.filter(o => ["reserved", "waiting_approval", "approved"].includes(o.status)).length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    done: orders.filter(o => o.status === "done").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  return (
    <div data-testid="orders-view" className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("dashboard")}
          className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            viewMode === "dashboard"
              ? "bg-[#007AFF] text-white"
              : "bg-white border border-[#E5E5EA] text-[#3C3C43] hover:bg-[#F2F2F7]"
          }`}
          data-testid="tab-dashboard"
        >
          <BarChart2 size={14} className="inline mr-1.5" />
          Dashboard & Analytics
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            viewMode === "list"
              ? "bg-[#007AFF] text-white"
              : "bg-white border border-[#E5E5EA] text-[#3C3C43] hover:bg-[#F2F2F7]"
          }`}
          data-testid="tab-list"
        >
          <FileText size={14} className="inline mr-1.5" />
          Order List
        </button>
      </div>
      
      {viewMode === "dashboard" && <OrderDashboard orders={orders} />}
      
      {viewMode === "list" && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { label: "Total", value: stats.total, color: "text-[#007AFF]", bg: "bg-[#EFF4FF]" },
              { label: "Reserved", value: stats.reserved, color: "text-[#FF9500]", bg: "bg-orange-50" },
              { label: "Confirmed", value: stats.confirmed, color: "text-[#34C759]", bg: "bg-green-50" },
              { label: "Done", value: stats.done, color: "text-[#5856D6]", bg: "bg-purple-50" },
              { label: "Cancelled", value: stats.cancelled, color: "text-red-500", bg: "bg-red-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-lg border border-[#EFF0F2] p-2.5 ${bg}`}>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B6B73]">{label}</p>
                <p className={`text-[20px] font-bold leading-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 rounded-lg border border-[#E5E5EA] bg-white px-3 py-2">
            <Search size={14} className="text-[#6B6B73]" />
            <input
              type="text"
              data-testid="orders-search-input"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#8E8E93]"
              placeholder="Cari order number, customer, produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[#6B6B73] hover:text-black">
                <XCircle size={14} />
              </button>
            )}
          </div>
          
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <section className="section-card">
              <div className="section-head">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="kicker">Order Control</span>
                  <h2>Sales Orders</h2>
                </div>
                <select 
                  className="field !py-1 !text-[11px] w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status ({orders.length})</option>
                  <option value="waiting_approval">Waiting Approval</option>
                  <option value="reserved">Reserved</option>
                  <option value="approved">Approved</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="overflow-hidden">
                <div className="grid grid-cols-[1fr_90px_90px_70px] bg-[#FAFBFC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6B6B73] border-b border-[#EFF0F2]">
                  <span>Order</span><span>Customer</span><span>Total</span><span>Status</span>
                </div>
                <div className="divide-y divide-[#EFF0F2] max-h-[600px] overflow-y-auto">
                  {filteredOrders.length === 0 && (
                    <div className="px-3 py-8 text-center text-[12px] text-[#6B6B73]">
                      {statusFilter === "all" ? "Tidak ada order aktif." : `Tidak ada order dengan status "${statusFilter}".`}
                    </div>
                  )}
                  {filteredOrders.map((order) => (
                    <div 
                      data-testid={`order-card-${order.id}`} 
                      key={order.id}
                      className={`grid grid-cols-[1fr_90px_90px_70px] items-center px-3 py-2.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors ${
                        selectedOrder === order.id ? 'bg-[#EFF4FF] border-l-2 border-[#007AFF]' : ''
                      }`}
                      onClick={() => setSelectedOrder(order.id === selectedOrder ? null : order.id)}
                    >
                      <div className="min-w-0">
                        <p data-testid={`order-number-${order.id}`} className="text-[12px] font-bold text-[#007AFF]">
                          {order.number}
                        </p>
                        <p className="text-[10.5px] text-[#6B6B73] truncate">
                          {(order.items || []).length} item · {order.payment_status === 'paid' ? '✓ Lunas' : 'Belum bayar'}
                        </p>
                      </div>
                      <p data-testid={`order-customer-${order.id}`} className="text-[11px] text-[#3C3C43] truncate">
                        {order.customer_name}
                      </p>
                      <p data-testid={`order-total-${order.id}`} className="text-[11.5px] font-bold">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <StatusPill status={order.status} testId={`order-status-${order.id}`} />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {sel ? (
              <aside data-testid="order-detail-panel" className="section-card self-start">
                <div className="section-head">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#0058CC]">{sel.number}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <StatusPill status={sel.status} />
                      <StatusPill status={sel.payment_status} />
                    </div>
                  </div>
                  <button className="icon-button" onClick={() => setSelectedOrder(null)}>
                    <XCircle size={14} />
                  </button>
                </div>
                <div className="section-body space-y-3">
                  <div>
                    <p data-testid="order-customer-detail" className="text-[12px] font-semibold">{sel.customer_name}</p>
                    <p className="text-[11px] text-[#6B6B73]">{sel.shipping_city} · Sales: {sel.sales_name}</p>
                    <p data-testid="order-expiry-detail" className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[#7A2CA0]">
                      <Clock3 size={11} /> {new Date(sel.reservation_expires_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  
                  <div className="rounded-md border border-[#EFF0F2] bg-[#FAFBFC] p-2.5">
                    <p className="text-[10px] font-bold uppercase text-[#6B6B73] mb-2">Status Timeline</p>
                    <div className="space-y-1.5">
                      {[
                        { status: 'waiting_approval', label: 'Waiting Approval', icon: '⏳' },
                        { status: 'reserved', label: 'Reserved (Approved)', icon: '✓' },
                        { status: 'approved', label: 'Approved', icon: '✓' },
                        { status: 'confirmed', label: 'Confirmed', icon: '✓' },
                        { status: 'dispatched', label: 'Dispatched', icon: '🚚' },
                        { status: 'done', label: 'Done', icon: '✅' },
                      ].map(({ status, label, icon }) => {
                        const statusOrder = ['waiting_approval', 'reserved', 'approved', 'confirmed', 'dispatched', 'done'];
                        const currentIdx = statusOrder.indexOf(sel.status);
                        const stepIdx = statusOrder.indexOf(status);
                        const isActive = stepIdx === currentIdx;
                        const isPassed = stepIdx < currentIdx;
                        const isCancelled = sel.status === 'cancelled';
                        
                        return (
                          <div key={status} className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                              isCancelled ? 'bg-gray-200 text-gray-400' :
                              isActive ? 'bg-[#007AFF] text-white font-bold' :
                              isPassed ? 'bg-green-500 text-white' :
                              'bg-gray-200 text-gray-400'
                            }`}>
                              {isPassed || isActive ? icon : '○'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] ${
                                isCancelled ? 'text-gray-400' :
                                isActive ? 'font-bold text-[#007AFF]' :
                                isPassed ? 'text-green-700 font-semibold' :
                                'text-[#8E8E93]'
                              }`}>
                                {label}
                              </p>
                            </div>
                            {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#007AFF] text-white font-bold">CURRENT</span>}
                          </div>
                        );
                      })}
                      {sel.status === 'cancelled' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#EFF0F2]">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 bg-red-500 text-white">
                            ✕
                          </div>
                          <p className="text-[11px] font-bold text-red-600">Order Cancelled</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-[#EFF0F2] overflow-hidden">
                    <div className="px-2.5 py-1.5 bg-[#FAFBFC] text-[10px] font-bold uppercase text-[#6B6B73] border-b border-[#EFF0F2]">
                      Items
                    </div>
                    {(sel.items || []).map((item) => (
                      <div 
                        data-testid={`order-item-${sel.id}-${item.id}`} 
                        key={item.id} 
                        className="px-2.5 py-1.5 border-b border-[#EFF0F2] last:border-0"
                      >
                        <p className="text-[10.5px] font-bold text-[#0058CC]">{item.sku}</p>
                        <div className="flex justify-between">
                          <p className="text-[11px]">{item.product_name}</p>
                          <p className="text-[11px] font-semibold">{formatQty(item.quantity)} {item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {sel.status === "waiting_approval" && (
                      <button 
                        data-testid={`approve-order-button-${sel.id}`} 
                        className="primary-button" 
                        onClick={() => onApprove(sel.id)}
                      >
                        <FileText size={13} /> Approve
                      </button>
                    )}
                    {["reserved", "approved"].includes(sel.status) && (
                      <button 
                        data-testid={`confirm-order-button-${sel.id}`} 
                        className="primary-button" 
                        onClick={() => onConfirm(sel.id)}
                      >
                        <FileText size={13} /> Confirm
                      </button>
                    )}
                    {sel.status === "confirmed" && sel.payment_status === "pending" && (
                      <button 
                        data-testid={`simulate-payment-button-${sel.id}`} 
                        className="secondary-button" 
                        onClick={() => onPay(sel.id)}
                      >
                        <CreditCard size={13} /> Simulate Payment
                      </button>
                    )}
                    {["reserved", "waiting_approval", "approved"].includes(sel.status) && (
                      <button 
                        data-testid={`release-reservation-button-${sel.id}`} 
                        className="secondary-button" 
                        onClick={() => onReleaseReservation(sel.id)}
                      >
                        <PackageX size={13} /> Release Reservation
                      </button>
                    )}
                    {!["done", "cancelled"].includes(sel.status) && (
                      <button 
                        data-testid={`cancel-order-button-${sel.id}`} 
                        className="secondary-button text-red-600" 
                        onClick={() => onCancel(sel.id)}
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                    {sel.status === "confirmed" && (
                      <button 
                        data-testid={`generate-sj-button-${sel.id}`} 
                        className="secondary-button" 
                        onClick={() => onGenerateDocument("surat_jalan", sel.id)}
                      >
                        <Truck size={13} /> Surat Jalan
                      </button>
                    )}
                  </div>
                </div>
              </aside>
            ) : (
              <aside className="section-card flex items-center justify-center min-h-[200px] border-dashed">
                <div className="text-center p-6">
                  <FileText size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-[12px] text-[#6B6B73]">Pilih order untuk lihat detail & aksi</p>
                </div>
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}
