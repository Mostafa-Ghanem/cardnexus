#!/usr/bin/env node
/**
 * Idempotent GitHub Models translation of UI source strings only.
 * Needs an Actions GITHUB_TOKEN with models:read permission.
 */
import fs from "node:fs";
const source = JSON.parse(fs.readFileSync("messages/source.json", "utf8"));
const token = process.env.GITHUB_TOKEN || process.env.GH_MODELS_TOKEN;
const maximum = Math.min(500, Math.max(1, Number(process.env.MAX_TRANSLATIONS_PER_RUN || 160)));
const model = process.env.GITHUB_MODEL || "openai/gpt-4.1-mini";
const endpoint = "https://models.github.ai/inference/chat/completions";
const ar = JSON.parse(fs.readFileSync("messages/ar-SA.json", "utf8"));
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const missing = source.filter(x => !ar[x.text] || !en[x.text]).slice(0, maximum);
if (!missing.length) { console.log("All extracted strings translated."); process.exit(0); }
if (!token) { console.error("GITHUB_TOKEN with models:read is required."); process.exit(1); }
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function sanitize(original, value) {
  if (typeof value !== "string") return null;
  const translated = value.trim();
  if (!translated || translated.length > Math.max(180, original.length * 5)) return null;
  const markers = original.match(/\{\{[^}]+\}\}|\{\w+\}|%[sd]/g) || [];
  if (markers.some(m => !translated.includes(m))) return null;
  if (/<\/?[a-z][^>]*>/i.test(translated) && !/<\/?[a-z][^>]*>/i.test(original)) return null;
  return translated;
}
async function translate(locale, originals) {
  const language = locale === "ar-SA"
    ? "Professional Saudi Arabic (ar-SA), fluent formal business Arabic used in Saudi interfaces. Avoid Egyptian dialect. Keep NFC, QR, CRM and brand names."
    : "Clear professional English (en), concise, consistent and accessible for UI.";
  const messages = [
    { role: "system", content:
      "Translate user-facing UI copy from German (or existing English) into " + language +
      " Return ONLY JSON with a translations array of strings in the same order. " +
      "Preserve numbers, product names, URLs, tokens and formatting. " +
      "Never invent legal or performance claims. Reword German-hosting/privacy compliance guarantees neutrally. " +
      "Do not translate names, emails or sample contacts. No markdown." },
    { role: "user", content: JSON.stringify({ locale, texts: originals }) },
  ];
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 7000, response_format: { type: "json_object" } }),
      signal: AbortSignal.timeout(90000),
    });
    if (response.status === 429 || response.status >= 500) {
      console.error("Retryable GitHub Models error", response.status, attempt + 1);
      await sleep((attempt + 1) * 5000);
      continue;
    }
    if (!response.ok) {
      throw new Error("GitHub Models HTTP " + response.status + " " + (await response.text()).slice(0,250));
    }
    const result = await response.json();
    const raw = result?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty GitHub Models response");
    const fence = String.fromCharCode(96).repeat(3);
    const cleaned = raw.trim().startsWith(fence) ?
      raw.trim().slice(raw.trim().indexOf("\n")+1).replace(new RegExp(fence + "\\s*$"),"") : raw;
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start < 0 || end < start) throw new Error("Model did not return JSON; prefix=" + cleaned.slice(0, 60));
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    }
    if (!Array.isArray(parsed.translations) || parsed.translations.length !== originals.length) {
      throw new Error("Array length mismatch: refused translation");
    }
    return parsed.translations.map((x,i) => sanitize(originals[i], x));
  }
  throw new Error("GitHub Models rate limit");
}
let count = 0;
for (let idx=0; idx<missing.length; idx+=20) {
  const chunk = missing.slice(idx,idx+20);
  for (const [locale, catalog] of [["en",en],["ar-SA",ar]]) {
    const sourceText = chunk.filter(x=>!catalog[x.text]).map(x=>x.text);
    if (!sourceText.length) continue;
    try {
      const values = await translate(locale,sourceText);
      values.forEach((text,i)=>{if(text){catalog[sourceText[i]]=text;count++;}});
      fs.writeFileSync("messages/"+locale+".json",JSON.stringify(catalog,null,2)+"\n");
      console.log(locale+" completed "+values.filter(Boolean).length+"/"+sourceText.length);
    } catch (err) {
      console.error("Translation paused: "+String(err));
      console.error("Already translated entries remain saved for review. Rerun to continue.");
      console.log("Catalog entries translated in this run: "+count);
      process.exit(0);
    }
    await sleep(1300);
  }
}
console.log("Catalog entries translated in this run: "+count);
