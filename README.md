# Distributed Event Booking System

A high-concurrency backend system that prevents double booking using distributed locks, transactional guarantees, and database-level constraints.

This project simulates the core backend of platforms like BookMyShow, Ticketmaster, or airline seat reservation systems.

---

## 🚀 Tech Stack

* **Node.js + Express**
* **PostgreSQL (Supabase)**
* **Prisma ORM**
* **Redis**
* **BullMQ (background jobs)**
* **JWT Authentication**
* **Sliding Window Rate Limiting**
* **Idempotency protection**

---

## 🎯 Problem Statement

When thousands of users try to book limited seats simultaneously:

* How do we prevent double booking?
* How do we handle retries safely?
* How do we recover from failures?
* How do we scale reads efficiently?

This system solves those challenges.

---

## 🧠 Architecture Overview

### Core Principles

* **Redis = Temporary truth (locking + availability)**
* **Database = Final truth (confirmed bookings)**
* **Queue = Delayed recovery & cleanup**
* **Partial unique DB index = Absolute safety**

---

## 🏗 Booking Lifecycle

```
AVAILABLE → LOCKED → CONFIRMED
           ↓
        EXPIRED
```

### Seat becomes unavailable when:

* Locked (Redis TTL)
* Confirmed (DB)

---

## 🔐 Concurrency Control

### Redis Distributed Lock

```redis
SET lock:seat:{seatId} bookingId NX PX 300000
```

Guarantees:

* Only one user can lock a seat
* Automatic expiration via TTL
* Ownership verification before confirmation

---

## 🧾 Database Integrity

### PostgreSQL Partial Unique Index

```sql
CREATE UNIQUE INDEX unique_confirmed_seat
ON "Booking" ("seatId")
WHERE status = 'CONFIRMED';
```

Even if Redis fails:

* Database prevents double booking.

---

## ⚙️ Booking Confirmation Flow

1. Validate booking ownership
2. Verify Redis lock ownership
3. Run DB transaction:

   * Update booking status → CONFIRMED
   * Insert payment record
4. Release Redis lock
5. Return idempotent response

---

## 🔁 Idempotency

`Idempotency-Key` header required for `/confirm`

Prevents:

* Duplicate payments
* Double confirmation
* Retry corruption

Redis stores previous response for safe replay.

---

## 🛡 Rate Limiting

Sliding window algorithm using Redis ZSET:

* Lock endpoint: 5 req / 10 sec
* Confirm endpoint: 3 req / 10 sec

Prevents abuse & bot attacks.

---

## 📦 Seat Availability (Read Scaling)

Redis SET maintains:

```
available:seats:{eventId}
```

Reads are:

* O(1)
* DB-independent
* Self-healing if Redis crashes

---

## 🔄 Background Jobs

Unlock worker:

* Cancels expired PENDING bookings
* Safely verifies lock ownership
* Restores seat availability

---

## 🔑 API Endpoints

### Auth

```
POST /api/v1/auth/register
POST /api/v1/auth/login
```

### Booking

```
POST /api/v1/bookings/lock
POST /api/v1/bookings/confirm
```

### Events

```
GET /api/v1/events/:eventId/seats
```

### Health

```
GET /health
```

---

## 🧪 Running Locally

### 1️⃣ Install dependencies

```
npm install
```

### 2️⃣ Configure environment

Create `.env` using `.env.example`

### 3️⃣ Run migrations

```
npx prisma migrate dev
```

### 4️⃣ Start Redis

Ensure Redis server is running.

### 5️⃣ Start server

```
npm run dev
```

---

## 🧠 Scaling Considerations

### If traffic increases to 50k concurrent users:

* Redis can be clustered
* API can be horizontally scaled (stateless)
* DB can use read replicas
* Lock contention can be sharded per event

---

## 🔥 Key Design Decisions

| Decision                   | Reason                     |
| -------------------------- | -------------------------- |
| Redis locks before DB      | Avoid heavy DB row locking |
| DB partial unique index    | Absolute safety layer      |
| Idempotency on confirm     | Payment retry protection   |
| Sliding window limiter     | Accurate rate control      |
| Redis SET for availability | Read scalability           |

---

## 📈 Future Improvements

* Payment failure simulation service
* Structured logging & request tracing
* Worker separation into independent process
* Refresh token authentication
* Event pagination
* Observability metrics

---

# 🔍 Current Bugs / Weaknesses

Be honest — this is how engineers grow.

---

## 1️⃣ Lock Removal Order

Currently:

* Lock removed after transaction
* But not using Lua atomic compare-and-delete

Improvement:

* Use Lua script for safe atomic unlock

---

## 2️⃣ No Refresh Token Flow

Auth currently:

* Single JWT
* No refresh token rotation
* No logout invalidation

---

## 3️⃣ No Structured Logging

Still using:

```
console.log
```

Should use:

* Pino or Winston
* JSON structured logs
* Request ID correlation

---

## 4️⃣ Manual Try/Catch in Controllers

We still have inline error handling.
Should refactor to:

* Throw errors
* Use global error middleware consistently

---

## 5️⃣ Redis Rebuild Is Naive

If Redis restarts:

* First request rebuilds availability
* But no confirmed-seat reconciliation

Better approach:

* Rebuild from DB excluding CONFIRMED seats

---

## 6️⃣ No Load Testing

No stress testing done yet.

Should:

* Simulate concurrent booking
* Use autocannon or k6

---

## 7️⃣ No Multi-Seat Booking Support

Currently handles:

* Single seat lock per request

Production system:

* Lock multiple seats atomically

---

## 8️⃣ Worker & API Not Decoupled

Currently:

* Worker runs inside same process

Production:

* Separate worker service

---

