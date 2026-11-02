"use client";
import { T } from "@/components/i18n/I18nProvider";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell } from "recharts";
import { Monitor, Cpu } from "lucide-react";
import type { AnalyticsSummary } from "@/types";

const BROWSER_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B", "#10B981", "#0EA5E9"];
const OS_COLORS     = ["#0F172A", "#64748B", "#94A3B8", "#CBD5E1", "#E2E8F0", "#10B981", "#6366F1"];

function PieLegend({ items, colors }: { items: { label: string; count: number }[]; colors: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground"><T text={"Noch keine Daten"} /></p>;
  const pieData = items.map((i) => ({ name: i.label, value: i.count }));
  return (
    <div className="flex items-center gap-6">
      <PieChart width={110} height={110}>
        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={48} innerRadius={28}>
          {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie>
      </PieChart>
      <div className="space-y-1.5 min-w-0">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="truncate text-foreground">{item.label}</span>
            <span className="text-muted-foreground ml-auto pl-2">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  browserSplit: AnalyticsSummary["browserSplit"];
  osSplit: AnalyticsSummary["osSplit"];
}

export function AnalyticsTech({ browserSplit, osSplit }: Props) {
  if (browserSplit.length === 0 && osSplit.length === 0) return null;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" /><T text={"Browser"} /></CardTitle>
        </CardHeader>
        <CardContent>
          <PieLegend
            items={browserSplit.map((b) => ({ label: b.browser, count: b.count }))}
            colors={BROWSER_COLORS}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" /><T text={"Betriebssystem"} /></CardTitle>
        </CardHeader>
        <CardContent>
          <PieLegend
            items={osSplit.map((o) => ({ label: o.os, count: o.count }))}
            colors={OS_COLORS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
