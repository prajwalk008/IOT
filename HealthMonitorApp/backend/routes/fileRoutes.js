const express = require('express');
const multer = require('multer');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

router.post('/upload/:userId', upload.array('files'), async (req, res) => {
  try {
    if (!req.files.length) return res.status(400).json({ message: 'No files uploaded' });
    console.log('📁 Uploaded files:', req.files.map(f => f.filename));
    res.json({ success: true, message: 'Files uploaded successfully' });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

module.exports = router;
