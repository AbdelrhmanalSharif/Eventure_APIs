// eventRoutes.js
const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { authenticateToken, authorizeRole } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Public routes for all users (including Individuals)
router.post("/", eventController.getAllEvents);
router.get("/major-categories", eventController.getMajorCategories);
router.get("/categories", eventController.getEventCategories);
router.get("/popular", eventController.getPopularEvents);
router.get("/:id", eventController.getEventById);
router.post(
  "/:id/images/multiple",
  authenticateToken,
  authorizeRole(["Company"]),
  upload.multiple,
  eventController.uploadMultipleEventImages
);
router.delete("/image/:imageId/delete", eventController.deleteImage);
router.get("/images/random", eventController.getRandomImages);

module.exports = router;
