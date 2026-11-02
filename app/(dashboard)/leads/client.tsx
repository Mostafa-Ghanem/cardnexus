"use client";

import { useState } from "react";
import type { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Phone, MessageSquare, Trash2, Download,
  Search, UserCheck, CreditCard,
} from "lucide-react";

interface Props {
  leads: Lead[];
  hasCard: boolean;
}

export function LeadsClient({ leads: initialLeads, hasCard }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      (l.email ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (l.phone ?? "").includes(query)
  );

  async function deleteLead(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/leads/my", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function exportCsv() {
    const header = "الاسم,البريد الإلكتروني,الجوال,الرسالة,التاريخ";
    const rows = leads.map((l) =>
      [
        `"${l.name}"`,
        `"${l.email ?? ""}"`,
        `"${l.phone ?? ""}"`,
        `"${(l.message ?? "").replace(/"/g, '""')}"`,
        new Date(l.createdAt).toLocaleDateString("ar-u-nu-latn"),
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
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
        <p className="text-sm text-muted-foreground">
          أنشئ بطاقتك أولًا لتبدأ في جمع العملاء المحتملين.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <a href="/card">إنشاء بطاقة</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats + actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-4 py-2.5">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{leads.length}</span>
          <span className="text-sm text-muted-foreground">
            {leads.length === 1 ? "عميل محتمل" : "عملاء محتملون"}
          </span>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث…"
            className="ps-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {leads.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        )}
      </div>

      {/* Empty state */}
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border-2 border-dashed rounded-2xl">
          <UserCheck className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">لا يوجد عملاء محتملون بعد</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            عندما يضغط أحد على «اترك بياناتك للتواصل» في بطاقتك سيظهر هنا.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">لا توجد نتائج لـ «{query}»</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDelete={() => deleteLead(lead.id)}
              deleting={deletingId === lead.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead, onDelete, deleting,
}: {
  lead: Lead; onDelete: () => void; deleting: boolean;
}) {
  const [showFull, setShowFull] = useState(false);
  const date = new Date(lead.createdAt);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
      {/* Avatar */}
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary text-sm">
        {lead.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-semibold text-sm">{lead.name}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {date.toLocaleDateString("ar-u-nu-latn", { day: "2-digit", month: "short", year: "numeric" })}{" "}
            {date.toLocaleTimeString("ar-u-nu-latn", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {lead.email && (
            <a href={`mailto:${lead.email}`} dir="ltr" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-3 w-3" />
              {lead.email}
            </a>
          )}
          {lead.phone && (
            <>
              <a href={`tel:${lead.phone}`} dir="ltr" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </a>
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                واتساب
              </a>
            </>
          )}
        </div>

        {lead.message && (
          <div className="mt-2">
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowFull((v) => !v)}
            >
              <MessageSquare className="h-3 w-3" />
              {showFull ? "إخفاء الرسالة" : "عرض الرسالة"}
            </button>
            {showFull && (
              <p className="mt-1.5 text-sm bg-muted rounded-lg px-3 py-2 text-muted-foreground leading-relaxed">
                {lead.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={deleting}
        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10 shrink-0"
        title="حذف"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
