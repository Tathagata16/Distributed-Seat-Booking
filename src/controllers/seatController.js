import SeatService from "../services/seatService.js";


export const getAvailableSeats = async (req, res) => {
  try {

    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    const seats = await SeatService.getAvailableSeats(eventId);

    return res.status(200).json({
      eventId,
      availableSeats: seats,
      totalAvailable: seats.length,
    });

  } catch (error) {
    console.error("Seat availability error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




