import { marked } from "marked";
import { escapeHtml } from "./html.js";
import { createRenderer } from "./renderer.js";

const defaultPageTitle = "UK public sector graduate schemes";
const feedbackHeading = "Is something wrong or missing?";

export function analyseTokens(tokens) {
  const contentTokens = [];

  let pageTitle = defaultPageTitle;
  const introHtmlParts = [];
  let plainIntro = "";
  let hasTitle = false;
  let calloutHeading = "";
  let calloutTokens = null;
  let introParagraphs = 0;

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

  return {
    pageTitle,
    introHtmlParts,
    plainIntro,
    calloutHeading,
    calloutTokens,
    contentTokens,
  };
}

export function renderCallout(calloutTokens, heading) {
  if (!calloutTokens) {
    return "";
  }

  const calloutRenderer = createRenderer();
  const calloutBody = marked
    .parser(calloutTokens, {
      renderer: calloutRenderer,
      mangle: false,
      headerIds: false,
    })
    .trim();

  if (!calloutBody) {
    return "";
  }

  const title = escapeHtml(heading || feedbackHeading);

  return [
    '<div class="feedback-callout" role="note" aria-label="How to suggest updates">',
    `<p class="feedback-callout__title"><strong>${title}</strong></p>`,
    calloutBody,
    "</div>",
  ].join("\n");
}

export function renderContentHtml(contentTokens, navItems) {
  const renderer = createRenderer({ collectNav: true, navItems });

  return marked.parser(contentTokens, {
    renderer,
    mangle: false,
    headerIds: false,
  });
}
