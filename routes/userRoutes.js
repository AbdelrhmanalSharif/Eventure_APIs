const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Public routes
router.post("/register", upload.profile, userController.registerUser);
router.post("/login", userController.loginUser);

// Authenticated user routes
router.get("/profile", authenticateToken, userController.getUserProfile);
router.put(
  "/profile",
  authenticateToken,
  upload.profile,
  userController.updateUserProfile
);
router.post(
  "/profile-picture",
  authenticateToken,
  upload.profile,
  userController.changeProfilePicture
);
router.post(
  "/change-password",
  authenticateToken,
  userController.changePassword
);

module.exports = router;
