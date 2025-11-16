import { escapeHtml } from "./html.js";

/**
 * Format date to W3C datetime format (ISO 8601)
 * @param {Date} date
 * @returns {string}
 */
function formatW3CDate(date) {
  return date.toISOString();
}

/**
 * Generate sitemap.xml content
 * @param {Object} options
 * @param {string} options.siteUrl - Base URL of the site
 * @param {Date} options.lastModified - Last modification date
 * @returns {string} - Sitemap XML content
 */
export function generateSitemap({ siteUrl, lastModified }) {
  const formattedDate = formatW3CDate(lastModified);
  const escapedUrl = escapeHtml(siteUrl);
  const escapedDate = escapeHtml(formattedDate);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${escapedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}
