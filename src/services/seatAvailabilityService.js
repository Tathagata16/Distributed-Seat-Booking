import redis from "../config/redis.js";

class SeatAvailabilityService {

    //redis key format
    static buildKey(eventId) {
        return `available:seats:${eventId}`;
    }

    //Seed availability set from DB
    static async seedAvailability(eventId, seatIds){
        const key = this.buildKey(eventId);

        if (seatIds.length == 0) return;

        //add all seats to Redis SET
        await redis.sadd(key, ...seatIds);

    }

    //remove seat from availability (when locked or confirmed)
    static async removeSeat(eventId, seatId) {
        const key = this.buildKey(eventId);
        await redis.srem(key, seatId);
    }

    //checking if seat exists
    static async exists(eventId) {
        const key = this.buildKey(eventId);
        return await redis.exists(key);
    }


    // Get all available seats
    static async getAvailableSeats(eventId) {
        const key = this.buildKey(eventId);
        return await redis.smembers(key);
    }

}

export default SeatAvailabilityService;








