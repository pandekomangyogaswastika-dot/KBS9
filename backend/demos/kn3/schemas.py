from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from demos.kn3.core_utils import new_id


class CustomerAddress(BaseModel):
    id: str = Field(default_factory=lambda: new_id("addr"))
    label: str = "Alamat Utama"
    recipient_name: str
    phone: str = ""
    city: str
    address: str
    is_primary: bool = False


class CustomerCreate(BaseModel):
    name: str
    pic_name: str
    phone: str
    email: str = ""
    type: str = "Retail"
    city: str
    address: str
    created_by: str = "Sales Demo"


class LoginRequest(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    password: str = "demo12345"


class GenericPatch(BaseModel):
    data: Dict[str, Any]


class ProductPayload(BaseModel):
    sku: str
    name: str
    category: str = "Kain"
    variant: str = "Regular"
    color: str = "Natural"
    motif: str = "Polos"
    grade: str = "A"
    supplier: str = "Internal"
    base_unit: str = "meter"
    price: float = 0
    image: str = "https://images.unsplash.com/photo-1774679817333-decf0d988dd5?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
    status: str = "active"
    uom_conversions: List[Dict[str, Any]] = []


class WarehousePayload(BaseModel):
    code: str
    name: str
    city: str
    bin_code: str = "A1-01"
    bin_capacity: float = 1000
    lat: Optional[float] = None
    lng: Optional[float] = None


class UOMPayload(BaseModel):
    code: str
    name: str
    base_type: str = "length"
    precision: int = 2


class TemplatePayload(BaseModel):
    document_type: str
    name: str
    header: str = "Kain Nusantara"
    footer: str = "Dokumen dibuat otomatis oleh sistem."
    columns: List[str] = []
    logo_url: str = ""
    paper_size: str = "A4"
    orientation: str = "portrait"
    margin_mm: int = 12
    signature_left: str = "Dibuat Oleh"
    signature_right: str = "Disetujui Oleh"
    section_order: List[str] = ["header", "customer", "items", "allocation", "signature", "footer"]


class PermissionUpdate(BaseModel):
    matrix: Dict[str, Dict[str, List[str]]]


class WMSTaskCreate(BaseModel):
    flow_type: str = "inbound"
    source_type: str = "supplier"
    product_id: str
    quantity: float
    unit: str = "meter"
    warehouse_id: str
    bin_id: str
    batch: str
    lot: str
    roll_id: str


class ScannerScan(BaseModel):
    scan_type: str
    scan_value: str
    actor: str = "Warehouse Demo"


class SalesOrderItemIn(BaseModel):
    product_id: str
    quantity: float
    unit: str


class SalesOrderCreate(BaseModel):
    customer_id: str
    shipping_address_id: str
    items: List[SalesOrderItemIn]
    sales_name: str = "Ayu Marketing"
    shipment_policy: str = "allow_partial_shipment"


class PaymentSimulationCreate(BaseModel):
    amount: float
    method: str = "Transfer Simulasi"
    created_by: str = "Admin Demo"


class DocumentGenerate(BaseModel):
    document_type: str
    source_id: str
    actor: str = "Admin Demo"


class BarcodeGenerate(BaseModel):
    target_type: str
    target_id: str
    label_size: str = "80x50mm"


WAREHOUSE_PRIORITY = {
    "Jakarta": ["Jakarta", "Bandung", "Surabaya"],
    "Bandung": ["Bandung", "Jakarta", "Surabaya"],
    "Surabaya": ["Surabaya", "Bandung", "Jakarta"],
    "Denpasar": ["Surabaya", "Jakarta", "Bandung"],
}


# ─── Transfer Schemas ────────────────────────────────────────────────────────

class TransferItem(BaseModel):
    product_id: str
    qty: float
    unit: str = "meter"
    batch: str = ""
    lot: str = ""
    roll_id: str = ""


class TransferCreate(BaseModel):
    source_warehouse_id: str
    dest_warehouse_id: str
    items: List[TransferItem]
    notes: str = ""
    requested_by: str = "Warehouse User"


class TransferApprove(BaseModel):
    approved_by: str = "Manager"


class TransferReject(BaseModel):
    rejected_by: str = "Manager"
    reason: str = ""


class TransferStatusUpdate(BaseModel):
    status: str  # picking, staging, dispatched, completed
    updated_by: str = "Warehouse User"


# ─── Purchase Order Schemas ──────────────────────────────────────────────────

class POItemCreate(BaseModel):
    product_id: str
    quantity: float
    unit: str = "meter"
    price: float = 0.0


class PurchaseOrderCreate(BaseModel):
    supplier_name: str
    supplier_contact: str = ""
    warehouse_id: str
    items: List[POItemCreate]
    expected_delivery_date: str = ""
    notes: str = ""
    created_by: str = "Admin"


class POReceiveItem(BaseModel):
    product_id: str
    actual_qty: float
    batch: str = ""
    lot: str = ""
    roll_id: str = ""
    bin_id: str = ""

