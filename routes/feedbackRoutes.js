const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { authenticateToken, authorizeRole } = require("../middlewares/auth");

router.post(
  "/",
  authenticateToken,
  authorizeRole(["Individual", "Admin", "Company"]),
  feedbackController.createFeedback
);

router.get(
  "/",
  authenticateToken,
  authorizeRole(["Admin"]),
  feedbackController.getAllFeedback
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["Admin"]),
  feedbackController.setCompletedFeedback
);

module.exports = router;
