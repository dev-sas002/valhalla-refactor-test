/**
 * Captures the screenshots in docs/screenshots/ at 1440x900.
 *
 *   npm run start:api & npm run start:web
 *   node docs/screenshots.js
 *
 * Playwright is not a dependency of this project; see docs/measure.js for how
 * to install it. The PNGs committed here were additionally palette-quantised
 * to keep each one under 400 KB.
 */
const { chromium } = require("playwright");

const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.join(__dirname, "screenshots");

const fullGrid = (page, count = 9) =>
  page.waitForFunction(
    (n) => document.querySelectorAll("#images img").length === n,
    count,
    { timeout: 60000 }
  );

const imagesDecoded = (page) =>
  page.waitForFunction(
    () =>
      [...document.querySelectorAll("#images img")].every(
        (i) => i.complete && i.naturalWidth > 0
      ),
    null,
    { timeout: 60000 }
  );

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  // 1 - a full page of nature photos
  await page.goto(BASE + "/");
  await fullGrid(page);
  await imagesDecoded(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/01-gallery.png`, fullPage: true });

  // 2 - the download affordance on hover
  await page.hover("#images figure:nth-child(5)");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/02-download-overlay.png` });

  // 3 - the last page of a category: partially filled, Next disabled
  await page.getByRole("link", { name: "Architecture" }).click();
  await fullGrid(page);
  await page.getByRole("button", { name: "Next" }).click();
  await fullGrid(page);
  await page.getByRole("button", { name: "Next" }).click();
  await fullGrid(page, 5);
  await imagesDecoded(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03-last-page.png`, fullPage: true });

  // 4 - the photo service is down
  const offline = await ctx.newPage();
  await offline.route("**/images?*", (route) =>
    route.fulfill({ status: 503, body: "Service Unavailable" })
  );
  await offline.goto(BASE + "/fashion");
  await offline
    .getByText("Could not load these photos")
    .waitFor({ timeout: 30000 });
  await offline.waitForTimeout(400);
  await offline.screenshot({ path: `${OUT}/04-error-state.png` });

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
