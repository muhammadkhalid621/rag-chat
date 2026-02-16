import { config } from '../config/env';
import type { RetrievedContext } from './messageService';
import { AppError } from '../utils/errors';

type ChatTurn = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ResponsesApiPayload = {
  model: string;
  input: Array<{
    role: 'user' | 'assistant' | 'system';
    content: Array<{ type: 'input_text'; text: string }>;
  }>;
};

type OpenAiResponsesApiResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function normalizeContext(context?: RetrievedContext): string {
  if (!context) {
    return '';
  }

  return `\n\nRetrieved context:\n${JSON.stringify(context)}`;
}

export async function generateAssistantReply(params: {
  history: ChatTurn[];
  userMessage: string;
  retrievedContext?: RetrievedContext;
}): Promise<string> {
  if (!config.openAiApiKey) {
    throw new AppError(500, 'OPENAI_API_KEY is not configured');
  }

  const userMessageWithContext = `${params.userMessage}${normalizeContext(params.retrievedContext)}`;

  const input: ResponsesApiPayload['input'] = [
    ...params.history.map((turn) => ({
      role: turn.role,
      content: [{ type: 'input_text' as const, text: turn.content }]
    })),
    {
      role: 'user',
      content: [{ type: 'input_text', text: userMessageWithContext }]
    }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);

  let response: globalThis.Response;
  let data: OpenAiResponsesApiResult;

  try {
    response = await fetch(`${config.openAiBaseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openAiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.openAiModel,
        input
      } satisfies ResponsesApiPayload),
      signal: controller.signal
    });

    data = (await response.json()) as OpenAiResponsesApiResult;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(504, 'OpenAI request timed out');
    }
    throw new AppError(502, 'OpenAI request failed');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = data.error?.message || 'OpenAI request failed';
    throw new AppError(response.status, message);
  }

  const textFromOutput = data.output_text;
  const textFromContent = data.output
    ?.flatMap((item) => item.content || [])
    .find((contentItem) => contentItem.type === 'output_text' && typeof contentItem.text === 'string')?.text;

  const assistantText = textFromOutput || textFromContent;

  if (!assistantText) {
    throw new AppError(502, 'OpenAI response did not include assistant text');
  }

  return assistantText;
}
