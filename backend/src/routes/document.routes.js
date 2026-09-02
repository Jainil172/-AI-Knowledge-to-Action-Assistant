import { Router } from 'express';
import { uploadDocument } from '../controllers/document.controller.js';
import upload from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/documents/upload', authenticate, async (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err.name, err.message, err.code);
      if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed'
      });
    }
    uploadDocument(req, res);
  });
});

export default router;
