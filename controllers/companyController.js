const { sql, poolPromise } = require("../config/database");
const { getFullEventById } = require("../utils/fetchFullEvent");

// Create a new event (Company only)
const createCompanyEvent = async (req, res) => {
  try {
    const companyId = req.user.userId;
    const {
      title,
      description,
      categories, // array of category IDs
      location,
      price,
      currency,
      startDate,
      endDate,
      maxAttendees,
      latitude,
      longitude,
    } = req.body;

    console.log("Create event data:", req.body);

    if (
      !title ||
      !description ||
      !categories ||
      !Array.isArray(categories) ||
      categories.length === 0 ||
      !location ||
      !startDate ||
      !endDate ||
      !currency
    ) {
      return res
        .status(400)
        .json({ message: "Missing or invalid required fields" });
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input("companyId", sql.Int, companyId)
        .input("title", sql.NVarChar, title)
        .input("description", sql.NVarChar, description)
        .input("location", sql.NVarChar, location)
        .input("price", sql.Decimal(10, 2), price || 0)
        .input("currency", sql.NVarChar(10), currency)
        .input("startDate", sql.DateTime, new Date(startDate))
        .input("endDate", sql.DateTime, new Date(endDate))
        .input("maxAttendees", sql.Int, maxAttendees || null).query(`
          INSERT INTO Events (CompanyID, Title, Description, Location, Price, Currency, StartDate, EndDate, MaxAttendees)
          VALUES (@companyId, @title, @description, @location, @price, @currency, @startDate, @endDate, @maxAttendees);
          SELECT SCOPE_IDENTITY() AS EventID;
        `);

      const eventId = result.recordset[0].EventID;
      console.log("New event ID:", eventId);

      for (const catId of categories) {
        await new sql.Request(transaction)
          .input("eventId", sql.Int, eventId)
          .input("categoryId", sql.Int, catId)
          .query(
            "INSERT INTO EventCategories (EventID, CategoryID) VALUES (@eventId, @categoryId)"
          );
      }

      if (latitude && longitude) {
        await new sql.Request(transaction)
          .input("eventId", sql.Int, eventId)
          .input("latitude", sql.Decimal(9, 6), latitude)
          .input("longitude", sql.Decimal(9, 6), longitude)
          .query(
            `INSERT INTO MapsIntegration (EventID, Latitude, Longitude) VALUES (@eventId, @latitude, @longitude)`
          );
      }

      await transaction.commit();
      const fullEvent = await getFullEventById(eventId);
      res
        .status(201)
        .json({ message: "Event created successfully", event: fullEvent });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Create company event error:", error);
    res.status(500).json({
      message: "Server error while creating event",
      error: error.message,
    });
  }
};

// Get all events created by the company
const getCompanyEvents = async (req, res) => {
  try {
    const companyId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("companyId", sql.Int, companyId)
      .query(
        "SELECT EventID FROM Events WHERE CompanyID = @companyId ORDER BY EventID ASC"
      );

    const events = [];
    for (const row of result.recordset) {
      const event = await getFullEventById(row.EventID);
      if (event) events.push(event);
    }

    res.status(200).json(events);
  } catch (error) {
    console.error("Fetch company events error:", error);
    res.status(500).json({
      message: "Server error while fetching company events",
      error: error.message,
    });
  }
};

// Update a company's event
const updateCompanyEvent = async (req, res) => {
  try {
    const companyId = req.user.userId;
    const eventId = parseInt(req.params.id);
    const {
      title,
      description,
      category, // array of category IDs
      location,
      price,
      currency,
      startDate,
      endDate,
      maxAttendees,
      latitude,
      longitude,
    } = req.body;

    console.log("Update event data:", req.body);

    const pool = await poolPromise;

    const check = await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query("SELECT CompanyID FROM Events WHERE EventID = @eventId");

    console.log(check);
    console.log(companyId);

    if (
      check.recordset.length === 0 ||
      check.recordset[0].CompanyID !== companyId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this event" });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const updateFields = [];
      if (title) updateFields.push(`Title = @title`);
      if (description) updateFields.push(`Description = @description`);
      if (location) updateFields.push(`Location = @location`);
      if (price !== undefined) updateFields.push(`Price = @price`);
      if (currency) updateFields.push(`Currency = @currency`);
      if (startDate) updateFields.push(`StartDate = @startDate`);
      if (endDate) updateFields.push(`EndDate = @endDate`);
      if (maxAttendees !== undefined)
        updateFields.push(`MaxAttendees = @maxAttendees`);

      const updateQuery = `UPDATE Events SET ${updateFields.join(
        ", "
      )} WHERE EventID = @eventId`;
      const eventRequest = new sql.Request(transaction).input(
        "eventId",
        sql.Int,
        eventId
      );
      if (title) eventRequest.input("title", sql.NVarChar, title);
      if (description)
        eventRequest.input("description", sql.NVarChar, description);
      if (location) eventRequest.input("location", sql.NVarChar, location);
      if (price !== undefined)
        eventRequest.input("price", sql.Decimal(10, 2), price);
      if (currency) eventRequest.input("currency", sql.NVarChar(10), currency);
      if (startDate)
        eventRequest.input("startDate", sql.DateTime, new Date(startDate));
      if (endDate)
        eventRequest.input("endDate", sql.DateTime, new Date(endDate));
      if (maxAttendees !== undefined)
        eventRequest.input("maxAttendees", sql.Int, maxAttendees);

      await eventRequest.query(updateQuery);

      if (category && Array.isArray(category)) {
        await new sql.Request(transaction)
          .input("eventId", sql.Int, eventId)
          .query("DELETE FROM EventCategories WHERE EventID = @eventId");

        for (const catId of category) {
          await new sql.Request(transaction)
            .input("eventId", sql.Int, eventId)
            .input("categoryId", sql.Int, catId)
            .query(
              "INSERT INTO EventCategories (EventID, CategoryID) VALUES (@eventId, @categoryId)"
            );
        }
      }

      if (latitude !== undefined && longitude !== undefined) {
        const mapCheck = await new sql.Request(transaction)
          .input("eventId", sql.Int, eventId)
          .query(
            "SELECT EventID FROM MapsIntegration WHERE EventID = @eventId"
          );

        if (mapCheck.recordset.length > 0) {
          await new sql.Request(transaction)
            .input("eventId", sql.Int, eventId)
            .input("latitude", sql.Decimal(9, 6), latitude)
            .input("longitude", sql.Decimal(9, 6), longitude)
            .query(
              `UPDATE MapsIntegration SET Latitude = @latitude, Longitude = @longitude WHERE EventID = @eventId`
            );
        } else {
          await new sql.Request(transaction)
            .input("eventId", sql.Int, eventId)
            .input("latitude", sql.Decimal(9, 6), latitude)
            .input("longitude", sql.Decimal(9, 6), longitude)
            .query(
              `INSERT INTO MapsIntegration (EventID, Latitude, Longitude) VALUES (@eventId, @latitude, @longitude)`
            );
        }
      }

      await transaction.commit();
      const updatedEvent = await getFullEventById(eventId);
      res
        .status(200)
        .json({ message: "Event updated successfully", event: updatedEvent });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Update company event error:", error);
    res.status(500).json({
      message: "Server error while updating event",
      error: error.message,
    });
  }
};

// Delete a company's event
const deleteCompanyEvent = async (req, res) => {
  try {
    const companyId = req.user.userId;
    const eventId = parseInt(req.params.id);
    const pool = await poolPromise;

    const check = await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query("SELECT CompanyID FROM Events WHERE EventID = @eventId");

    if (
      check.recordset.length === 0 ||
      check.recordset[0].CompanyID !== companyId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this event" });
    }

    await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query("DELETE FROM Events WHERE EventID = @eventId");

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete company event error:", error);
    res.status(500).json({
      message: "Server error while deleting event",
      error: error.message,
    });
  }
};

module.exports = {
  createCompanyEvent,
  getCompanyEvents,
  updateCompanyEvent,
  deleteCompanyEvent,
};
