"use client";

import { useState } from "react";
import { Copy, Check, Sheet } from "lucide-react";

const SCRIPT = `// Extensions ← Apps Script ← الصق هذا الكود ← Deploy ← New deployment ← Web app
// Execute as: Me — Who has access: Anyone ← انسخ رابط Web app
const SECRET = "ضع-كلمة-سرية-هنا";

function doPost(e) {
  if (e.parameter.key !== SECRET) return ContentService.createTextOutput("forbidden");
  const body = JSON.parse(e.postData.contents);
  if (body.event !== "lead") return ContentService.createTextOutput("ignored");
  const l = body.data;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(["التاريخ", "الاسم", "الجوال", "البريد", "الرسالة"]);
  sheet.appendRow([new Date(l.createdAt), l.name, "'" + (l.phone || ""), l.email || "", l.message || ""]);
  return ContentService.createTextOutput("ok");
}`;

/** Step-by-step: send every new lead to a Google Sheet through a webhook. */
export function GoogleSheetsGuide() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(SCRIPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="rounded-lg border border-border">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50">
        <Sheet className="h-4 w-4 text-emerald-600" />
        إرسال العملاء المحتملين تلقائيًا إلى Google Sheets
        <span className="ms-auto text-xs text-muted-foreground">{open ? "إخفاء" : "الخطوات"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3 text-sm">
          <ol className="list-decimal ps-5 space-y-1 text-muted-foreground">
            <li>أنشئ ملف Google Sheets جديدًا، ثم من القائمة: Extensions ← Apps Script.</li>
            <li>الصق الكود التالي وغيّر قيمة <code>SECRET</code> لكلمة سرية من اختيارك.</li>
            <li>Deploy ← New deployment ← النوع Web app، وExecute as: Me، وWho has access: Anyone، ثم انسخ الرابط.</li>
            <li>
              أضف Webhook جديدًا هنا بالرابط مع كلمتك السرية في آخره:
              <code dir="ltr" className="block mt-1 rounded bg-muted px-2 py-1 text-[11px]">https://script.google.com/macros/s/…/exec?key=كلمتك-السرية</code>
            </li>
          </ol>
          <div className="relative">
            <pre dir="ltr" className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-left">{SCRIPT}</pre>
            <button onClick={copy} className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
