"use client";
import { T } from "@/components/i18n/I18nProvider";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, MapPin, Link as LinkIcon, Languages } from "lucide-react";
import type { AnalyticsSummary } from "@/types";

const COUNTRY_NAMES = new Intl.DisplayNames(["de"], { type: "region" });

function safeCountryName(code: string) {
  try { return COUNTRY_NAMES.of(code) ?? code; } catch { return code; }
}

const BAR_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B", "#10B981", "#0EA5E9", "#14B8A6"];

function BarList({ items, labelKey, countKey }: {
  items: Record<string, unknown>[];
  labelKey: string;
  countKey: string;
}) {
  const max = (items[0]?.[countKey] as number) ?? 1;
  if (items.length === 0) return <p className="text-sm text-muted-foreground"><T text={"Noch keine Daten"} /></p>;
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={String(item[labelKey])} className="flex items-center gap-3">
          <span className="text-sm flex-1 truncate">{String(item[labelKey])}</span>
          <div className="w-28 bg-muted rounded-full h-1.5 overflow-hidden shrink-0">
            <div
              className="h-full rounded-full"
              style={{ width: `${((item[countKey] as number) / max) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
          <span className="text-sm text-muted-foreground w-8 text-right tabular-nums shrink-0">{item[countKey] as number}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  topCountries: AnalyticsSummary["topCountries"];
  topCities: AnalyticsSummary["topCities"];
  topReferrers: AnalyticsSummary["topReferrers"];
  topLanguages: AnalyticsSummary["topLanguages"];
}

export function AnalyticsGeo({ topCountries, topCities, topReferrers, topLanguages }: Props) {
  const hasAny = topCountries.length + topCities.length + topReferrers.length + topLanguages.length > 0;
  if (!hasAny) return null;

  const countriesFormatted = topCountries.map((r) => ({
    country: safeCountryName(r.country),
    count: r.count,
  }));

  const languagesFormatted = topLanguages.map((r) => ({
    language: r.language.toUpperCase(),
    count: r.count,
  }));

  return (
    <>
      {/* Countries + Cities */}
      {(topCountries.length > 0 || topCities.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {topCountries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" /><T text={"Länder"} /></CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={countriesFormatted} labelKey="country" countKey="count" />
              </CardContent>
            </Card>
          )}
          {topCities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /><T text={"Städte"} /></CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={topCities} labelKey="city" countKey="count" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Referrers + Languages */}
      {(topReferrers.length > 0 || topLanguages.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {topReferrers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" /><T text={"Referrer"} /></CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={topReferrers} labelKey="referrer" countKey="count" />
              </CardContent>
            </Card>
          )}
          {topLanguages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" /><T text={"Sprachen"} /></CardTitle>
              </CardHeader>
              <CardContent>
                <BarList items={languagesFormatted} labelKey="language" countKey="count" />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
