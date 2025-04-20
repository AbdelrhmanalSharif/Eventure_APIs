// database.js sets the connection with the server database 

// import mssql library le bet5l el node.js y3mel connect to the sql server mnest3mela to make the connection pool 
const sql = require('mssql'); 
require('dotenv').config(); // loads variable from .env

// creates the connection credentials
const dbConfig = {
  user: process.env.DB_USER || 'eventuredb_user',
  password: process.env.DB_PASSWORD || 'Eventure.123eet',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'EventureDB',
  options: { // for the sql connection
    encrypt: true,
    trustServerCertificate: true // for local dev / self-signed certs
  },
  pool: { // connection pool setting
    max: 10, // max db connections
    min: 0, // min idle connections
    idleTimeoutMillis: 30000 // close idle connection after the time 
  }
};

// Create a connection pool using config and connects immediately
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => { // eza el connection zabtet byetla3 mssg and return the pool object
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => console.error('Database Connection Failed:', err)); // eza sar fi connection fail mna3mel load lal error la ysa3ed bel debugging

module.exports = {
  sql,
  poolPromise
};