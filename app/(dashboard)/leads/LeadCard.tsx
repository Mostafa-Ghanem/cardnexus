"use client";

import { useState } from "react";
import type { Lead } from "@/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LEAD_STATUSES, isLeadStatus, statusLabel, LEAD_STATUS_COLORS } from "@/lib/lead-status";
import { Mail, Phone, MessageCircle, Trash2, StickyNote, Loader2 } from "lucide-react";

type Patch = Partial<Pick<Lead, "status" | "note">>;

export function LeadCard({ lead, deleting, onDelete, onUpdate }: {
  lead: Lead; deleting: boolean; onDelete: () => void;
  onUpdate: (patch: Patch) => Promise<boolean>;
}) {
  const { locale } = useI18n();
  const [showMessage,setShowMessage] = useState(false);
  const [editingNote,setEditingNote] = useState(false);
  const [note,setNote] = useState(lead.note || "");
  const [saving,setSaving] = useState(false);
  const status = isLeadStatus(lead.status) ? lead.status : "new";
  const phoneDigits = (lead.phone || "").replace(/\D/g, "");
  const whatsapp = phoneDigits.length>=8 && phoneDigits.length<=16
    ? `https://wa.me/${phoneDigits}` : null;
  const txt = locale==="ar-SA"
    ? {delete:"حذف",confirm:"هل تريد حذف هذا العميل المحتمل؟",whatsapp:"واتساب",call:"اتصال",
       email:"بريد",note:"إضافة ملاحظة خاصة",save:"حفظ",cancel:"إلغاء",show:"عرض الرسالة",
       hide:"إخفاء الرسالة",status:"حالة المتابعة"}
    : locale==="en"
    ? {delete:"Delete",confirm:"Delete this lead?",whatsapp:"WhatsApp",call:"Call",email:"Email",
       note:"Add a private note",save:"Save",cancel:"Cancel",show:"Show message",
       hide:"Hide message",status:"Follow-up status"}
    : {delete:"Löschen",confirm:"Lead löschen?",whatsapp:"WhatsApp",call:"Anrufen",email:"E-Mail",
       note:"Private Notiz hinzufügen",save:"Speichern",cancel:"Abbrechen",show:"Nachricht anzeigen",
       hide:"Nachricht verbergen",status:"Follow-up-Status"};

  async function saveNote() {
    setSaving(true);
    try {
      if(await onUpdate({ note: note.trim() || null })) setEditingNote(false);
    } finally {setSaving(false);}
  }
  return <article className="rounded-xl border border-border bg-card p-4">
    <header className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
        {Array.from(lead.name)[0]?.toUpperCase() || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{lead.name}</h3>
        <p className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleString(locale)}</p>
        <div className="mt-1 flex flex-wrap gap-3 text-xs">
          {lead.phone && <span dir="ltr">{lead.phone}</span>}
          {lead.email && <span dir="ltr" className="truncate">{lead.email}</span>}
        </div>
      </div>
      <button type="button" aria-label={txt.delete} title={txt.delete} disabled={deleting}
        onClick={()=>{if(confirm(txt.confirm))onDelete();}}
        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </header>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs text-white">
        <MessageCircle className="h-4 w-4" />{txt.whatsapp}</a>}
      {lead.phone && <a href={`tel:${lead.phone}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs">
        <Phone className="h-4 w-4" />{txt.call}</a>}
      {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs">
        <Mail className="h-4 w-4" />{txt.email}</a>}
      <select aria-label={txt.status} value={status}
        onChange={e=>{if(isLeadStatus(e.target.value))void onUpdate({status:e.target.value});}}
        className={`ms-auto rounded-lg border-0 px-3 py-2 text-xs font-medium ${LEAD_STATUS_COLORS[status]}`}>
        {LEAD_STATUSES.map(s=><option value={s} key={s}>{statusLabel(s,locale)}</option>)}
      </select>
    </div>
    {lead.message && <div className="mt-3">
      <button type="button" onClick={()=>setShowMessage(v=>!v)} className="text-xs text-muted-foreground underline">
        {showMessage?txt.hide:txt.show}
      </button>
      {showMessage && <p className="mt-2 whitespace-pre-line rounded-lg bg-muted p-3 text-sm">{lead.message}</p>}
    </div>}
    <div className="mt-3 border-t border-border pt-3">
      {editingNote ? <div className="space-y-2">
        <textarea rows={2} maxLength={2000} autoFocus value={note} onChange={e=>setNote(e.target.value)}
          aria-label={txt.note} placeholder={txt.note}
          className="w-full resize-y rounded-lg border border-input bg-background p-2 text-sm" />
        <div className="flex gap-2">
          <button type="button" disabled={saving} onClick={saveNote}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}{txt.save}
          </button>
          <button type="button" onClick={()=>{setNote(lead.note || "");setEditingNote(false);}}
            className="rounded-lg border px-3 py-2 text-xs">{txt.cancel}</button>
        </div>
      </div> : <button type="button" className="flex w-full items-start gap-2 text-start text-xs text-muted-foreground"
        onClick={()=>setEditingNote(true)}>
        <StickyNote className="h-4 w-4 shrink-0" />
        {lead.note ? <span className="whitespace-pre-line text-foreground">{lead.note}</span> : txt.note}
      </button>}
    </div>
  </article>;
}
