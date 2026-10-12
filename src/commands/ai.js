import { askAI } from '../ai/openai.js';

export default {
  name: 'ai',
  description: 'Ask the AI a question. Usage: .ai <question>',
  async execute({ sock, jid, args }) {
    const question = args.join(' ').trim();
    if (!question) {
      return sock.sendMessage(jid, {
        text: 'Usage: .ai <your question>',
      });
    }

    await sock.sendMessage(jid, { text: '🤔 Thinking...' });
    const reply = await askAI(jid, question);
    return sock.sendMessage(jid, { text: reply });
  },
};
