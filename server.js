const app = require('./app');
const { poolPromise } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Test database connection before starting server
poolPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed. Server not started:', err);
    process.exit(1);
  });