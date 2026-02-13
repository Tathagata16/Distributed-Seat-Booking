import express from "express";
import bookingRoutes from "./bookingRoutes.js";
import eventRoutes from "./eventRoutes.js";
import authRoutes from "./authRoutes.js";

const router = express.Router();

router.use("/bookings", bookingRoutes);
router.use("/events", eventRoutes);
router.use("/auth", authRoutes);

export default router;
