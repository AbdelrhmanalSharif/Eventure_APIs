const { sql, poolPromise } = require("../config/database");

const createFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { FeedbackText } = req.body;

    if (!FeedbackText) {
      return res.status(400).json({ message: "Feedback text is required" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("feedbackText", sql.NVarChar, FeedbackText)
      .query(
        "INSERT INTO Feedback (UserId, FeedbackText) VALUES (@userId, @feedbackText)"
      );
    if (!result.rowsAffected[0]) {
      return res.status(500).json({ message: "Failed to create feedback" });
    }

    res.status(200).json({ message: "Feedback created successfully" });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(304).json({ message: "Unauthorized" });
    }
    const pool = await poolPromise;
    const result = await pool.request().query(
      `SELECT f.FeedbackID, f.UserID, f.FeedbackText, 
        f.CreatedAt, f.Checked, f.CheckedAt, u.FullName, u.ProfilePicture
        FROM Feedback f
        JOIN Users u ON f.UserID = u.UserID;`
    );
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No feedback found" });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const setCompletedFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(304).json({ message: "Unauthorized!" });
    }

    const feedbackId = req.params.id;
    if (!feedbackId) {
      return res.status(400).json({ message: "FeedbackID is required" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("feedbackId", sql.Int, feedbackId)
      .query("Select * from Feedback WHERE FeedbackID = @feedbackId");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    const updateResult = await pool
      .request()
      .input("feedbackId", sql.Int, feedbackId)
      .query(
        "UPDATE Feedback SET Checked = 1, CheckedAt = GETDATE() WHERE FeedbackID = @feedbackId"
      );

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(400).json({ message: "Error updating feedback!" });
    }

    res.status(200).json({ message: "Feedback marked as completed." });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createFeedback,
  getAllFeedback,
  setCompletedFeedback,
};
