const { sql, poolPromise } = require('../config/database');

const addReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId, rating, reviewText } = req.body;

    if (!eventId || !rating) {
      return res.status(400).json({ message: 'Event ID and rating are required' });
    }

    const pool = await poolPromise;

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .input('rating', sql.Int, rating)
      .input('reviewText', sql.NVarChar, reviewText || null)
      .query(`
        INSERT INTO Reviews (UserID, EventID, Rating, ReviewText)
        VALUES (@userId, @eventId, @rating, @reviewText)
      `);

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error while adding review' });
  }
};

const updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;

    const pool = await poolPromise;

    const result = await pool.request()
      .input('reviewId', sql.Int, reviewId)
      .input('userId', sql.Int, userId)
      .input('rating', sql.Int, rating)
      .input('reviewText', sql.NVarChar, reviewText || null)
      .query(`
        UPDATE Reviews
        SET Rating = @rating, ReviewText = @reviewText
        WHERE ReviewID = @reviewId AND UserID = @userId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Review not found or not yours' });
    }

    res.status(200).json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error while updating review' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input('reviewId', sql.Int, reviewId)
      .input('userId', sql.Int, userId)
      .query(`
        DELETE FROM Reviews
        WHERE ReviewID = @reviewId AND UserID = @userId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Review not found or not yours' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
};

module.exports = {
  addReview,
  updateReview,
  deleteReview
};
