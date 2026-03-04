/**
 * AI Prompts for TradeMind
 * Structured prompts for different AI analysis types
 */

/**
 * System prompt for trade analysis
 */
export const TRADE_ANALYSIS_SYSTEM_PROMPT = `You are an expert trading analyst and coach. Your role is to analyze trades and provide actionable insights to help traders improve their performance.

Analyze the trade data provided and identify:
1. Mistakes or missed opportunities
2. Patterns in the trade execution
3. Risk management assessment
4. Psychological factors
5. Specific, actionable recommendations

Be constructive but honest. Focus on specific observations rather than general advice.

Respond in JSON format with the following structure:
{
  "summary": "Brief summary of the trade",
  "mistakes": [
    {
      "type": "mistake category",
      "description": "Detailed description",
      "severity": "low|medium|high|critical",
      "howToAvoid": "Specific advice to avoid this mistake"
    }
  ],
  "patterns": [
    {
      "pattern": "Pattern name",
      "observation": "What was observed",
      "significance": "Why this matters"
    }
  ],
  "riskAssessment": {
    "score": 1-10,
    "strengths": ["Risk management strengths"],
    "weaknesses": ["Risk management weaknesses"]
  },
  "psychology": {
    "observed": "Psychological observations",
    "recommendations": "Psychological improvement tips"
  },
  "recommendations": [
    "Specific actionable recommendations"
  ],
  "overallRating": 1-10
}`;

/**
 * System prompt for pattern detection across multiple trades
 */
export const PATTERN_DETECTION_SYSTEM_PROMPT = `You are an expert in trading pattern recognition. Analyze a series of trades to identify recurring patterns, both positive and negative.

Look for:
1. Recurring mistakes
2. Successful patterns to replicate
3. Time-based patterns (time of day, day of week)
4. Symbol/instrument preferences and performance
5. Risk management consistency
6. Emotional patterns

Respond in JSON format with the following structure:
{
  "patterns": [
    {
      "type": "mistake|success|behavioral|market",
      "name": "Pattern name",
      "description": "Detailed description",
      "frequency": "How often it occurs",
      "impact": "Impact on performance",
      "recommendation": "How to address or replicate"
    }
  ],
  "strengths": ["Trader's strengths"],
  "weaknesses": ["Areas for improvement"],
  "consistencyScore": 1-10,
  "keyInsights": ["Key takeaways"]
}`;

/**
 * System prompt for journal analysis
 */
export const JOURNAL_ANALYSIS_SYSTEM_PROMPT = `You are a trading psychology expert. Analyze trading journal entries to provide insights on the trader's mental state, discipline, and areas for improvement.

Focus on:
1. Emotional state and mood patterns
2. Discipline and adherence to plan
3. Self-awareness and reflection quality
4. Progress over time
5. Psychological barriers

Respond in JSON format with the following structure:
{
  "summary": "Overall assessment",
  "moodAnalysis": {
    "trend": "Improving|Stable|Declining",
    "observations": "Mood pattern observations",
    "concerns": ["Any concerns"]
  },
  "discipline": {
    "score": 1-10,
    "observations": "Discipline observations",
    "improvements": ["Suggested improvements"]
  },
  "psychology": {
    "strengths": ["Psychological strengths"],
    "challenges": ["Psychological challenges"],
    "recommendations": ["Mental game recommendations"]
  },
  "progress": "Assessment of progress",
  "actionItems": ["Specific action items"]
}`;

/**
 * System prompt for strategy feedback
 */
export const STRATEGY_FEEDBACK_SYSTEM_PROMPT = `You are a trading strategy expert. Analyze a trading strategy based on its rules and performance data to provide constructive feedback.

Evaluate:
1. Strategy logic and edge
2. Risk management rules
3. Entry/exit criteria clarity
4. Performance metrics interpretation
5. Potential improvements

Respond in JSON format with the following structure:
{
  "strategyAssessment": {
    "clarity": 1-10,
    "edge": "Assessment of strategy edge",
    "riskManagement": "Risk management assessment"
  },
  "performance": {
    "winRate": "Win rate assessment",
    "profitFactor": "Profit factor assessment",
    "expectancy": "Expectancy assessment",
    "drawdown": "Drawdown concerns"
  },
  "strengths": ["Strategy strengths"],
  "weaknesses": ["Strategy weaknesses"],
  "improvements": ["Suggested improvements"],
  "recommendations": ["Actionable recommendations"]
}`;

/**
 * System prompt for risk evaluation
 */
export const RISK_EVALUATION_SYSTEM_PROMPT = `You are a risk management expert. Analyze a trader's risk profile based on their trades and provide risk assessment.

Evaluate:
1. Position sizing consistency
2. Stop loss usage and placement
3. Risk per trade
4. Portfolio heat (total risk exposure)
5. Correlation risk
6. Risk of ruin

Respond in JSON format with the following structure:
{
  "riskProfile": {
    "overallRisk": "Conservative|Moderate|Aggressive|Very Aggressive",
    "riskScore": 1-10
  },
  "positionSizing": {
    "assessment": "Position sizing assessment",
    "consistency": "Consistency evaluation",
    "recommendation": "Sizing recommendation"
  },
  "stopLoss": {
    "usage": "Stop loss usage assessment",
    "placement": "Placement quality",
    "improvement": "Suggested improvements"
  },
  "exposure": {
    "current": "Current exposure assessment",
    "concentration": "Concentration risk",
    "correlation": "Correlation risk"
  },
  "riskOfRuin": {
    "level": "Low|Medium|High",
    "explanation": "Explanation of risk assessment"
  },
  "recommendations": ["Risk management recommendations"]
}`;

/**
 * Build trade analysis prompt
 */
export const buildTradeAnalysisPrompt = (trade: any): string => {
  const entries = trade.entries
    .map(
      (e: any, i: number) =>
        `Entry ${i + 1}: ${e.quantity} shares @ $${e.price} on ${new Date(e.date).toLocaleString()}`
    )
    .join('\n');

  const exits = trade.exits?.length
    ? trade.exits
        .map(
          (e: any, i: number) =>
            `Exit ${i + 1}: ${e.quantity} shares @ $${e.price} on ${new Date(e.date).toLocaleString()}`
        )
        .join('\n')
    : 'No exits yet';

  const psychology = trade.psychology
    ? `
Psychology:
- Pre-trade mood: ${trade.psychology.preTradeMood || 'Not recorded'}
- Post-trade mood: ${trade.psychology.postTradeMood || 'Not recorded'}
- Discipline score: ${trade.psychology.disciplineScore || 'Not recorded'}/10
- Notes: ${trade.psychology.notes || 'None'}
- Mistakes: ${trade.psychology.mistakes?.map((m: any) => m.type).join(', ') || 'None recorded'}
`
    : '';

  const setup = trade.setup
    ? `
Setup:
- Type: ${trade.setup.type || 'Not specified'}
- Timeframe: ${trade.setup.timeframe || 'Not specified'}
- Entry criteria: ${trade.setup.entryCriteria?.join(', ') || 'Not specified'}
- Exit criteria: ${trade.setup.exitCriteria?.join(', ') || 'Not specified'}
`
    : '';

  const risk = trade.risk
    ? `
Risk Management:
- Stop loss: $${trade.risk.stopLoss || 'Not set'}
- Take profit: $${trade.risk.takeProfit || 'Not set'}
- Risk/Reward ratio: ${trade.risk.riskRewardRatio || 'Not calculated'}
- Position size: ${trade.risk.positionSize || 'Not calculated'}
`
    : '';

  return `Analyze this trade:

Symbol: ${trade.symbol}
Direction: ${trade.direction}
Status: ${trade.status}
Instrument: ${trade.instrument || 'Stock'}

Entries:
${entries}

Exits:
${exits}

PnL: $${trade.calculations?.netPnL?.toFixed(2) || 'N/A'}
Return: ${trade.calculations?.returnPercent?.toFixed(2) || 'N/A'}%
R-Multiple: ${trade.calculations?.rMultiple?.toFixed(2) || 'N/A'}
Holding Period: ${trade.calculations?.holdingPeriod || 'N/A'} days

Strategy: ${trade.strategy?.name || 'Not specified'}
Tags: ${trade.tags?.join(', ') || 'None'}
${setup}${risk}${psychology}
Provide a detailed analysis of this trade.`;
};

/**
 * Build pattern detection prompt
 */
export const buildPatternDetectionPrompt = (trades: any[]): string => {
  const tradesSummary = trades
    .map((trade, index) => {
      return `
Trade ${index + 1}:
- Symbol: ${trade.symbol}
- Direction: ${trade.direction}
- PnL: $${trade.calculations?.netPnL?.toFixed(2) || 'N/A'}
- Date: ${new Date(trade.createdAt).toLocaleDateString()}
- Mistakes: ${trade.psychology?.mistakes?.map((m: any) => m.type).join(', ') || 'None'}
`;
    })
    .join('\n');

  return `Analyze these ${trades.length} trades to identify patterns:

${tradesSummary}

Identify recurring patterns, strengths, and areas for improvement.`;
};

/**
 * Build journal analysis prompt
 */
export const buildJournalAnalysisPrompt = (entries: any[]): string => {
  const entriesText = entries
    .map((entry, index) => {
      return `
Entry ${index + 1} (${new Date(entry.createdAt).toLocaleDateString()}):
- Type: ${entry.type}
- Mood: ${entry.psychology?.overallMood || 'Not recorded'}
- Discipline: ${entry.psychology?.disciplineRating || 'N/A'}/10
- Content: ${entry.content?.substring(0, 200)}...
`;
    })
    .join('\n');

  return `Analyze these ${entries.length} journal entries:

${entriesText}

Provide insights on the trader's psychological state, discipline, and progress.`;
};

/**
 * Build strategy feedback prompt
 */
export const buildStrategyFeedbackPrompt = (strategy: any, trades: any[]): string => {
  const performance = strategy.performance || {};

  return `Analyze this trading strategy:

Strategy Name: ${strategy.name}
Description: ${strategy.description || 'None'}
Category: ${strategy.category || 'Not specified'}

Rules:
${strategy.rules?.entryConditions?.map((r: any) => `- Entry: ${r.condition}`).join('\n') || 'Not specified'}
${strategy.rules?.exitConditions?.map((r: any) => `- Exit: ${r.condition}`).join('\n') || 'Not specified'}

Performance (${trades.length} trades):
- Win Rate: ${performance.winRate?.toFixed(1) || 'N/A'}%
- Profit Factor: ${performance.profitFactor?.toFixed(2) || 'N/A'}
- Expectancy: $${performance.expectancy?.toFixed(2) || 'N/A'}
- Total PnL: $${performance.totalPnL?.toFixed(2) || 'N/A'}
- Max Drawdown: ${performance.maxDrawdown?.toFixed(1) || 'N/A'}%

Provide feedback on this strategy.`;
};

/**
 * Build risk evaluation prompt
 */
export const buildRiskEvaluationPrompt = (trades: any[], portfolio: any): string => {
  const totalTrades = trades.length;
  const tradesWithStopLoss = trades.filter((t) => t.risk?.stopLoss).length;
  const avgRiskPercent =
    trades.reduce((sum, t) => sum + (t.risk?.riskPercent || 0), 0) / totalTrades;

  return `Evaluate risk management based on this data:

Trading Statistics:
- Total Trades: ${totalTrades}
- Trades with Stop Loss: ${tradesWithStopLoss} (${((tradesWithStopLoss / totalTrades) * 100).toFixed(1)}%)
- Average Risk per Trade: ${avgRiskPercent.toFixed(2)}%

Portfolio:
- Total Value: $${portfolio?.summary?.totalValue?.toFixed(2) || 'N/A'}
- Cash: $${portfolio?.cash?.available?.toFixed(2) || 'N/A'}
- Holdings: ${portfolio?.holdings?.length || 0}

Recent Trades:
${trades
  .slice(0, 5)
  .map(
    (t) =>
      `- ${t.symbol}: ${t.direction}, Risk: ${t.risk?.riskPercent || 'N/A'}%, SL: ${
        t.risk?.stopLoss ? 'Yes' : 'No'
      }`
  )
  .join('\n')}

Provide a risk assessment.`;
};
