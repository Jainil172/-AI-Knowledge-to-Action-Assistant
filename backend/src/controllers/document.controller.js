import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sendPDFToAIService } from '../services/ai.service.js';
import { saveDocumentIntelligence } from '../services/documentPersistenceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only PDF files are allowed'
    });
  }

  const filePath = path.join(__dirname, '../../uploads', req.file.filename);

  const aiResponse = await sendPDFToAIService(filePath, req.file.originalname);

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

  const intelligence = aiResponse.data?.intelligence;

  if (!intelligence || !intelligence.success) {
    return res.status(200).json({
      success: true,
      message: 'Document processed but no project intelligence could be extracted',
      document: {
        originalName: req.file.originalname,
        filename: req.file.filename
      },
      aiService: aiResponse.data
    });
  }

  try {
    const saved = await saveDocumentIntelligence({
      fileMetadata: {
        originalName: req.file.originalname,
        storedFilename: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      },
      aiResponse: aiResponse.data?.document || {},
      validatedIntelligence: intelligence.intelligence
    });

    res.status(201).json({
      success: true,
      message: 'Document processed and project intelligence saved successfully',
      document: {
        id: saved.document.id,
        originalName: saved.document.originalName,
        pageCount: saved.document.pageCount
      },
      summary: {
        tasksSaved: saved.tasks.length,
        risksSaved: saved.risks.length,
        decisionsSaved: saved.decisions.length
      },
      data: {
        tasks: saved.tasks,
        risks: saved.risks,
        decisions: saved.decisions
      }
    });
  } catch (error) {
    console.error('Failed to save project intelligence:', error.message);

    res.status(500).json({
      success: false,
      message: 'Document processed but failed to save project intelligence',
      error: error.message
    });
  }
};
