/**
 * Browser checks for the design/print features (needs Playwright + a running app).
 *   BASE_URL=http://localhost:3000 node tests/e2e/studio.cjs
 *
 * Covers: first-card wizard, print studio, print pages (pro / exact / A4 sheet,
 * free-plan fallback), card extras (validation + public rendering + sticky bar),
 * leads kanban drag & drop and the dashboard KPIs.
 */
const { chromium, devices } = require("playwright");
const B = process.env.BASE_URL || "http://localhost:3000";
const H = { Origin: B };
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) failed++; };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const watch = (p) => p.on("pageerror", (e) => errors.push(e.message));

  // ── Wizard ─────────────────────────────────────────────────────────────
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "ar" });
  const page = await ctx.newPage(); watch(page);
  const email = `studio${Date.now()}@example.invalid`;
  let r = await page.request.post(`${B}/api/auth/sign-up/email`, { headers: H, data: { name: "نور الهدى", email, password: "Passw0rd-long-123" } });
  ok(r.ok(), "sign up");
  await page.goto(`${B}/card`); await page.waitForLoadState("networkidle");
  ok(await page.getByText("لنبدأ ببطاقتك الرقمية").isVisible(), "new user sees the wizard");
  await page.getByLabel("المسمى الوظيفي").fill("مصممة");
  await page.getByLabel("رقم الجوال (وواتساب)").fill("+966 55 000 1111");
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "انشر بطاقتي" }).click();
  await page.getByText("بطاقتك جاهزة").waitFor({ timeout: 15000 });
  const card = (await (await page.request.get(`${B}/api/cards`)).json())[0];
  ok(card && card.firstName === "نور" && card.title === "مصممة" && card.whatsapp === "+966 55 000 1111", "wizard saved name, title, mobile and WhatsApp");

  // ── Print studio + print pages ─────────────────────────────────────────
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "ar", storageState: await ctx.storageState() });
  const dp = await desk.newPage(); watch(dp);
  await dp.goto(`${B}/card/print`); await dp.waitForLoadState("networkidle");
  ok(await dp.locator(".print-face").count() >= 12, "studio shows all print designs");
  r = await dp.request.patch(`${B}/api/cards`, { headers: H, data: { id: card.id, printDesign: JSON.stringify({ designId: "minimal", lang: "ar", size: "90x50" }) } });
  ok(r.ok(), "save print design");
  r = await dp.request.patch(`${B}/api/cards`, { headers: H, data: { id: card.id, printDesign: "{\"size\":\"A0\"}" } });
  ok(r.status() === 400, "invalid print design rejected");
  for (const mode of ["pro", "exact"]) {
    await dp.goto(`${B}/print/${card.slug}?mode=${mode}`); await dp.waitForLoadState("networkidle");
    ok(await dp.locator(".print-page").count() === 2, `print ${mode}: front and back pages`);
  }
  const box = await dp.locator(".print-page").first().boundingBox();
  ok(Math.round(box.width / (96 / 25.4)) === 90, "exact mode uses the chosen size (90 mm)");
  await dp.goto(`${B}/print/${card.slug}?mode=sheet`); await dp.waitForLoadState("networkidle");
  ok(await dp.getByText("لوح A4 متاح في باقة Pro").isVisible(), "free plan: A4 sheet falls back with a notice");
  await dp.request.patch(`${B}/api/cards`, { headers: H, data: { id: card.id, printDesign: JSON.stringify({ designId: "luxe" }) } });
  await dp.goto(`${B}/print/${card.slug}`); await dp.waitForLoadState("networkidle");
  ok(await dp.getByText("متاح في باقة Pro").isVisible(), "free plan: Pro design falls back to classic");
  await dp.goto(`${B}/print/team`); ok(dp.url().endsWith("/card/print"), "team print is limited to company admins");

  // ── Extras ─────────────────────────────────────────────────────────────
  r = await dp.request.patch(`${B}/api/cards`, { headers: H, data: { id: card.id, extras: JSON.stringify({ gallery: ["javascript:alert(1)"] }) } });
  ok(r.status() === 400, "unsafe gallery URL rejected");
  r = await dp.request.patch(`${B}/api/cards`, { headers: H, data: { id: card.id, address: "جدة", extras: JSON.stringify({
    videoUrl: "https://youtu.be/abc123", showMap: true, timeZone: "Asia/Riyadh",
    hours: Object.fromEntries(["sat", "sun", "mon", "tue", "wed", "thu", "fri"].map((d) => [d, { open: "00:00", close: "23:59" }])),
  }) } });
  ok(r.ok(), "save extras");
  const vis = await browser.newContext({ ...devices["iPhone 13"], locale: "ar" });
  const vp = await vis.newPage(); watch(vp);
  await vp.goto(`${B}/c/${card.slug}`); await vp.waitForLoadState("domcontentloaded");
  ok(await vp.getByText("مواعيد العمل").isVisible(), "public card shows opening hours");
  ok(await vp.getByText("مفتوح الآن").isVisible(), "open-now badge");
  ok(await vp.locator('iframe[src*="youtube-nocookie.com/embed/abc123"]').count() === 1, "YouTube embed");
  await vp.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await vp.waitForTimeout(600);
  const sticky = await vp.evaluate(() => [...document.querySelectorAll("div[aria-hidden]")].some((d) => d.className.includes("bottom-0") && d.getAttribute("aria-hidden") === "false"));
  ok(sticky, "sticky save bar appears after scrolling");

  // ── Leads board ────────────────────────────────────────────────────────
  r = await vis.request.post(`${B}/api/leads`, { headers: { ...H, "X-Forwarded-For": "10.9.9.9" }, data: { cardId: card.id, name: "عميل اللوحة", phone: "+966500000123" } });
  ok(r.ok(), "visitor leaves a lead");
  await dp.goto(`${B}/leads`); await dp.waitForLoadState("networkidle");
  await dp.getByRole("button", { name: "لوحة" }).click(); await dp.waitForTimeout(600);
  const item = dp.getByText("عميل اللوحة").locator("xpath=ancestor::div[@data-rfd-draggable-id]");
  await item.focus(); await dp.keyboard.press("Space"); await dp.waitForTimeout(250);
  await dp.keyboard.press("ArrowLeft"); await dp.waitForTimeout(250); await dp.keyboard.press("Space"); await dp.waitForTimeout(1200);
  const leads = (await (await dp.request.get(`${B}/api/leads/my`)).json()).leads;
  ok(leads.find((l) => l.name === "عميل اللوحة")?.status === "contacted", "drag to next column updates status");
  r = await dp.request.get(`${B}/api/leads/my?since=${encodeURIComponent(new Date(Date.now() - 60000).toISOString())}`);
  ok((await r.json()).leads.length >= 1, "since= returns new leads for the notifier");

  await dp.goto(`${B}/dashboard`); await dp.waitForLoadState("networkidle");
  ok(await dp.getByText("نسبة التحويل").isVisible() && await dp.getByText("النشاط آخر 14 يومًا").isVisible(), "dashboard KPIs and chart");

  ok(errors.length === 0, `no page errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ""}`);
  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed` : "\nall studio checks passed");
  process.exit(failed ? 1 : 0);
})();
