const { sql, poolPromise } = require("../config/database");
const { getFullEventById } = require("../utils/fetchFullEvent");

// Book an event
const bookEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId, nbOfTickets } = req.body;

    if (!eventId) {
      return res
        .status(400)
        .json({ message: "Event ID is required in the request body" });
    }

    if (!nbOfTickets) {
      nbOfTickets = 1; // Default to 1 ticket if not provided
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
          "SELECT ISNULL(SUM(NbOfTickets), 0) as Count FROM Bookings WHERE EventID = @eventId"
        );

      if (countResult.recordset[0].Count >= MaxAttendees) {
        return res.status(400).json({ message: "This event is fully booked" });
      }

      // Check if the requested number of tickets exceeds the remaining capacity
      const remainingCapacity = MaxAttendees - countResult.recordset[0].Count;
      if (nbOfTickets > remainingCapacity) {
        return res.status(450).json({
          message: `Only ${remainingCapacity} tickets available for this event`,
        });
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
      .input("eventId", sql.Int, eventId)
      .input("nbOfTickets", sql.Int, nbOfTickets).query(`
        INSERT INTO Bookings (UserID, EventID, NbOfTickets, BookingDate)
        VALUES (@userId, @eventId, @nbOfTickets, GETDATE());
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
        `SELECT BookingID, EventID, BookingDate, NbOfTickets 
        FROM Bookings WHERE UserID = @userId ORDER BY BookingDate DESC`
      );

    const bookings = [];

    for (const row of result.recordset) {
      const event = await getFullEventById(row.EventID);
      if (event) {
        bookings.push({
          BookingID: row.BookingID,
          BookingDate: row.BookingDate,
          NbOfTickets: row.NbOfTickets,
          Event: event,
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
    const pool = await poolPromise;

    const result = await pool.request().query(
      `SELECT BookingID, EventID, UserID, BookingDate, NbOfTickets 
        FROM Bookings ORDER BY BookingID Asc`
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

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

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
        `SELECT u.UserID, u.FullName, u.Email, SUM(b.NbOfTickets) AS NbOfBookedTickets
          FROM Users AS u
          JOIN Bookings AS b ON u.UserID = b.UserID
          JOIN Events AS e ON b.EventID = e.EventID
          WHERE e.EventID = @eventId
          GROUP BY u.UserID, u.FullName, u.Email
          ORDER BY u.UserID ASC;`
      );
    res.status(200).json({
      bookedUsers: result.recordset,
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
    console.log("User ID:", userId);
    console.log("Event ID:", eventId);
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId)
      .query(
        "SELECT * FROM Bookings WHERE UserID = @userId AND EventID = @eventId"
      );

    console.log("Verify booking result:", result.recordset);

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

const getNbOfAvailableTickets = async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const pool = await poolPromise;

    const maxAttendeesResult = await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query(`Select MaxAttendees from Events where EventID = @eventId`);

    if (maxAttendeesResult.recordset.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    const maxAttendees = maxAttendeesResult.recordset[0].MaxAttendees;

    const countResult = await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query(
        "SELECT ISNULL(SUM(NbOfTickets), 0) as Count FROM Bookings WHERE EventID = @eventId"
      );
    const nbOfBookedTickets = countResult.recordset[0].Count;

    const availableTickets = maxAttendees - nbOfBookedTickets;
    console.log(
      `Event ID: ${eventId}, Max Attendees: ${maxAttendees}, Booked Tickets: ${nbOfBookedTickets}, Available Tickets: ${availableTickets}`
    );

    res.status(200).json({ availableTickets });
  } catch (error) {
    console.error("Fetch available tickets error:", error);
    res.status(500).json({
      message: "Server error while fetching available tickets",
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
  getNbOfAvailableTickets,
};
