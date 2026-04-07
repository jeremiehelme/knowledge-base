import { Router } from "express";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { unlinkSync, readFileSync, writeFileSync, existsSync } from "fs";
import { requireAuth } from "./middleware.js";
import { listFiles, readFileContent } from "./index-parser.js";
import { ensureUserWorkspace, injectProfileIntoClaude } from "./profile-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspacesDir = join(__dirname, "..", "workspaces");

const router = Router();
router.use(requireAuth);

function userKnowledgeDir(userName) {
  return join(workspacesDir, userName.toLowerCase(), "knowledge");
}

router.get("/files", (req, res) => {
  const dir = userKnowledgeDir(req.user.name);
  if (!existsSync(dir)) return res.json([]);
  const files = listFiles(dir);
  res.json(files);
});

router.get("/files/*", (req, res) => {
  const filePath = req.params[0];
  if (!filePath) return res.status(400).json({ error: "Missing path" });

  if (filePath.endsWith("/content")) {
    const actualPath = filePath.slice(0, -"/content".length);
    const dir = userKnowledgeDir(req.user.name);
    const result = readFileContent(dir, actualPath);
    if (!result) return res.status(404).json({ error: "File not found" });
    return res.json(result);
  }

  res.status(400).json({ error: "Invalid path" });
});

router.delete("/files/*", (req, res) => {
  const filePath = req.params[0];
  if (!filePath) return res.status(400).json({ error: "Missing path" });
  if (!filePath.endsWith(".md") || filePath.endsWith("INDEX.md")) {
    return res.status(400).json({ error: "Cannot delete this file" });
  }

  const dir = userKnowledgeDir(req.user.name);
  const fullPath = resolve(dir, filePath);

  if (!fullPath.startsWith(resolve(dir) + "/")) return res.status(403).json({ error: "Forbidden" });
  if (!existsSync(fullPath)) return res.status(404).json({ error: "File not found" });

  unlinkSync(fullPath);

  const indexPath = join(dir, "INDEX.md");
  if (existsSync(indexPath)) {
    const indexContent = readFileSync(indexPath, "utf-8");
    const lines = indexContent.split("\n");
    const filtered = lines.filter((line) => !line.includes(filePath));
    writeFileSync(indexPath, filtered.join("\n"));
  }

  res.json({ ok: true });
});

router.get("/profile", (req, res) => {
  const dir = ensureUserWorkspace(req.user.name);
  const profilePath = join(dir, "profile.json");
  if (!existsSync(profilePath)) {
    return res.json({ onboardingCompleted: false });
  }
  const data = JSON.parse(readFileSync(profilePath, "utf-8"));
  res.json(data);
});

router.put("/profile", (req, res) => {
  const dir = ensureUserWorkspace(req.user.name);
  const profilePath = join(dir, "profile.json");
  const profile = req.body;
  writeFileSync(profilePath, JSON.stringify(profile, null, 2));
  injectProfileIntoClaude(dir, profile);
  res.json({ ok: true });
});

export default router;
