# wp-bot
# 🤖 WhatsApp Bot Tool

> A production-ready, extensible WhatsApp chatbot framework combining the best patterns from **Baileys**, **WOLFTECH**, **pywce**, and **Evolution API** — with plug-and-play commands, an AI brain powered by OpenAI, and optional RAG for grounded answers.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Baileys](https://img.shields.io/badge/Baileys-6.7-blue)](https://github.com/WhiskeySockets/Baileys)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991)](https://openai.com/)

---

## 📖 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Authentication](#-authentication)
- [Usage](#-usage)
- [Writing Commands](#-writing-commands)
- [AI & Tool Calling](#-ai--tool-calling)
- [RAG Microservice (Optional)](#-rag-microservice-optional)
- [Deployment](#-deployment)
- [Extending the Bot](#-extending-the-bot)
- [Troubleshooting](#-troubleshooting)
- [Comparison With Other Tools](#-comparison-with-other-tools)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🔌 **Plug-and-Play Commands** | Drop a `.js` file into `src/commands/` and it's auto-registered. No central registry to edit. |
| 🧠 **AI Brain** | OpenAI-powered conversations with per-chat history and **function calling** (agentic tool use). |
| 📚 **Optional RAG** | Python microservice with Qdrant + sentence-transformers for grounded, document-based answers. |
| 🔑 **Dual Auth** | Supports both **QR code** scanning and **8-digit pairing code** login. |
| ♻️ **Auto-Reconnect** | Exponential backoff with disconnect-reason detection — survives network drops, gives up only on `loggedOut`. |
| 💾 **Persistent Sessions** | Credentials saved to disk via `useMultiFileAuthState`, so you log in once. |
| 🎯 **Prefix Commands** | Configurable prefix (default `.`) with argument parsing. |
| 🤖 **AI Fallback** | Optionally route non-command messages straight to the AI. |
| 📦 **Zero-Code Extensions** | Add commands, tools, or AI models without touching the core. |
| 🐳 **Docker-Ready** | Simple containerization for VPS or cloud deploy. |

---

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     WhatsApp Client                        │
└──────────────────────────┬─────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   connection.js         │  Baileys socket,
              │   (Transport Layer)     │  QR / pairing auth,
              └────────────┬────────────┘  reconnect logic
                           │
              ┌────────────▼────────────┐
              │   index.js              │  Message router,
              │   (Message Router)      │  prefix parsing
              └────┬──────────────┬─────┘
                   │              │
        ┌──────────▼─────┐   ┌────▼──────────┐
        │ commandLoader  │   │  ai/openai.js │
        │ + commands/    │   │  (AI Brain)   │
        └────────────────┘   └────┬──────────┘
                                  │
                          ┌───────▼────────┐
                          │  rag-service/  │  (optional)
                          │  FastAPI +     │
                          │  Qdrant        │
                          └────────────────┘
```

**Four decoupled layers** — the transport, router, command registry, and AI brain can each be swapped or extended independently.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **pnpm**
- An **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))
- A phone number with WhatsApp installed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/whatsapp-bot-tool.git
cd whatsapp-bot-tool

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Start the bot
npm start
```

On first run, a QR code (or pairing code) will appear in the terminal. Follow the [Authentication](#-authentication) section to link your device.

---

## ⚙️ Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `BOT_NAME` | `MyBot` | Display name shown to WhatsApp. |
| `PREFIX` | `.` | Command prefix (e.g., `.ping`). |
| `AUTH_METHOD` | `qr` | `qr` or `pairing`. |
| `PHONE_NUMBER` | — | Required for `pairing` mode. Digits only, with country code. |
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI key. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Any chat-completion model. |
| `AI_SYSTEM_PROMPT` | *helpful assistant* | System prompt for the AI. |
| `RAG_ENABLED` | `false` | Enable RAG microservice lookups. |
| `RAG_BASE_URL` | `http://localhost:8000` | RAG service endpoint. |
| `BOT_MODE` | `public` | `public` or `private` (reserved). |

---

## 🔐 Authentication

### QR Code Mode (default)

Set `AUTH_METHOD=qr` in `.env`. On startup, a QR code renders in your terminal.

1. Open WhatsApp on your phone.
2. Go to **Settings → Linked Devices → Link a Device**.
3. Scan the QR code.

### Pairing Code Mode

Set `AUTH_METHOD=pairing` and provide `PHONE_NUMBER`. On startup, an 8-digit code is printed:

```
🔑 Pairing code: ABCD-1234
Enter this code in WhatsApp > Linked Devices > Link with phone number.
```

1. Open WhatsApp → **Linked Devices → Link with phone number**.
2. Enter the code shown in the terminal.

> ⚠️ `PHONE_NUMBER` must include the country code and contain **digits only** — no `+`, no spaces, no parentheses. Example: `15551234567`.

Credentials are cached in `auth_info/`. **Never commit this folder** — it grants full access to your WhatsApp account.

---

## 💬 Usage

Once connected, send messages to the linked number:

```
.ping
→ 🏓 Pong!

.help
→ *MyBot Commands*
    .ai — Ask the AI a question. Usage: .ai <question>
    .help — List all available commands.
    .ping — Check if the bot is alive.

.ai what is the capital of France?
→ 🤔 Thinking...
→ The capital of France is Paris.
```

---

## 🧩 Writing Commands

Creating a command is as simple as dropping a file into `src/commands/`. The loader auto-discovers it on startup.

### Basic Template

```js
// src/commands/hello.js
export default {
  name: 'hello',
  description: 'Greet the user.',

  async execute({ sock, msg, jid, args, text }) {
    const name = args[0] || 'there';
    await sock.sendMessage(jid, { text: `👋 Hello, ${name}!` });
  },
};
```

### Context Object

Every `execute()` receives a single object with:

| Field | Type | Description |
| :--- | :--- | :--- |
| `sock` | `WASocket` | The active Baileys socket — use it to send messages, react, etc. |
| `msg` | `proto.WebMessageInfo` | The raw incoming message. |
| `jid` | `string` | The chat JID (user or group). |
| `args` | `string[]` | Whitespace-split arguments after the command name. |
| `text` | `string` | The full original message text. |

### Sending Rich Messages

```js
// Text
await sock.sendMessage(jid, { text: 'Hello!' });

// Image
await sock.sendMessage(jid, {
  image: { url: 'https://example.com/image.jpg' },
  caption: 'Look at this!',
});

// Reaction
await sock.sendMessage(jid, {
  react: { text: '👍', key: msg.key },
});

// Reply
await sock.sendMessage(jid, { text: 'Got it!' }, { quoted: msg });
```

### Adding Rate Limiting

```js
const cooldowns = new Map();

export default {
  name: 'spam',
  description: 'Rate-limited command.',
  async execute({ sock, jid }) {
    const now = Date.now();
    const last = cooldowns.get(jid) || 0;
    if (now - last < 5000) {
      return sock.sendMessage(jid, { text: '⏳ Slow down!' });
    }
    cooldowns.set(jid, now);
    await sock.sendMessage(jid, { text: '✅ Done.' });
  },
};
```

---

## 🧠 AI & Tool Calling

The `src/ai/openai.js` module maintains **per-chat conversation history** (keyed by JID) and supports **function calling**, allowing the AI to invoke registered tools.

### Adding a New Tool

1. **Define the tool** in the `tools` array:

```js
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a city.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
        },
        required: ['city'],
      },
    },
  },
];
```

2. **Handle the tool** in `runTool()`:

```js
async function runTool(name, args) {
  if (name === 'get_current_time') {
    return new Date().toISOString();
  }
  if (name === 'get_weather') {
    const res = await fetch(`https://wttr.in/${args.city}?format=j1`);
    const data = await res.json();
    return `${data.current_condition[0].temp_C}°C, ${data.current_condition[0].weatherDesc[0].value}`;
  }
  return `Unknown tool: ${name}`;
}
```

The AI will now decide on its own when to call `get_weather`.

### Resetting a Conversation

```js
import { resetHistory } from './src/ai/openai.js';
resetHistory('15551234567@s.whatsapp.net');
```

### Enabling AI Fallback for All Messages

In `src/index.js`, uncomment the AI fallback block inside the `messages.upsert` handler. Non-command messages will then be forwarded to the AI.

---

## 📚 RAG Microservice (Optional)

To give the bot **grounded answers** based on your own documents (PDFs, markdown, text), enable the Python RAG service.

### Setup

```bash
cd rag-service
pip install -r requirements.txt

# Ingest your documents
python ingest.py ./docs

# Start the service
uvicorn main:app --port 8000
```

### Enable in the Bot

In `.env`:

```bash
RAG_ENABLED=true
RAG_BASE_URL=http://localhost:8000
```

### Wiring It In

Add `src/ai/ragClient.js`:

```js
import { config } from '../config.js';

export async function retrieve(question) {
  if (!config.ragEnabled) return '';
  const res = await fetch(`${config.ragBaseUrl}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  return data.context || '';
}
```

Then in `askAI()`, prepend the retrieved context to the system prompt:

```js
import { retrieve } from './ragClient.js';

const context = await retrieve(userMessage);
const systemContent = context
  ? `${config.systemPrompt}\n\nUse this context:\n${context}`
  : config.systemPrompt;
```

This is the same **retrieval-augmented-generation** pattern used by WainfoBot and SARA.

---

## 🐳 Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY .env ./
CMD ["node", "src/index.js"]
```

Build and run:

```bash
docker build -t whatsapp-bot-tool .
docker run -d \
  --name wa-bot \
  --env-file .env \
  -v $(pwd)/auth_info:/app/auth_info \
  whatsapp-bot-tool
```

> 💡 Mount `auth_info/` as a volume so the session survives container restarts.

### Docker Compose (Bot + RAG)

```yaml
version: "3.9"
services:
  bot:
    build: .
    env_file: .env
    volumes:
      - ./auth_info:/app/auth_info
    depends_on:
      - rag
    restart: unless-stopped

  rag:
    build: ./rag-service
    ports:
      - "8000:8000"
    restart: unless-stopped
```

### Railway / Render / Fly.io

1. Push the repo to GitHub.
2. Create a new service from the repo.
3. Add environment variables from `.env.example`.
4. Add a **persistent volume** mounted at `/app/auth_info`.
5. Deploy.

### VPS (systemd)

```ini
# /etc/systemd/system/wa-bot.service
[Unit]
Description=WhatsApp Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/whatsapp-bot-tool
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
EnvironmentFile=/home/ubuntu/whatsapp-bot-tool/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now wa-bot
sudo journalctl -u wa-bot -f
```

---

## 🧰 Extending the Bot

| Goal | Where to change |
| :--- | :--- |
| **Add a command** | Drop a `.js` file into `src/commands/`. |
| **Change AI model** | `OPENAI_MODEL` in `.env`. |
| **Add an AI tool** | `tools` array + `runTool()` in `src/ai/openai.js`. |
| **Persist chat history** | Swap the `Map` in `openai.js` for Redis/Postgres. |
| **Switch transport** | Replace `connection.js` with an official Cloud API webhook receiver — the rest is transport-agnostic. |
| **Add middleware** | Wrap `cmd.execute()` in `index.js` (e.g., auth, logging, rate limiting). |
| **Support multiple languages** | Add an i18n dictionary keyed by `jid`'s locale. |

---

## 🐛 Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| `Connection closed (401)` | You were logged out. Delete `auth_info/` and re-authenticate. |
| `Connection closed (428)` | Connection lost. The bot reconnects automatically. |
| QR code never appears | Ensure `AUTH_METHOD=qr` and no stale `auth_info/` folder. |
| Pairing code fails | Check `PHONE_NUMBER` has country code and digits only (`15551234567`, not `+1 555-123-4567`). |
| `OPENAI_API_KEY` error | Verify the key in `.env` and that it has credit. |
| Bot doesn't respond in groups | Groups require the bot to be mentioned or the message to start with the prefix. |
| `auth_info/` grows large | Prune old `app-state-sync-*.json` files periodically. |

Enable verbose logging by setting `logger` in `connection.js` to `pino({ level: 'info' })`.

---

## ⚖️ Comparison With Other Tools

| Tool | Transport | Command System | AI | RAG | Auth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **This tool** | Baileys | Auto-loaded ✅ | OpenAI + tools ✅ | Qdrant ✅ | QR + pairing ✅ |
| Baileys (raw) | Baileys | ❌ | ❌ | ❌ | QR + pairing |
| WOLFTECH | Baileys | Plug-and-play | ❌ | ❌ | QR + pairing |
| pywce | Baileys | YAML templates | ⚠️ Plugin | ❌ | QR |
| Evolution API | Baileys + Cloud API | REST API | OpenAI/Dify | ❌ | QR |
| WainfoBot | Baileys | ❌ | OpenAI | ✅ | QR |

This project merges the strongest ideas from each: WOLFTECH's plug-and-play commands, Evolution API's OpenAI integration, WainfoBot's RAG pattern, and Baileys' dual auth — all in a single readable codebase.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m "Add my feature"`.
4. Push and open a Pull Request.

Please keep commands self-contained and documented with a `description` field.

---

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

Built on the shoulders of these excellent open-source projects:

- [Baileys](https://github.com/WhiskeySockets/Baileys) — WhatsApp Web protocol
- [WOLFTECH](https://github.com/WOLVAREX/WhatsApp-Bot) — command-loader pattern
- [pywce](https://github.com/DonnC/pywce) — template-driven flows
- [Evolution API](https://github.com/EvolutionAPI/evolution-api) — AI integrations
- [WainfoBot](https://github.com/deepakprasad0089/WainfoBot) — RAG pattern
- [OpenAI Node SDK](https://github.com/openai/openai-node) — AI client

---

> ⚠️ **Disclaimer:** This tool uses unofficial WhatsApp libraries. Use at your own risk. For commercial, high-volume, or business-critical use, [WhatsApp Business Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) is the recommended path.
