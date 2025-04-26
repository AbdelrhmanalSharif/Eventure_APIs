const { sql, poolPromise } = require('../config/database');
const { getFullEventById } = require('../utils/fetchFullEvent');

// Create event by Individual
const createEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      description,
      categories, // array of category IDs
      location,
      price = 0,
      currency,
      startDate,
      endDate,
      maxAttendees,
      latitude,
      longitude
    } = req.body;

    if (!title || !description || !location || !startDate || !endDate || !currency || !categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('companyId', sql.Int, userId)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('location', sql.NVarChar, location)
      .input('price', sql.Decimal(10, 2), price)
      .input('currency', sql.NVarChar(10), currency)
      .input('startDate', sql.DateTime, new Date(startDate))
      .input('endDate', sql.DateTime, new Date(endDate))
      .input('maxAttendees', sql.Int, maxAttendees || null)
      .query(`
        INSERT INTO Events (CompanyID, Title, Description, Location, Price, Currency, StartDate, EndDate, MaxAttendees)
        VALUES (@companyId, @title, @description, @location, @price, @currency, @startDate, @endDate, @maxAttendees);
        SELECT SCOPE_IDENTITY() AS EventID;
      `);

    const eventId = result.recordset[0].EventID;

    for (const catId of categories) {
      await pool.request()
        .input('eventId', sql.Int, eventId)
        .input('categoryId', sql.Int, catId)
        .query('INSERT INTO EventCategories (EventID, CategoryID) VALUES (@eventId, @categoryId)');
    }

    if (latitude && longitude) {
      await pool.request()
        .input('eventId', sql.Int, eventId)
        .input('latitude', sql.Decimal(9, 6), latitude)
        .input('longitude', sql.Decimal(9, 6), longitude)
        .query('INSERT INTO MapsIntegration (EventID, Latitude, Longitude) VALUES (@eventId, @latitude, @longitude)');
    }

    res.status(201).json({ message: 'Event created', eventId });
  } catch (error) {
    console.error('Create individual event error:', error);
    res.status(500).json({ message: 'Server error while creating event', error: error.message });
  }
};


// Get all events created by the individual
const getMyEvents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT EventID FROM Events WHERE CompanyID = @userId ORDER BY CreatedAt DESC');

    const events = [];
    for (const row of result.recordset) {
      const fullEvent = await getFullEventById(row.EventID);
      if (fullEvent) events.push(fullEvent);
    }

    res.status(200).json(events);
  } catch (error) {
    console.error('Get individual events error:', error);
    res.status(500).json({ message: 'Server error while fetching events', error: error.message });
  }
};


// Update event
const updateEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = parseInt(req.params.id);
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
      longitude
    } = req.body;

    const pool = await poolPromise;
    const check = await pool.request()
      .input('eventId', sql.Int, eventId)
      .query('SELECT CompanyID FROM Events WHERE EventID = @eventId');

    if (check.recordset.length === 0 || check.recordset[0].CompanyID !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this event' });
    }

    const updateFields = [];
    const request = pool.request().input('eventId', sql.Int, eventId);

    if (title) { updateFields.push('Title = @title'); request.input('title', sql.NVarChar, title); }
    if (description) { updateFields.push('Description = @description'); request.input('description', sql.NVarChar, description); }
    if (location) { updateFields.push('Location = @location'); request.input('location', sql.NVarChar, location); }
    if (price !== undefined) { updateFields.push('Price = @price'); request.input('price', sql.Decimal(10, 2), price); }
    if (currency) { updateFields.push('Currency = @currency'); request.input('currency', sql.NVarChar(10), currency); }
    if (startDate) { updateFields.push('StartDate = @startDate'); request.input('startDate', sql.DateTime, new Date(startDate)); }
    if (endDate) { updateFields.push('EndDate = @endDate'); request.input('endDate', sql.DateTime, new Date(endDate)); }
    if (maxAttendees !== undefined) { updateFields.push('MaxAttendees = @maxAttendees'); request.input('maxAttendees', sql.Int, maxAttendees); }

    if (updateFields.length > 0) {
      await request.query(`UPDATE Events SET ${updateFields.join(', ')} WHERE EventID = @eventId`);
    }

    if (categories && Array.isArray(categories)) {
      await pool.request()
        .input('eventId', sql.Int, eventId)
        .query('DELETE FROM EventCategories WHERE EventID = @eventId');

      for (const catId of categories) {
        await pool.request()
          .input('eventId', sql.Int, eventId)
          .input('categoryId', sql.Int, catId)
          .query('INSERT INTO EventCategories (EventID, CategoryID) VALUES (@eventId, @categoryId)');
      }
    }

    if (latitude !== undefined && longitude !== undefined) {
      const mapCheck = await pool.request().input('eventId', sql.Int, eventId).query('SELECT * FROM MapsIntegration WHERE EventID = @eventId');

      if (mapCheck.recordset.length > 0) {
        await pool.request()
          .input('eventId', sql.Int, eventId)
          .input('latitude', sql.Decimal(9, 6), latitude)
          .input('longitude', sql.Decimal(9, 6), longitude)
          .query('UPDATE MapsIntegration SET Latitude = @latitude, Longitude = @longitude WHERE EventID = @eventId');
      } else {
        await pool.request()
          .input('eventId', sql.Int, eventId)
          .input('latitude', sql.Decimal(9, 6), latitude)
          .input('longitude', sql.Decimal(9, 6), longitude)
          .query('INSERT INTO MapsIntegration (EventID, Latitude, Longitude) VALUES (@eventId, @latitude, @longitude)');
      }
    }

  const updatedEvent = await getFullEventById(eventId);
  res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error while updating event', error: error.message });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const eventId = parseInt(req.params.id);

    const pool = await poolPromise;
    const check = await pool.request()
      .input('eventId', sql.Int, eventId)
      .query('SELECT CompanyID FROM Events WHERE EventID = @eventId');

    if (check.recordset.length === 0 || check.recordset[0].CompanyID !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this event' });
    }

    await pool.request()
      .input('eventId', sql.Int, eventId)
      .query('DELETE FROM Events WHERE EventID = @eventId');

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error while deleting event', error: error.message });
  }
};

module.exports = {
  createEvent,
  getMyEvents,
  updateEvent,
  deleteEvent
};
