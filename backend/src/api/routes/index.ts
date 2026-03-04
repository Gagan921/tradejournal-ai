import { Router } from 'express';
import authRoutes from './auth.routes';
import tradeRoutes from './trade.routes';
import portfolioRoutes from './portfolio.routes';
import aiRoutes from './ai.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/trades', tradeRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/ai', aiRoutes);

export default router;
