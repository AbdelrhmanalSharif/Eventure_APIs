const { sql, poolPromise } = require("../config/database");
const { getFullEventById } = require("../utils/fetchFullEvent");

// Add a recommendation (manual)
const addRecommendation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const pool = await poolPromise;

    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, eventId).query(`
        INSERT INTO Recommendations (UserID, EventID)
        VALUES (@userId, @eventId)
      `);

    res.status(201).json({ message: "Event recommended successfully" });
  } catch (error) {
    if (error.originalError?.info?.number === 2627) {
      return res
        .status(409)
        .json({ message: "You already recommended this event" });
    }
    console.error("Add recommendation error:", error);
    res
      .status(500)
      .json({ message: "Server error while adding recommendation" });
  }
};

// Get recommendations manually added by user (with full event data)
const getRecommendationsForUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(
        `SELECT RecommendationID, EventID FROM Recommendations WHERE UserID = @userId ORDER BY RecommendedOn DESC`
      );

    const recommendations = [];
    for (const row of result.recordset) {
      const event = await getFullEventById(row.EventID);
      if (event) {
        recommendations.push({
          recommendationId: row.RecommendationID,
          event,
        });
      }
    }

    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Get recommendations error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching recommendations" });
  }
};

// Behavioral recommendation using full event data
const getBehavioralRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const bookingCats = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT TOP 3 c.Name, COUNT(*) AS CountCat
        FROM Bookings b
        JOIN Events e ON b.EventID = e.EventID
        JOIN EventCategories ec ON e.EventID = ec.EventID
        JOIN Categories c ON ec.CategoryID = c.CategoryID
        WHERE b.UserID = @userId
        GROUP BY c.Name
        ORDER BY CountCat DESC;
      `);

    const reviewCats = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT TOP 3 c.Name, COUNT(*) AS CountCat
        FROM Reviews r
        JOIN Events e ON r.EventID = e.EventID
        JOIN EventCategories ec ON e.EventID = ec.EventID
        JOIN Categories c ON ec.CategoryID = c.CategoryID
        WHERE r.UserID = @userId
        GROUP BY c.Name
        ORDER BY CountCat DESC;
      `);

    const searchLocs = await pool.request().input("userId", sql.Int, userId)
      .query(`
        SELECT TOP 3 SearchQuery
        FROM SearchHistory
        WHERE UserID = @userId AND SearchType = 'Event'
        ORDER BY SearchedAt DESC
      `);

    const topCategories = new Set();
    bookingCats.recordset.forEach((row) => topCategories.add(row.Name));
    reviewCats.recordset.forEach((row) => topCategories.add(row.Name));
    const topLocations = searchLocs.recordset.map((row) => row.SearchQuery);

    if (topCategories.size === 0 && topLocations.length === 0) {
      console.log("No categories or locations found for user:", userId);
      return res
        .status(404)
        .json({ message: "Not enough user data to generate recommendations" });
    }

    // Build raw eventId result
    let query = `SELECT DISTINCT TOP 10 e.EventID 
                FROM Events e 
                JOIN EventCategories ec ON e.EventID = ec.EventID
                JOIN Categories c on ec.CategoryID = c.CategoryID
                WHERE e.StartDate >= GETDATE()`;
    const queryParams = [];

    if (topCategories.size > 0) {
      const categoryConditions = [...topCategories]
        .map((cat, i) => `c.Name = @cat${i}`)
        .join(" OR ");
      query += ` AND (${categoryConditions})`;
      [...topCategories].forEach((cat, i) => {
        queryParams.push({ name: `cat${i}`, type: sql.NVarChar, value: cat });
      });
    }

    if (topLocations.length > 0) {
      const locationConditions = topLocations
        .map((loc, i) => `e.Location LIKE @loc${i}`)
        .join(" OR ");
      query += ` AND (${locationConditions})`;
      topLocations.forEach((loc, i) => {
        queryParams.push({
          name: `loc${i}`,
          type: sql.NVarChar,
          value: `%${loc}%`,
        });
      });
    }

    const request = pool.request();
    queryParams.forEach((p) => request.input(p.name, p.type, p.value));

    const result = await request.query(query);
    const recommendedEvents = [];

    for (const row of result.recordset) {
      const fullEvent = await getFullEventById(row.EventID);
      if (fullEvent) recommendedEvents.push(fullEvent);
    }

    res.status(200).json(recommendedEvents);
  } catch (error) {
    console.error("Behavioral recommendation error:", error);
    res
      .status(500)
      .json({ message: "Server error while generating recommendations" });
  }
};

module.exports = {
  addRecommendation,
  getRecommendationsForUser,
  getBehavioralRecommendations,
};
