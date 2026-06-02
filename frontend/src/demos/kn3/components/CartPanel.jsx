import { ShoppingBag, PackageCheck, XCircle } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

export function CartPanel({ cart, setCart, selectedCustomer, selectedAddress, onSubmitOrder, onShowDetail }) {
  const total = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  
  const updateQty = (productId, quantity) => 
    setCart(cart.map((item) => 
      item.product.id === productId ? { ...item, quantity: Number(quantity) || 0 } : item
    ));
  
  const remove = (productId) => 
    setCart(cart.filter((item) => item.product.id !== productId));
  
  return (
    <section data-testid="cart-panel" className="section-card">
      <div className="section-head">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag data-testid="cart-panel-icon" size={14} className="text-[#0058CC]" />
          <span className="kicker">Draft Order</span>
          <h2>Reservasi 3 hari</h2>
        </div>
      </div>
      <div className="section-body">
        <div className="grid gap-2">
          {cart.length === 0 && (
            <p 
              data-testid="empty-cart-message" 
              className="rounded-md border border-dashed border-[#E5E5EA] bg-[#FAFBFC] p-3 text-[12px] text-[#6B6B73]"
            >
              Pilih produk dari grid POS untuk mulai membuat order.
            </p>
          )}
          {cart.map((item) => (
            <div 
              data-testid={`cart-item-${item.product.id}`} 
              key={item.product.id} 
              className="rounded-md border border-[#EFF0F2] bg-[#FAFBFC] p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p 
                    data-testid={`cart-item-sku-${item.product.id}`} 
                    className="text-[10.5px] font-bold uppercase tracking-wide text-[#0058CC]"
                  >
                    {item.product.sku}
                  </p>
                  <p 
                    data-testid={`cart-item-name-${item.product.id}`} 
                    className="text-[12.5px] font-semibold truncate"
                  >
                    {item.product.name}
                  </p>
                </div>
                <button 
                  data-testid={`remove-cart-item-button-${item.product.id}`} 
                  className="icon-button" 
                  onClick={() => remove(item.product.id)} 
                  aria-label="Remove item"
                >
                  <XCircle size={14} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_64px] gap-2">
                <input 
                  data-testid={`cart-item-qty-input-${item.product.id}`} 
                  className="field" 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  onChange={(e) => updateQty(item.product.id, e.target.value)} 
                />
                <div 
                  data-testid={`cart-item-unit-${item.product.id}`} 
                  className="grid place-items-center rounded-md bg-white border border-[#EFF0F2] text-[12px] font-semibold"
                >
                  {item.product.base_unit}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button 
          data-testid="cart-total-card" 
          className="interactive-card mt-3 w-full rounded-md bg-black p-2.5 text-left text-white" 
          onClick={() => onShowDetail({ 
            title: "Total Sales Order Draft", 
            body: "Total ini adalah snapshot harga saat order dibuat. Diskon belum aktif sesuai scope saat ini.", 
            facts: [
              { label: "Item", value: cart.length }, 
              { label: "Total", value: formatCurrency(total) }, 
              { label: "Customer", value: selectedCustomer?.name || "Belum dipilih" }
            ], 
            target: "sales", 
            cta: "Kembali ke draft" 
          })}
        >
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-white/70">
            Total snapshot
          </p>
          <p data-testid="cart-total-amount" className="text-[16px] font-bold">
            {formatCurrency(total)}
          </p>
        </button>
        <button 
          data-testid="submit-sales-order-button" 
          className="primary-button mt-2 w-full" 
          disabled={!selectedCustomer || !selectedAddress || cart.length === 0} 
          onClick={onSubmitOrder}
        >
          <PackageCheck size={14} /> Buat Sales Order & Reserve
        </button>
      </div>
    </section>
  );
}
