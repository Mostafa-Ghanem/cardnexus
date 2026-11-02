"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Download, QrCode, MousePointer, Users, UserPlus, ExternalLink } from "lucide-react";

interface ViewDay { date: string; count: number }
interface CardRow { slug: string; name: string; views: number }
interface LeadRow { slug: string; name: string; leads: number }

interface Props {
  totalViews: number;
  vcardDownloads: number;
  qrScans: number;
  linkClicks: number;
  totalLeads: number;
  memberCount: number;
  topCards: CardRow[];
  topCardsByLeads: LeadRow[];
  viewsLast30Days: ViewDay[];
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

export function OrgAnalyticsClient({
  totalViews, vcardDownloads, qrScans, linkClicks, totalLeads,
  memberCount, topCards, topCardsByLeads, viewsLast30Days,
}: Props) {
  const maxCount = Math.max(...viewsLast30Days.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="إجمالي الزيارات" value={totalViews} icon={Eye} />
        <StatCard label="تنزيلات جهة الاتصال" value={vcardDownloads} icon={Download} />
        <StatCard label="مسح QR" value={qrScans} icon={QrCode} />
        <StatCard label="نقرات الروابط" value={linkClicks} icon={MousePointer} />
        <StatCard label="العملاء المحتملون" value={totalLeads} icon={UserPlus} />
        <StatCard label="أعضاء الفريق" value={memberCount} icon={Users} />
      </div>

      {/* 30-day chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الزيارات – آخر 30 يومًا</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={viewsLast30Days} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} domain={[0, maxCount + 1]} />
              <Tooltip
                formatter={(v: number) => [v.toLocaleString("ar-u-nu-latn"), "الزيارات"]}
                labelFormatter={(l) => new Date(l).toLocaleDateString("ar-u-nu-latn")}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#orgGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top cards by views */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أعلى البطاقات زيارةً</CardTitle>
          </CardHeader>
          <CardContent>
            {topCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
            ) : (
              <div className="space-y-2">
                {topCards.map((c) => (
                  <div key={c.slug} className="flex items-center justify-between gap-3">
                    <a
                      href={`/c/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm hover:underline min-w-0 truncate"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {c.name}
                    </a>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {c.views.toLocaleString("ar-u-nu-latn")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top cards by leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أعلى البطاقات في العملاء المحتملين</CardTitle>
          </CardHeader>
          <CardContent>
            {topCardsByLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد عملاء محتملون بعد.</p>
            ) : (
              <div className="space-y-2">
                {topCardsByLeads.map((c) => (
                  <div key={c.slug} className="flex items-center justify-between gap-3">
                    <a
                      href={`/c/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm hover:underline min-w-0 truncate"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {c.name}
                    </a>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {c.leads.toLocaleString("ar-u-nu-latn")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
