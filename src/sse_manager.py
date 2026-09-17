import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any

logger = logging.getLogger("intellidesk.sse")

class SSEBroadcaster:
    """
    In-memory async SSE Event Broadcaster managing real-time push deliveries 
    for Staff Queue and Customer Portal streams.
    """
    def __init__(self):
        self.staff_queues: Set[asyncio.Queue] = set()
        self.customer_queues: Dict[str, Set[asyncio.Queue]] = {}

    def subscribe_staff(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.staff_queues.add(q)
        logger.info(f"Staff SSE client subscribed. Total active staff streams: {len(self.staff_queues)}")
        return q

    def unsubscribe_staff(self, q: asyncio.Queue):
        self.staff_queues.discard(q)
        logger.info(f"Staff SSE client unsubscribed. Remaining active: {len(self.staff_queues)}")

    def subscribe_customer(self, customer_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        if customer_id not in self.customer_queues:
            self.customer_queues[customer_id] = set()
        self.customer_queues[customer_id].add(q)
        logger.info(f"Customer '{customer_id}' SSE client subscribed.")
        return q

    def unsubscribe_customer(self, customer_id: str, q: asyncio.Queue):
        if customer_id in self.customer_queues:
            self.customer_queues[customer_id].discard(q)
            if not self.customer_queues[customer_id]:
                del self.customer_queues[customer_id]
        logger.info(f"Customer '{customer_id}' SSE client unsubscribed.")

    async def broadcast_to_staff(self, event_type: str, data: Dict[str, Any]):
        """Push real-time event to all connected staff queue clients"""
        payload = {
            "event": event_type,
            "data": data
        }
        for q in list(self.staff_queues):
            try:
                await q.put(payload)
            except Exception as e:
                logger.warning(f"Error putting event to staff queue: {e}")

    async def broadcast_to_customer(self, customer_id: str, event_type: str, data: Dict[str, Any]):
        """Push real-time event to connected customer portal streams for customer_id"""
        payload = {
            "event": event_type,
            "data": data
        }
        if customer_id in self.customer_queues:
            for q in list(self.customer_queues[customer_id]):
                try:
                    await q.put(payload)
                except Exception as e:
                    logger.warning(f"Error putting event to customer '{customer_id}' queue: {e}")

# Global SSE Broadcaster Singleton
sse_broadcaster = SSEBroadcaster()
