"use client";

import { useRouter, usePathname } from "next/navigation";

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  view:           { label: "زيارة",     color: "bg-blue-100 text-blue-700" },
  vcard_download: { label: "تنزيل جهة الاتصال",      color: "bg-green-100 text-green-700" },
  qr_scan:        { label: "مسح QR",    color: "bg-purple-100 text-purple-700" },
  link_click:     { label: "نقرة رابط", color: "bg-amber-100 text-amber-700" },
  wallet_save:    { label: "المحفظة",     color: "bg-pink-100 text-pink-700" },
};

interface Entry {
  id: string;
  cardSlug: string;
  event: string;
  linkLabel?: string | null;
  source?: string | null;
  ip?: string | null;
  country?: string | null;
  city?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  referrer?: string | null;
  language?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  createdAt: string;
}

interface Props {
  entries: Entry[];
  total: number;
  page: number;
  pageSize: number;
  cards: { slug: string; name: string | null }[];
  filters: { event?: string; cardSlug?: string; days?: string };
}

export function AccessLogClient({ entries, total, page, pageSize, cards, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function applyFilter(key: string, value: string) {
    const sp = new URLSearchParams();
    if (filters.event && key !== "event") sp.set("event", filters.event);
    if (filters.cardSlug && key !== "cardSlug") sp.set("cardSlug", filters.cardSlug);
    if (filters.days && key !== "days") sp.set("days", filters.days);
    if (value) sp.set(key, value);
    router.push(`${pathname}?${sp.toString()}`);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سجل الوصول</h1>
        <p className="text-muted-foreground mt-1">
          {total.toLocaleString("en-US")} سجل
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-card border border-border rounded-xl p-4">
        <select
          value={filters.event ?? ""}
          onChange={(e) => applyFilter("event", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">كل الأحداث</option>
          {Object.entries(EVENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={filters.cardSlug ?? ""}
          onChange={(e) => applyFilter("cardSlug", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">كل البطاقات</option>
          {cards.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name ?? c.slug} ({c.slug})</option>
          ))}
        </select>

        <select
          value={filters.days ?? ""}
          onChange={(e) => applyFilter("days", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">كل الأوقات</option>
          <option value="1">آخر 24 ساعة</option>
          <option value="7">آخر 7 أيام</option>
          <option value="30">آخر 30 يومًا</option>
          <option value="90">آخر 90 يومًا</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-start text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">الوقت</th>
              <th className="px-4 py-3 font-medium">الحدث</th>
              <th className="px-4 py-3 font-medium">البطاقة</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">الدولة / المدينة</th>
              <th className="px-4 py-3 font-medium">الجهاز</th>
              <th className="px-4 py-3 font-medium">المتصفح / النظام</th>
              <th className="px-4 py-3 font-medium">المصدر المحيل</th>
              <th className="px-4 py-3 font-medium">المصدر / UTM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد سجلات.
                </td>
              </tr>
            )}
            {entries.map((e) => {
              const ev = EVENT_LABELS[e.event];
              return (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString("ar-u-nu-latn", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ev?.color ?? "bg-muted text-muted-foreground"}`}>
                      {ev?.label ?? e.event}
                    </span>
                    {e.linkLabel && (
                      <span className="ms-1.5 text-xs text-muted-foreground truncate max-w-[120px] inline-block">{e.linkLabel}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{e.cardSlug}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{e.ip ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {e.country && <span className="font-medium">{e.country}</span>}
                    {e.city && <span className="text-muted-foreground">{e.country ? ` / ${e.city}` : e.city}</span>}
                    {!e.country && !e.city && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs capitalize text-muted-foreground">{e.device ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {e.browser && <span>{e.browser}</span>}
                    {e.os && <span className="text-muted-foreground">{e.browser ? ` / ${e.os}` : e.os}</span>}
                    {!e.browser && !e.os && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[140px]">{e.referrer ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {e.source && <span className="capitalize">{e.source}</span>}
                    {e.utmCampaign && <span className="ms-1 text-purple-600">[{e.utmCampaign}]</span>}
                    {!e.source && !e.utmCampaign && "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() => applyFilter("page", String(page - 1))}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                → السابق
              </button>
            )}
            {page < totalPages && (
              <button
                onClick={() => applyFilter("page", String(page + 1))}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                التالي ←
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
