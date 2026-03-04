import OpenAI from 'openai';
import { env } from '../../config';
import { logger } from '../../config';

/**
 * OpenAI client singleton
 */
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 */
export const getOpenAIClient = (): OpenAI => {
  if (openaiClient) {
    return openaiClient;
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  openaiClient = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  return openaiClient;
};

/**
 * AI response interface
 */
export interface AIResponse<T = any> {
  content: T;
  tokensUsed: number;
  model: string;
  processingTime: number;
}

/**
 * Chat completion options
 */
interface ChatCompletionOptions {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

/**
 * Create chat completion
 */
export const createChatCompletion = async <T = string>(
  options: ChatCompletionOptions
): Promise<AIResponse<T>> => {
  const startTime = Date.now();
  const client = getOpenAIClient();

  const model = options.model || env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const response = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      response_format: options.responseFormat,
    });

    const content = response.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    // Parse JSON if response format is json_object
    let parsedContent: T = content as unknown as T;
    if (options.responseFormat?.type === 'json_object') {
      try {
        parsedContent = JSON.parse(content);
      } catch (error) {
        logger.error('Failed to parse AI JSON response', { content, error });
        throw new Error('Invalid JSON response from AI');
      }
    }

    return {
      content: parsedContent,
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      processingTime,
    };
  } catch (error: any) {
    logger.error('OpenAI API error', { error: error.message });
    throw error;
  }
};

/**
 * Analyze text with AI
 */
export const analyzeText = async (
  prompt: string,
  systemPrompt?: string,
  options: Partial<ChatCompletionOptions> = {}
): Promise<AIResponse<string>> => {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  return createChatCompletion({
    messages,
    ...options,
  });
};

/**
 * Analyze and return structured JSON
 */
export const analyzeJSON = async <T = any>(
  prompt: string,
  systemPrompt?: string,
  options: Partial<ChatCompletionOptions> = {}
): Promise<AIResponse<T>> => {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  return createChatCompletion<T>({
    messages,
    responseFormat: { type: 'json_object' },
    ...options,
  });
};

export default getOpenAIClient;
