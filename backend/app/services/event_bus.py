"""In-process event bus used for SSE incident updates."""

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

    def subscribe(self, incident_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers[incident_id].append(queue)
        return queue

    def unsubscribe(self, incident_id: str, queue: asyncio.Queue) -> None:
        listeners = self._subscribers.get(incident_id, [])
        if queue in listeners:
            listeners.remove(queue)

    async def publish(self, incident_id: str, payload: dict[str, Any]) -> None:
        for queue in list(self._subscribers.get(incident_id, [])):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                continue

    def publish_sync(self, incident_id: str, payload: dict[str, Any]) -> None:
        for queue in list(self._subscribers.get(incident_id, [])):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                continue


event_bus = EventBus()
