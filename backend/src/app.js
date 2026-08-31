import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import aiRoutes from './routes/ai.routes.js';
import documentRoutes from './routes/document.routes.js';
import documentRetrievalRoutes from './routes/documentRetrieval.routes.js';
import databaseRoutes from './routes/database.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api', aiRoutes);
app.use('/api', documentRoutes);
app.use('/api', documentRetrievalRoutes);
app.use('/api', databaseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  // Handle multer errors
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

  // Handle custom file filter errors
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only PDF files are allowed'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default app;
