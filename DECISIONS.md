# Architectural & Design Decisions (DECISIONS.md)

This log records design decisions, trade-offs, and architectural selections made during the implementation of the IntelliDesk AI CSM Cockpit overhaul.

## Decision 1: Configuration Management & Frontend Base URL
- **Choice**: Created `frontend/src/config.ts` exporting `API_URL` read from `import.meta.env.VITE_API_URL`.
- **Default**: Throws a runtime error if undefined in strict production, while falling back gracefully to `http://localhost:8000/api` during local development if not set.
- **Rationale**: Prevents accidental silent failures in production deployments (such as Vercel) while maintaining effortless developer onboarding on localhost.

## Decision 2: Database Schema Evolution (Additive Only)
- **Choice**: Non-destructive additive migrations via SQLAlchemy `create_all` and explicit `ALTER TABLE` checks in `init_db`.
- **Details**: Added `StaffModel` table for staff credentials and metadata. Added `reason_code`, `reviewer_note`, and `second_approver` fields to `ApprovalQueueModel`.
- **Rationale**: Conforms to Rule 5 ("Do not drop or rewrite existing database tables destructively").

## Decision 3: 3-Tier RBAC Architecture & JWT Payload
- **Choice**: Staff JWT tokens encode `sub` (email), `staff_id`, `role`, `tier`, `team`, and `realm` (`staff`).
- **Thresholds**: Level 1 approvals (< ₹1,00,000) allow Senior CSR or CSM; Level 2 approvals (≥ ₹1,00,000) strictly require CSM. Support Agent role is strictly denied from approving payouts (HTTP 403 Forbidden).
- **Rationale**: Server-side enforcement eliminates client-side security circumvention.

## Decision 4: Real-Time SSE Architecture & Pub/Sub
- **Choice**: `SSEBroadcaster` in `src/sse_manager.py` manages async `asyncio.Queue` per client connection with 15s heartbeat comments (`: heartbeat\n\n`) and Redis pub/sub support if `REDIS_URL` is configured.
- **Event Schema**: Uniform JSON messages with `event` and `data` fields for events: `ticket_created`, `ticket_updated`, `approval_created`, `approval_resolved`, `audit_event`, `kpi_update`, `analytics_update`.
- **Rationale**: Supports long-lived SSE connections on persistent container platforms (Render, Railway, Fly.io) with multi-session sync under 2 seconds.

## Decision 5: Currency Formatting Standard
- **Choice**: Uniform usage of `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`.
- **Rationale**: Replaces legacy mixed dollar (`$1,000`) and rupee symbols with standardized Indian numbering notation (Lakhs and Crores).
