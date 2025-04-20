const { sql, poolPromise } = require('../config/database');

// Create ad
const createAd = async (req, res) => {
  try {
    const { adContent, targetCategory, targetLocation, startDate, endDate, adCost } = req.body;
    const companyId = req.user.userId;

    if (!adContent || !startDate || !endDate || !adCost) {
      return res.status(400).json({ message: 'Missing required ad fields' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('companyId', sql.Int, companyId)
      .input('adContent', sql.NVarChar, adContent)
      .input('targetCategory', sql.NVarChar, targetCategory || null)
      .input('targetLocation', sql.NVarChar, targetLocation || null)
      .input('startDate', sql.DateTime, new Date(startDate))
      .input('endDate', sql.DateTime, new Date(endDate))
      .input('adCost', sql.Decimal(10, 2), adCost)
      .query(`
        INSERT INTO Ads (CompanyID, AdContent, TargetCategory, TargetLocation, StartDate, EndDate, AdCost)
        VALUES (@companyId, @adContent, @targetCategory, @targetLocation, @startDate, @endDate, @adCost)
      `);

    res.status(201).json({ message: 'Ad created successfully' });
  } catch (error) {
    console.error('Ad creation error:', error);
    res.status(500).json({ message: 'Server error while creating ad', error: error.message });
  }
};

// Get active ads for users
const getActiveAds = async (req, res) => {
  try {
    const now = new Date();
    const pool = await poolPromise;

    const result = await pool.request()
      .input('now', sql.DateTime, now)
      .query(`
        SELECT a.*, u.FullName as CompanyName
        FROM Ads a
        LEFT JOIN Users u ON a.CompanyID = u.UserID
        WHERE @now BETWEEN a.StartDate AND a.EndDate
        ORDER BY a.StartDate DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Fetch ads error:', error);
    res.status(500).json({ message: 'Server error while fetching ads', error: error.message });
  }
};

// Get all ads (admin)
const getAllAds = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT a.*, u.FullName as CompanyName
      FROM Ads a
      LEFT JOIN Users u ON a.CompanyID = u.UserID
      ORDER BY a.StartDate DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Fetch all ads error:', error);
    res.status(500).json({ message: 'Server error while fetching all ads', error: error.message });
  }
};

module.exports = {
  createAd,
  getActiveAds,
  getAllAds
};