const { sql, poolPromise } = require('../config/database');

// Get all non-admin users, grouped by type
const getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserID, FullName, Email, UserType, CreatedAt
      FROM Users
      WHERE UserType != 'Admin'
      ORDER BY UserType, CreatedAt DESC
    `);

    const grouped = result.recordset.reduce((acc, user) => {
      if (!acc[user.UserType]) acc[user.UserType] = [];
      acc[user.UserType].push(user);
      return acc;
    }, {});

    res.status(200).json(grouped);
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Get all events with categories, images, and company name
const getAllEvents = async (req, res) => {
  try {
    const pool = await poolPromise;

    const eventResult = await pool.request().query(`
      SELECT e.EventID, e.Title, e.Description, e.Location, e.Price, e.Currency,
             e.StartDate, e.EndDate, e.MaxAttendees, e.CreatedAt,
             u.FullName AS CompanyName,
             m.Latitude, m.Longitude,
             STRING_AGG(c.Name, ',') AS Categories
      FROM Events e
      LEFT JOIN Users u ON e.CompanyID = u.UserID
      LEFT JOIN MapsIntegration m ON e.EventID = m.EventID
      LEFT JOIN EventCategories ec ON e.EventID = ec.EventID
      LEFT JOIN Categories c ON ec.CategoryID = c.CategoryID
      GROUP BY e.EventID, e.Title, e.Description, e.Location, e.Price, e.Currency,
               e.StartDate, e.EndDate, e.MaxAttendees, e.CreatedAt,
               u.FullName, m.Latitude, m.Longitude
      ORDER BY e.StartDate DESC
    `);

    const events = eventResult.recordset;

    const imageResult = await pool.request().query(`
      SELECT EventID, ImageID, ImageURL FROM EventImages
    `);

    const imageMap = {};
    imageResult.recordset.forEach(img => {
      if (!imageMap[img.EventID]) imageMap[img.EventID] = [];
      imageMap[img.EventID].push({ ImageID: img.ImageID, ImageURL: img.ImageURL });
    });

    events.forEach(event => {
      event.Images = imageMap[event.EventID] || [];
      event.Categories = event.Categories ? event.Categories.split(',') : [];
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Admin getAllEvents error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE UserID = @id');
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Delete event by ID
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM Events WHERE EventID = @id');
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Admin deleteEvent error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
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
    console.error('Admin getPlatformStats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getAllEvents,
  deleteUser,
  deleteEvent,
  getPlatformStats
};
