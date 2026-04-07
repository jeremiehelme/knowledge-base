import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspacesDir = join(__dirname, "..", "workspaces");
const templateDir = join(__dirname, "..", "template");

export function ensureUserWorkspace(userName) {
  const userDir = join(workspacesDir, userName.toLowerCase());
  if (!existsSync(userDir)) {
    mkdirSync(userDir, { recursive: true });
    if (existsSync(templateDir)) {
      cpSync(templateDir, userDir, { recursive: true });
    }
  }
  return userDir;
}

export function generateProfileMarkdown(profile) {
  const lines = ["<!-- BUSINESS_PROFILE_START -->", "## Business Context", ""];

  const {
    companyName,
    industry,
    companyStage: stage,
    teamSize,
    businessDescription: description,
    targetCustomers,
    revenueModel,
    goals,
    challenges,
    yourRole: founderRole,
    competitors,
    assistantFocus: advisorFocus,
    anythingElse: additionalContext,
  } = profile;

  const hasIntro = companyName || industry || stage || teamSize;
  if (hasIntro) {
    let intro = "You are advising";
    if (companyName) intro += ` **${companyName}**,`;
    if (industry) intro += ` a **${industry}** company`;
    if (stage) intro += ` at the **${stage}** stage`;
    if (teamSize) intro += ` with a team of **${teamSize}**`;
    intro += ".";
    lines.push(intro);
    lines.push("");
  }

  if (description) {
    lines.push(`**What they do:** ${description}`);
  }
  if (targetCustomers) {
    lines.push(`**Target customers:** ${targetCustomers}`);
  }
  if (revenueModel && (Array.isArray(revenueModel) ? revenueModel.length > 0 : revenueModel)) {
    const value = Array.isArray(revenueModel) ? revenueModel.join(", ") : revenueModel;
    lines.push(`**Revenue model:** ${value}`);
  }

  if (description || targetCustomers || (revenueModel && (Array.isArray(revenueModel) ? revenueModel.length > 0 : revenueModel))) {
    lines.push("");
  }

  if (goals) {
    if (Array.isArray(goals)) {
      if (goals.length > 0) {
        lines.push("## Current Goals");
        for (const goal of goals) {
          const statusLabel =
            goal.status === "in_progress" ? "IN PROGRESS" :
            goal.status === "achieved" ? "ACHIEVED" :
            "NOT STARTED";
          let line = `- [${statusLabel}] ${goal.title}`;
          if (goal.targetDate) line += ` (target: ${goal.targetDate})`;
          lines.push(line);
          if (goal.description) lines.push(`  ${goal.description}`);
        }
        lines.push("");
      }
    } else {
      lines.push(`**Goals:** ${goals}`);
    }
  }
  if (challenges) {
    if (Array.isArray(challenges)) {
      if (challenges.length > 0) {
        lines.push("## Challenges");
        for (const challenge of challenges) {
          lines.push(`- ${challenge}`);
        }
        lines.push("");
      }
    } else {
      lines.push(`**Challenges:** ${challenges}`);
      lines.push("");
    }
  } else if (goals && !Array.isArray(goals)) {
    lines.push("");
  }

  if (founderRole) {
    lines.push(`**Role:** ${founderRole}`);
  }
  if (competitors) {
    lines.push(`**Competitors:** ${competitors}`);
  }
  if (advisorFocus && (Array.isArray(advisorFocus) ? advisorFocus.length > 0 : advisorFocus)) {
    const value = Array.isArray(advisorFocus) ? advisorFocus.join(", ") : advisorFocus;
    lines.push(`**Focus areas:** ${value}`);
  }

  if (founderRole || competitors || (advisorFocus && (Array.isArray(advisorFocus) ? advisorFocus.length > 0 : advisorFocus))) {
    lines.push("");
  }

  if (additionalContext) {
    lines.push(additionalContext);
    lines.push("");
  }

  lines.push("<!-- BUSINESS_PROFILE_END -->");

  return lines.join("\n");
}

export function injectProfileIntoClaude(workspaceDir, profile) {
  const claudePath = join(workspaceDir, "CLAUDE.md");
  const existing = existsSync(claudePath) ? readFileSync(claudePath, "utf-8") : "";
  const block = generateProfileMarkdown(profile);

  const startSentinel = "<!-- BUSINESS_PROFILE_START -->";
  const endSentinel = "<!-- BUSINESS_PROFILE_END -->";

  let updated;
  if (existing.includes(startSentinel) && existing.includes(endSentinel)) {
    const startIdx = existing.indexOf(startSentinel);
    const endIdx = existing.indexOf(endSentinel) + endSentinel.length;
    updated = existing.slice(0, startIdx) + block + existing.slice(endIdx);
  } else {
    updated = block + "\n" + existing;
  }

  writeFileSync(claudePath, updated);
}
