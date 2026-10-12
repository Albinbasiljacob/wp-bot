import { connectToWhatsApp } from './connection.js';
import { loadCommands, getCommand } from './commandLoader.js';
import { askAI } from './ai/openai.js';
import { config } from './config.js';

async function main() {
  console.log(`\n🚀 Starting ${config.botName}...\n`);
  console.log('Loading commands...');
  await loadCommands();

  const sock = await connectToWhatsApp();

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Ignore messages sent by the bot itself
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith('@g.us') === false && jid.endsWith('@s.whatsapp.net') === false) {
        // Accept both DMs and groups
      }

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      if (!text) continue;

      // --- Command parsing ---
      if (text.startsWith(config.prefix)) {
        const [rawCmd, ...args] = text
          .slice(config.prefix.length)
          .trim()
          .split(/\s+/);

        const cmd = getCommand(rawCmd);
        if (cmd) {
          try {
            await cmd.execute({ sock, msg, jid, args, text });
          } catch (err) {
            console.error(`Command "${rawCmd}" failed:`, err);
            await sock.sendMessage(jid, {
              text: `❌ Command failed: ${err.message}`,
            });
          }
          continue;
        }
      }

      // --- Optional AI fallback for non-command messages ---
      // Uncomment the block below to let the AI answer every non-command message.
      /*
      try {
        const reply = await askAI(jid, text);
        await sock.sendMessage(jid, { text: reply });
      } catch (err) {
        console.error('AI fallback failed:', err);
      }
      */
    }
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
