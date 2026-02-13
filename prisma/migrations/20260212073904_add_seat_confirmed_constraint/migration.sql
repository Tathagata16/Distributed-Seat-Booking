-- This is an empty migration.
CREATE UNIQUE INDEX unique_confirmed_seat
ON "Booking" ("seatId")
WHERE status = 'CONFIRMED';
