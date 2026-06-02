import { useMemo } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "../../components/ProductCard";
import { ProductDetail } from "../../components/ProductDetail";
import { CustomerPanel } from "../../components/CustomerPanel";
import { CartPanel } from "../../components/CartPanel";

export function SalesPortal({ 
  data, 
  selectedProduct, 
  breakdown, 
  onInspect, 
  onAdd, 
  cart, 
  setCart, 
  selectedCustomer, 
  setSelectedCustomer, 
  selectedAddress, 
  setSelectedAddress, 
  onCreateCustomer, 
  onSubmitOrder, 
  search, 
  setSearch, 
  onShowDetail 
}) {
  const products = useMemo(() => 
    (data.products || []).filter((product) => 
      `${product.name} ${product.sku} ${product.category} ${product.color}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ), 
    [data.products, search]
  );
  
  return (
    <div data-testid="sales-portal-view" className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <section>
        <div className="section-card mb-4">
          <div className="section-head">
            <div className="flex items-center gap-3 min-w-0">
              <span className="kicker">Sales POS</span>
              <h2 data-testid="sales-portal-title">Katalog Produk</h2>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#E5E5EA] bg-white px-2 py-1.5 min-w-[240px]">
              <Search size={14} className="text-[#6B6B73]" />
              <input 
                data-testid="product-search-input" 
                className="w-full bg-transparent text-[13px] outline-none" 
                placeholder="Cari SKU, motif, warna..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>
          <p data-testid="sales-portal-subtitle" className="px-4 py-2 text-[12px] text-[#6B6B73]">
            Grid POS dengan stok real-time, reserved qty & breakdown gudang per produk.
          </p>
        </div>
        {selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            breakdown={breakdown} 
            onClose={() => onInspect(null)} 
            onAdd={onAdd} 
          />
        )}
        <div data-testid="product-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAdd={onAdd} 
              onInspect={onInspect} 
            />
          ))}
        </div>
      </section>
      <aside className="grid content-start gap-3">
        <CustomerPanel 
          customers={data.customers || []} 
          selectedCustomer={selectedCustomer} 
          setSelectedCustomer={setSelectedCustomer} 
          selectedAddress={selectedAddress} 
          setSelectedAddress={setSelectedAddress} 
          onCreateCustomer={onCreateCustomer} 
          onShowDetail={onShowDetail} 
        />
        <CartPanel 
          cart={cart} 
          setCart={setCart} 
          selectedCustomer={selectedCustomer} 
          selectedAddress={selectedAddress} 
          onSubmitOrder={onSubmitOrder} 
          onShowDetail={onShowDetail} 
        />
      </aside>
    </div>
  );
}
