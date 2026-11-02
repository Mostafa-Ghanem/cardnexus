"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseTranslations, type CardTranslation, type TranslatableField } from "@/lib/card-i18n";

const FIELDS: { key: TranslatableField; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "firstName",  label: "First name",  placeholder: "Ahmed" },
  { key: "lastName",   label: "Last name",   placeholder: "Hassan" },
  { key: "title",      label: "Job title",   placeholder: "Sales Manager" },
  { key: "company",    label: "Company",     placeholder: "Company LLC" },
  { key: "department", label: "Department",  placeholder: "Sales" },
  { key: "address",    label: "Address",     placeholder: "Street, District, City" },
  { key: "bio",        label: "Bio",         placeholder: "A short introduction…", multiline: true },
];

/** Editor for the English version of the card (stored as JSON in `translations`). */
export function EnglishTab({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const en: CardTranslation = parseTranslations(value).en ?? {};

  function set(key: TranslatableField, v: string) {
    const next = { ...en, [key]: v };
    const clean = Object.fromEntries(Object.entries(next).filter(([, x]) => x && x.trim()));
    onChange(Object.keys(clean).length ? JSON.stringify({ en: clean }) : null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        نسخة إنجليزية اختيارية من بطاقتك. عند تعبئتها يظهر للزائر زر للتبديل بين «عربي» و«English»،
        وتفتح الإنجليزية تلقائيًا لمن لغة متصفحه ليست العربية. أي حقل فارغ يُعرض بالعربية.
      </p>
      <div dir="ltr" lang="en" className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {FIELDS.map((f) => (
          <div key={f.key} className={`space-y-1.5 ${f.multiline ? "sm:col-span-2" : ""}`}>
            <Label>{f.label}</Label>
            {f.multiline ? (
              <Textarea value={en[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={500} rows={3} />
            ) : (
              <Input value={en[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={150} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
