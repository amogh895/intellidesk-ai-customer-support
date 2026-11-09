import os
import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any, List

logger = logging.getLogger("intellidesk.sse")

class StaffSubscription:
    def __init__(self, queue: asyncio.Queue, role: str, team: str, staff_id: str):
        self.queue = queue
        self.role = role
        self.team = team
        self.staff_id = staff_id

class SSEBroadcaster:
    """
    Robust Pub/Sub SSE Event Broadcaster managing real-time push deliveries 
    for Staff Cockpit and Customer Portal streams with role/team filtering.
    """
    def __init__(self):
        self.staff_subs: Set[StaffSubscription] = set()
        self.customer_queues: Dict[str, Set[asyncio.Queue]] = {}

    def subscribe_staff(self, role: str = "Customer Service Manager (CSM)", team: str = "Executive", staff_id: str = "STAFF-001") -> StaffSubscription:
        q = asyncio.Queue()
        sub = StaffSubscription(queue=q, role=role, team=team, staff_id=staff_id)
        self.staff_subs.add(sub)
        logger.info(f"Staff SSE client subscribed ({role}, {team}, {staff_id}). Active staff streams: {len(self.staff_subs)}")
        return sub

    def unsubscribe_staff(self, sub: StaffSubscription):
        self.staff_subs.discard(sub)
        logger.info(f"Staff SSE client unsubscribed. Remaining active: {len(self.staff_subs)}")

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

    def broadcast_to_staff(
        self,
        event_type: str,
        data: Dict[str, Any],
        target_role: Optional[str] = None,
        target_team: Optional[str] = None
    ):
        """
        Push real-time event to staff clients.
        Filters by team and role:
        - Customer Service Manager (CSM) receives all events across all teams.
        - Senior CSR and Support Agents receive events matching their team (or global events).
        """
        payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        for sub in list(self.staff_subs):
            # Filtering logic
            is_csm = sub.role == "Customer Service Manager (CSM)"
            matches_team = (target_team is None or target_team == "" or is_csm or sub.team == target_team)
            matches_role = (target_role is None or target_role == "" or sub.role == target_role or is_csm)

            if matches_team and matches_role:
                try:
                    sub.queue.put_nowait(payload)
                except Exception as e:
                    logger.warning(f"Error putting event to staff queue: {e}")

    def broadcast_to_customer(self, customer_id: str, event_type: str, data: Dict[str, Any]):
        """Push real-time event to connected customer portal streams for customer_id"""
        payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        if customer_id in self.customer_queues:
            for q in list(self.customer_queues[customer_id]):
                try:
                    q.put_nowait(payload)
                except Exception as e:
                    logger.warning(f"Error putting event to customer '{customer_id}' queue: {e}")

# Global SSE Broadcaster Singleton
sse_broadcaster = SSEBroadcaster()
