import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, 'commands');

const registry = new Map();

export async function loadCommands() {
  const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const fullPath = path.join(COMMANDS_DIR, file);
    const mod = await import(pathToFileURL(fullPath).href);
    const cmd = mod.default;

    if (!cmd || !cmd.name || typeof cmd.execute !== 'function') {
      console.warn(`⚠️  Skipping invalid command file: ${file}`);
      continue;
    }

    registry.set(cmd.name.toLowerCase(), cmd);
    console.log(`  ✓ loaded command: ${cmd.name}`);
  }

  console.log(`📦 ${registry.size} command(s) ready.\n`);
}

export function getCommand(name) {
  return registry.get(name.toLowerCase());
}

export function listCommands() {
  return [...registry.values()].map((c) => ({
    name: c.name,
    description: c.description || 'No description',
  }));
}
