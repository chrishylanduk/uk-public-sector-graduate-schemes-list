import { escapeHtml } from "./html.js";

function buildCanonicalTag(url) {
  return url ? `<link rel="canonical" href="${escapeHtml(url)}">` : "";
}

function buildOpenGraphTags({ pageUrl, pageTitle, description }) {
  const tags = [
    '<meta property="og:type" content="website">',
    pageUrl ? `<meta property="og:url" content="${escapeHtml(pageUrl)}">` : "",
    `<meta property="og:title" content="${escapeHtml(pageTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:site_name" content="${escapeHtml(pageTitle)}">`,
  ];

  return tags.filter(Boolean).join("\n    ");
}

function buildTwitterTags({ pageUrl, pageTitle, description }) {
  const tags = [
    '<meta name="twitter:card" content="summary">',
    `<meta name="twitter:title" content="${escapeHtml(pageTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    pageUrl ? `<meta name="twitter:url" content="${escapeHtml(pageUrl)}">` : "",
  ];

  return tags.filter(Boolean).join("\n    ");
}

function buildStructuredData({ pageUrl, pageTitle, description }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description,
    publisher: {
      "@type": "Person",
      name: "Chris Hyland",
    },
  };

  if (pageUrl) {
    structuredData.url = pageUrl;
  }

  return `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n    </script>`;
}

export function buildMetadata({ pageTitle, description, pageUrl }) {
  return {
    canonicalTag: buildCanonicalTag(pageUrl),
    openGraphTags: buildOpenGraphTags({ pageUrl, pageTitle, description }),
    twitterTags: buildTwitterTags({ pageUrl, pageTitle, description }),
    structuredData: buildStructuredData({ pageUrl, pageTitle, description }),
  };
}
