"""Real-time WebSocket infrastructure (Phase 15).

In-process connection manager keyed by user_id and topic.  Designed to be
single-instance friendly; for multi-replica deployments, swap the internal
storage with a Redis pub/sub adapter without changing public API.

Design:
  * Per-user fan-out: a user may be connected from multiple devices/tabs
    → every connection for that user receives the message.
  * Per-topic subscribe/unsubscribe (e.g. `project:abc`) for live updates.
  * All sends are best-effort: dead sockets are silently removed.
  * Locks per-key are NOT used; we rely on asyncio cooperative concurrency
    and Python's GIL for dict mutations. Operations are short.
"""
from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from typing import Any, Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    """Tracks active WebSocket connections per user + topic subscription."""

    def __init__(self) -> None:
        self._user_sockets: Dict[str, Set[WebSocket]] = defaultdict(set)
        # WebSocket → set of topics it subscribed to (reverse index)
        self._socket_topics: Dict[WebSocket, Set[str]] = defaultdict(set)
        # topic → set of websockets
        self._topic_sockets: Dict[str, Set[WebSocket]] = defaultdict(set)
        # WebSocket → user_id (reverse for cleanup)
        self._socket_user: Dict[WebSocket, str] = {}

    # ---------------------------------------------------------------- connect
    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self._user_sockets[user_id].add(websocket)
        self._socket_user[websocket] = user_id

    def disconnect(self, websocket: WebSocket) -> None:
        user_id = self._socket_user.pop(websocket, None)
        if user_id is not None:
            self._user_sockets.get(user_id, set()).discard(websocket)
            if not self._user_sockets.get(user_id):
                self._user_sockets.pop(user_id, None)
        # Remove from all topics
        for topic in list(self._socket_topics.get(websocket, set())):
            self._topic_sockets.get(topic, set()).discard(websocket)
            if not self._topic_sockets.get(topic):
                self._topic_sockets.pop(topic, None)
        self._socket_topics.pop(websocket, None)

    # ---------------------------------------------------------------- topics
    def subscribe(self, websocket: WebSocket, topic: str) -> None:
        self._socket_topics[websocket].add(topic)
        self._topic_sockets[topic].add(websocket)

    def unsubscribe(self, websocket: WebSocket, topic: str) -> None:
        self._socket_topics.get(websocket, set()).discard(topic)
        self._topic_sockets.get(topic, set()).discard(websocket)
        if not self._topic_sockets.get(topic):
            self._topic_sockets.pop(topic, None)

    # ---------------------------------------------------------------- send
    async def _safe_send(self, websocket: WebSocket, payload: str) -> None:
        try:
            await websocket.send_text(payload)
        except Exception:  # noqa: BLE001 — connection dropped, etc.
            self.disconnect(websocket)

    async def send_to_user(self, user_id: str, message: Dict[str, Any]) -> int:
        """Send a JSON message to every connection of a user.

        Returns the number of sockets the message was attempted to.
        """
        targets = list(self._user_sockets.get(user_id, set()))
        if not targets:
            return 0
        payload = json.dumps(message, default=str)
        await asyncio.gather(*(self._safe_send(ws, payload) for ws in targets))
        return len(targets)

    async def send_to_users(self, user_ids, message: Dict[str, Any]) -> int:
        total = 0
        for uid in set(user_ids or []):
            total += await self.send_to_user(uid, message)
        return total

    async def send_to_topic(self, topic: str, message: Dict[str, Any]) -> int:
        targets = list(self._topic_sockets.get(topic, set()))
        if not targets:
            return 0
        payload = json.dumps(message, default=str)
        await asyncio.gather(*(self._safe_send(ws, payload) for ws in targets))
        return len(targets)

    # ---------------------------------------------------------------- stats
    def stats(self) -> Dict[str, Any]:
        return {
            "connected_users": len(self._user_sockets),
            "total_sockets": len(self._socket_user),
            "topics": len(self._topic_sockets),
            "topic_subscribers": {
                t: len(s) for t, s in self._topic_sockets.items()
            },
        }


# Process-wide singleton.
manager = ConnectionManager()
