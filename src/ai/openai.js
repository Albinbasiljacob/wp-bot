import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({ apiKey: config.openaiKey });

// Per-chat history (in-memory; swap for Redis in production)
const histories = new Map();

// --- Tool definitions ---
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current date and time.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

async function runTool(name, _args) {
  if (name === 'get_current_time') {
    return new Date().toISOString();
  }
  return `Unknown tool: ${name}`;
}

/**
 * Ask the AI a question within a chat context.
 * @param {string} chatId - WhatsApp JID (used as history key)
 * @param {string} userMessage
 * @returns {Promise<string>} assistant reply
 */
export async function askAI(chatId, userMessage) {
  if (!histories.has(chatId)) {
    histories.set(chatId, [
      { role: 'system', content: config.systemPrompt },
    ]);
  }

  const history = histories.get(chatId);
  history.push({ role: 'user', content: userMessage });

  // Trim history to last 20 messages to control token usage
  const trimmed = [history[0], ...history.slice(-19)];

  let response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: trimmed,
    tools,
    tool_choice: 'auto',
  });

  let message = response.choices[0].message;

  // Handle tool calls (agentic loop)
  while (message.tool_calls && message.tool_calls.length > 0) {
    trimmed.push(message);

    for (const toolCall of message.tool_calls) {
      const result = await runTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments || '{}')
      );
      trimmed.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    response = await openai.chat.completions.create({
      model: config.openaiModel,
      messages: trimmed,
      tools,
      tool_choice: 'auto',
    });
    message = response.choices[0].message;
  }

  const reply = message.content || 'Sorry, I could not generate a reply.';
  history.push({ role: 'assistant', content: reply });
  return reply;
}

export function resetHistory(chatId) {
  histories.delete(chatId);
}
