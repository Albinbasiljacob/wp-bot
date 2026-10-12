// help.js
import { listCommands } from '../commandLoader.js';
import { config } from '../config.js';

export default {
  name: 'help',
  description: 'List all available commands.',
  async execute({ sock, jid }) {
    const cmds = listCommands()
      .map((c) => `  ${config.prefix}${c.name} — ${c.description}`)
      .join('\n');
    await sock.sendMessage(jid, {
      text: `*${config.botName} Commands*\n\n${cmds}`,
    });
  },
};
