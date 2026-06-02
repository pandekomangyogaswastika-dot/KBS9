"""Dashboard router: main metrics + overview."""
from typing import Any, Dict
from fastapi import APIRouter
from demos.kn3.db import db
from demos.kn3.core_utils import safe_doc
from demos.kn3.services.inventory_service import expire_old_reservations, product_summary

router = APIRouter(prefix="/api/demo/kn3")


@router.get("/dashboard")
async def dashboard() -> Dict[str, Any]:
    expired = await expire_old_reservations()
    products_raw = await db.products.find({}, {"_id": 0}).to_list(100)
    orders_raw = await db.sales_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    warehouses_raw = await db.warehouses.find({}, {"_id": 0}).to_list(100)
    customers_raw = await db.customers.find({}, {"_id": 0}).to_list(100)
    products = [safe_doc(p) for p in products_raw if p]
    orders = [safe_doc(o) for o in orders_raw if o]
    warehouses = [safe_doc(w) for w in warehouses_raw if w]
    customers = [safe_doc(c) for c in customers_raw if c]
    total_available = 0.0
    total_reserved = 0.0
    for product in products:
        summary = await product_summary(product["id"])
        product.update(summary)
        total_available += summary["available_qty"]
        total_reserved += summary["reserved_qty"]
    return {
        "expired_released": expired,
        "metrics": {
            "products": len(products),
            "warehouses": len(warehouses),
            "customers": len(customers),
            "available_qty": total_available,
            "reserved_qty": total_reserved,
            "active_orders": len(
                [o for o in orders if o.get("status") not in ["done", "cancelled", "expired"]]
            ),
        },
        "products": products,
        "orders": orders,
        "warehouses": warehouses,
        "customers": customers,
    }
