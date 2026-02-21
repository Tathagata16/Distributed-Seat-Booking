# Security & Workflow Audit

## Scope
- Static review of authentication, booking, locking, queue worker, rate limiting, and bootstrapping flow.
- Runtime sanity checks via `node --check` and `npm test`.

## Critical Findings

1. **Registration is broken due to incorrect bcrypt usage**
   - `bcrypt.hash(password.SALT_ROUNDS)` uses property access on the password string instead of the `SALT_ROUNDS` constant, causing registration failures and potential runtime errors.
   - File: `src/controllers/authController.js`

2. **Booking confirmation cannot succeed because of Prisma typo**
   - Confirmation calls `tx.booking.upadte(...)` (misspelled), so the confirm path always fails and returns 500.
   - File: `src/controllers/bookingController.js`

3. **Rate limiter is effectively disabled**
   - Middleware uses `redis.add(...)`, which is not an ioredis command for sorted sets. This throws and enters fail-open behavior (`next()`), allowing unlimited requests.
   - This creates abuse and brute-force risk against `/bookings/lock` and `/bookings/confirm`.
   - File: `src/middlewares/rateLimiter.js`

4. **Worker restoration path is broken**
   - Worker calls `SeatAvailabilityService.addSeat(...)`, but this method does not exist in `SeatAvailabilityService`, causing unlock jobs to fail.
   - Impact: expired locks may not restore availability correctly, causing stale inventory behavior.
   - Files: `src/queues/unlockSeatWorker.js`, `src/services/seatAvailabilityService.js`

## High-Risk Vulnerabilities / Logic Weaknesses

5. **Unsafe lock release (TOCTOU race)**
   - Lock release in confirmation does a `GET` then `DEL` in separate commands. If lock ownership changes between operations, one booking can delete another booking's valid lock.
   - Use atomic Lua compare-and-delete.
   - File: `src/controllers/bookingController.js`

6. **Seat ownership validation missing (IDOR/business logic flaw)**
   - `lockSeat` creates a booking for any `eventId` + `seatId` pair without verifying the seat belongs to the event.
   - A client can submit mismatched IDs and pollute booking records, resulting in inconsistent state and potential denial of inventory.
   - Files: `src/controllers/bookingController.js`, `src/services/bookingService.js`

7. **Weak input validation on payment amount**
   - `confirmBooking` only checks truthiness (`!paymentAmount`), accepting negative/NaN-like values if serialized unexpectedly and rejecting valid `0` only by accident.
   - Use strict numeric validation and minimum constraints.
   - File: `src/controllers/bookingController.js`

8. **Worker starts inside API process**
   - API imports worker directly, tightly coupling web traffic and background processing. A crash/failure domain can impact both planes.
   - File: `src/app.js`

## Reliability / Correctness Bugs

9. **Incorrect worker import path in app bootstrap**
   - In `src/app.js`, `import "./src/queues/unlockSeatWorker.js";` points to `src/src/...` relative path and is invalid for expected layout.
   - File: `src/app.js`

10. **Potential information leakage in Prisma config**
   - `prisma.config.ts` logs `DATABASE_URL` to stdout, risking credential leakage in shared logs/CI.
   - File: `prisma.config.ts`

11. **Schema omits datasource URL declaration in `schema.prisma`**
   - While config may inject URL, this is fragile and can break common Prisma tooling assumptions.
   - File: `prisma/schema.prisma`

## Recommended Remediation Order

1. Fix auth hash bug and booking confirm typo.
2. Repair rate limiter (`ZADD`-based sliding window) and add tests.
3. Add `SeatAvailabilityService.addSeat` and ensure worker idempotency.
4. Implement atomic lock release via Lua compare-and-delete.
5. Add request validation schema (event-seat relationship, payment numeric constraints).
6. Decouple worker into a separate process.
7. Remove sensitive env logging from Prisma config.

