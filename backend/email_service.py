"""
Email Service - Phase 12
Provider abstraction layer untuk email notifications (async, motor-based).

Providers:
  - mock (default, log-only ke email_outbox)
  - smtp (generic SMTP, configurable via admin settings)
  - resend/sendgrid (placeholder, future)

Semua konfigurasi diambil dari koleksi `integration_settings` (type=email)
untuk memenuhi rule "no hardcoded API keys".
"""
from __future__ import annotations

import asyncio
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from string import Template
from typing import Any, Dict, Optional

from db import get_db

# ---------------------------------------------------------------------------
# Provider interface
# ---------------------------------------------------------------------------


class EmailProvider(ABC):
    """Abstract base class for email providers."""

    name: str = "abstract"

    def __init__(self, config: Dict[str, Any]):
        self.config = config or {}
        self.enabled = bool(self.config.get("enabled", True))

    @abstractmethod
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send email and return result dict."""


class MockEmailProvider(EmailProvider):
    """Default mock provider — never sends real emails, just logs."""

    name = "mock"

    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.enabled:
            return {"success": False, "provider": self.name, "error": "Provider disabled"}

        print(f"[MockEmail] To={to} | Subject={subject} | HTML chars={len(html_body)}")

        return {
            "success": True,
            "provider": self.name,
            "message_id": f"mock-{uuid.uuid4().hex[:16]}",
            "to": to,
            "subject": subject,
        }


class SMTPEmailProvider(EmailProvider):
    """Generic SMTP provider. Konfigurasi dari admin settings."""

    name = "smtp"

    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.enabled:
            return {"success": False, "provider": self.name, "error": "Provider disabled"}

        host = self.config.get("smtp_host")
        port = int(self.config.get("smtp_port", 587))
        username = self.config.get("smtp_username")
        password = self.config.get("smtp_password")
        use_tls = bool(self.config.get("smtp_use_tls", True))

        if not host:
            return {"success": False, "provider": self.name, "error": "SMTP host belum dikonfigurasi"}

        def _send() -> Dict[str, Any]:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{from_name or 'KTI'} <{from_email or username or 'no-reply@kubus.id'}>"
                msg["To"] = to
                if text_body:
                    msg.attach(MIMEText(text_body, "plain"))
                msg.attach(MIMEText(html_body, "html"))

                with smtplib.SMTP(host, port, timeout=15) as server:
                    if use_tls:
                        server.starttls()
                    if username and password:
                        server.login(username, password)
                    server.send_message(msg)

                return {
                    "success": True,
                    "provider": self.name,
                    "message_id": f"smtp-{uuid.uuid4().hex[:16]}",
                    "to": to,
                }
            except Exception as exc:  # noqa: BLE001
                return {"success": False, "provider": self.name, "error": str(exc)}

        # Run blocking SMTP in thread executor.
        return await asyncio.to_thread(_send)


class PlaceholderProvider(EmailProvider):
    """Used for providers yang belum di-implement (resend/sendgrid) — kembalikan error informatif."""

    def __init__(self, config: Dict[str, Any], display_name: str):
        super().__init__(config)
        self.name = display_name

    async def send_email(self, *args, **kwargs) -> Dict[str, Any]:  # noqa: ANN002
        return {
            "success": False,
            "provider": self.name,
            "error": f"Provider '{self.name}' belum diimplementasi. Gunakan 'mock' atau 'smtp'.",
        }


# ---------------------------------------------------------------------------
# Settings loader & provider factory
# ---------------------------------------------------------------------------

DEFAULT_EMAIL_SETTINGS: Dict[str, Any] = {
    "type": "email",
    "enabled": True,
    "provider": "mock",
    "from_email": "no-reply@kubus.id",
    "from_name": "Kubus Teknologi",
    "config": {"enabled": True},
}


async def load_email_settings() -> Dict[str, Any]:
    """Read latest email settings from DB (or return defaults)."""
    db = get_db()
    doc = await db.integration_settings.find_one({"type": "email"}, {"_id": 0})
    if not doc:
        return DEFAULT_EMAIL_SETTINGS.copy()
    # Ensure config dict exists
    doc.setdefault("config", {})
    doc.setdefault("provider", "mock")
    doc.setdefault("from_email", DEFAULT_EMAIL_SETTINGS["from_email"])
    doc.setdefault("from_name", DEFAULT_EMAIL_SETTINGS["from_name"])
    doc.setdefault("enabled", True)
    return doc


def _build_provider(settings: Dict[str, Any]) -> EmailProvider:
    provider_type = (settings.get("provider") or "mock").lower()
    config = settings.get("config") or {}
    config["enabled"] = settings.get("enabled", True)
    if provider_type == "mock":
        return MockEmailProvider(config)
    if provider_type == "smtp":
        return SMTPEmailProvider(config)
    if provider_type in ("resend", "sendgrid"):
        return PlaceholderProvider(config, provider_type)
    # unknown → fallback mock
    return MockEmailProvider(config)


# ---------------------------------------------------------------------------
# Template rendering
# ---------------------------------------------------------------------------

async def _render_template(template_id: str, locale: str, variables: Dict[str, Any]) -> Dict[str, str]:
    db = get_db()
    doc = await db.email_templates.find_one(
        {"template_id": template_id, "locale": locale}, {"_id": 0}
    )
    if not doc:
        # try fallback locale
        fallback = "id" if locale != "id" else "en"
        doc = await db.email_templates.find_one(
            {"template_id": template_id, "locale": fallback}, {"_id": 0}
        )
    if not doc:
        return {
            "subject": f"Notifikasi dari Kubus Teknologi ({template_id})",
            "html_body": f"<p>Anda memiliki notifikasi baru: <b>{template_id}</b>.</p>",
            "text_body": f"Anda memiliki notifikasi baru: {template_id}.",
        }

    safe_vars = {str(k): ("" if v is None else str(v)) for k, v in (variables or {}).items()}
    try:
        subject = Template(doc.get("subject", "")).safe_substitute(safe_vars)
        html_body = Template(doc.get("html_body", "")).safe_substitute(safe_vars)
        text_body = Template(doc.get("text_body", "")).safe_substitute(safe_vars)
    except Exception:  # noqa: BLE001
        subject = doc.get("subject", "Notifikasi")
        html_body = doc.get("html_body", "")
        text_body = doc.get("text_body", "")
    return {"subject": subject, "html_body": html_body, "text_body": text_body}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def send_raw_email(
    to: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
    *,
    template_id: str = "raw",
    locale: str = "id",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Send a raw email (no template). Logs to email_outbox."""
    return await _dispatch(
        to=to,
        rendered={"subject": subject, "html_body": html_body, "text_body": text_body or ""},
        template_id=template_id,
        locale=locale,
        variables={},
        metadata=metadata or {},
    )


async def send_notification(
    to: str,
    template_id: str,
    variables: Dict[str, Any],
    *,
    locale: str = "id",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """High-level helper used by routers (lead/project/approval/etc)."""
    rendered = await _render_template(template_id, locale, variables)
    return await _dispatch(
        to=to,
        rendered=rendered,
        template_id=template_id,
        locale=locale,
        variables=variables,
        metadata=metadata or {},
    )


async def _dispatch(
    *,
    to: str,
    rendered: Dict[str, str],
    template_id: str,
    locale: str,
    variables: Dict[str, Any],
    metadata: Dict[str, Any],
) -> Dict[str, Any]:
    """Internal: resolve provider, send, log to outbox/events."""
    db = get_db()
    settings = await load_email_settings()
    provider = _build_provider(settings)

    from_email = settings.get("from_email") or DEFAULT_EMAIL_SETTINGS["from_email"]
    from_name = settings.get("from_name") or DEFAULT_EMAIL_SETTINGS["from_name"]

    if not settings.get("enabled", True):
        result = {"success": False, "provider": provider.name, "error": "Email integration disabled"}
    else:
        try:
            result = await provider.send_email(
                to=to,
                subject=rendered["subject"],
                html_body=rendered["html_body"],
                text_body=rendered.get("text_body") or "",
                from_email=from_email,
                from_name=from_name,
            )
        except Exception as exc:  # noqa: BLE001
            result = {"success": False, "provider": provider.name, "error": str(exc)}

    now = datetime.now(timezone.utc).isoformat()
    outbox_id = str(uuid.uuid4())
    outbox_entry = {
        "id": outbox_id,
        "to": to,
        "template_id": template_id,
        "locale": locale,
        "subject": rendered.get("subject", ""),
        "provider": result.get("provider", provider.name),
        "status": "sent" if result.get("success") else "failed",
        "message_id": result.get("message_id"),
        "error": result.get("error"),
        "variables": variables,
        "metadata": metadata,
        "created_at": now,
    }
    try:
        await db.email_outbox.insert_one(outbox_entry)
        await db.email_events.insert_one(
            {
                "id": str(uuid.uuid4()),
                "outbox_id": outbox_id,
                "event_type": outbox_entry["status"],
                "timestamp": now,
                "metadata": {"provider": outbox_entry["provider"], "error": outbox_entry["error"]},
            }
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[email_service] Failed to write outbox log: {exc}")

    return {**result, "outbox_id": outbox_id}


# ---------------------------------------------------------------------------
# Fire-and-forget helper for routers
# ---------------------------------------------------------------------------


def notify_async(
    to: str,
    template_id: str,
    variables: Dict[str, Any],
    *,
    locale: str = "id",
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """Schedule an email send without awaiting (fire-and-forget).

    Caller code stays simple: notify_async("x@y.com", "lead_created", {...}).
    Tasks run in the event loop in the background; failures are logged only.
    """

    async def _runner():
        try:
            await send_notification(to, template_id, variables, locale=locale, metadata=metadata)
        except Exception as exc:  # noqa: BLE001
            print(f"[email_service] notify_async error for {template_id}: {exc}")

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(_runner())
        else:
            loop.run_until_complete(_runner())
    except RuntimeError:
        # No running loop; spawn one
        asyncio.run(_runner())
