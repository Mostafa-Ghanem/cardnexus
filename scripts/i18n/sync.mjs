#!/usr/bin/env node
/** German-source UI inventory + idempotent JSX localization codemod.
 * Usage: node scripts/i18n/sync.mjs extract|apply|review
 * Excludes API, legal pages, user-provided content and vendor UI components.
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [];
const ignored = new Set(["node_modules", ".next", "dist", ".git", "api", "ui", "generated", "i18n"]);
const skip = /^(app\/(impressum|datenschutz|print)\/)/;
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".d.ts")) {
      const rel = path.relative(root, path.join(dir, entry.name)).replaceAll("\\", "/");
      if (!skip.test(rel)) files.push(rel);
    }
  }
}
for (const dir of ["app", "components"]) walk(path.join(root, dir));

function normalize(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}
function human(s) {
  return s.length > 1 && /[\p{L}]/u.test(s) &&
    !/^(https?:|mailto:|tel:|www\.|\/|#[\da-f]{3,8}$)/i.test(s) &&
    !/^[\d ,.+\-/:@]+$/.test(s);
}
const attributeNames = new Set(["placeholder", "title", "aria-label", "alt", "label"]);
const propertyNames = new Set(["title", "desc", "label", "description", "note", "placeholder", "message"]);
const skipTags = new Set(["option", "title", "script", "style", "svg", "code", "pre", "textarea", "noscript"]);
const extracted = new Map();
let wrapped = 0;
function record(text, file, kind, line) {
  const key = normalize(text);
  if (!human(key)) return;
  const item = extracted.get(key) ?? { text: key, sites: [] };
  item.sites.push({ file, kind, line });
  extracted.set(key, item);
}
function scan(file, apply) {
  const full = path.join(root, file);
  // Some upstream TSX files start with a UTF-8 BOM. Strip it before
  // parsing/inserting imports so the React "use client" directive stays first.
  let source = fs.readFileSync(full, "utf8").replace(/^\uFEFF/, "");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const replacements = [];
  let changed = 0;
  function visit(node, parent = null) {
    const line = ast.getLineAndCharacterOfPosition(node.pos).line + 1;
    if (ts.isJsxText(node)) {
      const raw = source.slice(node.pos, node.end);
      const text = normalize(raw);
      if (human(text)) {
        let tag = "";
        if (parent && ts.isJsxElement(parent)) tag = parent.openingElement.tagName.getText(ast).toLowerCase();
        if (!skipTags.has(tag)) {
          record(text, file, "jsx", line);
          if (apply) {
            const before = !raw.includes("\n") && /^[^\S\r\n]+/.test(raw) ? '{" "}' : "";
            const after = !raw.includes("\n") && /[^\S\r\n]+$/.test(raw) ? '{" "}' : "";
            const val = before + '<T text={' + JSON.stringify(text) + '} />' + after;
            replacements.push({ start: node.pos, end: node.end, value: val });
            changed++;
          }
        }
      }
    } else if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "T") {
      // Preserve original source inventory after JSX labels are transformed.
      const attribute = node.attributes.properties.find(
        x => ts.isJsxAttribute(x) && x.name.getText(ast) === "text"
      );
      if (attribute && ts.isJsxAttribute(attribute) && attribute.initializer &&
          ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression &&
          ts.isStringLiteral(attribute.initializer.expression)) {
        record(attribute.initializer.expression.text, file, "jsx", line);
      }
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(ast);
      if (attributeNames.has(name) && node.initializer && ts.isStringLiteral(node.initializer)) {
        record(node.initializer.text, file, "attribute:" + name, line);
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = node.name.getText(ast).replace(/^['"]|['"]$/g, "");
      if (propertyNames.has(name) && ts.isStringLiteral(node.initializer)) {
        record(node.initializer.text, file, "property:" + name, line);
      }
    }
    ts.forEachChild(node, child => visit(child, node));
  }
  visit(ast);
  if (apply && changed) {
    for (const e of replacements.sort((a,b) => b.start - a.start)) {
      source = source.slice(0, e.start) + e.value + source.slice(e.end);
    }
    const imp = 'import { T } from "@/components/i18n/I18nProvider";\n';
    if (!source.includes(imp.trim())) {
      if (/^["']use client["'];?/.test(source)) {
        source = source.replace(/^((?:"use client"|'use client');?)/, "$1\n" + imp);
      } else {
        source = imp + source;
      }
    }
    fs.writeFileSync(full, source);
    wrapped += changed;
  }
}
const command = process.argv[2] ?? "review";
if (!["extract", "apply", "review"].includes(command)) {
  console.error("Usage: node scripts/i18n/sync.mjs extract|apply|review");
  process.exit(2);
}
for (const file of files) scan(file, command === "apply");
fs.mkdirSync("messages", { recursive: true });
const all = [...extracted.values()].sort((a,b) => a.text.localeCompare(b.text, "de"));
fs.writeFileSync("messages/source.json", JSON.stringify(all, null, 2) + "\n");
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const ar = JSON.parse(fs.readFileSync("messages/ar-SA.json", "utf8"));
const missing = all.filter(x => !en[x.text] || !ar[x.text]);
const categories = {
  jsx: all.filter(x => x.sites.some(y => y.kind === "jsx")).length,
  attributes: all.filter(x => x.sites.some(y => y.kind.startsWith("attribute"))).length,
  properties: all.filter(x => x.sites.some(y => y.kind.startsWith("property"))).length,
};
const report = [
  "# Internationalization coverage", "",
  "Generated from the German source; legal documents and user content are excluded.", "",
  "- Source UI files: " + files.length,
  "- Unique UI strings: " + all.length,
  "- JSX text: " + categories.jsx,
  "- Attribute strings: " + categories.attributes,
  "- UI object properties: " + categories.properties,
  "- Strings missing either Arabic or English: " + missing.length,
  "- JSX text wrapped in this run: " + wrapped,
  "",
  "## Pending translations (first 200)", "",
  ...missing.slice(0, 200).map(x => "- " + x.text.replaceAll("\n", " ") + " — " + x.sites[0].file),
  "", "## Editorial review notes", "",
  "- Review pricing currency, privacy compliance and Saudi legal requirements.",
  "- Client-side dynamic data and user-entered profile fields must never be machine translated.",
  "- Test mixed numbers, phone, emails and URLs on RTL.",
  "- Missing values deliberately fall back to the German source; do not claim 100% translated.",
];
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/I18N_COVERAGE.md", report.join("\n") + "\n");
console.log(JSON.stringify({ command, files: files.length, uniqueStrings: all.length,
  ...categories, missing: missing.length, newlyWrapped: wrapped }, null, 2));
