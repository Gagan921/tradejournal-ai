import { Router } from 'express';
import { PortfolioController } from '../controllers';
import { authenticate, apiRateLimiter } from '../middleware';

const router = Router();
const portfolioController = new PortfolioController();

// All portfolio routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

/**
 * @route   POST /api/v1/portfolios
 * @desc    Create new portfolio
 * @access  Private
 */
router.post('/', ...portfolioController.createPortfolio);

/**
 * @route   GET /api/v1/portfolios
 * @desc    Get all portfolios for user
 * @access  Private
 */
router.get('/', ...portfolioController.getPortfolios);

/**
 * @route   GET /api/v1/portfolios/default
 * @desc    Get default portfolio
 * @access  Private
 */
router.get('/default', portfolioController.getDefaultPortfolio);

/**
 * @route   GET /api/v1/portfolios/:id
 * @desc    Get portfolio by ID
 * @access  Private
 */
router.get('/:id', ...portfolioController.getPortfolioById);

/**
 * @route   PUT /api/v1/portfolios/:id
 * @desc    Update portfolio
 * @access  Private
 */
router.put('/:id', ...portfolioController.updatePortfolio);

/**
 * @route   DELETE /api/v1/portfolios/:id
 * @desc    Delete portfolio
 * @access  Private
 */
router.delete('/:id', ...portfolioController.deletePortfolio);

/**
 * @route   POST /api/v1/portfolios/:id/holdings
 * @desc    Add holding to portfolio
 * @access  Private
 */
router.post('/:id/holdings', ...portfolioController.addHolding);

/**
 * @route   PUT /api/v1/portfolios/:id/holdings/:symbol
 * @desc    Update holding
 * @access  Private
 */
router.put('/:id/holdings/:symbol', ...portfolioController.updateHolding);

/**
 * @route   DELETE /api/v1/portfolios/:id/holdings/:symbol
 * @desc    Remove holding
 * @access  Private
 */
router.delete('/:id/holdings/:symbol', ...portfolioController.removeHolding);

/**
 * @route   POST /api/v1/portfolios/:id/cash/deposit
 * @desc    Deposit cash
 * @access  Private
 */
router.post('/:id/cash/deposit', ...portfolioController.depositCash);

/**
 * @route   POST /api/v1/portfolios/:id/cash/withdraw
 * @desc    Withdraw cash
 * @access  Private
 */
router.post('/:id/cash/withdraw', ...portfolioController.withdrawCash);

/**
 * @route   POST /api/v1/portfolios/:id/prices
 * @desc    Update prices
 * @access  Private
 */
router.post('/:id/prices', ...portfolioController.updatePrices);

/**
 * @route   GET /api/v1/portfolios/:id/performance
 * @desc    Get portfolio performance
 * @access  Private
 */
router.get('/:id/performance', ...portfolioController.getPerformance);

export default router;
