/**
 * Wall-clock timings of the photo grid, driven through a real browser.
 *
 *   node docs/measure.js http://localhost:3000 after
 *
 * Playwright is not a dependency of this project - the script is run by hand,
 * not in CI. Install it first:
 *
 *   npm i -D playwright && npx playwright install chromium
 *
 * Each figure is the time from the action to a grid of nine decoded photos.
 */
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://localhost:3000";
const LABEL = process.argv[3] || "run";
const GRID = "#images";

const srcs = (page) =>
  page.$$eval(`${GRID} img`, (els) => els.map((e) => e.getAttribute("src")));

async function waitForFullGrid(page, excluding = []) {
  const bad = new Set(excluding);
  await page.waitForFunction(
    ({ grid, bad }) => {
      const imgs = [...document.querySelectorAll(`${grid} img`)];
      if (imgs.length !== 9) return false;
      return imgs.every((i) => !bad.includes(i.getAttribute("src")));
    },
    { grid: GRID, bad: [...bad] },
    { timeout: 60000 }
  );
}

const time = async (fn) => {
  const t0 = Date.now();
  await fn();
  return Date.now() - t0;
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  const results = {};

  // 1. cold load of page 1
  results.coldLoadPage1 = await time(async () => {
    await page.goto(BASE + "/", { waitUntil: "commit" });
    await waitForFullGrid(page);
  });
  const p1 = await srcs(page);

  // 2. forward to page 2
  results.nextToPage2 = await time(async () => {
    await page.getByRole("button", { name: "Next" }).click();
    await waitForFullGrid(page, p1);
  });
  const p2 = await srcs(page);

  // 3. back to page 1
  results.previousToPage1 = await time(async () => {
    await page.getByRole("button", { name: "Previous" }).click();
    await waitForFullGrid(page, p2);
  });

  // 4. forward again to page 2 (already visited)
  results.nextToPage2Again = await time(async () => {
    await page.getByRole("button", { name: "Next" }).click();
    await waitForFullGrid(page, p1);
  });

  // 5. a realistic dwell: the user looks at the page for 3.5s, then pages on
  await page.getByRole("link", { name: "Fashion" }).click();
  await waitForFullGrid(page);
  const f1 = await srcs(page);
  await page.waitForTimeout(3500);
  results.nextAfter3500msDwell = await time(async () => {
    await page.getByRole("button", { name: "Next" }).click();
    await waitForFullGrid(page, f1);
  });

  // 6. switch category (cold)
  results.switchCategoryCold = await time(async () => {
    await page.getByRole("link", { name: "Architecture" }).click();
    await waitForFullGrid(page);
  });

  console.log(JSON.stringify({ label: LABEL, base: BASE, results }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
