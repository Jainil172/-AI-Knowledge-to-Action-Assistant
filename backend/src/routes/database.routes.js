import { Router } from 'express';
import prisma from '../config/prisma.js';

const router = Router();

router.get('/database/status', async (req, res) => {
  try {
    // Test database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: 'Database connection is working'
    });
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Unable to connect to database'
    });
  }
});

export default router;
