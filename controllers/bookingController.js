const { sql, poolPromise } = require("../config/database");
const { getFullEventById } = require("../utils/fetchFullEvent");

// Book an event
const bookEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId } = req.body;

    if (!eventId) {
      return res
        .status(400)
        .json({ message: "Event ID is required in the request body" });
    }

    const pool = await poolPromise;

    // Check event existence and capacity
    const eventResult = await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query("SELECT MaxAttendees FROM Events WHERE EventID = @eventId");

    if (eventResult.recordset.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { MaxAttendees } = eventResult.recordset[0];

    // Prevent duplicate bookings
    const existingBooking = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId)
      .query(
        "SELECT * FROM Bookings WHERE UserID = @userId AND EventID = @eventId"
      );

    if (existingBooking.recordset.length > 0) {
      return res.status(409).json({ message: "You already booked this event" });
    }

    // Check if event is full
    if (MaxAttendees !== null) {
      const countResult = await pool
        .request()
        .input("eventId", sql.Int, eventId)
        .query(
          "SELECT COUNT(*) as Count FROM Bookings WHERE EventID = @eventId"
        );

      if (countResult.recordset[0].Count >= MaxAttendees) {
        return res.status(400).json({ message: "This event is fully booked" });
      }
    }

    // Ensure user has completed payment
    const paymentResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId).query(`
        SELECT * FROM Payments
        WHERE UserID = @userId AND EventID = @eventId AND PaymentStatus = 'Completed'
      `);

    if (paymentResult.recordset.length === 0) {
      return res
        .status(402)
        .json({ message: "Payment required to complete booking" });
    }

    // Proceed with booking
    const bookingResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId).query(`
        INSERT INTO Bookings (UserID, EventID)
        VALUES (@userId, @eventId);
        SELECT SCOPE_IDENTITY() AS BookingID;
      `);

    res.status(200).json({
      message: "Booking successful",
      bookingId: bookingResult.recordset[0].BookingID,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      message: "Server error while booking event",
      error: error.message,
    });
  }
};

// View user bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(
        `SELECT BookingID, EventID, BookingDate FROM Bookings WHERE UserID = @userId ORDER BY BookingDate DESC`
      );

    const bookings = [];

    for (const row of result.recordset) {
      const event = await getFullEventById(row.EventID);
      if (event) {
        bookings.push({
          bookingId: row.BookingID,
          bookedAt: row.BookingDate,
          event,
        });
      }
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({
      message: "Server error while fetching bookings",
      error: error.message,
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(
        `SELECT BookingID, EventID, UserID, BookingDate FROM Bookings WHERE UserID = @userId ORDER BY BookingID Asc`
      );
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({
      message: "Server error while fetching bookings",
      error: error.message,
    });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = parseInt(req.params.eventId);
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId)
      .query(
        "DELETE FROM Bookings WHERE UserID = @userId AND EventID = @eventId"
      );

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      message: "Server error while cancelling booking",
      error: error.message,
    });
  }
};

const getBookedUserForEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query(
        `SELECT u.UserID, u.FullName, u.Email from Users as u Join Bookings as b on u.UserID = b.UserID
        Join Events as e on b.EventID = e.EventID
        WHERE e.EventID = @eventId ORDER BY u.UserID ASC`
      );
    res.status(200).json({
      bookedUsers: result.recordset,
      nbOfBookings: result.recordset.length,
    });
  } catch (error) {
    console.error("Fetch booked users error:", error);
    res.status(500).json({
      message: "Server error while fetching booked users",
      error: error.message,
    });
  }
};

// Verify if the user has booked the event
const verifyBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = parseInt(req.params.eventId);
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId)
      .query(
        "SELECT * FROM Bookings WHERE UserID = @userId AND EventID = @eventId"
      );

    if (result.recordset.length > 0) {
      return res.status(200).json({ booked: true });
    } else {
      return res.status(200).json({ booked: false });
    }
  } catch (error) {
    console.error("Verify booking error:", error);
    res.status(500).json({
      message: "Server error while verifying booking",
      error: error.message,
    });
  }
};

module.exports = {
  bookEvent,
  getUserBookings,
  cancelBooking,
  getAllBookings,
  getBookedUserForEvent,
  verifyBooking,
};
