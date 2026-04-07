import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

function parseYamlFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontMatter: {}, body: content };
  const body = content.slice(match[0].length).trim();
  const frontMatter = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
    } else {
      value = value.replace(/^["']|["']$/g, "");
    }
    frontMatter[key] = value;
  }
  return { frontMatter, body };
}

function scanDirectory(dir, knowledgeDir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, knowledgeDir));
    } else if (entry.name.endsWith(".md") && entry.name !== "INDEX.md") {
      const content = readFileSync(fullPath, "utf-8");
      const { frontMatter, body } = parseYamlFrontMatter(content);
      const relativePath = relative(knowledgeDir, fullPath);
      const stat = statSync(fullPath);
      files.push({
        title: frontMatter.title || entry.name.replace(/\.md$/, ""),
        summary: body.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 2).join(" ").slice(0, 200),
        tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
        date: frontMatter.added_date || frontMatter.publication_date || stat.mtime.toISOString().slice(0, 10),
        type: frontMatter.type || guessType(relativePath),
        path: relativePath,
        url: frontMatter.source_url || null,
      });
    }
  }
  return files;
}

function guessType(relativePath) {
  if (relativePath.startsWith("sources/web")) return "web";
  if (relativePath.startsWith("sources/articles")) return "article";
  if (relativePath.startsWith("sources/notes")) return "note";
  if (relativePath.startsWith("wiki")) return "wiki";
  return "unknown";
}

export function listFiles(knowledgeDir) {
  const files = [
    ...scanDirectory(join(knowledgeDir, "sources"), knowledgeDir),
    ...scanDirectory(join(knowledgeDir, "wiki"), knowledgeDir),
  ];
  files.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return files;
}

export function readFileContent(knowledgeDir, filePath) {
  const fullPath = join(knowledgeDir, filePath);
  if (!existsSync(fullPath)) return null;
  if (!fullPath.startsWith(knowledgeDir)) return null;
  const content = readFileSync(fullPath, "utf-8");
  const { frontMatter, body } = parseYamlFrontMatter(content);
  return {
    title: frontMatter.title || filePath.split("/").pop().replace(/\.md$/, ""),
    content: body,
  };
}
