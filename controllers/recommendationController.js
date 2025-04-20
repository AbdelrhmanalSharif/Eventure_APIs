const { sql, poolPromise } = require('../config/database');

// Add a recommendation (manual)
const addRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const pool = await poolPromise;

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .query(`
        INSERT INTO Recommendations (UserID, EventID)
        VALUES (@userId, @eventId)
      `);

    res.status(201).json({ message: 'Event recommended successfully' });
  } catch (error) {
    // SQL unique constraint violation (e.g. duplicate recommendation)
    if (error.originalError?.info?.number === 2627) {
      return res.status(409).json({ message: 'You already recommended this event' });
    }
    console.error('Add recommendation error:', error);
    res.status(500).json({ message: 'Server error while adding recommendation' });
  }
};

// Get recommendations manually added by user
const getRecommendationsForUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT r.RecommendationID, e.EventID, e.Title, e.Location, e.StartDate, e.EndDate
        FROM Recommendations r
        JOIN Events e ON r.EventID = e.EventID
        WHERE r.UserID = @userId
        ORDER BY r.RecommendedOn DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error while fetching recommendations' });
  }
};

// Behavioral recommendation based on past interactions
const getBehavioralRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    // Bookings - favorite categories
    const bookingCats = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 3 e.Category, COUNT(*) AS Count
        FROM Bookings b
        JOIN Events e ON b.EventID = e.EventID
        WHERE b.UserID = @userId
        GROUP BY e.Category
        ORDER BY Count DESC
      `);

    // Highly rated reviews
    const reviewCats = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 3 e.Category, COUNT(*) AS Count
        FROM Reviews r
        JOIN Events e ON r.EventID = e.EventID
        WHERE r.UserID = @userId AND r.Rating >= 4
        GROUP BY e.Category
        ORDER BY Count DESC
      `);

    // Frequent search locations
    const searchLocs = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 3 SearchQuery
        FROM SearchHistory
        WHERE UserID = @userId AND SearchType = 'Event'
        ORDER BY SearchedAt DESC
      `);

    const topCategories = new Set();
    bookingCats.recordset.forEach(row => topCategories.add(row.Category));
    reviewCats.recordset.forEach(row => topCategories.add(row.Category));
    const topLocations = searchLocs.recordset.map(row => row.SearchQuery);

    if (topCategories.size === 0 && topLocations.length === 0) {
      return res.status(404).json({ message: 'Not enough user data to generate recommendations' });
    }

    // Build event query
    let query = `
      SELECT DISTINCT TOP 10 e.*, u.FullName AS CompanyName,
        (SELECT AVG(CAST(r.Rating AS FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) AS AvgRating
      FROM Events e
      LEFT JOIN Users u ON e.CompanyID = u.UserID
      WHERE e.StartDate >= GETDATE()
    `;

    const queryParams = [];

    if (topCategories.size > 0) {
      const categoryConditions = [...topCategories].map((cat, i) => `e.Category = @cat${i}`).join(' OR ');
      query += ` AND (${categoryConditions})`;
      [...topCategories].forEach((cat, i) => {
        queryParams.push({ name: `cat${i}`, type: sql.NVarChar, value: cat });
      });
    }

    if (topLocations.length > 0) {
      const locationConditions = topLocations.map((loc, i) => `e.Location LIKE @loc${i}`).join(' OR ');
      query += ` AND (${locationConditions})`;
      topLocations.forEach((loc, i) => {
        queryParams.push({ name: `loc${i}`, type: sql.NVarChar, value: `%${loc}%` });
      });
    }

    query += ` ORDER BY e.StartDate ASC`;

    const request = pool.request();
    queryParams.forEach(p => request.input(p.name, p.type, p.value));

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Behavioral recommendation error:', error);
    res.status(500).json({ message: 'Server error while generating recommendations' });
  }
};

module.exports = {
  addRecommendation,
  getRecommendationsForUser,
  getBehavioralRecommendations
};
