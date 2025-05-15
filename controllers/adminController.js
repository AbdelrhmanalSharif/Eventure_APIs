const { sql, poolPromise } = require("../config/database");
const { getFullEventById } = require("../utils/fetchFullEvent");

// Get all non-admin users, grouped by type
const getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserID, FullName, Email, UserType, CreatedAt, ProfilePicture
      FROM Users
      WHERE UserType != 'Admin'
      ORDER BY UserID ASC
    `);

    // const grouped = result.recordset.reduce((acc, user) => {
    //   if (!acc[user.UserType]) acc[user.UserType] = [];
    //   acc[user.UserType].push(user);
    //   return acc;
    // }, {});

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Admin getAllUsers error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};

// Get all events with categories, images, and company name
const getAllEvents = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT EventID FROM Events
      ORDER BY EventID ASC
    `);

    const events = [];
    for (const row of result.recordset) {
      const fullEvent = await getFullEventById(row.EventID);
      if (fullEvent) events.push(fullEvent);
    }

    res.status(200).json(events);
  } catch (error) {
    console.error("Admin getAllEvents error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch events", error: error.message });
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Users WHERE UserID = @id");
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin deleteUser error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
};

// Delete event by ID
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Events WHERE EventID = @id");
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Admin deleteEvent error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete event", error: error.message });
  }
};

// Get platform stats
const getPlatformStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Users WHERE UserType != 'Admin') AS userCount,
        (SELECT COUNT(*) FROM Events) AS eventCount,
        (SELECT COUNT(*) FROM Bookings) AS bookingCount,
        (SELECT COUNT(*) FROM Payments) AS paymentCount
    `);

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Admin getPlatformStats error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: error.message });
  }
};

// Get all reviews
const getAllReviews = async (req, res) => {
  try {
    const pool = await poolPromise;
    const reviewsRes = await pool.request().query(`
      SELECT r.ReviewID, r.Rating, r.ReviewText, r.CreatedAt, u.UserID,
        u.FullName AS ReviewerName, u.ProfilePicture AS ReviewerPicture,
        e.EventID, e.Title 
      FROM  Events e
      JOIN Reviews r ON e.EventID = r.EventID
      JOIN Users u ON r.UserID = u.UserID
      ORDER BY r.CreatedAt DESC
    `);
    if (reviewsRes.recordset.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }
    const reviews = reviewsRes.recordset;
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Server error during retreiving reviews:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch reviews", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAllEvents,
  deleteUser,
  deleteEvent,
  getPlatformStats,
  getAllReviews,
};
