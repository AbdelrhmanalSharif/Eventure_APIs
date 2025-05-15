const { sql, poolPromise } = require("../config/database");

// Add a review
const addReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId, rating, reviewText } = req.body;

    if (!eventId || !rating) {
      return res
        .status(400)
        .json({ message: "Event ID and rating are required" });
    }

    const pool = await poolPromise;

    // Check if event exists
    const eventCheck = await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query("SELECT 1 FROM Events WHERE EventID = @eventId");

    if (eventCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Event does not exist" });
    }

    // Check if user booked this event
    const bookingCheck = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId)
      .query(
        "SELECT 1 FROM Bookings WHERE UserID = @userId AND EventID = @eventId"
      );

    if (bookingCheck.recordset.length === 0) {
      return res
        .status(403)
        .json({ message: "You must book the event before reviewing it" });
    }

    // Insert review
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId)
      .input("rating", sql.Int, rating)
      .input("reviewText", sql.NVarChar, reviewText || null).query(`
        INSERT INTO Reviews (UserID, EventID, Rating, ReviewText)
        VALUES (@userId, @eventId, @rating, @reviewText)
      `);

    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ message: "Server error while adding review" });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("reviewId", sql.Int, reviewId)
      .input("userId", sql.Int, userId)
      .input("rating", sql.Int, rating)
      .input("reviewText", sql.NVarChar, reviewText || null).query(`
        UPDATE Reviews
        SET Rating = @rating, ReviewText = @reviewText
        WHERE ReviewID = @reviewId AND UserID = @userId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Review not found or not yours" });
    }

    res.status(200).json({ message: "Review updated successfully" });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ message: "Server error while updating review" });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("reviewId", sql.Int, reviewId)
      .query(`DELETE FROM Reviews WHERE ReviewID = @reviewId`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Review not found!" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Server error while deleting review" });
  }
};

const getReviewsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const pool = await poolPromise;
    const reviewsRes = await pool.request().input("eventId", sql.Int, eventId)
      .query(`
      SELECT r.ReviewID, r.Rating, r.ReviewText, r.CreatedAt, u.UserID,
        u.FullName AS ReviewerName, u.ProfilePicture AS ReviewerPicture,
        e.EventID, e.Title 
      FROM  Events e
      JOIN Reviews r ON e.EventID = r.EventID
      JOIN Users u ON r.UserID = u.UserID
      WHERE r.EventID = @eventId
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
  addReview,
  updateReview,
  deleteReview,
  getReviewsByEventId,
};
