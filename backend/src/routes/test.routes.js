import { Router } from 'express';
import { saveDocumentIntelligence } from '../services/documentPersistenceService.js';

const router = Router();

router.post('/test-persistence', async (req, res) => {
  try {
    const mockData = {
      fileMetadata: {
        originalName: 'test-document.pdf',
        storedFilename: 'test-123.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024
      },
      aiResponse: {
        pageCount: 5
      },
      validatedIntelligence: {
        tasks: [
          {
            title: 'Complete project setup',
            description: 'Set up the development environment',
            owner: 'John Doe',
            deadline: 'next week',
            priority: 'high',
            source: { pageNumber: 1, evidence: 'Project setup tasks listed on page 1' }
          },
          {
            title: 'Review requirements',
            description: 'Review and finalize project requirements',
            owner: 'Jane Smith',
            deadline: '2026-09-15',
            priority: 'medium',
            source: { pageNumber: 2, evidence: 'Requirements review mentioned' }
          }
        ],
        risks: [
          {
            title: 'Timeline risk',
            description: 'Project timeline may be too aggressive',
            severity: 'high',
            source: { pageNumber: 3, evidence: 'Timeline concerns noted' }
          }
        ],
        decisions: [
          {
            title: 'Technology stack decision',
            description: 'Using Node.js and Python microservices',
            source: { pageNumber: 1, evidence: 'Architecture decision documented' }
          }
        ]
      }
    };

    const saved = await saveDocumentIntelligence(mockData);

    res.status(201).json({
      success: true,
      message: 'Test persistence successful',
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
    console.error('Test persistence failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Test persistence failed',
      error: error.message
    });
  }
});

export default router;
