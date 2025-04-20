// load libraries
const express = require('express'); // main framework to build APIs
const cors = require('cors'); // allows cross origin requests men el frontend
const helmet = require('helmet'); //sets secure http headers to prevent common attacks
const morgan = require('morgan'); //logs http requests
require('dotenv').config(); // loads .env

const app = express(); // creates the express app le howe el base la middleware, routes w 8yron

// middleware
app.use(helmet()); // security headers
app.use(cors()); // enables frontend to make API calls to backend 
app.use(express.json()); // automatically parses JSON bodies
app.use(morgan('dev')); // logs the requests

// import and use routes ;e hene kelon gam3ton w 7tyton bel index.js
const apiRoutes = require('./routes');
app.use('/api', apiRoutes); 

// home route bse3d la gareb eza el server meshe
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Eventure API' });
});

// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // logs the full error bel console
  res.status(500).json({ // sends error response
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined // bas teb3et el full error in dev mode
  });// hyda kermel el security by3mel protect lal API from crashing or exposing sensitive info
});

module.exports = app;
