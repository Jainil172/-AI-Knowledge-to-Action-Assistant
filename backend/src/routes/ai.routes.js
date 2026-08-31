import { Router } from 'express';
import { getAIStatus } from '../controllers/ai.controller.js';

const router = Router();

router.get('/ai/status', getAIStatus);

export default router;
