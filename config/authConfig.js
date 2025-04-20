// Configuration settings for authentication
// loads variables from the .env
require('dotenv').config();

// JWT Configuration mnest3mela w2t bdna n3mel generate or verify la login tokens
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_default_jwt_secret_key', // private string to assign each token
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '1h', // how long the token lasts
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d' // how long refresh token last?
};

// Rules for the user password
const passwordConfig = {
  saltRounds: 10, // hashing the password
  minLength: 8, 
  requireSpecialChar: true
};

// Helper object bes3ed to categorize different types of tokens
const tokenTypes = {
  ACCESS: 'access', // Regular token
  REFRESH: 'refresh', // Refresh token mnest3mela to get new access token bala ma n3mel login mara tenye
  RESET_PASSWORD: 'resetPassword', // tosta3mal lal forget password
  VERIFY_EMAIL: 'verifyEmail' 
};

// hay bet5leen 23melon import la aya file bde ye
module.exports = {
  jwtConfig,
  passwordConfig,
  tokenTypes
};