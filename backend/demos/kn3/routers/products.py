"""Products router: CRUD products + stock breakdown."""
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Request
from pymongo import ReturnDocument
from demos.kn3.db import db
from demos.kn3.dependencies import require_permission, audit
from demos.kn3.core_utils import new_id, now_iso, safe_doc
from demos.kn3.schemas import GenericPatch, ProductPayload
from demos.kn3.services.inventory_service import expire_old_reservations, product_summary

router = APIRouter(prefix="/api/demo/kn3")


@router.get("/products")
async def list_products() -> List[Dict[str, Any]]:
    await expire_old_reservations()
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    for product in products:
        product.update(await product_summary(product["id"]))
    return products


@router.post("/products")
async def create_product(payload: ProductPayload, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "product", "create")
    if await db.products.find_one({"sku": payload.sku}, {"_id": 0}):
        raise HTTPException(status_code=409, detail="SKU sudah digunakan")
    product = payload.model_dump()
    product.update({"id": new_id("prod"), "batch_lot_rolls": [], "created_at": now_iso(), "updated_at": now_iso()})
    await db.products.insert_one(product)
    await audit(actor["name"], "product_created", "product", product["id"], product)
    return safe_doc(product)


@router.patch("/products/{product_id}")
async def update_product(product_id: str, payload: GenericPatch, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "product", "update")
    allowed = ["sku", "name", "category", "variant", "color", "motif", "grade", "supplier",
               "base_unit", "price", "image", "status", "uom_conversions"]
    data = {k: v for k, v in payload.data.items() if k in allowed}
    data["updated_at"] = now_iso()
    product = await db.products.find_one_and_update(
        {"id": product_id}, {"$set": data},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    await audit(actor["name"], "product_updated", "product", product_id, product)
    return product


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "product", "delete")
    product = await db.products.find_one_and_update(
        {"id": product_id},
        {"$set": {"status": "inactive", "updated_at": now_iso()}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    await audit(actor["name"], "product_deactivated", "product", product_id, product)
    return product


@router.get("/products/{product_id}/stock-breakdown")
async def stock_breakdown(product_id: str) -> Dict[str, Any]:
    product = safe_doc(await db.products.find_one({"id": product_id}, {"_id": 0}))
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    balances_raw = await db.inventory_balances.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    warehouses = {w["id"]: w for w in await db.warehouses.find({}, {"_id": 0}).to_list(100)}
    reservations_raw = await db.sales_orders.find(
        {"allocations.product_id": product_id,
         "status": {"$in": ["reserved", "waiting_approval", "approved", "confirmed"]}},
        {"_id": 0}
    ).to_list(100)
    rows = []
    for balance in balances_raw:
        b = safe_doc(balance)
        warehouse = safe_doc(warehouses.get(b.get("warehouse_id"), {}))
        rows.append({**b, "warehouse_name": warehouse.get("name"), "warehouse_city": warehouse.get("city")})
    return {
        "product": product,
        "balances": rows,
        "reservations": [safe_doc(r) for r in reservations_raw if r]
    }
