import express from 'express'
import { lockSeat, confirmBooking } from '../../controllers/bookingController.js'
import authMiddleware from "../../middlewares/auth.js"
import rateLimiter from '../../middlewares/rateLimiter.js';

const router = express.Router();

router.post("/lock",authMiddleware,rateLimiter(5,10), lockSeat);
router.post("/confirm",authMiddleware,rateLimiter(3,10),confirmBooking);

export default router;