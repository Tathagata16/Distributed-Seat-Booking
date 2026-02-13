import express from 'express'
import { getAvailableSeats } from '../../controllers/seatController.js'

const router = express.Router();

router.get("/:eventId/seats", getAvailableSeats);
export default router;