/**
 * Mobile (iPhone 13) browser flow: register, create card, visitor leaves a lead.
 *   BASE_URL=http://localhost:3000 node tests/e2e/mobile.cjs ./screenshots
 */
const { chromium, devices } = require("playwright");
const B = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? ".";
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ar" });
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  const stamp = Date.now();
  // register through the UI
  await page.goto(B + "/register");
  await page.fill("#name", "منى علي"); await page.fill("#email", `m${stamp}@example.invalid`); await page.fill("#password", "Passw0rd-long-123");
  await page.screenshot({ path: `${OUT}/1-register.png` });
  await page.click('button[type=submit]'); await page.waitForURL("**/dashboard", { timeout: 20000 });
  await page.screenshot({ path: `${OUT}/2-dashboard.png` });
  // create card through UI editor
  await page.goto(B + "/card"); await page.waitForLoadState("networkidle");
  const first = page.locator('input[autocomplete="given-name"]');
  await first.fill("منى"); await page.locator('input[autocomplete="family-name"]').fill("علي");
  await page.getByRole("tab", { name: "التواصل" }).click();
  await page.locator('input[autocomplete="tel"]').fill("+966501112233");
  await page.screenshot({ path: `${OUT}/3-editor.png` });
  await page.getByRole("button", { name: /^حفظ$/ }).click();
  await page.waitForTimeout(2000);
  const res = await page.request.get(B + "/api/cards"); const cards = await res.json();
  const card = (Array.isArray(cards) ? cards : cards.cards)[0];
  console.log("card saved:", card.slug, card.firstName, card.mobile);
  // public card as a visitor (fresh context)
  const v = await browser.newContext({ ...devices["iPhone 13"], locale: "ar" });
  const vp = await v.newPage(); vp.on("pageerror", e => errors.push(e.message));
  await vp.goto(`${B}/c/${card.slug}`); await vp.waitForLoadState("networkidle");
  await vp.screenshot({ path: `${OUT}/4-public-card.png`, fullPage: true });
  await vp.getByRole("button", { name: "اترك بياناتك للتواصل" }).click();
  await vp.screenshot({ path: `${OUT}/5-lead-sheet.png` });
  const ac = await vp.$$eval("#lead-name,#lead-phone,#lead-email", els => els.map(e => e.getAttribute("autocomplete")));
  console.log("autocomplete:", ac.join(","));
  await vp.fill("#lead-name", "زائر تجريبي"); await vp.fill("#lead-phone", "٠٥٥٥١٢٣٤٥٦");
  await vp.getByRole("button", { name: "إرسال" }).click();
  await vp.getByText("شكرًا لك!").waitFor({ timeout: 10000 });
  await vp.screenshot({ path: `${OUT}/6-lead-success.png` });
  // reopen: visitor details prefilled
  await vp.getByRole("button", { name: "إغلاق" }).last().click();
  await vp.getByRole("button", { name: "اترك بياناتك للتواصل" }).click();
  await vp.waitForTimeout(400); console.log("prefilled name:", await vp.inputValue("#lead-name"));
  // vCard + QR from public page
  const [dl] = await Promise.all([vp.waitForEvent("download"), vp.keyboard.press("Escape").then(() => vp.getByRole("button", { name: "حفظ جهة الاتصال" }).click())]);
  console.log("vcard file:", dl.suggestedFilename());
  await vp.getByRole("button", { name: "رمز QR" }).click(); await vp.waitForTimeout(500);
  await vp.screenshot({ path: `${OUT}/7-qr.png` });
  // owner sees the lead
  await page.goto(B + "/leads"); await page.waitForLoadState("networkidle");
  console.log("lead visible to owner:", await page.getByText("زائر تجريبي").count() > 0, "| phone:", await page.getByText("0555123456").count() > 0);
  await page.screenshot({ path: `${OUT}/8-leads.png`, fullPage: true });
  await page.goto(B + "/"); await page.screenshot({ path: `${OUT}/9-landing.png` });
  console.log("horizontal overflow on card page:", await vp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
  console.log("page errors:", errors.length ? errors : "none");
  await browser.close();
})().catch(e => { console.error("FAILED", e); process.exit(1); });
