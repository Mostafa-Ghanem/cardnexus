"use client";

import { useId } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Point { day: string; views: number; leads: number }

/** 14-day views vs. leads. */
export function ActivityChart({ data, color }: { data: Point[]; color: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const empty = data.every((d) => d.views === 0 && d.leads === 0);
  return (
    <div className="relative h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`v-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`l-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", direction: "rtl", fontSize: 12 }}
            formatter={(v: number, name: string) => [v, name === "views" ? "الزيارات" : "العملاء المحتملون"]}
          />
          <Area type="monotone" dataKey="views" stroke={color} strokeWidth={2} fill={`url(#v-${uid})`} />
          <Area type="monotone" dataKey="leads" stroke="#F59E0B" strokeWidth={2} fill={`url(#l-${uid})`} />
        </AreaChart>
      </ResponsiveContainer>
      {empty && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground" dir="rtl">
          شارك بطاقتك لتبدأ الأرقام بالظهور هنا
        </div>
      )}
    </div>
  );
}
