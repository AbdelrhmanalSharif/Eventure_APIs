const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'eventuredb_user',
  password: process.env.DB_PASSWORD || 'Eventure.123eet',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'EventureDB',
  options: {
    encrypt: true,
    trustServerCertificate: true // for local dev / self-signed certs
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => console.error('Database Connection Failed:', err));

module.exports = {
  sql,
  poolPromise
};