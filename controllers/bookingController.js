const { sql, poolPromise } = require('../config/database');

const bookEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = parseInt(req.params.eventId);
    const pool = await poolPromise;

    // Check if the event exists and get max attendees and price
    const eventResult = await pool.request()
      .input('eventId', sql.Int, eventId)
      .query('SELECT MaxAttendees, Price FROM Events WHERE EventID = @eventId');

    if (eventResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { MaxAttendees, Price } = eventResult.recordset[0];

    // Check if user already booked the event
    const existingBooking = await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query('SELECT * FROM Bookings WHERE UserID = @userId AND EventID = @eventId');

    if (existingBooking.recordset.length > 0) {
      return res.status(409).json({ message: 'You already booked this event' });
    }

    // Check if event is full
    if (MaxAttendees !== null) {
      const countResult = await pool.request()
        .input('eventId', sql.Int, eventId)
        .query('SELECT COUNT(*) as Count FROM Bookings WHERE EventID = @eventId');

      if (countResult.recordset[0].Count >= MaxAttendees) {
        return res.status(400).json({ message: 'This event is fully booked' });
      }
    }

    // Check if the user has completed payment for this event
    const paymentResult = await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query(`
        SELECT * FROM Payments
        WHERE UserID = @userId AND EventID = @eventId AND PaymentStatus = 'Completed'
      `);

    if (paymentResult.recordset.length === 0) {
      return res.status(402).json({ message: 'Payment required to complete booking' });
    }

    // Book the event
    const bookingResult = await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query(`
        INSERT INTO Bookings (UserID, EventID)
        VALUES (@userId, @eventId);
        SELECT SCOPE_IDENTITY() AS BookingID;
      `);

    res.status(201).json({
      message: 'Booking successful',
      bookingId: bookingResult.recordset[0].BookingID
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error while booking event', error: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT b.BookingID, b.BookedAt, e.EventID, e.Title, e.Location, e.StartDate, e.EndDate
        FROM Bookings b
        JOIN Events e ON b.EventID = e.EventID
        WHERE b.UserID = @userId
        ORDER BY b.BookedAt DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings', error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = parseInt(req.params.eventId);
    const pool = await poolPromise;

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query('DELETE FROM Bookings WHERE UserID = @userId AND EventID = @eventId');

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error while cancelling booking', error: error.message });
  }
};

module.exports = {
  bookEvent,
  getUserBookings,
  cancelBooking
};