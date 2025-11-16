import fs from "fs";
import path from "path";
import { marked } from "marked";
import { createRequire } from "module";
import { projectRoot, paths } from "./utils/paths.js";
import { loadRoleConfig, transformRoleTags } from "./utils/roleConfig.js";
import {
  analyseTokens,
  renderCallout,
  renderContentHtml,
} from "./utils/pageContent.js";
import { buildMetadata } from "./utils/metadata.js";
import { escapeHtml } from "./utils/html.js";
import { extractSiteContent } from "./utils/readme.js";
import { generateSitemap } from "./utils/sitemap.js";

const require = createRequire(import.meta.url);

let transformSync;
try {
  ({ transformSync } = require("esbuild"));
} catch (error) {
  throw new Error(
    "esbuild is required to build the client bundle. Install dependencies with `npm install` before running the build.",
    { cause: error },
  );
}

function readSourceFiles() {
  const readme = fs.readFileSync(paths.readme, "utf8");
  const template = fs.readFileSync(paths.template, "utf8");
  const siteMarkdown = extractSiteContent(readme);
  return { siteMarkdown, template };
}

function buildDescription({ pageTitle, plainIntro }) {
  return plainIntro || pageTitle;
}

function resolveSiteUrl() {
  const defaultSiteUrl = "https://publicsectorgradschemes.co.uk";
  const siteUrlEnv = process.env.SITE_URL ? process.env.SITE_URL.trim() : "";
  const siteUrlSource = siteUrlEnv || defaultSiteUrl;
  const normalizedSiteUrl = siteUrlSource.replace(/\/+$/, "");

  if (!normalizedSiteUrl) {
    return "";
  }

  return `${normalizedSiteUrl}/`;
}

function buildNavHtml(navItems) {
  if (!navItems.length) {
    return "<li><span>No sections available</span></li>";
  }

  return navItems
    .map(
      (item) => `<li><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`,
    )
    .join("\n          ");
}

function buildRoleFilterListHtml(roleConfig) {
  const entries = Object.entries(roleConfig || {});

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(([slug, config]) => {
      const safeSlug = escapeHtml(slug);
      const labelText = config?.label || slug;
      const safeLabel = escapeHtml(labelText);
      const id = `role-filter-${slug}`;
      const safeId = escapeHtml(id);

      return `
                <div class="role-filter__item">
                  <input type="checkbox" class="role-filter__checkbox" id="${safeId}" name="role-filter" value="${safeSlug}" />
                  <label class="role-filter__label" for="${safeId}">
                    <span class="role-tag role-tag--filter" data-role="${safeSlug}" data-role-label="${safeLabel}">${safeLabel}</span>
                  </label>
                </div>`;
    })
    .join("");
}

function countSchemeItems(contentHtml) {
  if (!contentHtml || typeof contentHtml !== "string") {
    return 0;
  }

  const schemePattern = /<li\b[^>]*>[\s\S]*?class="role-tag\b[\s\S]*?<\/li>/gi;
  const matches = contentHtml.match(schemePattern);
  return matches ? matches.length : 0;
}

function buildResultsSummary(totalItems) {
  if (!Number.isFinite(totalItems) || totalItems <= 0) {
    return "No schemes available.";
  }

  const plural = totalItems === 1 ? "scheme" : "schemes";
  return `Showing all ${totalItems} ${plural}.`;
}

function applyTemplate(template, replacements) {
  return Object.entries(replacements).reduce((html, [placeholder, value]) => {
    return html.replaceAll(placeholder, value);
  }, template);
}

function writeOutput(html) {
  fs.mkdirSync(paths.distDir, { recursive: true });
  fs.writeFileSync(paths.outputHtml, html);
}

function writeSitemap(siteUrl, lastModified) {
  const sitemapContent = generateSitemap({ siteUrl, lastModified });
  const sitemapPath = path.join(paths.distDir, "sitemap.xml");
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log(`Built ${path.relative(projectRoot, sitemapPath)}`);
}

function copyStaticAssets() {
  if (!fs.existsSync(paths.staticDir)) {
    console.warn(
      "Warning: static assets directory not found, expected at static/",
    );
    return;
  }

  const entries = fs.readdirSync(paths.staticDir, { withFileTypes: true });

  entries.forEach((entry) => {
    const srcPath = path.join(paths.staticDir, entry.name);
    const destPath = path.join(paths.distDir, entry.name);

    if (entry.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function transpileClientScripts() {
  const searchSource = fs.readFileSync(paths.searchScript, "utf8");
  const { code } = transformSync(searchSource, {
    loader: "js",
    target: "es2018",
    format: "esm",
  });
  fs.writeFileSync(path.join(paths.distDir, "search.js"), `${code}\n`);
}

function buildSite() {
  const { siteMarkdown, template } = readSourceFiles();
  const { roleConfigData, roleAliasMap } = loadRoleConfig(paths.roleConfig);

  const markdown = transformRoleTags(siteMarkdown, roleAliasMap);
  const tokens = marked.lexer(markdown);

  const {
    pageTitle,
    introHtmlParts,
    plainIntro,
    calloutHeading,
    calloutTokens,
    contentTokens,
  } = analyseTokens(tokens);

  const navItems = [];
  const contentHtml = renderContentHtml(contentTokens, navItems);
  const calloutHtml = renderCallout(calloutTokens, calloutHeading);
  const description = buildDescription({ pageTitle, plainIntro });
  const pageUrl = resolveSiteUrl();
  const lastModified = new Date();

  const { canonicalTag, openGraphTags, twitterTags, structuredData, lastModifiedMeta } =
    buildMetadata({
      pageTitle,
      description,
      pageUrl,
      lastModified,
    });

  const introHtml = introHtmlParts.join("\n\n        ");
  const navHtml = buildNavHtml(navItems);
  const contentWithCalloutHtml = calloutHtml
    ? `${contentHtml}\n${calloutHtml}`
    : contentHtml;

  const cacheBuster = Date.now().toString();
  const roleFilterList = buildRoleFilterListHtml(roleConfigData);
  const totalSchemes = countSchemeItems(contentWithCalloutHtml);
  const resultsSummary = buildResultsSummary(totalSchemes);
  const replacements = {
    "{{ title }}": escapeHtml(pageTitle),
    "{{ description }}": escapeHtml(description),
    "{{ intro }}": introHtml || "",
    "{{ nav }}": navHtml,
    "{{ content }}": contentWithCalloutHtml,
    "{{ lastUpdated }}": new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
    }).format(lastModified),
    "{{ canonical }}": canonicalTag,
    "{{ metaOg }}": openGraphTags,
    "{{ metaTwitter }}": twitterTags,
    "{{ metaLastModified }}": lastModifiedMeta,
    "{{ jsonLd }}": structuredData,
    "{{ roleConfigJson }}": JSON.stringify(roleConfigData),
    "{{ cacheBuster }}": cacheBuster,
    "{{ roleFilterList }}": roleFilterList,
    "{{ resultsSummary }}": escapeHtml(resultsSummary),
  };

  const finalHtml = applyTemplate(template, replacements);

  writeOutput(finalHtml);
  copyStaticAssets();
  transpileClientScripts();
  writeSitemap(pageUrl, lastModified);

  console.log(`Built ${path.relative(projectRoot, paths.outputHtml)}`);
}

try {
  buildSite();
} catch (error) {
  console.error(error);
  process.exit(1);
}
