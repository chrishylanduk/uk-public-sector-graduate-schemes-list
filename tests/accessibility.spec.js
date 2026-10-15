import path from "path";
import { pathToFileURL } from "url";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Tests run against the built page, so run `npm run build` first
// (`npm run test:a11y` does this).
const pageUrl = pathToFileURL(path.resolve("dist/index.html")).href;

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function formatViolations(violations) {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .map((node) => `    ${node.target.join(" ")}`)
        .join("\n");
      return `${violation.id} (${violation.impact}): ${violation.help}\n  ${violation.helpUrl}\n${targets}`;
    })
    .join("\n\n");
}

async function expectNoViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
});

test("initial page", async ({ page }) => {
  await expectNoViolations(page);
});

test("role filter open with a role selected", async ({ page }) => {
  await page.getByText("Select role types").click();
  // The checkbox is visually hidden; users click its pill label instead.
  await page.locator('label[for="role-filter-policy"]').click();
  await expect(page.locator("#role-filter-policy")).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Clear role filters" }),
  ).toBeVisible();
  await expectNoViolations(page);
});

test("search with matching results", async ({ page }) => {
  await page.getByLabel("Search scheme names").fill("graduate");
  await expect(
    page.getByRole("button", { name: "Clear search" }),
  ).toBeVisible();
  await expectNoViolations(page);
});

test("search with no results", async ({ page }) => {
  await page.getByLabel("Search scheme names").fill("zzzzzz");
  await expect(page.locator("#results-summary")).toContainText(
    "No schemes match",
  );
  await expectNoViolations(page);
});

test("mobile viewport with navigation open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByText("Browse organisation types").click();
  await expectNoViolations(page);
});

test("high contrast preference", async ({ page }) => {
  await page.emulateMedia({ contrast: "more" });
  await expectNoViolations(page);
});
