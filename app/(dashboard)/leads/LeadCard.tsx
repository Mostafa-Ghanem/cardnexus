"use client";

import { useState } from "react";
import type { Lead } from "@/types";
import { Mail, Phone, MessageSquare, Trash2, StickyNote, Loader2 } from "lucide-react";
import { whatsappDigits } from "@/lib/utils";
import { LEAD_STATUSES, LEAD_STATUS_COLORS, LEAD_STATUS_LABELS, isLeadStatus } from "@/lib/lead-status";

interface Props {
  lead: Lead;
  deleting: boolean;
  onDelete: () => void;
  onUpdate: (patch: Partial<Pick<Lead, "status" | "note">>) => Promise<boolean>;
}

export function LeadCard({ lead, deleting, onDelete, onUpdate }: Props) {
  const [showMessage, setShowMessage] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(lead.note ?? "");
  const [saving, setSaving] = useState(false);
  const date = new Date(lead.createdAt);
  const status = isLeadStatus(lead.status) ? lead.status : "new";
  const waDigits = whatsappDigits(lead.phone);

  async function saveNote() {
    setSaving(true);
    const ok = await onUpdate({ note: note.trim() || null });
    setSaving(false);
    if (ok) setEditingNote(false);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3 items-start">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary text-sm">
          {Array.from(lead.name)[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="font-semibold text-sm">{lead.name}</p>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {date.toLocaleDateString("ar-u-nu-latn", { day: "2-digit", month: "short", year: "numeric" })}{" "}
              {date.toLocaleTimeString("ar-u-nu-latn", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            {lead.phone && <span dir="ltr">{lead.phone}</span>}
            {lead.email && <span dir="ltr" className="truncate">{lead.email}</span>}
          </div>
        </div>

        <button
          onClick={() => { if (confirm("هل تريد حذف هذا العميل المحتمل؟")) onDelete(); }}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10 shrink-0"
          title="حذف"
          aria-label="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Quick actions: big tap targets for phones */}
      <div className="flex flex-wrap gap-2">
        {waDigits && (
          <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700">
            <MessageSquare className="h-3.5 w-3.5" /> واتساب
          </a>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent">
            <Phone className="h-3.5 w-3.5" /> اتصال
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent">
            <Mail className="h-3.5 w-3.5" /> بريد
          </a>
        )}
        <select
          value={status}
          onChange={(e) => onUpdate({ status: e.target.value })}
          aria-label="حالة المتابعة"
          className={`ms-auto rounded-lg border-0 px-3 py-2 text-xs font-medium ${LEAD_STATUS_COLORS[status]}`}
        >
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {lead.message && (
        <div>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowMessage((v) => !v)}>
            <MessageSquare className="h-3 w-3" /> {showMessage ? "إخفاء الرسالة" : "عرض الرسالة"}
          </button>
          {showMessage && <p className="mt-1.5 text-sm bg-muted rounded-lg px-3 py-2 text-muted-foreground leading-relaxed">{lead.message}</p>}
        </div>
      )}

      {editingNote ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            autoFocus
            placeholder="ملاحظة خاصة بك (لا يراها العميل)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <button onClick={saveNote} disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              {saving && <Loader2 className="h-3 w-3 animate-spin" />} حفظ
            </button>
            <button onClick={() => { setNote(lead.note ?? ""); setEditingNote(false); }} className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">إلغاء</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditingNote(true)} className="flex w-full items-start gap-1.5 text-start text-xs text-muted-foreground hover:text-foreground">
          <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {lead.note ? <span className="whitespace-pre-line text-foreground/80">{lead.note}</span> : "إضافة ملاحظة"}
        </button>
      )}
    </div>
  );
}
