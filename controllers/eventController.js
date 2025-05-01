const { sql, poolPromise } = require("../config/database");
const { getFullEventById } = require("../utils/fetchFullEvent");
const path = require("path");
const fs = require("fs");

// Get all events with filters and pagination
const getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      location,
      minPrice,
      maxPrice,
      startDate,
      endDate,
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, u.FullName AS CompanyName, 
        (SELECT COUNT(*) FROM Reviews r WHERE r.EventID = e.EventID) AS ReviewCount,
        (SELECT AVG(CAST(r.Rating AS FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) AS AverageRating,
        m.Latitude, m.Longitude
      FROM Events e
      LEFT JOIN Users u ON e.CompanyID = u.UserID
      LEFT JOIN MapsIntegration m ON e.EventID = m.EventID
      WHERE 1=1
    `;

    const queryParams = [];

    if (category) {
      query += ` AND EXISTS (
        SELECT 1 FROM EventCategories ec
        JOIN Categories c ON ec.CategoryID = c.CategoryID
        WHERE ec.EventID = e.EventID AND c.Name = @category
      )`;
      queryParams.push({
        name: "category",
        type: sql.NVarChar,
        value: category,
      });
    }

    if (location) {
      query += ` AND e.Location LIKE @location`;
      queryParams.push({
        name: "location",
        type: sql.NVarChar,
        value: `%${location}%`,
      });
    }

    if (minPrice) {
      query += ` AND e.Price >= @minPrice`;
      queryParams.push({
        name: "minPrice",
        type: sql.Decimal(10, 2),
        value: parseFloat(minPrice),
      });
    }

    if (maxPrice) {
      query += ` AND e.Price <= @maxPrice`;
      queryParams.push({
        name: "maxPrice",
        type: sql.Decimal(10, 2),
        value: parseFloat(maxPrice),
      });
    }

    if (startDate) {
      query += ` AND e.StartDate >= @startDate`;
      queryParams.push({
        name: "startDate",
        type: sql.DateTime,
        value: new Date(startDate),
      });
    }

    if (endDate) {
      query += ` AND e.EndDate <= @endDate`;
      queryParams.push({
        name: "endDate",
        type: sql.DateTime,
        value: new Date(endDate),
      });
    }

    query += ` ORDER BY e.StartDate ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    queryParams.push({ name: "offset", type: sql.Int, value: offset });
    queryParams.push({ name: "limit", type: sql.Int, value: parseInt(limit) });

    const pool = await poolPromise;

    const countRequest = pool.request();
    queryParams.forEach((param) =>
      countRequest.input(param.name, param.type, param.value)
    );
    const countResult = await countRequest.query(
      `SELECT COUNT(*) AS TotalCount FROM Events e WHERE 1=1`
    );
    const totalCount = countResult.recordset[0].TotalCount;

    const request = pool.request();
    queryParams.forEach((param) =>
      request.input(param.name, param.type, param.value)
    );
    const result = await request.query(query);

    const events = result.recordset;

    for (const event of events) {
      const imagesResult = await pool
        .request()
        .input("eventId", sql.Int, event.EventID)
        .query(
          "SELECT ImageID, ImageURL FROM EventImages WHERE EventID = @eventId"
        );
      event.images = imagesResult.recordset;

      const categoryResult = await pool
        .request()
        .input("eventId", sql.Int, event.EventID).query(`
          SELECT c.CategoryID, c.Name 
          FROM EventCategories ec
          JOIN Categories c ON ec.CategoryID = c.CategoryID
          WHERE ec.EventID = @eventId
        `);
      event.categories = categoryResult.recordset.map((c) => c.Name);
    }

    res.status(200).json({
      events,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      message: "Server error while fetching events",
      error: error.message,
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await getFullEventById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Get event by ID error:", error);
    res.status(500).json({
      message: "Server error while fetching event",
      error: error.message,
    });
  }
};

const getEventCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT CategoryID, Name FROM Categories ORDER BY Name");
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      message: "Server error while fetching categories",
      error: error.message,
    });
  }
};

const uploadMultipleEventImages = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const pool = await poolPromise;

    for (const file of files) {
      console.log("File:", file);
      const imagePath = `/uploads/events/${file.filename}`;
      await pool
        .request()
        .input("eventId", sql.Int, eventId)
        .input("imageUrl", sql.NVarChar, imagePath).query(`
          INSERT INTO EventImages (EventID, ImageURL)
          VALUES (@eventId, @imageUrl)
        `);
    }

    res.status(201).json({ message: "Images uploaded successfully" });
  } catch (error) {
    console.error("Upload multiple images error:", error);
    res.status(500).json({
      message: "Server error while uploading images",
      error: error.message,
    });
  }
};

const deleteEventImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const pool = await poolPromise;

    const imageResult = await pool
      .request()
      .input("imageId", sql.Int, imageId)
      .query("SELECT ImageURL FROM EventImages WHERE ImageID = @imageId");

    if (imageResult.recordset.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imagePath = imageResult.recordset[0].ImageURL;
    const fullPath = path.join(__dirname, "..", imagePath);

    fs.unlink(fullPath, async (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("File deletion error:", err);
        return res.status(500).json({ message: "Error deleting image file" });
      }

      await pool
        .request()
        .input("imageId", sql.Int, imageId)
        .query("DELETE FROM EventImages WHERE ImageID = @imageId");

      res.status(200).json({ message: "Image deleted successfully" });
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      message: "Server error while deleting image",
      error: error.message,
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const pool = await poolPromise;

    const imageResult = await pool
      .request()
      .input("imageId", sql.Int, imageId)
      .query("SELECT ImageURL FROM EventImages WHERE ImageID = @imageId");

    if (imageResult.recordset.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imagePath = imageResult.recordset[0].ImageURL;
    const fullPath = path.join(__dirname, "..", imagePath);

    fs.unlink(fullPath, async (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("File deletion error:", err);
        return res.status(500).json({ message: "Error deleting image file" });
      }

      await pool
        .request()
        .input("imageId", sql.Int, imageId)
        .query("DELETE FROM EventImages WHERE ImageID = @imageId");

      res.status(200).json({ message: "Image deleted successfully" });
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      message: "Server error while deleting image",
      error: error.message,
    });
  }
};

const getRandomImages = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT TOP 6 ImageID, ImageURL FROM EventImages ORDER BY NEWID()`
      );
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Get random images error:", error);
    res.status(500).json({
      message: "Server error while fetching random images",
      error: error.message,
    });
  }
};

const getPopularEvents = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 5 e.EventID, e.Title,
      (SELECT AVG(CAST(r.Rating AS FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) AS AverageRating,
      (SELECT TOP 1 ImageURL FROM EventImages ei WHERE ei.EventID = e.EventID) AS ImageURL
      FROM Events e ORDER BY 
      (SELECT AVG(CAST(r.Rating AS FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) DESC
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No popular events found" });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    console.log("here");
    // console.error("Get popular events error:", error);
    res.status(500).json({
      message: "Server error while fetching popular events",
      error: error.message,
    });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  getEventCategories,
  deleteEventImage,
  deleteImage,
  uploadMultipleEventImages,
  getRandomImages,
  getPopularEvents,
};
