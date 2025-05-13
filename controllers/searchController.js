const { sql, poolPromise } = require("../config/database");
const { getFullEventById } = require("../utils/fetchFullEvent");

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const pool = await poolPromise;
    const results = {};

    // Search Events (fetch only IDs for efficiency)
    const eventIdResults = await pool
      .request()
      .input("searchTerm", sql.NVarChar, `%${q}%`).query(`
        SELECT e.EventID
        FROM Events e
        LEFT JOIN Users u ON e.CompanyID = u.UserID
        WHERE e.Title LIKE @searchTerm
           OR e.Description LIKE @searchTerm
           OR e.Location LIKE @searchTerm
      `);

    const fullEvents = [];
    for (const row of eventIdResults.recordset) {
      const fullEvent = await getFullEventById(row.EventID);
      if (fullEvent) fullEvents.push(fullEvent);
    }
    results.events = fullEvents;

    // Search Reviews (no change needed)
    const reviews = await pool
      .request()
      .input("searchTerm", sql.NVarChar, `%${q}%`).query(`
        SELECT r.*, u.FullName AS Reviewer, e.Title AS EventTitle
        FROM Reviews r
        LEFT JOIN Users u ON r.UserID = u.UserID
        LEFT JOIN Events e ON r.EventID = e.EventID
        WHERE r.ReviewText LIKE @searchTerm
           OR CAST(r.Rating AS NVARCHAR) LIKE @searchTerm
      `);
    results.reviews = reviews.recordset;

    // Search Users
    const users = await pool
      .request()
      .input("searchTerm", sql.NVarChar, `%${q}%`).query(`
        SELECT UserID, FullName, Email, UserType
        FROM Users
        WHERE FullName LIKE @searchTerm OR Email LIKE @searchTerm
      `);
    results.users = users.recordset;

    res.status(200).json(results);
  } catch (error) {
    console.error("Global search error:", error);
    res
      .status(500)
      .json({ message: "Server error during search", error: error.message });
  }
};

const addSearchQuery = async (req, res) => {
  try {
    userId = req.user.userId;
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("query", sql.NVarChar, query).query(`
        INSERT INTO SearchHistory (UserID, SearchQuery, SearchType, SearchedAt)
        VALUES (@userId, @query, 'Event', GETDATE())
      `);
    if (result.rowsAffected[0] > 0) {
      return res.status(200).json({ message: "Search query added to history" });
    }
  } catch (error) {
    console.error("Error adding search query to history:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  globalSearch,
  addSearchQuery,
};
