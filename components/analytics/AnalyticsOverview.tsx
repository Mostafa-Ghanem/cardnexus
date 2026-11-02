"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/types";
import {
  Eye, Download, QrCode, MousePointer, Megaphone, Link as LinkIcon, ExternalLink, Wallet,
} from "lucide-react";
import { AnalyticsGeo } from "./AnalyticsGeo";
import { AnalyticsTech } from "./AnalyticsTech";

const DEVICE_COLORS = ["#0F172A", "#64748B", "#94A3B8"];
const SOURCE_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B", "#10B981"];

interface CardOption { id: string; name: string }

interface Props {
  cards?: CardOption[];
  initialCardId?: string;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString("ar-u-nu-latn")}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsOverview({ cards = [], initialCardId }: Props) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [cardId, setCardId] = useState<string>(initialCardId ?? cards[0]?.id ?? "");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (cardId) params.set("cardId", cardId);
    fetch(`/api/analytics?${params}`)
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .finally(() => setLoading(false));
  }, [days, cardId]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">لم تنشئ بطاقة بعد.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter row: card + period */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {d === 365 ? "سنة" : `${d} يومًا`}
            </button>
          ))}
        </div>
        {cards.length > 1 && (
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            aria-label="اختر البطاقة"
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="إجمالي الزيارات" value={data.totalViews} icon={Eye} />
        <StatCard label="تنزيلات جهة الاتصال" value={data.vcardDownloads} icon={Download} />
        <StatCard label="مسح QR" value={data.qrScans} icon={QrCode} />
        <StatCard label="نقرات الروابط" value={data.linkClicks} icon={MousePointer} />
        <StatCard label="الحفظ في المحفظة" value={data.walletSaves ?? 0} icon={Wallet} />
      </div>

      {/* Views chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الزيارات ({days === 365 ? "سنة" : `${days} يومًا`})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.viewsLast30Days}>
              <defs>
                <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => new Date(v).toLocaleDateString("ar-u-nu-latn")}
              />
              <Area type="monotone" dataKey="count" stroke="#0F172A" strokeWidth={2} fill="url(#viewGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Geo stats */}
      <AnalyticsGeo
        topCountries={data.topCountries ?? []}
        topCities={data.topCities ?? []}
        topReferrers={data.topReferrers ?? []}
        topLanguages={data.topLanguages ?? []}
      />

      {/* Browser + OS */}
      <AnalyticsTech
        browserSplit={data.browserSplit ?? []}
        osSplit={data.osSplit ?? []}
      />

      {/* Device + Source split */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الأجهزة</CardTitle>
          </CardHeader>
          <CardContent>
            {data.deviceSplit.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات بعد</p>
            ) : (
              <div className="flex items-center gap-6">
                <PieChart width={120} height={120}>
                  <Pie data={data.deviceSplit} dataKey="count" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                    {data.deviceSplit.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {data.deviceSplit.map((d, i) => (
                    <div key={d.device} className="flex items-center gap-2 text-sm">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                      <span className="capitalize text-foreground">{d.device}</span>
                      <span className="text-muted-foreground ms-auto">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">المصادر</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات بعد</p>
            ) : (
              <div className="space-y-3">
                {data.topSources.map((s, i) => (
                  <div key={s.source} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                    <span className="text-sm capitalize flex-1">{s.source}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${data.totalViews ? (s.count / data.totalViews) * 100 : 0}%`,
                          backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-end">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top clicked links */}
      {data.topLinks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <CardTitle className="text-base">الروابط الأكثر نقرًا</CardTitle>
                <CardDescription>أعلى 10 روابط مخصصة وروابط تواصل حسب عدد النقرات.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topLinks.map((l, i) => {
                const max = data.topLinks[0]?.count ?? 1;
                return (
                  <div key={l.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 text-end tabular-nums">{i + 1}</span>
                    <span className="text-sm flex-1 truncate">{l.label}</span>
                    <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(l.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-end tabular-nums">{l.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UTM campaign breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <CardTitle className="text-base">حملات UTM</CardTitle>
              <CardDescription>
                الزيارات مجمّعة حسب <code className="text-xs">utm_campaign</code>,
                <code className="text-xs ms-1">utm_source</code> و
                <code className="text-xs ms-1">utm_medium</code>. أي رابط فيه
                معاملات UTM يظهر هنا حتى بدون حملة مسجلة.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.utmCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا توجد زيارات بمعاملات UTM في هذه الفترة.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">الحملة</th>
                    <th className="pb-2 font-medium">المصدر</th>
                    <th className="pb-2 font-medium">الوسيط</th>
                    <th className="pb-2 font-medium text-end">الزيارات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.utmCampaigns.map((c, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium">{c.campaign}</td>
                      <td className="py-2 text-muted-foreground">{c.source ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{c.medium ?? "—"}</td>
                      <td className="py-2 text-end tabular-nums">{c.count.toLocaleString("ar-u-nu-latn")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Named campaigns (custom) */}
      {data.namedCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <CardTitle className="text-base">حملات مخصصة</CardTitle>
                <CardDescription>
                  روابط مختصرة على <code className="text-xs">/p/&lt;slug&gt;</code>، مع
                  عدد النقرات من عداد التحويل.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {data.namedCampaigns.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">/p/{c.urlSlug}</p>
                    </div>
                    {expired && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">منتهية</span>
                    )}
                    <span className="tabular-nums font-semibold">{c.views.toLocaleString("ar-u-nu-latn")}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
