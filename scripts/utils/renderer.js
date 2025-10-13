import { marked } from "marked";
import { SlugTracker } from "./slugger.js";

export function createRenderer({ collectNav = false, navItems = [] } = {}) {
  const slugTracker = new SlugTracker();

  if (collectNav) {
    slugTracker.reset();
  }

  const renderer = new marked.Renderer();
  const defaultLink = marked.Renderer.prototype.link;
  const defaultListItem = marked.Renderer.prototype.listitem;

  if (collectNav) {
    renderer.heading = (token) => {
      const { depth, text } = token;
      const inlineHtml = marked.parseInline(text, { mangle: false });
      const id = slugTracker.slugify(text);

      if (depth === 2) {
        navItems.push({ id, text, depth });
      }

      return `<h${depth} id="${id}">${inlineHtml}</h${depth}>`;
    };
  }

  renderer.listitem = function listitem(token) {
    const html = defaultListItem.call(this, token);

    if (!html || !html.includes('class="role-tag')) {
      return html;
    }

    const roleTagPattern =
      /<span\b[^>]*class="[^"]*\brole-tag\b[^"]*"[^>]*data-role="([^"]+)"[^>]*data-role-label="([^"]*)"[^>]*>([\s\S]*?)<\/span>/gi;
    const unique = new Map();
    let match;

    while ((match = roleTagPattern.exec(html))) {
      const slug = match[1];
      const labelAttr = match[2] || "";
      const textContent = (match[3] || "").trim();
      const label = labelAttr || textContent;

      if (!slug || unique.has(slug)) {
        continue;
      }

      unique.set(slug, label);
    }

    if (unique.size === 0) {
      return html;
    }

    const pills = Array.from(unique.entries())
      .map(([slug, label]) => {
        const pillLabel = label || slug;
        return `<span class="role-tag role-tag--details" data-role="${slug}" data-role-label="${pillLabel}">${pillLabel}</span>`;
      })
      .join("");

    const detailsHtml = `\n  <details class="role-tag-details">\n    <summary class="role-tag-details__summary">View all role types</summary>\n    <div class="role-tag-details__content">${pills}</div>\n  </details>`;

    const closingIndex = html.lastIndexOf("</li>");
    if (closingIndex === -1) {
      return html;
    }

    return `${html.slice(0, closingIndex)}${detailsHtml}${html.slice(closingIndex)}`;
  };

  renderer.link = function link(token) {
    const html = defaultLink.call(this, token);
    const href = token.href || "";

    if (!/^https?:\/\//i.test(href) || html.includes("target=")) {
      return html;
    }

    return html.replace("<a ", '<a target="_blank" rel="noopener" ');
  };

  return renderer;
}
