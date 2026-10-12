// ping.js
export default {
  name: 'ping',
  description: 'Check if the bot is alive.',
  async execute({ sock, jid }) {
    await sock.sendMessage(jid, { text: '🏓 Pong!' });
  },
};
