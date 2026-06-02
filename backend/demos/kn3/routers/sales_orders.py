"""Sales orders router: full order lifecycle with reservation engine."""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Request
from pymongo import ReturnDocument
from demos.kn3.db import db
from demos.kn3.dependencies import require_permission, audit
from demos.kn3.core_utils import new_id, now_iso, safe_doc
from demos.kn3.schemas import GenericPatch, SalesOrderCreate
from demos.kn3.services.inventory_service import (
    allocate_stock, atomic_reserve, rollback_reservations, expire_old_reservations
)

router = APIRouter(prefix="/api/demo/kn3")


@router.get("/sales-orders")
async def list_orders(request: Request, status: str = None, customer_id: str = None) -> List[Dict[str, Any]]:
    await require_permission(request, "order", "view")
    await expire_old_reservations()
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    return await db.sales_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/sales-orders/stats/summary")
async def get_orders_stats(request: Request) -> Dict[str, Any]:
    """Get statistics summary for orders monitoring."""
    await require_permission(request, "order", "view")
    await expire_old_reservations()
    
    # Count by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "total_amount": {"$sum": "$total_amount"}}}
    ]
    status_counts = {doc["_id"]: {"count": doc["count"], "total_amount": doc["total_amount"]} 
                     for doc in await db.sales_orders.aggregate(pipeline).to_list(100)}
    
    # Reserved qty across all products
    reserved_orders = await db.sales_orders.find(
        {"status": {"$in": ["reserved", "waiting_approval", "approved"]}},
        {"_id": 0, "allocations": 1, "reservation_expires_at": 1}
    ).to_list(200)
    
    total_reserved_qty = sum(
        alloc.get("quantity", 0) 
        for order in reserved_orders 
        for alloc in order.get("allocations", [])
    )
    
    # Expiring soon (within 24 hours)
    from datetime import datetime, timedelta, timezone
    expiring_soon = sum(
        1 for order in reserved_orders
        if order.get("reservation_expires_at") and 
        datetime.fromisoformat(order["reservation_expires_at"]) < 
        datetime.now(timezone.utc) + timedelta(hours=24)
    )
    
    return {
        "by_status": status_counts,
        "total_reserved_qty": total_reserved_qty,
        "expiring_soon_count": expiring_soon,
        "total_orders": await db.sales_orders.count_documents({})
    }


@router.post("/sales-orders")
async def create_order(payload: SalesOrderCreate, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "order", "create")
    customer = safe_doc(await db.customers.find_one({"id": payload.customer_id}, {"_id": 0}))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan")
    address = next(
        (a for a in customer.get("addresses", []) if a["id"] == payload.shipping_address_id),
        customer.get("addresses", [{}])[0]
    )
    products = {p["id"]: p for p in await db.products.find({}, {"_id": 0}).to_list(100)}
    items = []
    for item_in in payload.items:
        product = products.get(item_in.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Produk {item_in.product_id} tidak ditemukan")
        price = float(product["price"])
        items.append({
            "product_id": product["id"], "sku": product["sku"], "product_name": product["name"],
            "quantity": item_in.quantity, "unit": item_in.unit, "price": price,
            "subtotal": price * item_in.quantity
        })
    total_amount = sum(item["subtotal"] for item in items)
    count = await db.sales_orders.count_documents({}) + 1
    number = f"SO-{count:05d}"
    customer_city = address.get("city", customer.get("city", ""))
    # Multi-item reservation
    all_allocations: List[Dict[str, Any]] = []
    reserved_allocations: List[Dict[str, Any]] = []
    is_split = False
    try:
        for item in items:
            plan = await allocate_stock(item["product_id"], item["quantity"], customer_city)
            if len(plan) > 1:
                is_split = True
            all_allocations.extend(plan)
        for allocation in all_allocations:
            await atomic_reserve(allocation)
            reserved_allocations.append(allocation)
    except HTTPException:
        await rollback_reservations(reserved_allocations)
        raise
    except Exception as e:
        await rollback_reservations(reserved_allocations)
        raise HTTPException(status_code=500, detail=str(e))
    expires = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    order = {
        "id": new_id("so"), "number": number, "status": "reserved" if all_allocations else "draft",
        "customer_id": customer["id"], "customer_name": customer["name"],
        "shipping_address": address, "shipping_address_id": payload.shipping_address_id,
        "items": items, "allocations": all_allocations, "total_amount": total_amount,
        "is_split_warehouse": is_split, "sales_name": payload.sales_name,
        "shipment_policy": payload.shipment_policy,
        "reservation_expires_at": expires,
        "created_at": now_iso(), "updated_at": now_iso()
    }
    await db.sales_orders.insert_one(order)
    await audit(actor["name"], "order_created", "sales_order", order["id"], {
        "number": order["number"], "customer": customer["name"], "total_amount": total_amount
    })
    return safe_doc(order)


@router.get("/sales-orders/{order_id}")
async def get_order(order_id: str, request: Request) -> Dict[str, Any]:
    await require_permission(request, "order", "view")
    order = safe_doc(await db.sales_orders.find_one({"id": order_id}, {"_id": 0}))
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    return order


@router.patch("/sales-orders/{order_id}")
async def update_order(order_id: str, payload: GenericPatch, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "order", "update")
    allowed = ["sales_name", "shipment_policy", "notes"]
    data = {k: v for k, v in payload.data.items() if k in allowed}
    data["updated_at"] = now_iso()
    order = await db.sales_orders.find_one_and_update(
        {"id": order_id}, {"$set": data},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    await audit(actor["name"], "order_updated", "sales_order", order_id, data)
    return order


async def _transition(
    order_id: str, expected_from: List[str], new_status: str,
    actor_name: str, action: str, extra_data: Dict[str, Any] = {}
) -> Dict[str, Any]:
    order = safe_doc(await db.sales_orders.find_one({"id": order_id}, {"_id": 0}))
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    if order["status"] not in expected_from:
        raise HTTPException(status_code=409, detail=f"Status saat ini '{order['status']}' tidak memungkinkan aksi ini")
    update_data = {"status": new_status, "updated_at": now_iso(), **extra_data}
    order = await db.sales_orders.find_one_and_update(
        {"id": order_id}, {"$set": update_data},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    await audit(actor_name, action, "sales_order", order_id, {"status": new_status})
    return order


@router.post("/sales-orders/{order_id}/submit-for-approval")
async def submit_for_approval(order_id: str, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "order", "update")
    return await _transition(order_id, ["reserved"], "waiting_approval", actor["name"], "order_submitted")


@router.post("/sales-orders/{order_id}/approve")
async def approve_order(order_id: str, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "order", "approve")
    return await _transition(order_id, ["reserved", "waiting_approval"], "approved", actor["name"], "order_approved")


@router.post("/sales-orders/{order_id}/confirm")
async def confirm_order(order_id: str, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "order", "confirm")
    return await _transition(order_id, ["approved", "waiting_approval", "reserved"], "confirmed",
                             actor["name"], "order_confirmed")


@router.post("/sales-orders/{order_id}/release-reservation")
async def release_reservation(order_id: str, request: Request) -> Dict[str, Any]:
    """Manually release reservation without cancelling order (set to draft)."""
    actor = await require_permission(request, "order", "update")
    order = safe_doc(await db.sales_orders.find_one({"id": order_id}, {"_id": 0}))
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    if order["status"] not in ["reserved", "waiting_approval", "approved"]:
        raise HTTPException(status_code=409, detail="Order tidak dalam status yang di-reserve")
    # Release reservations
    await rollback_reservations(order.get("allocations", []))
    # Update order to draft status
    update_data = {
        "status": "draft", 
        "allocations": [],
        "updated_at": now_iso()
    }
    order = await db.sales_orders.find_one_and_update(
        {"id": order_id}, {"$set": update_data},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    await audit(actor["name"], "reservation_released", "sales_order", order_id, 
                {"status": "draft", "note": "Reservation released manually"})
    return order


@router.post("/sales-orders/{order_id}/cancel")
async def cancel_order(order_id: str, request: Request) -> Dict[str, Any]:
    actor = await require_permission(request, "order", "update")
    order = safe_doc(await db.sales_orders.find_one({"id": order_id}, {"_id": 0}))
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    if order["status"] in ["done", "cancelled", "expired"]:
        raise HTTPException(status_code=409, detail="Order tidak bisa dibatalkan")
    if order["status"] in ["reserved", "waiting_approval", "approved", "confirmed"]:
        await rollback_reservations(order.get("allocations", []))
    return await _transition(order_id, [order["status"]], "cancelled", actor["name"], "order_cancelled")
