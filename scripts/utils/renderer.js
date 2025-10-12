import { marked } from "marked";
import { SlugTracker } from "./slugger.js";

export function createRenderer({ collectNav = false, navItems = [] } = {}) {
  const slugTracker = new SlugTracker();

  if (collectNav) {
    slugTracker.reset();
  }

  const renderer = new marked.Renderer();
  const defaultLink = marked.Renderer.prototype.link;

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
