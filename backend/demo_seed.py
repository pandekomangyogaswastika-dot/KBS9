"""
Generic WMS Demo Seed — data showcase untuk demo publik.
Tidak spesifik ke client tertentu. Dapat di-inject ke database demo session.

Menampilkan:
- 3 Gudang di berbagai kota
- 15+ Produk tekstil generic
- 8 Pelanggan retail
- Stok awal yang realistis
- 5 Sales Orders dalam berbagai status
- 8 WMS Tasks (inbound + outbound)
- Unit of measure lengkap
"""
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from demos.kn3.core_utils import new_id, now_iso, hash_password
from demos.kn3.permissions_config import DEFAULT_PERMISSIONS


def ago(days=0, hours=0, minutes=0) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days, hours=hours, minutes=minutes)
    return dt.isoformat()


def future(days=0, hours=0) -> str:
    dt = datetime.now(timezone.utc) + timedelta(days=days, hours=hours)
    return dt.isoformat()


WAREHOUSES = [
    {"id": "wh_jkt", "name": "Gudang Utama Jakarta", "code": "WH-JKT", "city": "Jakarta",
     "address": "Jl. Industri Raya No. 88, Jakarta Utara", "capacity": 50000,
     "manager": "Bambang Prasetyo", "status": "active", "type": "main"},
    {"id": "wh_bdg", "name": "Gudang Regional Bandung", "code": "WH-BDG", "city": "Bandung",
     "address": "Kawasan Industri Gedebage, Bandung", "capacity": 30000,
     "manager": "Sari Dewi", "status": "active", "type": "regional"},
    {"id": "wh_sby", "name": "Gudang Regional Surabaya", "code": "WH-SBY", "city": "Surabaya",
     "address": "SIER Industrial Estate, Surabaya", "capacity": 35000,
     "manager": "Hendra Kusuma", "status": "active", "type": "regional"},
]

PRODUCTS = [
    {"sku": "PRD-001", "name": "Material Cotton Plain",
     "category": "Cotton", "variant": "Putih", "color": "Putih", "grade": "A",
     "base_unit": "meter", "price": 35000, "supplier": "Supplier A",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-002", "name": "Material Cotton Plain",
     "category": "Cotton", "variant": "Navy", "color": "Navy", "grade": "A",
     "base_unit": "meter", "price": 37000, "supplier": "Supplier A",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-003", "name": "Material Jersey Stretch",
     "category": "Jersey", "variant": "Hitam", "color": "Hitam", "grade": "A",
     "base_unit": "meter", "price": 45000, "supplier": "Supplier B",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-004", "name": "Material Jersey Stretch",
     "category": "Jersey", "variant": "Merah", "color": "Merah", "grade": "A",
     "base_unit": "meter", "price": 45000, "supplier": "Supplier B",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-005", "name": "Premium Linen Material",
     "category": "Linen", "variant": "Cream", "color": "Cream", "grade": "A+",
     "base_unit": "meter", "price": 85000, "supplier": "Supplier C",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-006", "name": "Satin Silk Premium",
     "category": "Satin", "variant": "Gold", "color": "Gold", "grade": "A+",
     "base_unit": "meter", "price": 120000, "supplier": "Supplier D",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-007", "name": "Rayon Viscose Material",
     "category": "Rayon", "variant": "Biru Muda", "color": "Biru Muda", "grade": "B",
     "base_unit": "meter", "price": 28000, "supplier": "Supplier A",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-008", "name": "Batik Tulis Premium",
     "category": "Batik", "variant": "Sogan", "color": "Coklat", "grade": "A",
     "base_unit": "lembar", "price": 350000, "supplier": "Supplier E",
     "motif": "Parang", "status": "active"},
    {"sku": "PRD-009", "name": "Twill Polyester Material",
     "category": "Polyester", "variant": "Abu-abu", "color": "Abu-abu", "grade": "B",
     "base_unit": "meter", "price": 22000, "supplier": "Supplier F",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-010", "name": "Wool Blend Premium",
     "category": "Wol", "variant": "Charcoal", "color": "Charcoal", "grade": "A",
     "base_unit": "meter", "price": 195000, "supplier": "Supplier G",
     "motif": "Polos", "status": "active"},
    {"sku": "PRD-011", "name": "Denim Material 12oz",
     "category": "Denim", "variant": "Indigo", "color": "Indigo", "grade": "A",
     "base_unit": "meter", "price": 78000, "supplier": "Supplier H",
     "motif": "Polos", "status": "active"},
]

CUSTOMERS = [
    {"id": "cust_01", "name": "PT Industri Prima Jaya", "email": "order@primajaya.co.id",
     "pic_name": "Ibu Sari", "phone": "021-5551001", "city": "Jakarta",
     "type": "corporate", "credit_limit": 500000000, "payment_term": "NET30",
     "addresses": [{"id": "addr_01_a", "label": "Kantor Utama",
                    "recipient_name": "Ibu Sari", "phone": "021-5551001",
                    "address": "Jl. Industri No. 12, Cengkareng",
                    "city": "Jakarta", "is_default": True}]},
    {"id": "cust_02", "name": "CV Berkah Distribusi", "email": "purchasing@berkahdist.com",
     "pic_name": "Pak Hendra", "phone": "022-4441002", "city": "Bandung",
     "type": "distributor", "credit_limit": 200000000, "payment_term": "NET14",
     "addresses": [{"id": "addr_02_a", "label": "Gudang Bandung",
                    "recipient_name": "Pak Hendra", "phone": "022-4441002",
                    "address": "Jl. Riau No. 45, Bandung",
                    "city": "Bandung", "is_default": True}]},
    {"id": "cust_03", "name": "PT Aneka Solusi Indonesia", "email": "supply@anekasolusi.id",
     "pic_name": "Bu Rina", "phone": "031-3332003", "city": "Surabaya",
     "type": "corporate", "credit_limit": 750000000, "payment_term": "NET45",
     "addresses": [{"id": "addr_03_a", "label": "Gudang Surabaya",
                    "recipient_name": "Bu Rina", "phone": "031-3332003",
                    "address": "SIER Block D No. 8, Surabaya",
                    "city": "Surabaya", "is_default": True}]},
    {"id": "cust_04", "name": "UD Permata Niaga", "email": "toko@permata-niaga.com",
     "pic_name": "Pak Agus", "phone": "024-2223004", "city": "Semarang",
     "type": "retail", "credit_limit": 50000000, "payment_term": "COD",
     "addresses": [{"id": "addr_04_a", "label": "Toko Semarang",
                    "recipient_name": "Pak Agus", "phone": "024-2223004",
                    "address": "Pasar Johar Blok B No. 22, Semarang",
                    "city": "Semarang", "is_default": True}]},
    {"id": "cust_05", "name": "PT Gemilang Usaha Mandiri", "email": "procurement@gemilang.co.id",
     "pic_name": "Bu Dewi", "phone": "021-6664005", "city": "Tangerang",
     "type": "corporate", "credit_limit": 400000000, "payment_term": "NET30",
     "addresses": [{"id": "addr_05_a", "label": "Kantor Tangerang",
                    "recipient_name": "Bu Dewi", "phone": "021-6664005",
                    "address": "Kawasan Industri Jatake, Tangerang",
                    "city": "Tangerang", "is_default": True}]},
]

UOMS = [
    {"id": "uom_meter", "name": "Meter", "symbol": "m", "type": "length", "base_unit": True},
    {"id": "uom_roll", "name": "Roll", "symbol": "roll",
     "type": "packaging", "base_unit": False, "conversions": {"meter": 50}},
    {"id": "uom_lembar", "name": "Lembar", "symbol": "lbr", "type": "unit", "base_unit": True},
    {"id": "uom_kg", "name": "Kilogram", "symbol": "kg", "type": "weight", "base_unit": True},
    {"id": "uom_yard", "name": "Yard", "symbol": "yd",
     "type": "length", "base_unit": False, "conversions": {"meter": 0.9144}},
]


async def seed_all(db_instance) -> dict:
    """
    Seed demo data ke database yang diberikan.
    Hapus semua data lama, isi dengan data demo generic.
    Return summary of what was seeded.
    """
    db = db_instance
    now = now_iso()

    # ──────────────────────────────────────────────
    # 1. Clear existing data
    # ──────────────────────────────────────────────
    collections_to_clear = [
        "users", "uoms", "warehouses", "products", "customers",
        "inventory_balances", "inventory_movements", "sales_orders",
        "wms_tasks", "purchase_orders", "document_templates",
        "permission_settings", "audit_logs", "sessions",
    ]
    for col in collections_to_clear:
        await db[col].delete_many({})

    # ──────────────────────────────────────────────
    # 2. Users (demo admin saja — bypass login anyway)
    # ──────────────────────────────────────────────
    await db.users.insert_one({
        "id": "demo_admin_01", "name": "Admin Demo",
        "email": "admin@demo.wms", "role": "admin",
        "password_hash": hash_password("demo12345"),
        "status": "active", "created_at": ago(days=90)
    })

    # ──────────────────────────────────────────────
    # 3. UOMs
    # ──────────────────────────────────────────────
    for uom in UOMS:
        uom["created_at"] = now
        await db.uoms.insert_one(dict(uom))

    # ──────────────────────────────────────────────
    # 4. Warehouses
    # ──────────────────────────────────────────────
    wh_ids = []
    for wh in WAREHOUSES:
        doc = dict(wh)
        doc["created_at"] = now
        await db.warehouses.insert_one(doc)
        wh_ids.append(wh["id"])

    # ──────────────────────────────────────────────
    # 5. Products + inventory balances
    # ──────────────────────────────────────────────
    product_ids = []
    for p in PRODUCTS:
        prod = dict(p)
        prod["id"] = new_id("prod")
        prod["batch_lot_rolls"] = []
        prod["created_at"] = ago(days=random.randint(10, 90))
        prod["updated_at"] = now
        await db.products.insert_one(prod)
        product_ids.append(prod["id"])

        # Seed inventory balances
        for wh_id in wh_ids:
            on_hand = round(random.uniform(500, 5000), 1)
            reserved = round(random.uniform(0, on_hand * 0.2), 1)
            available = round(on_hand - reserved, 1)
            await db.inventory_balances.insert_one({
                "id": new_id("bal"),
                "product_id": prod["id"],
                "warehouse_id": wh_id,
                "on_hand_qty": on_hand,
                "reserved_qty": reserved,
                "available_qty": available,
                "blocked_qty": 0.0,
                "picked_qty": 0.0,
                "in_transit_qty": 0.0,
                "updated_at": now,
            })

            # Initial stock movement
            await db.inventory_movements.insert_one({
                "id": new_id("mov"),
                "product_id": prod["id"],
                "warehouse_id": wh_id,
                "movement_type": "initial_stock",
                "quantity": on_hand,
                "unit": prod["base_unit"],
                "batch": f"BATCH-{random.randint(100,999)}",
                "lot": f"LOT-{random.randint(10,99)}",
                "roll_id": "",
                "source_document": "initial_stock",
                "timestamp": ago(days=random.randint(5, 60)),
            })

    # ──────────────────────────────────────────────
    # 6. Customers
    # ──────────────────────────────────────────────
    for c in CUSTOMERS:
        doc = dict(c)
        doc["created_at"] = ago(days=random.randint(30, 180))
        doc["updated_at"] = now
        await db.customers.insert_one(doc)

    # ──────────────────────────────────────────────
    # 7. Sales Orders
    # ──────────────────────────────────────────────
    order_scenarios = [
        # (customer_id, addr_id, city, items_count, status)
        ("cust_01", "addr_01_a", "Jakarta", 2, "confirmed"),
        ("cust_02", "addr_02_a", "Bandung", 1, "waiting_approval"),
        ("cust_03", "addr_03_a", "Surabaya", 3, "reserved"),
        ("cust_04", "addr_04_a", "Semarang", 1, "done"),
        ("cust_05", "addr_05_a", "Tangerang", 2, "draft"),
    ]

    order_count = 1
    for i, (cust_id, addr_id, city, n_items, status) in enumerate(order_scenarios):
        cust = next(c for c in CUSTOMERS if c["id"] == cust_id)
        addr = next(a for a in cust["addresses"] if a["id"] == addr_id)

        # Pick random products
        chosen_prods = random.sample(list(zip(PRODUCTS, product_ids)), min(n_items, len(product_ids)))
        items = []
        for prod_data, prod_id in chosen_prods:
            qty = round(random.uniform(100, 1000), 1)
            price = float(prod_data["price"])
            items.append({
                "product_id": prod_id,
                "sku": prod_data["sku"],
                "product_name": prod_data["name"],
                "quantity": qty,
                "unit": prod_data["base_unit"],
                "price": price,
                "subtotal": round(price * qty, 2),
            })

        total = sum(item["subtotal"] for item in items)
        order_id = new_id("so")
        order_num = f"SO-{order_count:05d}"
        order_count += 1

        # Allocations
        allocations = []
        for item in items:
            allocations.append({
                "id": new_id("alloc"),
                "product_id": item["product_id"],
                "warehouse_id": random.choice(wh_ids),
                "warehouse_name": random.choice([w["name"] for w in WAREHOUSES]),
                "warehouse_city": city,
                "quantity": item["quantity"],
                "status": "allocated",
            })

        await db.sales_orders.insert_one({
            "id": order_id,
            "number": order_num,
            "status": status,
            "customer_id": cust_id,
            "customer_name": cust["name"],
            "shipping_address": addr,
            "shipping_address_id": addr_id,
            "items": items,
            "allocations": allocations,
            "total_amount": round(total, 2),
            "is_split_warehouse": False,
            "sales_name": "Admin Demo",
            "shipment_policy": "partial",
            "reservation_expires_at": future(days=3),
            "created_at": ago(days=random.randint(1, 30)),
            "updated_at": ago(days=random.randint(0, 1)),
        })

    # ──────────────────────────────────────────────
    # 8. WMS Tasks (inbound + outbound)
    # ──────────────────────────────────────────────
    task_scenarios = [
        ("inbound", "purchase_order", "put_away"),
        ("inbound", "purchase_order", "qc_check"),
        ("outbound", "sales_order", "picking"),
        ("outbound", "sales_order", "packing"),
        ("outbound", "sales_order", "dispatched"),
        ("inbound", "purchase_order", "receiving"),
    ]

    for flow_type, source_type, status in task_scenarios:
        prod_data, prod_id = random.choice(list(zip(PRODUCTS, product_ids)))
        wh = random.choice(WAREHOUSES)
        qty = round(random.uniform(200, 2000), 1)
        await db.wms_tasks.insert_one({
            "id": new_id("wms"),
            "flow_type": flow_type,
            "source_type": source_type,
            "product_id": prod_id,
            "product_name": prod_data["name"],
            "sku": prod_data["sku"],
            "quantity": qty,
            "unit": prod_data["base_unit"],
            "warehouse_id": wh["id"],
            "warehouse_name": wh["name"],
            "warehouse_city": wh["city"],
            "bin_id": f"BIN-{random.randint(10,99)}",
            "batch": f"BATCH-{random.randint(100,999)}",
            "lot": f"LOT-{random.randint(10,99)}",
            "roll_id": f"ROLL-{random.randint(1000,9999)}" if random.random() > 0.5 else "",
            "status": status,
            "stages": ["created", "in_transit", "receiving", "qc_check", "put_away", "done"],
            "scan_log": [],
            "created_by": "Admin Demo",
            "created_at": ago(days=random.randint(0, 7)),
            "updated_at": ago(hours=random.randint(1, 48)),
        })

    # ──────────────────────────────────────────────
    # 9. Permission settings
    # ──────────────────────────────────────────────
    await db.permission_settings.delete_many({})
    await db.permission_settings.insert_one({
        "id": "default",
        "matrix": DEFAULT_PERMISSIONS,
        "updated_at": now,
    })

    return {
        "warehouses": len(WAREHOUSES),
        "products": len(PRODUCTS),
        "customers": len(CUSTOMERS),
        "uoms": len(UOMS),
        "orders": len(order_scenarios),
        "wms_tasks": len(task_scenarios),
    }
