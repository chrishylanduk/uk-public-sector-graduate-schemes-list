import fs from "fs";
import { escapeHtml, slugifyRole } from "./html.js";

function createAliasEntries(slug, config) {
  const aliases = new Set([config.label, ...(config.aliases || [])]);
  const pairs = [];

  aliases.forEach((alias) => {
    if (!alias) {
      return;
    }

    const key = alias.trim().toLowerCase();
    if (key) {
      pairs.push([key, { slug, config }]);
    }
  });

  pairs.push([slug, { slug, config }]);
  return pairs;
}

export function loadRoleConfig(roleConfigPath) {
  let roleConfigData = {};

  if (fs.existsSync(roleConfigPath)) {
    try {
      roleConfigData = JSON.parse(fs.readFileSync(roleConfigPath, "utf8"));
    } catch (error) {
      console.warn(
        `Warning: unable to parse role config at ${roleConfigPath}:`,
        error,
      );
      roleConfigData = {};
    }
  }

  const roleAliasMap = new Map();

  Object.entries(roleConfigData).forEach(([slug, config]) => {
    createAliasEntries(slug, config).forEach(([key, value]) => {
      roleAliasMap.set(key, value);
    });
  });

  return {
    roleConfigData,
    roleAliasMap,
  };
}

export function transformRoleTags(markdown, roleAliasMap) {
  const rolePattern = /\{([^{}]+)\}/g;

  return markdown.replace(rolePattern, (match, rawRole) => {
    const label = rawRole.trim();

    if (!label) {
      return match;
    }

    const lookupKey = label.toLowerCase();
    const matchedConfig =
      roleAliasMap.get(lookupKey) ||
      roleAliasMap.get(slugifyRole(label)) ||
      null;
    const slug = matchedConfig?.slug || slugifyRole(label) || "role";
    const displayLabel = matchedConfig?.config?.label || label;

    return `<span class="role-tag" data-role="${escapeHtml(slug)}" data-role-label="${escapeHtml(displayLabel)}">${escapeHtml(displayLabel)}</span>`;
  });
}
