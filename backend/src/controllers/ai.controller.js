import { getAIServiceHealth } from '../services/ai.service.js';

export const getAIStatus = async (req, res) => {
  const result = await getAIServiceHealth();

  if (!result.success) {
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to AI service'
    });
  }

  res.json({
    success: true,
    message: 'Node.js backend successfully connected to AI service',
    aiService: result.data
  });
};
