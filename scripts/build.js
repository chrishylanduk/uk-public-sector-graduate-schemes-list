import fs from "fs";
import path from "path";
import { marked } from "marked";
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

function applyTemplate(template, replacements) {
  return Object.entries(replacements).reduce((html, [placeholder, value]) => {
    return html.replaceAll(placeholder, value);
  }, template);
}

function writeOutput(html) {
  fs.mkdirSync(paths.distDir, { recursive: true });
  fs.writeFileSync(paths.outputHtml, html);
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

  const { canonicalTag, openGraphTags, twitterTags, structuredData } =
    buildMetadata({
      pageTitle,
      description,
      pageUrl,
    });

  const introHtml = introHtmlParts.join("\n\n        ");
  const navHtml = buildNavHtml(navItems);
  const contentWithCalloutHtml = calloutHtml
    ? `${contentHtml}\n${calloutHtml}`
    : contentHtml;

  const cacheBuster = Date.now().toString();
  const replacements = {
    "{{ title }}": escapeHtml(pageTitle),
    "{{ description }}": escapeHtml(description),
    "{{ intro }}": introHtml || "",
    "{{ nav }}": navHtml,
    "{{ content }}": contentWithCalloutHtml,
    "{{ lastUpdated }}": new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
    }).format(new Date()),
    "{{ canonical }}": canonicalTag,
    "{{ metaOg }}": openGraphTags,
    "{{ metaTwitter }}": twitterTags,
    "{{ jsonLd }}": structuredData,
    "{{ roleConfigJson }}": JSON.stringify(roleConfigData),
    "{{ cacheBuster }}": cacheBuster,
  };

  const finalHtml = applyTemplate(template, replacements);

  writeOutput(finalHtml);
  copyStaticAssets();

  console.log(`Built ${path.relative(projectRoot, paths.outputHtml)}`);
}

try {
  buildSite();
} catch (error) {
  console.error(error);
  process.exit(1);
}
