-- PostgreSQL 15+; staging schema for future transactional appointment claims.
-- This migration does not activate bookings. Never use a local Set as production lock.
BEGIN;
CREATE TABLE IF NOT EXISTS booking_slot_claims (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site text NOT NULL DEFAULT 'molfetta' CHECK (site = 'molfetta'),
  slot_start timestamptz NOT NULL,
  slot_end timestamptz NOT NULL,
  state text NOT NULL CHECK (state IN ('held', 'confirmed', 'cancelled', 'expired')),
  external_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  modified_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slot_end = slot_start + interval '20 minutes')
);
-- Prevent simultaneous live claims for exactly the same start time across server instances.
CREATE UNIQUE INDEX IF NOT EXISTS booking_one_live_claim_per_slot
  ON booking_slot_claims (site, slot_start)
  WHERE state IN ('held', 'confirmed');
CREATE UNIQUE INDEX IF NOT EXISTS booking_external_event_id_unique
  ON booking_slot_claims (external_event_id)
  WHERE external_event_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS booking_cancellation_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  claim_id bigint REFERENCES booking_slot_claims(id),
  external_event_id text NOT NULL,
  site text NOT NULL CHECK (site = 'molfetta'),
  slot_start timestamptz NOT NULL,
  cancelled_at timestamptz NOT NULL DEFAULT now(),
  origin text NOT NULL DEFAULT 'public_portal'
);
COMMIT;

-- Integration requirements before enabling writes:
-- 1. Hold a slot in a DB transaction and handle unique violations as HTTP 409.
-- 2. Confirm Google Calendar availability and create the external event.
-- 3. Confirm the database claim, with reconciliation for Google failures/timeouts.
-- 4. Expire abandoned holds safely; use an idempotency key per request.
-- 5. On cancellation, verify 48h cutoff, delete Google event, audit and release claim
--    using an idempotent, recoverable workflow (outbox/reconciliation).
-- 6. Never log names, email addresses, cancellation codes or medical information here.
