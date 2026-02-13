import prisma from "../config/database.js";
import SeatAvailabilityService from "../services/seatAvailabilityService.js";

async function seedAllEvents(params) {

    const events = await prisma.event.findMany({
        include: {
            seats: true,
        },
    });

    for (const event of events) {
        const seatIds = event.seats.map(seat => seat.id);

        await SeatAvailabilityService.seedAvailability(event.id, seatIds);
    }

    console.log("Seat availability seeded");
}

seedAllEvents();








