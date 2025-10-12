const SITE_CONTENT_START = "<!-- site-content:start -->";
const SITE_CONTENT_END = "<!-- site-content:end -->";

function locateMarker(markdown, marker) {
  let searchIndex = 0;

  while (searchIndex <= markdown.length) {
    const index = markdown.indexOf(marker, searchIndex);

    if (index === -1) {
      break;
    }

    const charBefore = index === 0 ? "\n" : markdown[index - 1];
    const charAfterIndex = index + marker.length;
    const charAfter =
      charAfterIndex >= markdown.length ? "\n" : markdown[charAfterIndex];

    const isBoundaryBefore = charBefore === "\n" || index === 0;
    const isBoundaryAfter =
      charAfter === "\n" ||
      charAfter === "\r" ||
      charAfterIndex === markdown.length;

    if (isBoundaryBefore && isBoundaryAfter) {
      return index;
    }

    searchIndex = index + marker.length;
  }

  return markdown.indexOf(marker);
}

export function extractSiteContent(markdown) {
  const startIndex = locateMarker(markdown, SITE_CONTENT_START);
  const endIndex = locateMarker(markdown, SITE_CONTENT_END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const start = startIndex + SITE_CONTENT_START.length;
    return markdown.slice(start, endIndex).trim();
  }

  if (startIndex !== -1 && endIndex === -1) {
    return markdown.slice(startIndex + SITE_CONTENT_START.length).trim();
  }

  if (startIndex === -1 && endIndex !== -1) {
    return markdown.slice(0, endIndex).trim();
  }

  return markdown.trim();
}

export const siteContentMarkers = {
  start: SITE_CONTENT_START,
  end: SITE_CONTENT_END,
};
