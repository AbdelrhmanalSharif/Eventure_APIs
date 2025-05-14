const { sql, poolPromise } = require('../config/database');

const getFullEventById = async (eventId) => {
  const pool = await poolPromise;

  const eventRes = await pool.request()
    .input('eventId', sql.Int, eventId)
    .query(`
      SELECT e.*, u.FullName AS CompanyName, u.Email AS CompanyEmail,
        (SELECT AVG(CAST(r.Rating AS FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) AS AverageRating,
        m.Latitude, m.Longitude
      FROM Events e
      LEFT JOIN Users u ON e.CompanyID = u.UserID
      LEFT JOIN MapsIntegration m ON e.EventID = m.EventID
      WHERE e.EventID = @eventId
    `);

  if (eventRes.recordset.length === 0) return null;

  const event = eventRes.recordset[0];

  const imagesRes = await pool.request()
    .input('eventId', sql.Int, eventId)
    .query('SELECT ImageID, ImageURL FROM EventImages WHERE EventID = @eventId');
  event.images = imagesRes.recordset;

  const categoriesRes = await pool.request()
    .input('eventId', sql.Int, eventId)
    .query(`
      SELECT c.CategoryID, c.Name
      FROM EventCategories ec
      JOIN Categories c ON ec.CategoryID = c.CategoryID
      WHERE ec.EventID = @eventId
    `);
  event.categories = categoriesRes.recordset.map(c => c.Name);

  const reviewsRes = await pool.request()
    .input('eventId', sql.Int, eventId)
    .query(`
      SELECT r.ReviewID, r.Rating, r.ReviewText, r.CreatedAt, u.UserID,
        u.FullName AS ReviewerName, u.ProfilePicture AS ReviewerPicture
      FROM Reviews r
      LEFT JOIN Users u ON r.UserID = u.UserID
      WHERE r.EventID = @eventId
      ORDER BY r.CreatedAt DESC
    `);
  event.reviews = reviewsRes.recordset;

  return event;
};

module.exports = { getFullEventById };
