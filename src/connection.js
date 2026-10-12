import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import readline from 'readline';
import { config } from './config.js';

const logger = pino({ level: 'silent' });

// Store the active socket so commands can send messages
export let sock = null;

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const usePairing = config.authMethod === 'pairing';

  sock = makeWASocket({
    version,
    logger,
    auth: state,
    // Do not set printQRInTerminal when using pairing code
    printQRInTerminal: !usePairing,
    browser: [config.botName, 'Chrome', '1.0.0'],
  });

  // --- Pairing code flow ---
  if (usePairing && !sock.authState.creds.registered) {
    // Wait for the socket to initialise before requesting a code
    await new Promise((r) => setTimeout(r, 2000));

    let number = config.phoneNumber;
    if (!number) {
      number = await ask('Enter your phone number (digits only, with country code): ');
    }

    const code = await sock.requestPairingCode(number);
    console.log(`\n🔑 Pairing code: ${code}`);
    console.log('Enter this code in WhatsApp > Linked Devices > Link with phone number.\n');
  }

  // --- Connection lifecycle ---
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !usePairing) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`Connection closed (${statusCode}). Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) connectToWhatsApp();
    }

    if (connection === 'open') {
      console.log(`✅ ${config.botName} is connected.`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  return sock;
}
