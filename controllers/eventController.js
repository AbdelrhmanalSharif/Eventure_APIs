const { sql, poolPromise } = require('../config/database');

// Create a new event
const createEvent = async (req, res) => {
  try {
    const companyId = req.user.userId; // Get the user ID from the token
    const { 
      title, 
      description, 
      category, 
      location, 
      price, 
      startDate, 
      endDate, 
      maxAttendees,
      latitude,
      longitude
    } = req.body;

    // Validate input
    if (!title || !description || !category || !location || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Additional validations
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const pool = await poolPromise;
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Insert event
      const eventResult = await new sql.Request(transaction)
        .input('companyId', sql.Int, companyId)
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description)
        .input('category', sql.NVarChar, category)
        .input('location', sql.NVarChar, location)
        .input('price', sql.Decimal(10, 2), price || 0)
        .input('startDate', sql.DateTime, new Date(startDate))
        .input('endDate', sql.DateTime, new Date(endDate))
        .input('maxAttendees', sql.Int, maxAttendees || null)
        .query(`
          INSERT INTO Events (CompanyID, Title, Description, Category, Location, Price, StartDate, EndDate, MaxAttendees)
          VALUES (@companyId, @title, @description, @category, @location, @price, @startDate, @endDate, @maxAttendees);
          SELECT SCOPE_IDENTITY() AS EventID;
        `);
      
      const eventId = eventResult.recordset[0].EventID;
      
      // Insert map coordinates if provided
      if (latitude && longitude) {
        await new sql.Request(transaction)
          .input('eventId', sql.Int, eventId)
          .input('latitude', sql.Decimal(9, 6), latitude)
          .input('longitude', sql.Decimal(9, 6), longitude)
          .query(`
            INSERT INTO MapsIntegration (EventID, Latitude, Longitude)
            VALUES (@eventId, @latitude, @longitude);
          `);
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.status(201).json({ 
        message: 'Event created successfully',
        eventId: eventId
      });
    } catch (error) {
      // Rollback transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error during event creation', error: error.message });
  }
};

// Get all events with pagination and basic filtering
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
      searchTerm
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT e.*, u.FullName as CompanyName, 
        (SELECT COUNT(*) FROM Reviews r WHERE r.EventID = e.EventID) as ReviewCount,
        (SELECT AVG(CAST(r.Rating as FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) as AverageRating,
        m.Latitude, m.Longitude
      FROM Events e
      LEFT JOIN Users u ON e.CompanyID = u.UserID
      LEFT JOIN MapsIntegration m ON e.EventID = m.EventID
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters if provided
    if (category) {
      query += ` AND e.Category = @category`;
      queryParams.push({ name: 'category', type: sql.NVarChar, value: category });
    }
    
    if (location) {
      query += ` AND e.Location LIKE @location`;
      queryParams.push({ name: 'location', type: sql.NVarChar, value: `%${location}%` });
    }
    
    if (minPrice !== undefined) {
      query += ` AND e.Price >= @minPrice`;
      queryParams.push({ name: 'minPrice', type: sql.Decimal(10, 2), value: parseFloat(minPrice) });
    }
    
    if (maxPrice !== undefined) {
      query += ` AND e.Price <= @maxPrice`;
      queryParams.push({ name: 'maxPrice', type: sql.Decimal(10, 2), value: parseFloat(maxPrice) });
    }
    
    if (startDate) {
      query += ` AND e.StartDate >= @startDate`;
      queryParams.push({ name: 'startDate', type: sql.DateTime, value: new Date(startDate) });
    }
    
    if (endDate) {
      query += ` AND e.EndDate <= @endDate`;
      queryParams.push({ name: 'endDate', type: sql.DateTime, value: new Date(endDate) });
    }
    
    if (searchTerm) {
      query += ` AND (e.Title LIKE @searchTerm OR e.Description LIKE @searchTerm)`;
      queryParams.push({ name: 'searchTerm', type: sql.NVarChar, value: `%${searchTerm}%` });
    }
    
    // Add pagination
    query += ` ORDER BY e.StartDate ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    queryParams.push({ name: 'offset', type: sql.Int, value: offset });
    queryParams.push({ name: 'limit', type: sql.Int, value: parseInt(limit) });
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as TotalCount
      FROM Events e
      WHERE 1=1
    `;
    
    // Add the same filters to count query
    if (category) {
      countQuery += ` AND e.Category = @category`;
    }
    
    if (location) {
      countQuery += ` AND e.Location LIKE @location`;
    }
    
    if (minPrice !== undefined) {
      countQuery += ` AND e.Price >= @minPrice`;
    }
    
    if (maxPrice !== undefined) {
      countQuery += ` AND e.Price <= @maxPrice`;
    }
    
    if (startDate) {
      countQuery += ` AND e.StartDate >= @startDate`;
    }
    
    if (endDate) {
      countQuery += ` AND e.EndDate <= @endDate`;
    }
    
    if (searchTerm) {
      countQuery += ` AND (e.Title LIKE @searchTerm OR e.Description LIKE @searchTerm)`;
    }
    
    const pool = await poolPromise;
    
    // Execute count query
    const countRequest = pool.request();
    queryParams.forEach(param => {
      countRequest.input(param.name, param.type, param.value);
    });
    
    const countResult = await countRequest.query(countQuery);
    const totalCount = countResult.recordset[0].TotalCount;
    
    // Execute main query
    const request = pool.request();
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    // Get event images for each event
    const events = result.recordset;
    for (const event of events) {
      const imagesResult = await pool.request()
        .input('eventId', sql.Int, event.EventID)
        .query('SELECT ImageID, ImageURL FROM EventImages WHERE EventID = @eventId');
      
      event.images = imagesResult.recordset;
    }
    
    res.status(200).json({
      events: events,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error while fetching events', error: error.message });
  }
};

// Get single event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await poolPromise;
    
    // Get event details
    const eventResult = await pool.request()
      .input('eventId', sql.Int, id)
      .query(`
        SELECT e.*, u.FullName as CompanyName, u.Email as CompanyEmail,
          (SELECT AVG(CAST(r.Rating as FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) as AverageRating,
          m.Latitude, m.Longitude
        FROM Events e
        LEFT JOIN Users u ON e.CompanyID = u.UserID
        LEFT JOIN MapsIntegration m ON e.EventID = m.EventID
        WHERE e.EventID = @eventId
      `);
    
    if (eventResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const event = eventResult.recordset[0];
    
    // Get event images
    const imagesResult = await pool.request()
      .input('eventId', sql.Int, id)
      .query('SELECT ImageID, ImageURL FROM EventImages WHERE EventID = @eventId');
    
    event.images = imagesResult.recordset;
    
    // Get event reviews
    const reviewsResult = await pool.request()
      .input('eventId', sql.Int, id)
      .query(`
        SELECT r.ReviewID, r.Rating, r.ReviewText, r.CreatedAt,
          u.FullName as ReviewerName, u.ProfilePicture as ReviewerPicture
        FROM Reviews r
        LEFT JOIN Users u ON r.UserID = u.UserID
        WHERE r.EventID = @eventId
        ORDER BY r.CreatedAt DESC
      `);
    
    event.reviews = reviewsResult.recordset;
    
    res.status(200).json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error while fetching event', error: error.message });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    const { 
      title, 
      description, 
      category, 
      location, 
      price, 
      startDate, 
      endDate, 
      maxAttendees,
      latitude,
      longitude
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if event exists and belongs to the user
    const eventCheck = await pool.request()
      .input('eventId', sql.Int, id)
      .query('SELECT CompanyID FROM Events WHERE EventID = @eventId');
    
    if (eventCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Only allow the company that created the event or admin to update it
    if (eventCheck.recordset[0].CompanyID !== userId && userType !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Update event
      let updateQuery = 'UPDATE Events SET ';
      const updateParams = [];
      
      if (title) {
        updateParams.push('Title = @title');
      }
      
      if (description) {
        updateParams.push('Description = @description');
      }
      
      if (category) {
        updateParams.push('Category = @category');
      }
      
      if (location) {
        updateParams.push('Location = @location');
      }
      
      if (price !== undefined) {
        updateParams.push('Price = @price');
      }
      
      if (startDate) {
        updateParams.push('StartDate = @startDate');
      }
      
      if (endDate) {
        updateParams.push('EndDate = @endDate');
      }
      
      if (maxAttendees !== undefined) {
        updateParams.push('MaxAttendees = @maxAttendees');
      }
      
      if (updateParams.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }
      
      updateQuery += updateParams.join(', ') + ' WHERE EventID = @eventId';
      
      const eventRequest = new sql.Request(transaction);
      
      eventRequest.input('eventId', sql.Int, id);
      
      if (title) {
        eventRequest.input('title', sql.NVarChar, title);
      }
      
      if (description) {
        eventRequest.input('description', sql.NVarChar, description);
      }
      
      if (category) {
        eventRequest.input('category', sql.NVarChar, category);
      }
      
      if (location) {
        eventRequest.input('location', sql.NVarChar, location);
      }
      
      if (price !== undefined) {
        eventRequest.input('price', sql.Decimal(10, 2), price);
      }
      
      if (startDate) {
        eventRequest.input('startDate', sql.DateTime, new Date(startDate));
      }
      
      if (endDate) {
        eventRequest.input('endDate', sql.DateTime, new Date(endDate));
      }
      
      if (maxAttendees !== undefined) {
        eventRequest.input('maxAttendees', sql.Int, maxAttendees);
      }
      
      await eventRequest.query(updateQuery);
      
      // Update or insert map coordinates if provided
      if (latitude !== undefined && longitude !== undefined) {
        const mapCheck = await new sql.Request(transaction)
          .input('eventId', sql.Int, id)
          .query('SELECT EventID FROM MapsIntegration WHERE EventID = @eventId');
        
        if (mapCheck.recordset.length > 0) {
          // Update existing map entry
          await new sql.Request(transaction)
            .input('eventId', sql.Int, id)
            .input('latitude', sql.Decimal(9, 6), latitude)
            .input('longitude', sql.Decimal(9, 6), longitude)
            .query(`
              UPDATE MapsIntegration 
              SET Latitude = @latitude, Longitude = @longitude 
              WHERE EventID = @eventId
            `);
        } else {
          // Insert new map entry
          await new sql.Request(transaction)
            .input('eventId', sql.Int, id)
            .input('latitude', sql.Decimal(9, 6), latitude)
            .input('longitude', sql.Decimal(9, 6), longitude)
            .query(`
              INSERT INTO MapsIntegration (EventID, Latitude, Longitude)
              VALUES (@eventId, @latitude, @longitude)
            `);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.status(200).json({ message: 'Event updated successfully' });
    } catch (error) {
      // Rollback transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error during event update', error: error.message });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    const pool = await poolPromise;
    
    // Check if event exists and belongs to the user
    const eventCheck = await pool.request()
      .input('eventId', sql.Int, id)
      .query('SELECT CompanyID FROM Events WHERE EventID = @eventId');
    
    if (eventCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Only allow the company that created the event or admin to delete it
    if (eventCheck.recordset[0].CompanyID !== userId && userType !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    // Delete event (cascading delete will handle related records)
    await pool.request()
      .input('eventId', sql.Int, id)
      .query('DELETE FROM Events WHERE EventID = @eventId');
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error during event deletion', error: error.message });
  }
};

// Add event image
const addEventImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    const pool = await poolPromise;
    
    // Check if event exists and belongs to the user
    const eventCheck = await pool.request()
      .input('eventId', sql.Int, id)
      .query('SELECT CompanyID FROM Events WHERE EventID = @eventId');
    
    if (eventCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Only allow the company that created the event or admin to add images
    if (eventCheck.recordset[0].CompanyID !== userId && userType !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to add images to this event' });
    }
    
    // Insert image
    const result = await pool.request()
      .input('eventId', sql.Int, id)
      .input('imageUrl', sql.NVarChar, imageUrl)
      .query(`
        INSERT INTO EventImages (EventID, ImageURL)
        VALUES (@eventId, @imageUrl);
        SELECT SCOPE_IDENTITY() AS ImageID;
      `);
    
    const imageId = result.recordset[0].ImageID;
    
    res.status(201).json({ 
      message: 'Image added successfully',
      imageId: imageId,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({ message: 'Server error while adding image', error: error.message });
  }
};

// Delete event image
const deleteEventImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    const pool = await poolPromise;
    
    // Check if event exists and belongs to the user
    const eventCheck = await pool.request()
      .input('eventId', sql.Int, id)
      .query('SELECT CompanyID FROM Events WHERE EventID = @eventId');
    
    if (eventCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Only allow the company that created the event or admin to delete images
    if (eventCheck.recordset[0].CompanyID !== userId && userType !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete images from this event' });
    }
    
    // Check if image exists
    const imageCheck = await pool.request()
      .input('imageId', sql.Int, imageId)
      .input('eventId', sql.Int, id)
      .query('SELECT ImageID FROM EventImages WHERE ImageID = @imageId AND EventID = @eventId');
    
    if (imageCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Delete image
    await pool.request()
      .input('imageId', sql.Int, imageId)
      .query('DELETE FROM EventImages WHERE ImageID = @imageId');
    
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error while deleting image', error: error.message });
  }
};

// Get event categories
const getEventCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request()
      .query(`
        SELECT DISTINCT Category 
        FROM Events 
        ORDER BY Category
      `);
    
    const categories = result.recordset.map(row => row.Category);
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories', error: error.message });
  }
};

// Search events
const searchEvents = async (req, res) => {
  try {
    const { q, userId } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const pool = await poolPromise;
    
    // Search for events matching the query
    const result = await pool.request()
      .input('searchTerm', sql.NVarChar, `%${q}%`)
      .query(`
        SELECT TOP 20 e.*, u.FullName as CompanyName,
          (SELECT AVG(CAST(r.Rating as FLOAT)) FROM Reviews r WHERE r.EventID = e.EventID) as AverageRating
        FROM Events e
        LEFT JOIN Users u ON e.CompanyID = u.UserID
        WHERE e.Title LIKE @searchTerm OR e.Description LIKE @searchTerm OR e.Category LIKE @searchTerm
        ORDER BY e.StartDate ASC
      `);
    
    // Save search history if userId is provided
    if (userId) {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('searchQuery', sql.NVarChar, q)
        .input('searchType', sql.NVarChar, 'Event')
        .query(`
          INSERT INTO SearchHistory (UserID, SearchQuery, SearchType)
          VALUES (@userId, @searchQuery, @searchType)
        `);
    }
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({ message: 'Server error while searching events', error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addEventImage,
  deleteEventImage,
  getEventCategories,
  searchEvents
};