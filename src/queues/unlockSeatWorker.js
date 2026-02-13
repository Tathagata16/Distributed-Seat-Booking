import { Worker } from "bullmq";
import redis from "../config/redis.js";
import prisma from "../config/database.js";
import { BOOKING_STATUS } from "../utils/constants.js";
import SeatAvailabilityService from "../services/seatAvailabilityService.js";

const unlockSeatWorker = new Worker(
    "unlock-seat",
    async (job) => {
        const { seatId, bookingId, eventId } = job.data;

        const key = `lock:seat:${seatId}`;

        //fetch lock
        const lockData = await redis.get(key);
        if (!lockData) {
            return;//already lock expired or removed
        }

        const parsed = JSON.parse(lockData);
        //2.ownership check
        if (parsed.bookingId !== bookingId) {
            return;//lock belongs to someone else
        }

        // 3. cancel booking
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: BOOKING_STATUS.CANCELLED },
        })

        await SeatAvailabilityService.addSeat(eventId, seatId);


        //4. removing lock safely
        await redis.del(key);
    },
    {
        connection: redis,
    }
);

export default unlockSeatWorker;