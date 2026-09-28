"""Server-Sent Events for live incident status updates."""

import asyncio
import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.services.event_bus import event_bus

router = APIRouter()


@router.get("/incidents/{incident_id}/events")
async def incident_events(incident_id: str, request: Request):
    queue = event_bus.subscribe(incident_id)

    async def generator():
        try:
            yield _sse("connected", {"incident_id": incident_id, "event": "connected"})
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15)
                    yield _sse(payload.get("event", "update"), payload)
                except TimeoutError:
                    yield _sse("heartbeat", {"ok": True})
        finally:
            event_bus.unsubscribe(incident_id, queue)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, default=str)}\n\n"
