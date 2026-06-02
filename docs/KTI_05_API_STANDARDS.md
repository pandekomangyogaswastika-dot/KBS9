# KTI_05 — API STANDARDS

---

## Prefix
SEMUA endpoint diawali `/api`. Router pakai `APIRouter(prefix="/api/...")`.
Domain prefix: `/api/auth`, `/api/services`, `/api/cases`, `/api/team`, `/api/clients`, `/api/tech`, `/api/blog`, `/api/careers`, `/api/settings`, `/api/leads`, `/api/assessment`, `/api/projects`, `/api/invoices`, `/api/chat`, `/api/ai`, `/api/admin`.

---

## Response Envelope
```json
// success single
{ "success": true, "data": { } }
// success list + pagination
{ "success": true, "data": [ ], "meta": { "total":0, "page":1, "limit":20, "total_pages":0, "has_next":false, "has_prev":false } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```
Helpers di `core_utils.py`: `success_response(data)`, `paginate_response(data,total,page,limit)`, `error_response(code,msg,details)`.

---

## HTTP Status
```
200 OK | 201 Created | 204 No Content
400 Bad Request | 401 Unauthorized | 403 Forbidden | 404 Not Found
409 Conflict | 422 Unprocessable | 429 Too Many Req | 500 Server Error
```

---

## URL & Query
```
GET  /api/services?lang=id&category=ai&search=...&page=1&limit=20&sort_by=created_at&sort_dir=desc
GET  /api/services/{slug}
POST /api/admin/services            (admin)
PATCH/api/admin/services/{id}       (admin)
DELETE /api/admin/services/{id}     (admin, soft delete)
# action endpoint non-CRUD:
POST /api/projects/{id}/milestones/{mid}/approve
POST /api/assessment/sessions/{id}/submit
```
Route ordering: spesifik SEBELUM generic (`/services/featured` sebelum `/services/{slug}`).

---

## Error Code Convention (SCREAMING_SNAKE, domain prefix)
```
AUTH_INVALID_CREDENTIALS, AUTH_TOKEN_EXPIRED, AUTH_INSUFFICIENT_PERMISSION
VALIDATION_ERROR, VALIDATION_REQUIRED_FIELD
NOT_FOUND, DUPLICATE_SLUG, DUPLICATE_EMAIL
ASSESSMENT_SESSION_LOCKED, ASSESSMENT_INVALID_TOKEN
PROJECT_NOT_FOUND, AI_PROVIDER_ERROR
```

---

## Pagination Helper
```python
def paginate_response(data, total, page, limit):
    total_pages = (total + limit - 1) // limit
    return {"success": True, "data": data, "meta": {
        "total": total, "page": page, "limit": limit, "total_pages": total_pages,
        "has_next": page < total_pages, "has_prev": page > 1}}
```
