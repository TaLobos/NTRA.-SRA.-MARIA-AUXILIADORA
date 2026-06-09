import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
await page.screenshot({ path: "C:/tmp/arte-sacro-front.png", fullPage: true });

const result = {
  title: await page.title(),
  products: await page.locator(".product-card").count(),
  errors,
};

await browser.close();
console.log(JSON.stringify(result, null, 2));
