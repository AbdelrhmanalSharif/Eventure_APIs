const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper function to resolve upload path based on field name
const getUploadPath = (fieldname) => {
  if (fieldname === 'profilePicture') {
    return path.join(__dirname, '..', 'uploads', 'users');
  }
  return path.join(__dirname, '..', 'uploads', 'events');
};

// Configure storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath(file.fieldname);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'profilePicture' ? 'profile' : 'event';
    cb(null, `${prefix}-${Date.now()}${ext}`);
  }
});

// Filter files to allow only valid image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'), false);
  }
};

// Set up the multer instance
const upload = multer({
  storage,
  fileFilter
});

// Export custom middleware bindings for specific upload types
module.exports = {
  profile: upload.single('profilePicture'),     // For profile picture (users)
  single: upload.single('image'),               // For single event image upload (if needed)
  multiple: upload.array('images', 10)          // For multiple event images
};
