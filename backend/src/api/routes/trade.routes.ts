import { Router } from 'express';
import { TradeController } from '../controllers';
import { authenticate, apiRateLimiter } from '../middleware';

const router = Router();
const tradeController = new TradeController();

// All trade routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

/**
 * @route   POST /api/v1/trades
 * @desc    Create new trade
 * @access  Private
 */
router.post('/', ...tradeController.createTrade);

/**
 * @route   GET /api/v1/trades
 * @desc    Get all trades for user
 * @access  Private
 */
router.get('/', ...tradeController.getTrades);

/**
 * @route   GET /api/v1/trades/statistics
 * @desc    Get trade statistics
 * @access  Private
 */
router.get('/statistics', tradeController.getStatistics);

/**
 * @route   GET /api/v1/trades/symbols
 * @desc    Get distinct symbols
 * @access  Private
 */
router.get('/symbols', tradeController.getSymbols);

/**
 * @route   GET /api/v1/trades/tags
 * @desc    Get distinct tags
 * @access  Private
 */
router.get('/tags', tradeController.getTags);

/**
 * @route   GET /api/v1/trades/equity-curve
 * @desc    Get equity curve
 * @access  Private
 */
router.get('/equity-curve', tradeController.getEquityCurve);

/**
 * @route   GET /api/v1/trades/:id
 * @desc    Get trade by ID
 * @access  Private
 */
router.get('/:id', ...tradeController.getTradeById);

/**
 * @route   PUT /api/v1/trades/:id
 * @desc    Update trade
 * @access  Private
 */
router.put('/:id', ...tradeController.updateTrade);

/**
 * @route   DELETE /api/v1/trades/:id
 * @desc    Delete trade
 * @access  Private
 */
router.delete('/:id', ...tradeController.deleteTrade);

/**
 * @route   POST /api/v1/trades/:id/exit
 * @desc    Add exit to trade
 * @access  Private
 */
router.post('/:id/exit', ...tradeController.addExit);

export default router;
