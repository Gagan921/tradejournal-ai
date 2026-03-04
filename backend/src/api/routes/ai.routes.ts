import { Router } from 'express';
import { AIController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();
const aiController = new AIController();

// All AI routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/ai/analyze-trade
 * @desc    Analyze a trade with AI
 * @access  Private
 */
router.post('/analyze-trade', ...aiController.analyzeTrade);

/**
 * @route   POST /api/v1/ai/detect-patterns
 * @desc    Detect patterns across trades
 * @access  Private
 */
router.post('/detect-patterns', ...aiController.detectPatterns);

/**
 * @route   POST /api/v1/ai/analyze-journal
 * @desc    Analyze journal entries
 * @access  Private
 */
router.post('/analyze-journal', ...aiController.analyzeJournal);

/**
 * @route   POST /api/v1/ai/strategy-feedback
 * @desc    Get strategy feedback
 * @access  Private
 */
router.post('/strategy-feedback', ...aiController.getStrategyFeedback);

/**
 * @route   POST /api/v1/ai/evaluate-risk
 * @desc    Evaluate risk profile
 * @access  Private
 */
router.post('/evaluate-risk', ...aiController.evaluateRisk);

/**
 * @route   GET /api/v1/ai/trades/:tradeId/insights
 * @desc    Get AI insights for a trade
 * @access  Private
 */
router.get('/trades/:tradeId/insights', ...aiController.getTradeInsights);

/**
 * @route   POST /api/v1/ai/trades/:tradeId/insights/:insightId/acknowledge
 * @desc    Acknowledge an insight
 * @access  Private
 */
router.post('/trades/:tradeId/insights/:insightId/acknowledge', ...aiController.acknowledgeInsight);

/**
 * @route   POST /api/v1/ai/trades/:tradeId/insights/:insightId/rate
 * @desc    Rate an insight as helpful
 * @access  Private
 */
router.post('/trades/:tradeId/insights/:insightId/rate', ...aiController.rateInsight);

export default router;
