// Configuration settings for authentication
require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_default_jwt_secret_key',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '1h',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d'
};

const passwordConfig = {
  saltRounds: 10,
  minLength: 8,
  requireSpecialChar: true
};

const tokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'resetPassword',
  VERIFY_EMAIL: 'verifyEmail'
};

module.exports = {
  jwtConfig,
  passwordConfig,
  tokenTypes
};