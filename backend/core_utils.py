import uuid
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def serialize_doc(doc):
    """Hapus _id Mongo & ubah datetime -> ISO string (cegah JSON error)."""
    if not doc:
        return doc
    doc.pop("_id", None)
    for k, v in list(doc.items()):
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


def serialize_list(docs):
    return [serialize_doc(d) for d in docs]


def public_user(user):
    """Serialize a system_users doc WITHOUT sensitive fields."""
    if not user:
        return user
    u = serialize_doc(dict(user))
    u.pop("password_hash", None)
    return u


def success_response(data):
    return {"success": True, "data": data}


def paginate_response(data, total, page, limit):
    total_pages = (total + limit - 1) // limit if limit else 0
    return {
        "success": True,
        "data": data,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }


def error_response(code, message, details=None):
    return {"success": False, "error": {"code": code, "message": message, "details": details or []}}
