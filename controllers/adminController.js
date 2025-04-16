const { sql, poolPromise } = require('../config/database');

const getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT UserID, FullName, Email, UserType, CreatedAt FROM Users');
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Events ORDER BY StartDate DESC');
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Admin getAllEvents error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Users WHERE UserID = @id');
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Events WHERE EventID = @id');
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Admin deleteEvent error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Users) AS userCount,
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
  getPlatformStats,
  deleteUser,
  deleteEvent
};
