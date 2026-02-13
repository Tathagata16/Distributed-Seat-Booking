import prisma from "../config/database.js";
import { BOOKING_STATUS } from "../utils/constants.js";

class BookingService {
    static async createPendingBooking(userId, eventId, seatId) {
        return prisma.booking.create({
            data: {
                userId,
                eventId,
                seatId,
                status: BOOKING_STATUS.PENDING,
            },
        });
    }
}

export default BookingService;