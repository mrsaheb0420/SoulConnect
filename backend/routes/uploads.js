const router = require("express").Router();
const path = require("path");
const fs = require("fs");

/*
=====================================
UPLOAD MEDIA FILES
POST /api/uploads/media
=====================================
*/
router.post("/media", (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json("No files were uploaded");
    }

    const file = req.files.file;
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.name).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (!mimetype || !extname) {
      return res.status(400).json("Invalid file type");
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return res.status(400).json("File too large");
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.name.split('.')[0] + '-' + uniqueSuffix + path.extname(file.name);

    // Move file to uploads directory
    const uploadPath = path.join(__dirname, '../uploads', filename);

    file.mv(uploadPath, (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(500).json("File upload failed");
      }

      // Determine media type
      const isVideo = /mp4|mov|avi|webm/.test(path.extname(file.name).toLowerCase());
      const mediaType = isVideo ? 'video' : 'image';

      res.json({
        type: mediaType,
        url: `/uploads/${filename}`,
        filename: filename,
        size: file.size,
        mimetype: file.mimetype
      });
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json("Upload failed");
  }
});

/*
=====================================
DELETE MEDIA FILE
DELETE /api/uploads/media/:filename
=====================================
*/
router.delete("/media/:filename", (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json("File deleted successfully");
    } else {
      res.status(404).json("File not found");
    }
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json("Delete failed");
  }
});

module.exports = router;