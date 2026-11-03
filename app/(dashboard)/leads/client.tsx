"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buildCsv } from "@/lib/csv";
import { LEAD_STATUSES, isLeadStatus, statusLabel, type LeadStatus } from "@/lib/lead-status";
import { LeadBoard } from "./LeadBoard";
import { LeadCard } from "./LeadCard";
import { Download, Search, UserCheck, CreditCard, List, Columns3 } from "lucide-react";

interface Props { leads: Lead[]; hasCard: boolean }
type Filter = "all" | LeadStatus;
type Patch = Partial<Pick<Lead, "status" | "note">>;

export function LeadsClient({ leads: initialLeads, hasCard }: Props) {
  const { locale } = useI18n();
  const [leads,setLeads] = useState(initialLeads);
  const [query,setQuery] = useState("");
  const [filter,setFilter] = useState<Filter>("all");
  const [deletingId,setDeletingId] = useState<string|null>(null);
  const [view,setView] = useState<"list"|"board">("list");
  const [error,setError] = useState("");
  useEffect(()=>{try{if(localStorage.getItem("cardnexus_leads_view")==="board")setView("board");}catch { /* Browser storage may be unavailable in private mode. */ }},[]);
  const copy = locale === "ar-SA" ? {
    search:"ابحث بالاسم أو الجوال أو الملاحظات…",list:"قائمة",board:"لوحة",all:"الكل",
    export:"تصدير CSV",empty:"لا يوجد عملاء محتملون بعد",noResults:"لا توجد نتائج مطابقة.",
    noCard:"لم تنشئ بطاقة بعد",create:"إنشاء بطاقة",needCard:"أنشئ بطاقة أولًا لتبدأ جمع العملاء المحتملين.",
    leads:"العملاء المحتملون",error:"تعذّر حفظ التغيير. حاول مرة أخرى.",
  } : locale === "en" ? {
    search:"Search names, phone numbers or notes…",list:"List",board:"Board",all:"All",
    export:"Export CSV",empty:"No leads yet",noResults:"No matching leads.",
    noCard:"No card yet",create:"Create a card",needCard:"Create a card to start collecting leads.",
    leads:"Leads",error:"Couldn't save the change. Please try again.",
  } : {
    search:"Namen, Telefonnummern oder Notizen suchen…",list:"Liste",board:"Board",all:"Alle",
    export:"CSV exportieren",empty:"Noch keine Leads",noResults:"Keine passenden Leads.",
    noCard:"Noch keine Karte",create:"Karte erstellen",needCard:"Erstelle zuerst eine Karte, um Kontakte zu sammeln.",
    leads:"Leads",error:"Änderung konnte nicht gespeichert werden.",
  };
  const statusOf = (lead: Lead): LeadStatus => isLeadStatus(lead.status) ? lead.status : "new";
  const counts = useMemo(()=>{
    const x: Record<string,number> = {all:leads.length};
    for(const status of LEAD_STATUSES)x[status]=0;
    for(const lead of leads)x[statusOf(lead)]++;
    return x;
  },[leads]);

  const q=query.trim().toLowerCase();
  const allMatching = leads.filter(lead=>!q ||
    [lead.name,lead.email||"",lead.phone||"",lead.note||""].some(v=>v.toLowerCase().includes(q)));
  const filtered = allMatching.filter(lead=>filter==="all" || statusOf(lead)===filter);
  function switchView(next: "list"|"board"){
    setView(next);try{localStorage.setItem("cardnexus_leads_view",next);}catch { /* Browser storage may be unavailable in private mode. */ }
  }
  async function updateLead(id: string, patch: Patch): Promise<boolean> {
    const original=leads.find(l=>l.id===id);
    setLeads(prev=>prev.map(l=>l.id===id?{...l,...patch}:l));
    try {
      const res=await fetch("/api/leads/my",{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id,...patch}),
      });
      if(!res.ok)throw Error("not saved");
      setError("");
      return true;
    } catch {
      setLeads(prev=>prev.map(l=>l.id===id && original ? original : l));
      setError(copy.error);
      return false;
    }
  }
  async function deleteLead(id:string) {
    setDeletingId(id);setError("");
    try {
      const res=await fetch("/api/leads/my",{method:"DELETE",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id})});
      if(!res.ok)throw Error("failed");
      setLeads(prev=>prev.filter(l=>l.id!==id));
    } catch {setError(copy.error);} finally{setDeletingId(null);}
  }
  function exportCsv() {
    const header=locale==="ar-SA"
      ?["الاسم","البريد الإلكتروني","الجوال","الرسالة","الحالة","ملاحظة","التاريخ"]
      :locale==="en"
      ?["Name","Email","Phone","Message","Status","Note","Date"]
      :["Name","E-Mail","Telefon","Nachricht","Status","Notiz","Datum"];
    const rows=filtered.map(l=>[l.name,l.email,l.phone,l.message,statusLabel(statusOf(l),locale),
      l.note,new Date(l.createdAt).toLocaleDateString(locale)]);
    const blob=new Blob(["\uFEFF"+buildCsv(header,rows)],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=url;
    link.download="leads-"+new Date().toISOString().slice(0,10)+".csv";
    link.click();URL.revokeObjectURL(url);
  }

  if(!hasCard)return <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <CreditCard className="h-10 w-10 text-muted-foreground" />
    <p className="font-semibold">{copy.noCard}</p>
    <p className="text-sm text-muted-foreground">{copy.needCard}</p>
    <Button asChild variant="outline"><a href="/card">{copy.create}</a></Button>
  </div>;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2">
        <UserCheck className="h-4 w-4" /><strong>{leads.length}</strong>
        <span className="text-sm text-muted-foreground">{copy.leads}</span>
      </div>
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label={copy.search} className="ps-9" placeholder={copy.search}
          value={query} onChange={event=>setQuery(event.target.value)} />
      </div>
      {(["list","board"] as const).map(mode=><button type="button" key={mode}
        aria-pressed={view===mode} onClick={()=>switchView(mode)}
        className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs ${view===mode?"bg-primary text-primary-foreground":"bg-background"}`}>
        {mode==="list"?<List className="h-4 w-4" />:<Columns3 className="h-4 w-4" />}
        {copy[mode]}
      </button>)}
      {leads.length>0 && <Button size="sm" variant="outline" onClick={exportCsv}>
        <Download className="h-4 w-4" />{copy.export}
      </Button>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {leads.length>0 && view==="list" && <div className="flex gap-2 overflow-x-auto pb-1">
      {(["all",...LEAD_STATUSES] as Filter[]).map(status=><button type="button" key={status}
        onClick={()=>setFilter(status)}
        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${filter===status?"border-primary bg-primary text-primary-foreground":"border-border"}`}>
        {status==="all"?copy.all:statusLabel(status,locale)} ({counts[status]||0})
      </button>)}
    </div>}
    {leads.length===0?<p className="rounded-xl border-2 border-dashed border-border py-14 text-center text-muted-foreground">{copy.empty}</p>
      : view==="board"?<LeadBoard leads={allMatching} onMove={(id,status)=>{void updateLead(id,{status});}} />
      : !filtered.length?<p className="py-12 text-center text-muted-foreground">{copy.noResults}</p>
      :<div className="space-y-3">{filtered.map(lead=><LeadCard key={lead.id} lead={lead}
        deleting={deletingId===lead.id} onDelete={()=>void deleteLead(lead.id)}
        onUpdate={patch=>updateLead(lead.id,patch)} />)}</div>}
  </section>;
}
