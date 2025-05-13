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
    } = req.body;

    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, u.FullName AS CompanyName, 
        (SELECT COUNT(*) FROM Reviews r WHERE r.EventID = e.EventID) AS ReviewCount,
        (SELECT AVG(CAST(r.Rating AS FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) AS AverageRating,
        m.Latitude, m.Longitude
      FROM Events e
      LEFT JOIN Users u ON e.CompanyID = u.UserID
      LEFT JOIN MapsIntegration m ON e.EventID = m.EventID
    `;

    let whereClause = " WHERE 1=1";

    const queryParams = [];

    if (category && Array.isArray(category) && category.length > 0) {
      const categoryPlaceholders = category
        .map((_, index) => `@category${index}`)
        .join(", ");
      whereClause += ` AND EXISTS (
      SELECT 1 FROM EventCategories ec
      JOIN Categories c ON ec.CategoryID = c.CategoryID
      WHERE ec.EventID = e.EventID AND c.Name IN (${categoryPlaceholders})
      )`;
      category.forEach((cat, index) => {
        queryParams.push({
          name: `category${index}`,
          type: sql.NVarChar,
          value: cat,
        });
      });
    }

    if (location) {
      whereClause += ` AND e.Location LIKE @location`;
      queryParams.push({
        name: "location",
        type: sql.NVarChar,
        value: `%${location}%`,
      });
    }

    if (minPrice) {
      whereClause += ` AND e.Price >= @minPrice`;
      queryParams.push({
        name: "minPrice",
        type: sql.Decimal(10, 2),
        value: parseFloat(minPrice),
      });
    }

    if (maxPrice) {
      whereClause += ` AND e.Price <= @maxPrice`;
      queryParams.push({
        name: "maxPrice",
        type: sql.Decimal(10, 2),
        value: parseFloat(maxPrice),
      });
    }

    if (startDate) {
      whereClause += ` AND e.StartDate >= @startDate`;
      queryParams.push({
        name: "startDate",
        type: sql.DateTime,
        value: new Date(startDate),
      });
    }

    if (endDate) {
      whereClause += ` AND e.EndDate <= @endDate`;
      queryParams.push({
        name: "endDate",
        type: sql.DateTime,
        value: new Date(endDate),
      });
    }

    query += `${whereClause} ORDER BY e.StartDate ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    queryParams.push({ name: "offset", type: sql.Int, value: offset });
    queryParams.push({ name: "limit", type: sql.Int, value: parseInt(limit) });

    const pool = await poolPromise;

    const countRequest = pool.request();
    queryParams.forEach((param) =>
      countRequest.input(param.name, param.type, param.value)
    );
    const countResult = await countRequest.query(
      `SELECT COUNT(*) AS TotalCount FROM Events e ${whereClause}`
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

const getUngroupedCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      Select c.CategoryID, c.Name from Categories c
      Where c.CategoryID not in
      (Select Distinct gc.CatID from GroupedCategories gc);`);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Get ungrouped categories error:", error);
    res.status(500).json({
      message: "Server error while fetching ungrouped categories",
      error: error.message,
    });
  }
};

const getMajorCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const majorCatResult = await pool
      .request()
      .query(
        `Select CatID as MajorCatID, CatName, Icon from MajorCategories order by CatID asc`
      );
    const majorCategories = majorCatResult.recordset;
    for (const majorCat of majorCategories) {
      const subCatResult = await pool
        .request()
        .input("majorCatId", sql.Int, majorCat.MajorCatID).query(`
        Select c.CategoryID, c.Name from Categories c Join GroupedCategories gc on c.CategoryID = gc.CatID where gc.MajorCatID = @majorCatId;`);
      majorCat.SubCategories = subCatResult.recordset;
    }
    res.status(200).json(majorCategories);
  } catch (error) {
    console.error("Get major categories error:", error);
    res.status(500).json({
      message: "Server error while fetching major categories",
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

const updateEventCategories = async (req, res) => {
  try {
    const majorCatID = parseInt(req.params.majorCatID);
    const { CatName, Icon, SubCategories, NewSubCategories } = req.body;
    console.log(majorCatID);
    console.log(req.body);
    if (!CatName || !Icon) {
      return res.status(400).json({ message: "CatName and Icon are required" });
    }

    const pool = await poolPromise;

    //Probably means user deleted all subcategories
    if (!SubCategories || !Array.isArray(SubCategories)) {
      await pool.request().input("majorCatID", sql.Int, majorCatID).query(`
        Delete from GroupedCategories where MajorCatID = @majorCatID;`);
    }

    //Add new subcategories to Categories table
    if (NewSubCategories && Array.isArray(NewSubCategories)) {
      for (const subCat of NewSubCategories) {
        if (subCat.CategoryID < 0) {
          const result = await pool
            .request()
            .input("catName", sql.NVarChar, subCat.Name)
            .query(`INSERT INTO Categories (Name) VALUES (@catName);`);
          if (!result.rowsAffected[0]) {
            return res
              .status(400)
              .json({ message: "Failed to insert new subcategory" });
          }
        }
      }
    }

    //Update existing subcategories
    for (const subCat of SubCategories) {
      const result = await pool
        .request()
        .input("catName", sql.NVarChar, subCat.Name)
        .input("catId", sql.Int, subCat.CategoryID)
        .query(
          `UPDATE Categories SET Name = @catName WHERE CategoryID = @catId;`
        );
      if (!result.rowsAffected[0]) {
        return res
          .status(400)
          .json({ message: "Failed to update existing subcategory" });
      }
    }

    //Update major category
    const updateMajorCatResult = await pool
      .request()
      .input("majorCatID", sql.Int, majorCatID)
      .input("catName", sql.NVarChar, CatName)
      .input("icon", sql.NVarChar, Icon).query(`
      UPDATE MajorCategories SET CatName = @catName, Icon = @icon WHERE CatID = @majorCatID;`);

    if (!updateMajorCatResult.rowsAffected[0]) {
      console.error("Failed to update major category");
      return res
        .status(400)
        .json({ message: "Failed to update major category" });
    }

    //Delete existing subcategories to add the new and existing ones
    await pool
      .request()
      .input("majorCatID", sql.Int, majorCatID)
      .query(`DELETE FROM GroupedCategories WHERE MajorCatID = @majorCatID;`);

    //Add new subcategories to grouped categories
    for (const subCat of NewSubCategories) {
      const result = await pool
        .request()
        .input("majorCatID", sql.Int, majorCatID)
        .input("catName", sql.NVarChar, subCat.Name)
        .query(
          `INSERT INTO GroupedCategories (MajorCatID, CatID) 
          VALUES (@majorCatID, (Select CategoryID from Categories where Name = @catName));`
        );
      if (!result.rowsAffected[0]) {
        return res
          .status(400)
          .json({ message: "Failed to insert new subcategory" });
      }
    }

    //Add existing subcategories to grouped categories
    for (const subCat of SubCategories) {
      const result = await pool
        .request()
        .input("majorCatID", sql.Int, majorCatID)
        .input("catId", sql.Int, subCat.CategoryID)
        .query(
          `INSERT INTO GroupedCategories (MajorCatID, CatID) 
          VALUES (@majorCatID, @catId);`
        );
      if (!result.rowsAffected[0]) {
        return res
          .status(400)
          .json({ message: "Failed to update list of subcategories" });
      }
    }

    res.status(200).json({ message: "Major category updated successfully" });
  } catch (error) {
    console.error("Update event categories error:", error);
    res.status(500).json({
      message: "Server error while updating event categories",
      error: error.message,
    });
  }
};

const deleteMajorCategory = async (req, res) => {
  try {
    const majorCatID = parseInt(req.params.majorCatID);
    const pool = await poolPromise;
    await pool.request().input("majorCatID", sql.Int, majorCatID).query(`
      Delete from GroupedCategories where MajorCatID = @majorCatID;
      DELETE FROM MajorCategories WHERE CatID = @majorCatID;`);
    res.status(200).json({ message: "Major category deleted successfully" });
  } catch (error) {
    console.error("Delete major category error:", error);
    res.status(500).json({
      message: "Server error while deleting major category",
      error: error.message,
    });
  }
};

const createMajorCategory = async (req, res) => {
  try {
    const { CatName } = req.body;
    const pool = await poolPromise;
    if (!CatName) {
      return res.status(401).json({ message: "Category name is required" });
    }

    //Check if the category already exists
    const existingCategory = await pool
      .request()
      .input("catName", sql.NVarChar, CatName)
      .query("SELECT * FROM MajorCategories WHERE CatName = @catName");
    if (existingCategory.recordset.length > 0) {
      return res.status(300).json({ message: "Category name already exists" });
    }

    //Insert the new category
    const result = await pool
      .request()
      .input("catName", sql.NVarChar, CatName)
      .query("INSERT INTO MajorCategories (CatName) VALUES (@catName);");
    if (!result.rowsAffected[0]) {
      return res
        .status(400)
        .json({ message: "Failed to insert new major category" });
    }

    //Get the ID of the newly created category
    const newCategory = await pool
      .request()
      .input("catName", sql.NVarChar, CatName)
      .query("SELECT CatID FROM MajorCategories WHERE CatName = @catName");
    const newCategoryId = newCategory.recordset[0].CatID;
    res.status(200).json({
      message: "Major category created successfully",
      majorCatID: newCategoryId,
    });
  } catch (error) {
    console.error("Create major category error:", error);
    res.status(500).json({
      message: "Server error while creating major category",
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
  getMajorCategories,
  getUngroupedCategories,
  updateEventCategories,
  deleteMajorCategory,
  createMajorCategory,
};
