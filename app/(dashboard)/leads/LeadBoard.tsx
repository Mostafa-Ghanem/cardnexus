"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { Lead } from "@/types";
import { LEAD_STATUSES, isLeadStatus, statusLabel, type LeadStatus } from "@/lib/lead-status";
import { Mail, MessageCircle, Phone } from "lucide-react";

interface Props {
  leads: Lead[];
  onMove: (id: string, status: LeadStatus) => void;
}

function whatsappLink(phone?: string | null): string | null {
  if (!phone) return null;
  const digits=phone.replace(/\D/g,"");
  return digits.length>=8 && digits.length<=16 ? `https://wa.me/${digits}` : null;
}

/**
 * Accessible dependency-free Kanban: native drag/drop for desktop and a
 * status select for touch and keyboard users. No browser-only DnD package.
 */
export function LeadBoard({ leads, onMove }: Props) {
  const { locale } = useI18n();

  return (
    <div className="-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-4 sm:mx-0 sm:px-0">
      {LEAD_STATUSES.map(status => {
        const items=leads.filter(lead => (isLeadStatus(lead.status) ? lead.status : "new") === status);
        return <section key={status}
          className="min-h-48 w-[78vw] max-w-[260px] shrink-0 snap-start rounded-2xl border border-border bg-muted/30 p-3 sm:w-[240px]"
          onDragOver={event=>event.preventDefault()}
          onDrop={event=>{
            event.preventDefault();
            const id=event.dataTransfer.getData("text/plain");
            if(id && items.every(lead=>lead.id!==id)) onMove(id,status);
          }}>
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{statusLabel(status,locale)}</h3>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs">{items.length}</span>
          </header>
          <div className="space-y-2">
            {items.map(lead=>{
              const whatsapp=whatsappLink(lead.phone);
              return <article key={lead.id} draggable
                onDragStart={event=>event.dataTransfer.setData("text/plain",lead.id)}
                className="cursor-grab rounded-xl border border-border bg-card p-3 text-sm shadow-sm active:cursor-grabbing">
                <p className="font-semibold">{lead.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString(locale)}</p>
                <div className="mt-2 flex gap-3">
                  {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <MessageCircle className="h-4 w-4" /></a>}
                  {lead.phone && <a href={`tel:${lead.phone}`} aria-label="Phone"><Phone className="h-4 w-4" /></a>}
                  {lead.email && <a href={`mailto:${lead.email}`} aria-label="Email"><Mail className="h-4 w-4" /></a>}
                </div>
                <label className="mt-3 block text-xs text-muted-foreground">
                  {locale==="ar-SA"?"تغيير الحالة":locale==="en"?"Change status":"Status ändern"}
                  <select className="mt-1 block w-full rounded-lg border border-input bg-background p-1.5"
                    value={status} onChange={e=>{if(isLeadStatus(e.target.value))onMove(lead.id,e.target.value);}}>
                    {LEAD_STATUSES.map(next=><option key={next} value={next}>{statusLabel(next,locale)}</option>)}
                  </select>
                </label>
              </article>;
            })}
            {!items.length && <p className="py-6 text-center text-xs text-muted-foreground">
              {locale==="ar-SA"?"اسحب بطاقة إلى هنا":locale==="en"?"Drop a lead here":"Lead hierher ziehen"}
            </p>}
          </div>
        </section>;
      })}
    </div>
  );
}
