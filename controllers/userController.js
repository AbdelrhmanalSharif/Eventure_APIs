const { sql, poolPromise } = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwtConfig, passwordConfig } = require('../config/authConfig');
require('dotenv').config();

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, userType, profilePicture } = req.body;

    // Validate input
    if (!fullName || !email || !password || !userType) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate userType against allowed values
    const allowedUserTypes = ['Admin', 'Company', 'Individual'];
    if (!allowedUserTypes.includes(userType)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Password strength validation
    if (passwordConfig.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }
    
    if (password.length < passwordConfig.minLength) {
      return res.status(400).json({ message: `Password must be at least ${passwordConfig.minLength} characters long` });
    }

    const pool = await poolPromise;
    
    // Check if user already exists
    const userCheck = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    if (userCheck.recordset.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(passwordConfig.saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Convert the hash to a buffer for SQL Server VARBINARY
    const passwordBuffer = Buffer.from(passwordHash);

    // Insert user into database
    const result = await pool.request()
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.VarBinary, passwordBuffer)
      .input('userType', sql.NVarChar, userType)
      .input('profilePicture', sql.NVarChar, profilePicture || null)
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, UserType, ProfilePicture)
        VALUES (@fullName, @email, @passwordHash, @userType, @profilePicture);
        SELECT SCOPE_IDENTITY() AS UserID;
      `);
    
    const userId = result.recordset[0].UserID;
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const pool = await poolPromise;
    
    // Find user by email
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.recordset[0];
    
    // Convert buffer to string for bcrypt comparison
    const hashedPasswordFromDB = user.PasswordHash.toString();
    
    // Compare passwords
    const validPassword = await bcrypt.compare(password, hashedPasswordFromDB);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create and assign token
    const accessToken = jwt.sign(
      { 
        userId: user.UserID,
        email: user.Email,
        userType: user.UserType
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.accessTokenExpiry }
    );

    // Create refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days expiry
    
    // Store refresh token in database
    await pool.request()
      .input('userId', sql.Int, user.UserID)
      .input('token', sql.NVarChar, refreshToken)
      .input('expiresAt', sql.DateTime, refreshTokenExpiry)
      .query(`
        IF EXISTS (SELECT * FROM RefreshTokens WHERE UserID = @userId)
          UPDATE RefreshTokens SET Token = @token, ExpiresAt = @expiresAt WHERE UserID = @userId
        ELSE
          INSERT INTO RefreshTokens (UserID, Token, ExpiresAt) VALUES (@userId, @token, @expiresAt)
      `);
    
    res.status(200).json({
      userId: user.UserID,
      fullName: user.FullName,
      email: user.Email,
      userType: user.UserType,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT UserID, FullName, Email, UserType, ProfilePicture, CreatedAt 
        FROM Users 
        WHERE UserID = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const { fullName, profilePicture } = req.body;
    
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('fullName', sql.NVarChar, fullName)
      .input('profilePicture', sql.NVarChar, profilePicture || null)
      .query(`
        UPDATE Users
        SET FullName = @fullName, ProfilePicture = @profilePicture
        WHERE UserID = @userId
      `);
    
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Password strength validation for new password
    if (passwordConfig.requireSpecialChar && !/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one special character' });
    }
    
    if (newPassword.length < passwordConfig.minLength) {
      return res.status(400).json({ message: `New password must be at least ${passwordConfig.minLength} characters long` });
    }
    
    const pool = await poolPromise;
    
    // Get current password hash
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT PasswordHash FROM Users WHERE UserID = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentHashedPassword = userResult.recordset[0].PasswordHash.toString();
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, currentHashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = passwordConfig?.saltRounds || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);
    
    if (!passwordHash) {
      return res.status(500).json({ message: 'Password hashing failed' });
    }
    
    const passwordBuffer = Buffer.from(passwordHash);
    
    
    // Update password
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('passwordHash', sql.VarBinary, newPasswordBuffer)
      .query('UPDATE Users SET PasswordHash = @passwordHash WHERE UserID = @userId');
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error while changing password', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword
};