const jwt = require("jsonwebtoken"); // mn3mela import to handle JWt verification and signing
const { jwtConfig } = require("../config/authConfig"); //load el key

// middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // bte5od el token men el header
  const token = authHeader && authHeader.split(" ")[1]; // Bearer token format (Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...)

  //eza token missing block access
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }
  // eza valid by3mel decode w store bel req.user w eza la2 btale3 error
  try {
    const verified = jwt.verify(token, jwtConfig.secret);
    req.user = verified;
    next();
  } catch (error) {
    console.error("Token verification error:", error); // log the error for debugging
    res.status(403).json({ message: "Invalid token" });
  }
};

// middleware to check user type/role eza admin or company or individual by3mel accept eza la2 ma by3mel allowedRoles howe el array
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (allowedRoles.includes(req.user.userType)) {
      next();
    } else {
      res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
};
