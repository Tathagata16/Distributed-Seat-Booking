import prisma from "../config/database.js";
import SeatAvailabilityService from "./seatAvailabilityService.js";

class SeatService {
    static async getAvailableSeats(eventId) {
        //1.check if availability set exists in redis
        const exists = await SeatAvailabilityService.exists(eventId);

        //2. If redis key missing -> rebuild
        if (!exists) {
            const seats = await prisma.seat.findMany({
                where: { eventId },
                select: { id: true },
            });

            const seatIds = seats.map(seat => seat.id);
            await SeatAvailabilityService.seedAvailability(eventId, seatIds);
        }

        // 3️. Return Redis set members
        const availableSeats =
            await SeatAvailabilityService.getAvailableSeats(eventId);

        return availableSeats;
    }
}

export default SeatService;