import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const readmePath = path.join(projectRoot, "README.md");
const templatePath = path.join(projectRoot, "templates", "layout.html");
const staticDir = path.join(projectRoot, "static");
const distDir = path.join(projectRoot, "dist");
const outputHtmlPath = path.join(distDir, "index.html");
const roleConfigPath = path.join(projectRoot, "config", "roles.json");

const slugCounts = new Map();

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
for (const [slug, config] of Object.entries(roleConfigData)) {
  const aliases = new Set([config.label, ...(config.aliases || [])]);
  aliases.forEach((alias) => {
    if (!alias) {
      return;
    }
    roleAliasMap.set(alias.trim().toLowerCase(), { slug, config });
  });
  roleAliasMap.set(slug, { slug, config });
}

function slugifyRole(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function transformRoleTags(markdown) {
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
    const safeSlug = escapeHtml(slug);
    const safeLabel = escapeHtml(displayLabel);

    return `<span class="role-tag" data-role="${safeSlug}" data-role-label="${safeLabel}">${safeLabel}</span>`;
  });
}

function slugify(value) {
  const plainValue = String(value ?? "");
  const plainText = plainValue
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/g, "")
    .trim();

  let base = plainText
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!base) {
    base = "section";
  }

  const count = slugCounts.get(base) || 0;
  slugCounts.set(base, count + 1);

  return count === 0 ? base : `${base}-${count}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function createRenderer({ collectNav = false, navItems = [] } = {}) {
  if (collectNav) {
    slugCounts.clear();
  }

  const renderer = new marked.Renderer();
  const defaultLink = marked.Renderer.prototype.link;

  if (collectNav) {
    renderer.heading = (token) => {
      const { depth, text } = token;
      const inlineHtml = marked.parseInline(text, { mangle: false });
      const id = slugify(text);

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

function buildSite() {
  const rawMarkdown = fs.readFileSync(readmePath, "utf8");
  const markdown = transformRoleTags(rawMarkdown);
  const template = fs.readFileSync(templatePath, "utf8");

  const tokens = marked.lexer(markdown);
  const contentTokens = [];

  let pageTitle = "UK public sector graduate schemes";
  const introHtmlParts = [];
  let plainIntro = "";
  let hasTitle = false;
  let calloutHeading = "";
  let calloutTokens = null;
  let introParagraphs = 0;

  const feedbackHeading = "Is something wrong or missing?";

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (!hasTitle && token.type === "heading" && token.depth === 1) {
      pageTitle = token.text.trim();
      hasTitle = true;
      continue;
    }

    if (hasTitle && token.type === "paragraph" && introParagraphs < 2) {
      const introContent = marked.parser([token], {
        mangle: false,
        headerIds: false,
      });

      if (introParagraphs === 0) {
        const leadHtml = introContent
          .replace(/^<p>/, '<p class="lead">')
          .replace(/<\/p>$/, "</p>");
        introHtmlParts.push(leadHtml);
        plainIntro = leadHtml.replace(/<[^>]+>/g, "").trim();
      } else {
        introHtmlParts.push(introContent.trim());
      }

      introParagraphs += 1;
      continue;
    }

    if (
      !calloutTokens &&
      token.type === "heading" &&
      token.depth === 3 &&
      token.text.trim().toLowerCase() === feedbackHeading.toLowerCase()
    ) {
      const sectionTokens = [];
      let nextIndex = tokens.length;
      for (let j = i + 1; j < tokens.length; j += 1) {
        const nextToken = tokens[j];
        if (nextToken.type === "heading" && nextToken.depth <= token.depth) {
          nextIndex = j;
          break;
        }
        sectionTokens.push(nextToken);
      }

      calloutHeading = token.text.trim() || feedbackHeading;
      calloutTokens = sectionTokens;
      i = nextIndex - 1;
      continue;
    }

    if (!hasTitle && token.type === "space") {
      continue;
    }

    contentTokens.push(token);
  }

  const navItems = [];
  const renderer = createRenderer({ collectNav: true, navItems });

  const contentHtml = marked.parser(contentTokens, {
    renderer,
    mangle: false,
    headerIds: false,
  });

  let calloutHtml = "";
  if (calloutTokens) {
    const calloutRenderer = createRenderer();
    const calloutBody = marked
      .parser(calloutTokens, {
        renderer: calloutRenderer,
        mangle: false,
        headerIds: false,
      })
      .trim();

    if (calloutBody) {
      calloutHtml = [
        '<div class="feedback-callout" role="note" aria-label="How to suggest updates">',
        `<p class="feedback-callout__title"><strong>${escapeHtml(calloutHeading || feedbackHeading)}</strong></p>`,
        calloutBody,
        "</div>",
      ].join("\n");
    }
  }
  const descriptionSource = plainIntro || pageTitle;
  const description = descriptionSource;

  const defaultSiteUrl = "https://publicsectorgradschemes.co.uk";
  const siteUrlEnv = process.env.SITE_URL ? process.env.SITE_URL.trim() : "";
  const siteUrlSource = siteUrlEnv || defaultSiteUrl;
  const normalizedSiteUrl = siteUrlSource.replace(/\/+$/, "");
  const pageUrl = normalizedSiteUrl ? `${normalizedSiteUrl}/` : "";

  const canonicalTag = pageUrl
    ? `<link rel="canonical" href="${escapeHtml(pageUrl)}">`
    : "";

  const ogTags = [
    '<meta property="og:type" content="website">',
    pageUrl ? `<meta property="og:url" content="${escapeHtml(pageUrl)}">` : "",
    `<meta property="og:title" content="${escapeHtml(pageTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:site_name" content="${escapeHtml(pageTitle)}">`,
  ]
    .filter(Boolean)
    .join("\n    ");

  const twitterTags = [
    '<meta name="twitter:card" content="summary">',
    `<meta name="twitter:title" content="${escapeHtml(pageTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    pageUrl ? `<meta name="twitter:url" content="${escapeHtml(pageUrl)}">` : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description,
  };

  if (pageUrl) {
    structuredData.url = pageUrl;
  }

  structuredData.publisher = {
    "@type": "Person",
    name: "Chris Hyland",
  };

  const jsonLd = `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n    </script>`;

  const introHtml = introHtmlParts.join("\n\n        ");

  const navHtml = navItems
    .map(
      (item) => `<li><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`,
    )
    .join("\n          ");

  const contentWithCalloutHtml = calloutHtml
    ? `${contentHtml}\n${calloutHtml}`
    : contentHtml;

  const cacheBuster = Date.now().toString();

  const replacements = {
    "{{ title }}": escapeHtml(pageTitle),
    "{{ description }}": escapeHtml(description),
    "{{ intro }}": introHtml || "",
    "{{ nav }}": navHtml || "<li><span>No sections available</span></li>",
    "{{ content }}": contentWithCalloutHtml,
    "{{ lastUpdated }}": new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
    }).format(new Date()),
    "{{ canonical }}": canonicalTag,
    "{{ metaOg }}": ogTags,
    "{{ metaTwitter }}": twitterTags,
    "{{ jsonLd }}": jsonLd,
    "{{ roleConfigJson }}": JSON.stringify(roleConfigData),
    "{{ cacheBuster }}": cacheBuster,
  };

  let finalHtml = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    finalHtml = finalHtml.replaceAll(placeholder, value);
  }

  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(outputHtmlPath, finalHtml); // keep trailing newline from template

  if (fs.existsSync(staticDir)) {
    const entries = fs.readdirSync(staticDir, { withFileTypes: true });
    entries.forEach((entry) => {
      const srcPath = path.join(staticDir, entry.name);
      const destPath = path.join(distDir, entry.name);

      if (entry.isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  } else {
    console.warn(
      "Warning: static assets directory not found, expected at static/",
    );
  }

  console.log(`Built ${path.relative(projectRoot, outputHtmlPath)}`);
}

try {
  buildSite();
} catch (error) {
  console.error(error);
  process.exit(1);
}
