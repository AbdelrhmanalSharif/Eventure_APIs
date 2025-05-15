const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticateToken, authorizeRole } = require("../middlewares/auth");

// All review routes require authentication
router.post(
  "/",
  authenticateToken,
  authorizeRole(["Individual"]),
  reviewController.addReview
);

router.get(
  "/event/:eventId",
  authenticateToken,
  reviewController.getReviewsByEventId
);

router.put(
  "/:reviewId",
  authenticateToken,
  authorizeRole(["Individual"]),
  reviewController.updateReview
);
router.delete("/:reviewId", authenticateToken, reviewController.deleteReview);

module.exports = router;
