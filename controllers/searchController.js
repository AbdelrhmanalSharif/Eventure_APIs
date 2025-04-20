const { sql, poolPromise } = require('../config/database');

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const pool = await poolPromise;
    const results = {};

    // Search Events
    const events = await pool.request()
      .input('searchTerm', sql.NVarChar, `%${q}%`)
      .query(`
        SELECT e.*, u.FullName AS CompanyName
        FROM Events e
        LEFT JOIN Users u ON e.CompanyID = u.UserID
        WHERE e.Title LIKE @searchTerm
           OR e.Description LIKE @searchTerm
           OR e.Category LIKE @searchTerm
           OR e.Location LIKE @searchTerm
      `);
    results.events = events.recordset;

    // Search Reviews
    const reviews = await pool.request()
      .input('searchTerm', sql.NVarChar, `%${q}%`)
      .query(`
        SELECT r.*, u.FullName AS Reviewer, e.Title AS EventTitle
        FROM Reviews r
        LEFT JOIN Users u ON r.UserID = u.UserID
        LEFT JOIN Events e ON r.EventID = e.EventID
        WHERE r.ReviewText LIKE @searchTerm
           OR CAST(r.Rating AS NVARCHAR) LIKE @searchTerm
      `);
    results.reviews = reviews.recordset;

    // Search Users (optional, only if Admin-only access later)
    const users = await pool.request()
      .input('searchTerm', sql.NVarChar, `%${q}%`)
      .query(`
        SELECT UserID, FullName, Email, UserType
        FROM Users
        WHERE FullName LIKE @searchTerm OR Email LIKE @searchTerm
      `);
    results.users = users.recordset;

    res.status(200).json(results);
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ message: 'Server error during search', error: error.message });
  }
};

module.exports = {
  globalSearch
};
