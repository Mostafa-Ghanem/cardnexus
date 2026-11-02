"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, UserCheck, CreditCard, List, Columns3 } from "lucide-react";
import { toast } from "sonner";
import { buildCsv } from "@/lib/csv";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, isLeadStatus, type LeadStatus } from "@/lib/lead-status";
import { LeadCard } from "./LeadCard";
import { LeadBoard } from "./LeadBoard";

interface Props {
  leads: Lead[];
  hasCard: boolean;
}

type Filter = "all" | LeadStatus;

export function LeadsClient({ leads: initialLeads, hasCard }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "board">("list");
  // Remembered per browser; read after mount to keep server and client HTML identical.
  useEffect(() => {
    try { if (localStorage.getItem("leads_view") === "board") setView("board"); } catch { /* ignore */ }
  }, []);
  function changeView(v: "list" | "board") {
    setView(v);
    try { localStorage.setItem("leads_view", v); } catch { /* ignore */ }
  }

  const statusOf = (l: Lead): LeadStatus => (isLeadStatus(l.status) ? l.status : "new");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length };
    for (const s of LEAD_STATUSES) c[s] = 0;
    for (const l of leads) c[statusOf(l)]++;
    return c;
  }, [leads]);

  const q = query.trim().toLowerCase();
  const filtered = leads.filter((l) =>
    (filter === "all" || statusOf(l) === filter) &&
    (!q || l.name.toLowerCase().includes(q) || (l.email ?? "").toLowerCase().includes(q) ||
      (l.phone ?? "").includes(q) || (l.note ?? "").toLowerCase().includes(q))
  );

  async function deleteLead(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/leads/my", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setLeads((prev) => prev.filter((l) => l.id !== id));
      else toast.error("تعذّر الحذف");
    } finally {
      setDeletingId(null);
    }
  }

  async function updateLead(id: string, patch: Partial<Pick<Lead, "status" | "note">>): Promise<boolean> {
    const before = leads;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const res = await fetch("/api/leads/my", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    }).catch(() => null);
    if (!res?.ok) {
      setLeads(before);
      toast.error("تعذّر الحفظ");
      return false;
    }
    return true;
  }

  function exportCsv() {
    // buildCsv neutralises spreadsheet formulas typed by visitors (CSV injection)
    // and adds a UTF-8 BOM so Excel shows Arabic correctly.
    const csv = buildCsv(
      ["الاسم", "البريد الإلكتروني", "الجوال", "الرسالة", "الحالة", "ملاحظة", "التاريخ"],
      filtered.map((l) => [
        l.name, l.email, l.phone, l.message, LEAD_STATUS_LABELS[statusOf(l)], l.note,
        new Date(l.createdAt).toLocaleDateString("ar-u-nu-latn"),
      ])
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasCard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <CreditCard className="h-12 w-12 text-muted-foreground/40" />
        <p className="font-semibold text-muted-foreground">لم تنشئ بطاقة بعد</p>
        <p className="text-sm text-muted-foreground">أنشئ بطاقتك أولًا لتبدأ في جمع العملاء المحتملين.</p>
        <Button asChild variant="outline" className="mt-2"><a href="/card">إنشاء بطاقة</a></Button>
      </div>
    );
  }

  const chips: Filter[] = ["all", ...LEAD_STATUSES];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-4 py-2.5">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{leads.length}</span>
          <span className="text-sm text-muted-foreground">{leads.length === 1 ? "عميل محتمل" : "عملاء محتملون"}</span>
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو الجوال أو الملاحظة…" className="ps-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {leads.length > 0 && (
          <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="طريقة العرض">
            {([["list", List, "قائمة"], ["board", Columns3, "لوحة"]] as const).map(([v, Icon, label]) => (
              <button key={v} onClick={() => changeView(v)} aria-pressed={view === v}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        )}
        {leads.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> تصدير CSV
          </Button>
        )}
      </div>

      {leads.length > 0 && view === "list" && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
              }`}
            >
              {c === "all" ? "الكل" : LEAD_STATUS_LABELS[c]} <span className="opacity-70">({counts[c] ?? 0})</span>
            </button>
          ))}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border-2 border-dashed rounded-2xl">
          <UserCheck className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">لا يوجد عملاء محتملون بعد</p>
          <p className="text-sm text-muted-foreground max-w-xs">عندما يضغط أحد على «اترك بياناتك للتواصل» في بطاقتك سيظهر هنا.</p>
        </div>
      ) : view === "board" ? (
        <LeadBoard
          leads={leads.filter((l) => !q || l.name.toLowerCase().includes(q) || (l.phone ?? "").includes(q) || (l.email ?? "").toLowerCase().includes(q))}
          onMove={(id, status) => { updateLead(id, { status }).then((ok) => ok && toast.success(`نُقل إلى «${LEAD_STATUS_LABELS[status]}»`)); }}
        />
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">لا توجد نتائج مطابقة.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              deleting={deletingId === lead.id}
              onDelete={() => deleteLead(lead.id)}
              onUpdate={(patch) => updateLead(lead.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
