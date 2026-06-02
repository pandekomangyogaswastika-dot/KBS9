"""
Consultation booking router - Handle consultation scheduling
"""
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from db import get_db
from core_utils import new_id, now_iso, success_response, serialize_doc

router = APIRouter(prefix="/api/consultation")


class BookingRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company: Optional[str] = None
    service: str
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    message: Optional[str] = None


@router.post("/book")
async def create_booking(booking: BookingRequest):
    """
    Create a new consultation booking
    """
    db = get_db()
    
    # Create booking document
    booking_doc = {
        "id": new_id(),
        "name": booking.name,
        "email": booking.email,
        "phone": booking.phone,
        "company": booking.company,
        "service": booking.service,
        "date": booking.date,
        "time": booking.time,
        "message": booking.message,
        "status": "pending",  # pending, confirmed, completed, cancelled
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "voided": False,
    }
    
    # Insert to database
    result = await db.consultation_bookings.insert_one(booking_doc)
    
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create booking")
    
    # TODO: Send confirmation email to customer
    # TODO: Send notification to admin
    
    return success_response({
        "id": booking_doc["id"],
        "message": "Booking berhasil dibuat. Kami akan menghubungi Anda segera.",
        "status": "pending"
    })


@router.get("/bookings")
async def list_bookings(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """
    List all consultation bookings (Admin only in production)
    """
    db = get_db()
    
    query = {"voided": {"$ne": True}}
    if status:
        query["status"] = status
    
    bookings = await db.consultation_bookings.find(query).sort(
        "created_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    return success_response([serialize_doc(b) for b in bookings])


@router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    """
    Get a specific booking by ID
    """
    db = get_db()
    
    booking = await db.consultation_bookings.find_one({
        "id": booking_id,
        "voided": {"$ne": True}
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return success_response(serialize_doc(booking))


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str):
    """
    Update booking status (Admin only in production)
    Valid statuses: pending, confirmed, completed, cancelled
    """
    db = get_db()
    
    valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    result = await db.consultation_bookings.update_one(
        {"id": booking_id, "voided": {"$ne": True}},
        {"$set": {"status": status, "updated_at": now_iso()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return success_response({"message": "Status updated successfully", "status": status})


@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str):
    """
    Soft delete a booking (Admin only in production)
    """
    db = get_db()
    
    result = await db.consultation_bookings.update_one(
        {"id": booking_id, "voided": {"$ne": True}},
        {"$set": {"voided": True, "updated_at": now_iso()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return success_response({"message": "Booking deleted successfully"})
