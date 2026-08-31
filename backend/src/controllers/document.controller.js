import path from 'path';
import { fileURLToPath } from 'url';
import { sendPDFToAIService } from '../services/ai.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDocument = async (req, res) => {
  // Check if file was provided
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Validate file type (PDF only)
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only PDF files are allowed'
    });
  }

  // Build the full file path
  const filePath = path.join(__dirname, '../../uploads', req.file.filename);

  // Send PDF to Python AI service
  const aiResponse = await sendPDFToAIService(filePath, req.file.originalname);

  // Return combined response
  if (!aiResponse.success) {
    return res.status(503).json({
      success: false,
      message: 'Document uploaded but AI service unavailable',
      document: {
        originalName: req.file.originalname,
        filename: req.file.filename
      },
      aiService: {
        success: false,
        error: aiResponse.error
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Document uploaded and sent to AI service successfully',
    document: {
      originalName: req.file.originalname,
      filename: req.file.filename
    },
    aiService: aiResponse.data
  });
};
