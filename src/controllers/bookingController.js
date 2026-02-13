import LockService from "../services/lockService.js";
import BookingService from "../services/bookingService.js";

import unlockSeatQueue from "../queues/unlockSeatQueue.js";

import SeatAvailabilityService from "../services/seatAvailabilityService.js";

import { BOOKING_STATUS, LOCK_TTL } from "../utils/constants.js";
import prisma from "../config/database.js";
import redis from "../config/redis.js";

export const lockSeat = async (req, res, next) => {
    try {
        const { eventId, seatId } = req.body;
        const userId = req.user.id; //from auth middlewares

        if (!eventId || !seatId) {
            return res.status(400).json({ message: "Invalid input" });
        }
        const booking = await BookingService.createPendingBooking(
            userId, eventId, seatId
        );

        const lockAcquired = await LockService.acquireSeatLock(seatId, { userId, bookingId: booking.id, seatId });

        if (!lockAcquired) {

            await prisma.booking.delete({
                where: { id: booking.id }
            });

            return res.status(409).json({ message: "Seat already locked" });
        }

        await SeatAvailabilityService.removeSeat(eventId, seatId);


        //Schedule auto unlock job
        await unlockSeatQueue.add(
            "unlockSeat",
            {
                seatId,
                bookingId: booking.id,
                eventId,

            },
            { delay: LOCK_TTL }
        );

        return res.status(201).json({
            message: "Seat locked successfully",
            bookingId: booking.id,
            expiresIn: LOCK_TTL,
        });


    } catch (error) {
        next(error);
    }
}

export const confirmBooking = async (req, res) => {
    try {
        //extracting input from body
        const { bookingId, paymentAmount } = req.body;

        //since auth middlewares are not there yet, will use mock userid
        const userId = req.user.id;

        //2.validate
        if (!bookingId || !paymentAmount) {
            return res.status(400).json({ message: "Invalid input" });
        }

        //3. fetch booking from db
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        //if booking doesn't exist
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.userId != userId) {
            return res.status(403).json({
                message: "You do not own this booking",
            });
        }

        //4. Ensure booking is still PENDING
        if (booking.status !== BOOKING_STATUS.PENDING) {
            return res.status(409).json({
                message: "Booking is not in confirmable state",
            })
        }

        //5. verify redis lock ownership
        const lockKey = `lock:seat:${booking.seatId}`;
        const lockData = await redis.get(lockKey);

        if (!lockData) {
            return res.status(409).json({
                message: "Lock expired. Cannot confirm booking.",
            });
        }

        const parsedLock = JSON.parse(lockData);

        //ensure the lock belongs to this booking
        if (parsedLock.bookingId !== bookingId) {
            return res.status(403).json({
                message: "Lock does not belong to this booking",
            })
        }

        // 6. starting db transaction***
        const result = await prisma.$transaction(async (tx) => {
            const updatedBooking = await tx.booking.upadte({
                where: { id: bookingId },
                data: { status: BOOKING_STATUS.CONFIRMED }
            });

            //insert payment record
            await tx.payment.create({
                data: {
                    bookingId: bookingId,
                    amount: paymentAmount,
                    status: "SUCCESS",
                },
            });

            return updatedBooking;
        })

        //deleting seatavailability from redis as well permanently
        await SeatAvailabilityService.removeSeat(booking.eventId, booking.seatId);


        // 7. safely release redis lock (ownership check again)
        const latestLockData = await redis.get(lockKey);

        if (latestLockData) {
            const parsed = JSON.parse(latestLockData);

            if (parsed.bookingId === bookingId) {
                await redis.del(lockKey);
            }
        }

        // 8. return success
        return res.status(200).json({
            message: "Booking confirmed successfully",
            booking: result,
        });




    } catch (error) {
        console.error("Confirm booking error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}