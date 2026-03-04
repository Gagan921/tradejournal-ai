import { analyzeJSON } from '../integrations/openai/client';
import {
  TRADE_ANALYSIS_SYSTEM_PROMPT,
  PATTERN_DETECTION_SYSTEM_PROMPT,
  JOURNAL_ANALYSIS_SYSTEM_PROMPT,
  STRATEGY_FEEDBACK_SYSTEM_PROMPT,
  RISK_EVALUATION_SYSTEM_PROMPT,
  buildTradeAnalysisPrompt,
  buildPatternDetectionPrompt,
  buildJournalAnalysisPrompt,
  buildStrategyFeedbackPrompt,
  buildRiskEvaluationPrompt,
} from '../integrations/openai/prompts';
import { TradeRepository, UserRepository } from '../repositories';
import { ITrade, ITradeAIInsight } from '../interfaces';
import { NotFoundError, ValidationError, ServiceUnavailableError } from '../utils';
import { TRADE_CONSTANTS } from '../constants';
import { logger } from '../config';

/**
 * AI service for trade analysis and insights
 */
export class AIService {
  constructor(
    private tradeRepository: TradeRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Analyze a single trade
   */
  async analyzeTrade(userId: string, tradeId: string): Promise<{
    insights: ITradeAIInsight[];
    analysis: any;
    tokensUsed: number;
    processingTime: number;
  }> {
    // Check user's AI quota
    await this.checkAIQuota(userId);

    // Get trade
    const trade = await this.tradeRepository.findByIdAndUser(tradeId, userId);
    if (!trade) {
      throw new NotFoundError('Trade', tradeId);
    }

    // Build prompt
    const prompt = buildTradeAnalysisPrompt(trade);

    try {
      // Call AI
      const response = await analyzeJSON<any>(prompt, TRADE_ANALYSIS_SYSTEM_PROMPT, {
        temperature: 0.5,
        maxTokens: 2000,
      });

      // Process response
      const analysis = response.content;

      // Convert to insights
      const insights: ITradeAIInsight[] = [];

      // Add mistake insights
      if (analysis.mistakes && Array.isArray(analysis.mistakes)) {
        analysis.mistakes.forEach((mistake: any) => {
          insights.push({
            type: 'mistake',
            category: mistake.type || 'general',
            title: mistake.type || 'Mistake Identified',
            description: mistake.description,
            confidence: this.severityToConfidence(mistake.severity),
            generatedAt: new Date(),
            acknowledged: false,
          });
        });
      }

      // Add pattern insights
      if (analysis.patterns && Array.isArray(analysis.patterns)) {
        analysis.patterns.forEach((pattern: any) => {
          insights.push({
            type: 'pattern',
            category: pattern.pattern || 'pattern',
            title: pattern.pattern || 'Pattern Detected',
            description: pattern.observation,
            confidence: 0.7,
            generatedAt: new Date(),
            acknowledged: false,
          });
        });
      }

      // Add suggestion insights
      if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
        analysis.recommendations.forEach((rec: string) => {
          insights.push({
            type: 'suggestion',
            category: 'improvement',
            title: 'Recommendation',
            description: rec,
            confidence: 0.8,
            generatedAt: new Date(),
            acknowledged: false,
          });
        });
      }

      // Add risk insight if applicable
      if (analysis.riskAssessment) {
        insights.push({
          type: 'risk',
          category: 'risk_management',
          title: 'Risk Assessment',
          description: `Risk score: ${analysis.riskAssessment.score}/10. ${analysis.riskAssessment.weaknesses?.join(', ')}`,
          confidence: 0.75,
          generatedAt: new Date(),
          acknowledged: false,
        });
      }

      // Increment AI usage
      await this.userRepository.incrementUsage(userId, 'aiInsightsThisMonth');

      logger.info('Trade analyzed by AI', {
        userId,
        tradeId,
        insightsCount: insights.length,
        tokensUsed: response.tokensUsed,
      });

      return {
        insights,
        analysis,
        tokensUsed: response.tokensUsed,
        processingTime: response.processingTime,
      };
    } catch (error: any) {
      logger.error('AI analysis failed', { userId, tradeId, error: error.message });
      throw new ServiceUnavailableError('AI analysis failed. Please try again later.');
    }
  }

  /**
   * Detect patterns across multiple trades
   */
  async detectPatterns(userId: string, tradeIds?: string[]): Promise<{
    patterns: any[];
    tokensUsed: number;
    processingTime: number;
  }> {
    await this.checkAIQuota(userId);

    // Get trades
    let trades: ITrade[];
    if (tradeIds && tradeIds.length > 0) {
      trades = await Promise.all(
        tradeIds.map((id) => this.tradeRepository.findByIdAndUser(id, userId))
      ).then((results) => results.filter((t): t is ITrade => t !== null));
    } else {
      const result = await this.tradeRepository.findByUser(userId, { limit: 50 });
      trades = result.trades;
    }

    if (trades.length < 3) {
      throw new ValidationError('At least 3 trades are required for pattern detection');
    }

    const prompt = buildPatternDetectionPrompt(trades);

    try {
      const response = await analyzeJSON<any>(prompt, PATTERN_DETECTION_SYSTEM_PROMPT, {
        temperature: 0.5,
        maxTokens: 2000,
      });

      await this.userRepository.incrementUsage(userId, 'aiInsightsThisMonth');

      logger.info('Patterns detected by AI', {
        userId,
        tradesCount: trades.length,
        patternsCount: response.content.patterns?.length || 0,
      });

      return {
        patterns: response.content.patterns || [],
        tokensUsed: response.tokensUsed,
        processingTime: response.processingTime,
      };
    } catch (error: any) {
      logger.error('Pattern detection failed', { userId, error: error.message });
      throw new ServiceUnavailableError('Pattern detection failed. Please try again later.');
    }
  }

  /**
   * Analyze journal entries
   */
  async analyzeJournal(userId: string, entries: any[]): Promise<{
    analysis: any;
    tokensUsed: number;
    processingTime: number;
  }> {
    await this.checkAIQuota(userId);

    if (entries.length < 1) {
      throw new ValidationError('At least one journal entry is required');
    }

    const prompt = buildJournalAnalysisPrompt(entries);

    try {
      const response = await analyzeJSON<any>(prompt, JOURNAL_ANALYSIS_SYSTEM_PROMPT, {
        temperature: 0.6,
        maxTokens: 2000,
      });

      await this.userRepository.incrementUsage(userId, 'aiInsightsThisMonth');

      logger.info('Journal analyzed by AI', {
        userId,
        entriesCount: entries.length,
      });

      return {
        analysis: response.content,
        tokensUsed: response.tokensUsed,
        processingTime: response.processingTime,
      };
    } catch (error: any) {
      logger.error('Journal analysis failed', { userId, error: error.message });
      throw new ServiceUnavailableError('Journal analysis failed. Please try again later.');
    }
  }

  /**
   * Get strategy feedback
   */
  async getStrategyFeedback(
    userId: string,
    strategy: any,
    tradeIds?: string[]
  ): Promise<{
    feedback: any;
    tokensUsed: number;
    processingTime: number;
  }> {
    await this.checkAIQuota(userId);

    // Get trades for this strategy
    let trades: ITrade[] = [];
    if (tradeIds && tradeIds.length > 0) {
      trades = await Promise.all(
        tradeIds.map((id) => this.tradeRepository.findByIdAndUser(id, userId))
      ).then((results) => results.filter((t): t is ITrade => t !== null));
    }

    const prompt = buildStrategyFeedbackPrompt(strategy, trades);

    try {
      const response = await analyzeJSON<any>(prompt, STRATEGY_FEEDBACK_SYSTEM_PROMPT, {
        temperature: 0.5,
        maxTokens: 2000,
      });

      await this.userRepository.incrementUsage(userId, 'aiInsightsThisMonth');

      logger.info('Strategy feedback generated by AI', {
        userId,
        strategyId: strategy._id,
      });

      return {
        feedback: response.content,
        tokensUsed: response.tokensUsed,
        processingTime: response.processingTime,
      };
    } catch (error: any) {
      logger.error('Strategy feedback failed', { userId, error: error.message });
      throw new ServiceUnavailableError('Strategy feedback failed. Please try again later.');
    }
  }

  /**
   * Evaluate risk profile
   */
  async evaluateRisk(userId: string, portfolio?: any): Promise<{
    evaluation: any;
    tokensUsed: number;
    processingTime: number;
  }> {
    await this.checkAIQuota(userId);

    // Get recent trades
    const { trades } = await this.tradeRepository.findByUser(userId, { limit: 30 });

    const prompt = buildRiskEvaluationPrompt(trades, portfolio);

    try {
      const response = await analyzeJSON<any>(prompt, RISK_EVALUATION_SYSTEM_PROMPT, {
        temperature: 0.4,
        maxTokens: 2000,
      });

      await this.userRepository.incrementUsage(userId, 'aiInsightsThisMonth');

      logger.info('Risk evaluation completed by AI', {
        userId,
        tradesCount: trades.length,
      });

      return {
        evaluation: response.content,
        tokensUsed: response.tokensUsed,
        processingTime: response.processingTime,
      };
    } catch (error: any) {
      logger.error('Risk evaluation failed', { userId, error: error.message });
      throw new ServiceUnavailableError('Risk evaluation failed. Please try again later.');
    }
  }

  /**
   * Check if user has AI quota available
   */
  private async checkAIQuota(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const plan = user.subscription?.plan || 'free';
    const limit = TRADE_CONSTANTS.PLAN_LIMITS[plan as keyof typeof TRADE_CONSTANTS.PLAN_LIMITS];

    if (limit.maxAiInsightsPerMonth > 0 && user.usage.aiInsightsThisMonth >= limit.maxAiInsightsPerMonth) {
      throw new ValidationError(
        'Monthly AI analysis limit exceeded. Please upgrade your plan for more AI insights.'
      );
    }
  }

  /**
   * Convert severity to confidence score
   */
  private severityToConfidence(severity: string): number {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 0.95;
      case 'high':
        return 0.85;
      case 'medium':
        return 0.75;
      case 'low':
        return 0.65;
      default:
        return 0.7;
    }
  }
}
