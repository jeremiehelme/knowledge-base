import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, "..", "config.json");

let config = null;

function loadConfig() {
  const raw = readFileSync(configPath, "utf-8");
  config = JSON.parse(raw);
  return config;
}

export function getConfig() {
  if (!config) loadConfig();
  return config;
}

export function authenticateToken(token) {
  const { users } = getConfig();
  const user = users.find((u) => u.token === token);
  return user ? { name: user.name } : null;
}
