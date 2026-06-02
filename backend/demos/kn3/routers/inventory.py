"""Inventory router: balances, movements, initial stock, history."""
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Request
from demos.kn3.db import db
from demos.kn3.dependencies import require_permission, audit
from demos.kn3.core_utils import new_id, now_iso, safe_doc

router = APIRouter(prefix="/api/demo/kn3")


@router.get("/inventory/balances")
async def list_balances(request: Request) -> List[Dict[str, Any]]:
    await require_permission(request, "product", "view")
    balances = await db.inventory_balances.find({}, {"_id": 0}).to_list(1000)
    warehouses = {w["id"]: w for w in await db.warehouses.find({}, {"_id": 0}).to_list(100)}
    products = {p["id"]: p for p in await db.products.find({}, {"_id": 0}).to_list(1000)}
    result = []
    for b in balances:
        b["warehouse_name"] = warehouses.get(b["warehouse_id"], {}).get("name", "")
        b["warehouse_city"] = warehouses.get(b["warehouse_id"], {}).get("city", "")
        p = products.get(b["product_id"], {})
        b["sku"] = p.get("sku", "")
        b["product_name"] = p.get("name", "")
        result.append(b)
    return result


@router.get("/inventory/movements")
async def list_movements(request: Request) -> List[Dict[str, Any]]:
    await require_permission(request, "product", "view")
    return await db.inventory_movements.find({}, {"_id": 0}).sort("timestamp", -1).to_list(500)


@router.post("/inventory/initial-stock")
async def add_initial_stock(payload: Dict[str, Any], request: Request) -> Dict[str, Any]:
    """Add or update initial stock for a product/warehouse/bin."""
    actor = await require_permission(request, "product", "create")
    product_id = payload.get("product_id")
    warehouse_id = payload.get("warehouse_id")
    quantity = float(payload.get("quantity", 0))
    if not product_id or not warehouse_id or quantity <= 0:
        raise HTTPException(status_code=400, detail="product_id, warehouse_id, quantity wajib diisi")
    existing = safe_doc(
        await db.inventory_balances.find_one({"product_id": product_id, "warehouse_id": warehouse_id}, {"_id": 0})
    )
    if existing:
        await db.inventory_balances.update_one(
            {"product_id": product_id, "warehouse_id": warehouse_id},
            {"$inc": {"on_hand_qty": quantity, "available_qty": quantity}, "$set": {"updated_at": now_iso()}}
        )
    else:
        await db.inventory_balances.insert_one({
            "id": new_id("bal"), "product_id": product_id, "warehouse_id": warehouse_id,
            "on_hand_qty": quantity, "reserved_qty": 0, "available_qty": quantity,
            "blocked_qty": 0, "picked_qty": 0, "in_transit_qty": 0, "updated_at": now_iso()
        })
    movement = {
        "id": new_id("mov"), "product_id": product_id, "warehouse_id": warehouse_id,
        "movement_type": "initial_stock", "quantity": quantity, "unit": payload.get("unit", "unit"),
        "batch": payload.get("batch", ""), "lot": payload.get("lot", ""),
        "roll_id": payload.get("roll_id", ""), "source_document": "initial_stock", "timestamp": now_iso()
    }
    await db.inventory_movements.insert_one(movement)
    await audit(actor["name"], "initial_stock_added", "inventory", product_id, payload)
    return {"message": "Stok awal berhasil ditambahkan", "movement_id": movement["id"]}


@router.get("/history/{product_id}")
async def product_history(product_id: str, request: Request) -> List[Dict[str, Any]]:
    await require_permission(request, "product", "view")
    movements = await db.inventory_movements.find(
        {"product_id": product_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(200)
    warehouses = {w["id"]: w for w in await db.warehouses.find({}, {"_id": 0}).to_list(100)}
    for m in movements:
        m["warehouse_name"] = warehouses.get(m.get("warehouse_id", ""), {}).get("name", "")
    return movements
