"""
Garment Serial Tracking Demo Router

Demo case study yang diekstrak dari repository `garmentyanathisfinal`.
Berbeda dengan demo KN3 (yang menggunakan isolated DB per session), demo ini
sepenuhnya **stateless** dan **hardcoded** untuk kemudahan pemeliharaan.

Endpoints (semua public, tidak butuh auth atau demo session):
  GET /api/demos/garment-serial/serial-list?status=&search=
  GET /api/demos/garment-serial/serial-trace?serial=

Catatan keamanan:
- Tidak menerima input mutasi (read-only)
- Tidak mengakses database produksi
- Tidak ada side-effect (purely deterministic responses)
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/demos/garment-serial", tags=["demo:garment-serial"])


# ---------------------------------------------------------------------------
# Hardcoded master & sample data
# ---------------------------------------------------------------------------
# Dataset kecil yang merepresentasikan workflow ERP garmen end-to-end:
#  PO Created → Vendor Shipment → Material Inspection → Production Job →
#  Production Progress → Buyer Dispatch
#
# Status mapping:
#   ongoing   = production sedang berjalan / belum semua selesai
#   completed = sudah selesai diproduksi & dikirim
#   pending   = baru dibuat, belum ada progress
# ---------------------------------------------------------------------------

_BUYERS = {
    "BYR-001": "PT Mode Nusantara",
    "BYR-002": "Kanaya Garment Co.",
    "BYR-003": "Sentra Apparel Group",
    "BYR-004": "Dewi Sri Boutique",
}

_VENDORS = {
    "VDR-001": "Vendor Jaya Tekstil",
    "VDR-002": "CV Karya Jahit Mandiri",
    "VDR-003": "Konveksi Bali Indah",
}

_PRODUCTS = [
    {"sku": "SHRT-LIN-001", "name": "Linen Shirt Premium", "size": "L", "color": "Beige"},
    {"sku": "SHRT-LIN-002", "name": "Linen Shirt Premium", "size": "M", "color": "Beige"},
    {"sku": "DRS-FLR-001", "name": "Floral Summer Dress", "size": "M", "color": "Coral"},
    {"sku": "TRS-CTN-001", "name": "Cotton Trouser Classic", "size": "32", "color": "Khaki"},
    {"sku": "JKT-DNM-001", "name": "Denim Jacket Vintage", "size": "L", "color": "Indigo"},
    {"sku": "BLZ-WOL-001", "name": "Wool Blazer Tailored", "size": "M", "color": "Charcoal"},
    {"sku": "TSH-CTN-005", "name": "Cotton T-Shirt Basic", "size": "XL", "color": "Black"},
    {"sku": "SKT-MDI-002", "name": "Midi Skirt Pleated", "size": "S", "color": "Navy"},
    {"sku": "POL-PIQ-003", "name": "Polo Piqué Sport", "size": "L", "color": "White"},
    {"sku": "DRS-CKT-004", "name": "Cocktail Dress Sequin", "size": "M", "color": "Black"},
]


def _product_for(sku: str) -> Dict[str, str]:
    for p in _PRODUCTS:
        if p["sku"] == sku:
            return p
    return _PRODUCTS[0]


# Each serial entry represents one item-level lineage in the ERP.
# qty fields shape demo dashboards & summary cards.
_SERIALS: List[Dict[str, Any]] = [
    {
        "serial_number": "SN-2026-0001",
        "sku": "SHRT-LIN-001",
        "po_number": "PO-2026-0101",
        "po_id": "po-101",
        "po_status": "In Production",
        "buyer_id": "BYR-001",
        "vendor_id": "VDR-001",
        "status": "ongoing",
        "ordered_qty": 500,
        "received_qty": 500,
        "produced_qty": 320,
        "shipped_qty": 0,
        "remaining_qty": 180,
    },
    {
        "serial_number": "SN-2026-0002",
        "sku": "SHRT-LIN-002",
        "po_number": "PO-2026-0101",
        "po_id": "po-101",
        "po_status": "In Production",
        "buyer_id": "BYR-001",
        "vendor_id": "VDR-001",
        "status": "ongoing",
        "ordered_qty": 300,
        "received_qty": 300,
        "produced_qty": 210,
        "shipped_qty": 0,
        "remaining_qty": 90,
    },
    {
        "serial_number": "SN-2026-0003",
        "sku": "DRS-FLR-001",
        "po_number": "PO-2026-0102",
        "po_id": "po-102",
        "po_status": "Closed",
        "buyer_id": "BYR-002",
        "vendor_id": "VDR-002",
        "status": "completed",
        "ordered_qty": 250,
        "received_qty": 250,
        "produced_qty": 250,
        "shipped_qty": 250,
        "remaining_qty": 0,
    },
    {
        "serial_number": "SN-2026-0004",
        "sku": "TRS-CTN-001",
        "po_number": "PO-2026-0103",
        "po_id": "po-103",
        "po_status": "Open",
        "buyer_id": "BYR-003",
        "vendor_id": "VDR-001",
        "status": "pending",
        "ordered_qty": 800,
        "received_qty": 0,
        "produced_qty": 0,
        "shipped_qty": 0,
        "remaining_qty": 800,
    },
    {
        "serial_number": "SN-2026-0005",
        "sku": "JKT-DNM-001",
        "po_number": "PO-2026-0104",
        "po_id": "po-104",
        "po_status": "Closed",
        "buyer_id": "BYR-001",
        "vendor_id": "VDR-003",
        "status": "completed",
        "ordered_qty": 400,
        "received_qty": 400,
        "produced_qty": 400,
        "shipped_qty": 400,
        "remaining_qty": 0,
    },
    {
        "serial_number": "SN-2026-0006",
        "sku": "BLZ-WOL-001",
        "po_number": "PO-2026-0105",
        "po_id": "po-105",
        "po_status": "In Production",
        "buyer_id": "BYR-004",
        "vendor_id": "VDR-002",
        "status": "ongoing",
        "ordered_qty": 150,
        "received_qty": 150,
        "produced_qty": 80,
        "shipped_qty": 40,
        "remaining_qty": 70,
    },
    {
        "serial_number": "SN-2026-0007",
        "sku": "TSH-CTN-005",
        "po_number": "PO-2026-0106",
        "po_id": "po-106",
        "po_status": "In Production",
        "buyer_id": "BYR-002",
        "vendor_id": "VDR-001",
        "status": "ongoing",
        "ordered_qty": 1200,
        "received_qty": 1200,
        "produced_qty": 950,
        "shipped_qty": 600,
        "remaining_qty": 250,
    },
    {
        "serial_number": "SN-2026-0008",
        "sku": "SKT-MDI-002",
        "po_number": "PO-2026-0107",
        "po_id": "po-107",
        "po_status": "Open",
        "buyer_id": "BYR-003",
        "vendor_id": "VDR-003",
        "status": "pending",
        "ordered_qty": 350,
        "received_qty": 0,
        "produced_qty": 0,
        "shipped_qty": 0,
        "remaining_qty": 350,
    },
    {
        "serial_number": "SN-2026-0009",
        "sku": "POL-PIQ-003",
        "po_number": "PO-2026-0108",
        "po_id": "po-108",
        "po_status": "Closed",
        "buyer_id": "BYR-001",
        "vendor_id": "VDR-002",
        "status": "completed",
        "ordered_qty": 600,
        "received_qty": 600,
        "produced_qty": 600,
        "shipped_qty": 600,
        "remaining_qty": 0,
    },
    {
        "serial_number": "SN-2026-0010",
        "sku": "DRS-CKT-004",
        "po_number": "PO-2026-0109",
        "po_id": "po-109",
        "po_status": "In Production",
        "buyer_id": "BYR-004",
        "vendor_id": "VDR-003",
        "status": "ongoing",
        "ordered_qty": 200,
        "received_qty": 200,
        "produced_qty": 130,
        "shipped_qty": 60,
        "remaining_qty": 70,
    },
    {
        "serial_number": "SN-2026-0011",
        "sku": "TSH-CTN-005",
        "po_number": "PO-2026-0110",
        "po_id": "po-110",
        "po_status": "Open",
        "buyer_id": "BYR-002",
        "vendor_id": "VDR-001",
        "status": "pending",
        "ordered_qty": 1500,
        "received_qty": 0,
        "produced_qty": 0,
        "shipped_qty": 0,
        "remaining_qty": 1500,
    },
    {
        "serial_number": "SN-2026-0012",
        "sku": "SHRT-LIN-001",
        "po_number": "PO-2026-0111",
        "po_id": "po-111",
        "po_status": "Closed",
        "buyer_id": "BYR-003",
        "vendor_id": "VDR-002",
        "status": "completed",
        "ordered_qty": 450,
        "received_qty": 450,
        "produced_qty": 450,
        "shipped_qty": 450,
        "remaining_qty": 0,
    },
]


# Hardcoded timeline per serial. Used by /serial-trace endpoint.
_TIMELINES: Dict[str, List[Dict[str, Any]]] = {
    "SN-2026-0001": [
        {"step": "PO Created", "date": "2026-03-01T09:00:00Z", "qty": 500, "po_number": "PO-2026-0101", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-03-05T10:15:00Z", "qty_sent": 500, "received_qty": 500, "shipment_number": "VS-3001", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-03-06T14:30:00Z", "received_qty": 500, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-03-08T08:00:00Z", "qty": 500, "status": "In Progress", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-03-12T16:45:00Z", "completed_quantity": 180, "produced_qty": 180, "module": "Production Progress"},
        {"step": "Production Progress", "date": "2026-03-18T17:00:00Z", "completed_quantity": 140, "produced_qty": 320, "module": "Production Progress"},
    ],
    "SN-2026-0002": [
        {"step": "PO Created", "date": "2026-03-01T09:00:00Z", "qty": 300, "po_number": "PO-2026-0101", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-03-05T10:15:00Z", "qty_sent": 300, "received_qty": 300, "shipment_number": "VS-3001", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-03-06T14:30:00Z", "received_qty": 300, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-03-08T08:00:00Z", "qty": 300, "status": "In Progress", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-03-14T15:20:00Z", "completed_quantity": 210, "produced_qty": 210, "module": "Production Progress"},
    ],
    "SN-2026-0003": [
        {"step": "PO Created", "date": "2026-02-10T09:30:00Z", "qty": 250, "po_number": "PO-2026-0102", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-02-14T11:00:00Z", "qty_sent": 250, "received_qty": 250, "shipment_number": "VS-2980", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-02-15T10:00:00Z", "received_qty": 250, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-02-17T08:00:00Z", "qty": 250, "status": "Completed", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-02-28T17:00:00Z", "completed_quantity": 250, "produced_qty": 250, "module": "Production Progress"},
        {"step": "Buyer Dispatch", "date": "2026-03-03T13:15:00Z", "qty_shipped": 250, "shipment_number": "BS-1102", "module": "Buyer Shipment"},
    ],
    "SN-2026-0004": [
        {"step": "PO Created", "date": "2026-04-05T10:00:00Z", "qty": 800, "po_number": "PO-2026-0103", "module": "Production PO"},
    ],
    "SN-2026-0005": [
        {"step": "PO Created", "date": "2026-02-20T09:00:00Z", "qty": 400, "po_number": "PO-2026-0104", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-02-24T10:30:00Z", "qty_sent": 400, "received_qty": 400, "shipment_number": "VS-2995", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-02-25T11:15:00Z", "received_qty": 400, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-02-27T08:00:00Z", "qty": 400, "status": "Completed", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-03-08T16:30:00Z", "completed_quantity": 400, "produced_qty": 400, "module": "Production Progress"},
        {"step": "Buyer Dispatch", "date": "2026-03-12T14:00:00Z", "qty_shipped": 400, "shipment_number": "BS-1108", "module": "Buyer Shipment"},
    ],
    "SN-2026-0006": [
        {"step": "PO Created", "date": "2026-03-15T09:00:00Z", "qty": 150, "po_number": "PO-2026-0105", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-03-19T10:00:00Z", "qty_sent": 150, "received_qty": 150, "shipment_number": "VS-3015", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-03-20T14:00:00Z", "received_qty": 150, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-03-22T08:00:00Z", "qty": 150, "status": "In Progress", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-03-27T16:00:00Z", "completed_quantity": 80, "produced_qty": 80, "module": "Production Progress"},
        {"step": "Buyer Dispatch", "date": "2026-04-01T13:45:00Z", "qty_shipped": 40, "shipment_number": "BS-1130", "module": "Buyer Shipment"},
    ],
    "SN-2026-0007": [
        {"step": "PO Created", "date": "2026-03-01T09:00:00Z", "qty": 1200, "po_number": "PO-2026-0106", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-03-04T10:00:00Z", "qty_sent": 1200, "received_qty": 1200, "shipment_number": "VS-3008", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-03-05T14:00:00Z", "received_qty": 1200, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-03-07T08:00:00Z", "qty": 1200, "status": "In Progress", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-03-12T16:00:00Z", "completed_quantity": 400, "produced_qty": 400, "module": "Production Progress"},
        {"step": "Production Progress", "date": "2026-03-18T16:00:00Z", "completed_quantity": 550, "produced_qty": 950, "module": "Production Progress"},
        {"step": "Buyer Dispatch", "date": "2026-03-20T13:00:00Z", "qty_shipped": 300, "shipment_number": "BS-1118", "module": "Buyer Shipment"},
        {"step": "Buyer Dispatch", "date": "2026-03-25T13:00:00Z", "qty_shipped": 300, "shipment_number": "BS-1124", "module": "Buyer Shipment"},
    ],
    "SN-2026-0008": [
        {"step": "PO Created", "date": "2026-04-08T09:00:00Z", "qty": 350, "po_number": "PO-2026-0107", "module": "Production PO"},
    ],
    "SN-2026-0009": [
        {"step": "PO Created", "date": "2026-02-05T09:00:00Z", "qty": 600, "po_number": "PO-2026-0108", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-02-09T10:00:00Z", "qty_sent": 600, "received_qty": 600, "shipment_number": "VS-2950", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-02-10T14:00:00Z", "received_qty": 600, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-02-12T08:00:00Z", "qty": 600, "status": "Completed", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-02-24T16:00:00Z", "completed_quantity": 600, "produced_qty": 600, "module": "Production Progress"},
        {"step": "Buyer Dispatch", "date": "2026-02-27T13:00:00Z", "qty_shipped": 600, "shipment_number": "BS-1095", "module": "Buyer Shipment"},
    ],
    "SN-2026-0010": [
        {"step": "PO Created", "date": "2026-03-20T09:00:00Z", "qty": 200, "po_number": "PO-2026-0109", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-03-24T10:00:00Z", "qty_sent": 200, "received_qty": 200, "shipment_number": "VS-3025", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-03-25T14:00:00Z", "received_qty": 200, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-03-27T08:00:00Z", "qty": 200, "status": "In Progress", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-04-02T16:00:00Z", "completed_quantity": 130, "produced_qty": 130, "module": "Production Progress"},
        {"step": "Buyer Dispatch", "date": "2026-04-05T13:00:00Z", "qty_shipped": 60, "shipment_number": "BS-1141", "module": "Buyer Shipment"},
    ],
    "SN-2026-0011": [
        {"step": "PO Created", "date": "2026-04-15T09:00:00Z", "qty": 1500, "po_number": "PO-2026-0110", "module": "Production PO"},
    ],
    "SN-2026-0012": [
        {"step": "PO Created", "date": "2026-02-15T09:00:00Z", "qty": 450, "po_number": "PO-2026-0111", "module": "Production PO"},
        {"step": "Vendor Shipment", "date": "2026-02-19T10:00:00Z", "qty_sent": 450, "received_qty": 450, "shipment_number": "VS-2965", "module": "Vendor Shipment"},
        {"step": "Material Inspection", "date": "2026-02-20T14:00:00Z", "received_qty": 450, "missing_qty": 0, "status": "Passed", "module": "Material Inspection"},
        {"step": "Production Job", "date": "2026-02-22T08:00:00Z", "qty": 450, "status": "Completed", "module": "Production Job"},
        {"step": "Production Progress", "date": "2026-03-04T16:00:00Z", "completed_quantity": 450, "produced_qty": 450, "module": "Production Progress"},
        {"step": "Buyer Dispatch", "date": "2026-03-07T13:00:00Z", "qty_shipped": 450, "shipment_number": "BS-1099", "module": "Buyer Shipment"},
    ],
}


def _enrich_serial(s: Dict[str, Any]) -> Dict[str, Any]:
    """Add product/buyer/vendor names for frontend display."""
    product = _product_for(s["sku"])
    return {
        **s,
        "product_name": product["name"],
        "size": product["size"],
        "color": product["color"],
        "customer_name": _BUYERS.get(s["buyer_id"], "—"),
        "vendor_name": _VENDORS.get(s["vendor_id"], "—"),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/serial-list")
async def list_serials(
    status: str = Query("all", description="Filter status: all, ongoing, completed, pending"),
    search: Optional[str] = Query(None, description="Search by serial/SKU/product/PO"),
) -> List[Dict[str, Any]]:
    """Return filtered & enriched list of serial numbers for the demo dashboard."""
    items = [_enrich_serial(s) for s in _SERIALS]

    if status and status.lower() != "all":
        items = [s for s in items if s.get("status") == status.lower()]

    if search:
        q = search.strip().lower()
        if q:
            items = [
                s for s in items
                if q in s.get("serial_number", "").lower()
                or q in s.get("sku", "").lower()
                or q in s.get("product_name", "").lower()
                or q in s.get("po_number", "").lower()
                or q in s.get("customer_name", "").lower()
                or q in s.get("vendor_name", "").lower()
            ]

    # Stable ordering: ongoing first, then pending, then completed (by serial)
    order = {"ongoing": 0, "pending": 1, "completed": 2}
    items.sort(key=lambda s: (order.get(s.get("status"), 9), s.get("serial_number", "")))
    return items


@router.get("/serial-trace")
async def trace_serial(serial: str = Query(..., min_length=1)) -> Dict[str, Any]:
    """Return full trace data for one serial number (timeline + summary + items)."""
    target = serial.strip().upper()
    matching = [s for s in _SERIALS if s["serial_number"].upper() == target]
    if not matching:
        # Partial / prefix match fallback so demo "type-as-you-search" tetap berguna
        matching = [s for s in _SERIALS if target in s["serial_number"].upper()]

    if not matching:
        return {
            "serial_number": serial,
            "po_count": 0,
            "po_item_count": 0,
            "timeline": [],
            "summary": {},
            "po_info": [],
            "all_items": [],
        }

    primary = matching[0]
    enriched_primary = _enrich_serial(primary)

    # All items in the same PO (for "Semua Item" table)
    same_po = [s for s in _SERIALS if s["po_id"] == primary["po_id"]]
    enriched_items: List[Dict[str, Any]] = []
    for s in same_po:
        e = _enrich_serial(s)
        e["is_searched_serial"] = (s["serial_number"] == primary["serial_number"])
        e["not_produced"] = max(0, s["ordered_qty"] - s["produced_qty"])
        enriched_items.append(e)

    # PO info (unique by po_id)
    po_info_map: Dict[str, Dict[str, Any]] = {}
    vendors_set = set()
    buyers_set = set()
    for s in same_po:
        po_info_map[s["po_id"]] = {"po_number": s["po_number"], "status": s["po_status"]}
        if s["vendor_id"] in _VENDORS:
            vendors_set.add(_VENDORS[s["vendor_id"]])
        if s["buyer_id"] in _BUYERS:
            buyers_set.add(_BUYERS[s["buyer_id"]])

    # Aggregate summary
    total_ordered = sum(s["ordered_qty"] for s in same_po)
    total_produced = sum(s["produced_qty"] for s in same_po)
    total_shipped = sum(s["shipped_qty"] for s in same_po)
    summary = {
        "total_ordered": total_ordered,
        "total_produced": total_produced,
        "total_not_produced": max(0, total_ordered - total_produced),
        "total_shipped": total_shipped,
        "total_not_shipped": max(0, total_produced - total_shipped),
        "all_serials": [s["serial_number"] for s in same_po],
        "buyer": ", ".join(sorted(buyers_set)) or "—",
        "vendors": ", ".join(sorted(vendors_set)) or "—",
    }

    timeline = _TIMELINES.get(primary["serial_number"], [])

    return {
        "serial_number": primary["serial_number"],
        "po_count": len(po_info_map),
        "po_item_count": len(same_po),
        "timeline": timeline,
        "summary": summary,
        "po_info": list(po_info_map.values()),
        "all_items": enriched_items,
        # Convenience fields (re-exposed for top-card display)
        "po_number": enriched_primary["po_number"],
        "po_status": enriched_primary["po_status"],
        "product_name": enriched_primary["product_name"],
        "sku": enriched_primary["sku"],
        "size": enriched_primary["size"],
        "color": enriched_primary["color"],
        "customer_name": enriched_primary["customer_name"],
        "vendor_name": enriched_primary["vendor_name"],
        "ordered_qty": enriched_primary["ordered_qty"],
        "received_qty": enriched_primary["received_qty"],
        "produced_qty": enriched_primary["produced_qty"],
        "shipped_qty": enriched_primary["shipped_qty"],
        "remaining_qty": enriched_primary["remaining_qty"],
    }


@router.get("/meta")
async def get_meta() -> Dict[str, Any]:
    """Return summary metadata of the demo dataset (useful for dashboards)."""
    total = len(_SERIALS)
    ongoing = sum(1 for s in _SERIALS if s["status"] == "ongoing")
    completed = sum(1 for s in _SERIALS if s["status"] == "completed")
    pending = sum(1 for s in _SERIALS if s["status"] == "pending")
    return {
        "app_slug": "garment-serial",
        "version": "1.0.0",
        "source_repo": "pandekomangyogaswastika-dot/garmentyanathisfinal",
        "feature_extracted": "Serial Tracking",
        "total_serials": total,
        "by_status": {"ongoing": ongoing, "completed": completed, "pending": pending},
        "products_count": len(_PRODUCTS),
        "buyers_count": len(_BUYERS),
        "vendors_count": len(_VENDORS),
    }
