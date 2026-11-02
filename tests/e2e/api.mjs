/**
 * End-to-end HTTP checks against a running app + disposable MySQL database.
 *   BASE_URL=http://localhost:3000 node tests/e2e/api.mjs
 * Never point this at production: it creates users, cards and leads.
 */
const B = process.env.BASE_URL ?? "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
class Client {
  constructor() { this.cookies = {}; }
  async req(path, opts = {}) {
    const h = { Origin: B, ...(opts.headers || {}) };
    const c = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    if (c) h.Cookie = c;
    if (opts.json) { h["Content-Type"] = "application/json"; opts.body = JSON.stringify(opts.json); }
    const r = await fetch(B + path, { ...opts, headers: h, redirect: "manual" });
    for (const sc of r.headers.getSetCookie?.() ?? []) { const [kv] = sc.split(";"); const i = kv.indexOf("="); this.cookies[kv.slice(0, i)] = kv.slice(i + 1); }
    return r;
  }
}
const stamp = Date.now();
const a = new Client(), b = new Client(), anon = new Client();
const emailA = `owner-${stamp}@example.invalid`, emailB = `other-${stamp}@example.invalid`;

let r = await a.req("/api/auth/sign-up/email", { method: "POST", json: { name: "أحمد حسن", email: emailA, password: "Passw0rd-long-123" } });
ok(r.ok, `register owner (${r.status})`);
r = await b.req("/api/auth/sign-up/email", { method: "POST", json: { name: "Other", email: emailB, password: "Passw0rd-long-123" } });
ok(r.ok, `register second user (${r.status})`);
r = await b.req("/api/auth/sign-up/email", { method: "POST", json: { name: "x", email: emailB+"x", password: "Passw0rd-long-123", role: "super_admin" } });
const roleTry = r.ok ? await r.json() : null;
ok(!r.ok || roleTry?.user?.role !== "super_admin", `self-assigned role rejected (${r.status})`);

a.cookies = {};
r = await a.req("/api/auth/sign-in/email", { method: "POST", json: { email: emailA, password: "wrong-password-1" } });
ok(r.status >= 400, `login with wrong password rejected (${r.status})`);
r = await a.req("/api/auth/sign-in/email", { method: "POST", json: { email: emailA, password: "Passw0rd-long-123" } });
ok(r.ok, `login owner (${r.status})`);

r = await anon.req("/dashboard"); ok([302,303,307,308].includes(r.status), `anon /dashboard redirects (${r.status})`);
r = await anon.req("/api/cards"); ok(r.status === 401, `anon /api/cards 401 (${r.status})`);
r = await a.req("/dashboard"); ok(r.status === 200, `owner /dashboard 200 (${r.status})`);
const dash = await r.text(); ok(dash.includes('dir="rtl"') && dash.includes("لوحة التحكم"), "dashboard is Arabic RTL");

r = await a.req("/api/cards", { method: "POST", json: { firstName: "أحمد", lastName: "حسن" } });
const card = await r.json(); ok(r.status === 201 && card.slug, `create card (${r.status}) slug=${card.slug}`);
r = await a.req("/api/cards", { method: "PATCH", json: { id: card.id, title: "مدير المبيعات", company: "شركة الريادة", mobile: "+966501234567", email: "ahmed@example.com" } });
ok(r.ok, `edit card (${r.status}) ${r.ok ? "" : await r.text()}`);
r = await b.req("/api/cards", { method: "PATCH", json: { id: card.id, title: "hacked" } });
ok(!r.ok, `other user cannot edit card (${r.status})`);
r = await a.req("/api/cards", { method: "POST", json: { firstName: "x" } });
ok(r.status === 403 || r.status === 400, `free plan card limit enforced (${r.status})`);
const lim = r.ok ? null : await r.json(); ok(lim && /[؀-ۿ]/.test(lim.error), `limit error is Arabic: ${lim?.error}`);

r = await anon.req(`/c/${card.slug}`); const html = await r.text();
ok(r.ok && html.includes("مدير المبيعات") && html.includes("اترك بياناتك"), `public card renders + lead button on free plan (${r.status})`);
r = await anon.req(`/api/qr/${card.slug}`); ok(r.ok && (r.headers.get("content-type")||"").includes("image"), `QR image (${r.status} ${r.headers.get("content-type")})`);
r = await anon.req(`/api/vcard/${card.slug}`); const vcf = await r.text();
console.log("  content-disposition:", r.headers.get("content-disposition"));
ok(r.ok && vcf.includes("BEGIN:VCARD") && vcf.includes("أحمد") && vcf.includes("+966501234567"), `vCard download (${r.status})`);

r = await anon.req("/api/leads", { method: "POST", json: { cardId: card.id, name: "سارة", phone: "٠٥٠١٢٣٤٥٦٧", email: "" } });
ok(r.ok, `lead with Arabic-digit phone only (${r.status}) ${r.ok ? "" : await r.text()}`);
r = await anon.req("/api/leads", { method: "POST", json: { cardId: card.id, name: "No contact" } });
ok(r.status === 400, `lead without phone/email rejected (${r.status})`);
r = await anon.req("/api/leads", { method: "POST", json: { cardId: card.id, name: "Mail only", email: "m@example.com" } });
ok(r.ok, `lead with email only (${r.status})`);

r = await a.req("/api/leads/my"); const my = await r.json();
ok(r.ok && my.leads.length === 2 && my.leads.some(l => l.phone === "0501234567"), `owner sees leads, digits normalized (${my.leads?.map(l=>l.phone).join(",")})`);
r = await b.req("/api/leads/my"); const theirs = await r.json(); ok(theirs.leads.length === 0, "other user sees no leads");
const leadId = my.leads[0].id;
r = await b.req("/api/leads/my", { method: "DELETE", json: { id: leadId } }); ok(r.status === 404, `other user cannot delete lead (${r.status})`);
r = await a.req("/api/leads/export"); const buf = new Uint8Array(await r.arrayBuffer()); const csv = new TextDecoder().decode(buf);
ok(r.ok && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf && csv.includes("سارة"), `CSV export with BOM (${r.status})`);
r = await a.req("/api/leads/my", { method: "DELETE", json: { id: leadId } }); ok(r.ok, `owner deletes lead (${r.status})`);

r = await a.req("/admin"); ok(r.status !== 200 || !(await r.text()).includes("نظرة عامة على المنصة"), `non-admin blocked from /admin (${r.status})`);
r = await a.req("/api/admin/settings", { method: "PATCH", json: { appName: "x" } }); ok(r.status === 403 || r.status === 401 || r.status === 405, `non-admin cannot change platform settings (${r.status})`);
r = await a.req("/api/campaigns", { method: "POST", json: { name: "x" } }); ok(r.status === 403, `campaigns gated on free plan (${r.status})`);


// ── Security regressions ──────────────────────────────────────────────────
r = await b.req("/api/users?limit=100"); ok(r.status === 403, `plain user cannot list users (${r.status})`);
let spoofOk = 0;
for (let i = 0; i < 6; i++) {
  r = await anon.req("/api/leads", { method: "POST", headers: { "X-Forwarded-For": `10.${i}.0.1, 203.0.113.9` }, json: { cardId: card.id, name: "spoof" + i, phone: "+966500000000" } });
  if (r.ok) spoofOk++;
}
ok(spoofOk <= 3, `spoofed X-Forwarded-For can't bypass lead limit (${spoofOk} accepted, max 3)`);
r = await anon.req("/api/leads", { method: "POST", headers: { "X-Forwarded-For": "198.51.100.7" }, json: { cardId: card.id, name: "bot", phone: "+966500000001", website: "http://spam" } });
const hpCount = (await (await a.req("/api/leads/my")).json()).leads.filter((l) => l.name === "bot").length;
ok(r.ok && hpCount === 0, `honeypot silently drops bot submissions (${r.status}, stored=${hpCount})`);

// ── Lead pipeline ─────────────────────────────────────────────────────────
const someLead = (await (await a.req("/api/leads/my")).json()).leads[0];
r = await a.req("/api/leads/my", { method: "PATCH", json: { id: someLead.id, status: "contacted", note: "اتصلت به" } });
const pj = await r.json(); ok(r.ok && pj.data.status === "contacted" && pj.data.note === "اتصلت به", `owner updates lead status + note (${r.status})`);
r = await b.req("/api/leads/my", { method: "PATCH", json: { id: someLead.id, status: "won" } }); ok(r.status === 404, `other user cannot update lead (${r.status})`);
r = await a.req("/api/leads/my", { method: "PATCH", json: { id: someLead.id, status: "hacked" } }); ok(r.status === 400, `invalid status rejected (${r.status})`);

// ── WhatsApp + English version ────────────────────────────────────────────
r = await a.req("/api/cards", { method: "PATCH", json: { id: card.id, whatsapp: "+966501234567", translations: JSON.stringify({ en: { firstName: "Ahmed", title: "Sales Manager" } }) } });
ok(r.ok, `save WhatsApp + English translation (${r.status})`);
r = await a.req("/api/cards", { method: "PATCH", json: { id: card.id, translations: "{\"en\":{\"evil\":\"x\"}}" } });
ok(r.status === 400, `unknown translation fields rejected (${r.status})`);
r = await anon.req(`/c/${card.slug}`); const pub = await r.text();
ok(pub.includes("راسلني واتساب") && pub.includes("English"), "public card shows WhatsApp button + language switch");

// ── Read API with API key ─────────────────────────────────────────────────
r = await a.req("/api/api-keys", { method: "POST", json: { name: "e2e" } }); const keyJ = await r.json();
ok(r.status === 201 && keyJ.data.key, `create API key (${r.status})`);
r = await fetch(B + "/api/v1/leads?limit=5", { headers: { Authorization: `Bearer ${keyJ.data.key}` } }); const v1 = await r.json();
ok(r.ok && Array.isArray(v1.data) && v1.data.length > 0 && v1.data[0].card?.slug === card.slug, `GET /api/v1/leads with key (${r.status})`);
r = await fetch(B + "/api/v1/leads", { headers: { Authorization: "Bearer fk_" + "0".repeat(48) } }); ok(r.status === 401, `invalid API key rejected (${r.status})`);
r = await fetch(B + "/api/v1/leads?status=contacted", { headers: { Authorization: `Bearer ${keyJ.data.key}` } });
ok(r.ok && (await r.json()).data.every((l) => l.status === "contacted"), "API status filter");

// ── Telegram webhook refuses unsigned calls ───────────────────────────────
r = await anon.req("/api/telegram/webhook", { method: "POST", json: { message: { text: "/start x_y", chat: { id: 1, type: "private" } } } });
ok(r.status === 401, `telegram webhook requires secret (${r.status})`);

r = await a.req("/api/auth/two-factor/enable", { method: "POST", json: { password: "Passw0rd-long-123" } });
const tf = r.ok ? await r.json() : await r.text(); ok(r.ok && tf.totpURI, `2FA enable returns TOTP (${r.status}) ${r.ok ? "" : tf}`);
r = await a.req("/api/auth/get-session"); ok(r.ok, `session still valid (${r.status})`);
r = await a.req("/api/auth/sign-out", { method: "POST", json: {} }); ok(r.ok, `sign-out (${r.status})`);
r = await a.req("/api/cards"); ok(r.status === 401, `after sign-out API is 401 (${r.status})`);
for (const p of ["/", "/login", "/register", "/pricing", "/impressum", "/datenschutz", "/forgot-password", "/reset-password", "/login/2fa"]) {
  r = await anon.req(p); const t = await r.text();
  ok(r.ok && t.includes('dir="rtl"') && !/[äöüß]|Visitenkarte|Deutschland|DSGVO/.test(t.replace(/<script[\s\S]*?<\/script>/g, "")), `${p} Arabic, no German (${r.status})`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
