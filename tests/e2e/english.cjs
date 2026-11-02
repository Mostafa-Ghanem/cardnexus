/**
 * English version of a card: every fixed text must switch to English.
 *   BASE_URL=http://localhost:3000 node tests/e2e/english.cjs ./screenshots
 * Needs Playwright + Chromium installed locally (not a project dependency).
 */
const { chromium, devices } = require("playwright");
const B = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? ".";
const ARABIC = /[؀-ۿ]/;

(async () => {
  const browser = await chromium.launch();
  const owner = await (await browser.newContext()).newPage();
  const s = Date.now();
  await owner.request.post(B + "/api/auth/sign-up/email", { headers: { Origin: B }, data: { name: "سارة", email: `en${s}@example.invalid`, password: "Passw0rd-long-123" } });
  const card = await (await owner.request.post(B + "/api/cards", { headers: { Origin: B }, data: { firstName: "سارة", lastName: "أحمد" } })).json();
  await owner.request.patch(B + "/api/cards", { headers: { Origin: B }, data: {
    id: card.id, title: "مديرة التسويق", mobile: "+966501234567", email: "sara@example.com", showQrOnCard: true,
    translations: JSON.stringify({ en: { firstName: "Sara", lastName: "Ahmed", title: "Marketing Manager" } }),
  } });

  let failed = 0;
  const check = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) failed++; };
  const page = await (await browser.newContext({ ...devices["iPhone 13"], locale: "en-US" })).newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));

  for (const tpl of ["classic", "corporate", "minimal", "retro", "neon", "elegant"]) {
    await owner.request.patch(B + "/api/cards", { headers: { Origin: B }, data: { id: card.id, templateId: tpl } });
    await page.goto(`${B}/c/${card.slug}?lang=en`); await page.waitForLoadState("networkidle");
    const text = await page.locator("main, body").first().innerText();
    // The platform name (brand) may be Arabic; it's set by the admin, not translated.
    const leftovers = text.split("\n").filter((l) => ARABIC.test(l) && !/عربي/.test(l) && !l.startsWith("Made with"));
    check(leftovers.length === 0, `${tpl}: no Arabic text in English mode ${leftovers.length ? JSON.stringify(leftovers) : ""}`);
  }
  check((await page.title()).startsWith("Sara Ahmed"), `page title in English: ${await page.title()}`);
  await page.screenshot({ path: `${OUT}/english-card.png`, fullPage: true });

  await page.getByRole("button", { name: "Leave your details" }).click();
  const sheet = await page.locator('[role="dialog"]').innerText();
  check(!ARABIC.test(sheet), "lead form fully English");
  await page.screenshot({ path: `${OUT}/english-lead-form.png` });
  await page.fill("#lead-name", "John"); await page.fill("#lead-phone", "+15551234567");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText("Thank you!").waitFor({ timeout: 10000 });
  check(true, "English lead submitted");

  await page.getByRole("button", { name: "Close" }).last().click();
  await page.getByRole("button", { name: "عربي" }).click();
  check(await page.getByText("مديرة التسويق").count() > 0 && await page.getByText("حفظ جهة الاتصال").count() > 0, "switch back to Arabic");
  check(errors.length === 0, `no page errors ${errors.join(" | ")}`);

  await browser.close();
  console.log(failed ? `\n${failed} failed` : "\nall passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
