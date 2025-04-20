const app = require('./app'); // import express app men el app.js
const { poolPromise } = require('./config/database'); //import database connection pool / poolpromise heye a Promise that connects 3ala sql server

const PORT = process.env.PORT || 3000; // port the server will run on

// Test database connection before starting server
poolPromise // waits until connection works
  .then(() => {
    app.listen(PORT, () => { //starts the server
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed. Server not started:', err);
    process.exit(1);
  });