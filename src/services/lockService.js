import redis from "../config/redis.js"

import { LOCK_TTL } from "../utils/constants.js"

class LockService{
    static async acquireSeatLock(seatId, value){
        const key = `lock:seat:${seatId}`;

        const result = await redis.set(
            key, 
            JSON.stringify(value),
            "NX",
            "PX",
            LOCK_TTL
        );
        return result === "OK";
    }

    static async getSeatLock(seatId){
        const key = `lock:seat:${seatId}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    static async releaseSeatLock(seatId){
        const key = `lock:seat:${seatId}`;
        await redis.del(key);
    }
}

export default LockService;