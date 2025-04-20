const { sql, poolPromise } = require('../config/database');

const createPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId, paymentMethod, amount, currency = 'USD' } = req.body;

    if (!eventId || !paymentMethod || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventId', sql.Int, eventId)
      .input('paymentMethod', sql.VarChar, paymentMethod)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('currency', sql.NVarChar, currency)
      .input('status', sql.VarChar, 'Completed') // You can change this to 'Pending' if needed
      .query(`
        INSERT INTO Payments (UserID, EventID, PaymentMethod, Amount, Currency, PaymentStatus)
        VALUES (@userId, @eventId, @paymentMethod, @amount, @currency, @status)
      `);

    res.status(201).json({ message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error during payment', error: error.message });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT PaymentID, EventID, Amount, Currency, PaymentMethod, PaymentStatus, TransactionDate
        FROM Payments
        WHERE UserID = @userId
        ORDER BY TransactionDate DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
};

module.exports = {
  createPayment,
  getUserPayments
};
