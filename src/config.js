import 'dotenv/config';

export const config = {
  botName: process.env.BOT_NAME || 'MyBot',
  prefix: process.env.PREFIX || '.',
  authMethod: process.env.AUTH_METHOD || 'qr',
  phoneNumber: process.env.PHONE_NUMBER || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  systemPrompt: process.env.AI_SYSTEM_PROMPT ||
    'You are a helpful WhatsApp assistant. Keep replies concise.',
  ragEnabled: process.env.RAG_ENABLED === 'true',
  ragBaseUrl: process.env.RAG_BASE_URL || 'http://localhost:8000',
  botMode: process.env.BOT_MODE || 'public',
};
