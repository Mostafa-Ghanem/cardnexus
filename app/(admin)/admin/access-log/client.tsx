"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useRouter, usePathname } from "next/navigation";

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  view:           { label: "Aufruf",     color: "bg-blue-100 text-blue-700" },
  vcard_download: { label: "vCard",      color: "bg-green-100 text-green-700" },
  qr_scan:        { label: "QR-Scan",    color: "bg-purple-100 text-purple-700" },
  link_click:     { label: "Link-Klick", color: "bg-amber-100 text-amber-700" },
  wallet_save:    { label: "Wallet",     color: "bg-pink-100 text-pink-700" },
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
        <h1 className="text-2xl font-bold"><T text={"Access Log"} /></h1>
        <p className="text-muted-foreground mt-1">
          {total.toLocaleString("de-DE")}<T text={"Einträge"} /></p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-card border border-border rounded-xl p-4">
        <select
          value={filters.event ?? ""}
          onChange={(e) => applyFilter("event", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Alle Events</option>
          {Object.entries(EVENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={filters.cardSlug ?? ""}
          onChange={(e) => applyFilter("cardSlug", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Alle Karten</option>
          {cards.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name ?? c.slug} ({c.slug})</option>
          ))}
        </select>

        <select
          value={filters.days ?? ""}
          onChange={(e) => applyFilter("days", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Alle Zeit</option>
          <option value="1">Letzte 24h</option>
          <option value="7">Letzte 7 Tage</option>
          <option value="30">Letzte 30 Tage</option>
          <option value="90">Letzte 90 Tage</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium"><T text={"Zeit"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"Event"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"Karte"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"IP"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"Land / Stadt"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"Gerät"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"Browser / OS"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"Referrer"} /></th>
              <th className="px-4 py-3 font-medium"><T text={"Quelle / UTM"} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground"><T text={"Keine Einträge gefunden."} /></td>
              </tr>
            )}
            {entries.map((e) => {
              const ev = EVENT_LABELS[e.event];
              return (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString("de-DE", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ev?.color ?? "bg-muted text-muted-foreground"}`}>
                      {ev?.label ?? e.event}
                    </span>
                    {e.linkLabel && (
                      <span className="ml-1.5 text-xs text-muted-foreground truncate max-w-[120px] inline-block">{e.linkLabel}</span>
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
                    {e.utmCampaign && <span className="ml-1 text-purple-600">[{e.utmCampaign}]</span>}
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
          <span className="text-muted-foreground"><T text={"Seite"} />{page}{" "}<T text={"von"} />{" "}{totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() => applyFilter("page", String(page - 1))}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              ><T text={"← Zurück"} /></button>
            )}
            {page < totalPages && (
              <button
                onClick={() => applyFilter("page", String(page + 1))}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              ><T text={"Weiter →"} /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
