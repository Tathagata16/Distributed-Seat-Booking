import {Queue} from "bullmq";
import redis from "../config/redis.js"

const unlockSeatQueue = new Queue("unlock-seat", {
    connection: redis,
});

export default unlockSeatQueue;