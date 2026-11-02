"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, PlayCircle, X, ExternalLink } from "lucide-react";
import { WEEK_DAYS, openNow, parseExtras, videoEmbedUrl } from "@/lib/card-extras";
import type { CardLang } from "@/lib/card-i18n";

const T = {
  ar: { gallery: "من أعمالي", video: "فيديو تعريفي", watch: "شاهد الفيديو", hours: "مواعيد العمل", openNow: "مفتوح الآن", closedNow: "مغلق الآن",
        closed: "مغلق", today: "اليوم", map: "الموقع", openMaps: "افتح في الخرائط", close: "إغلاق", prev: "السابق", next: "التالي" },
  en: { gallery: "My work", video: "Intro video", watch: "Watch the video", hours: "Opening hours", openNow: "Open now", closedNow: "Closed now",
        closed: "Closed", today: "Today", map: "Location", openMaps: "Open in Maps", close: "Close", prev: "Previous", next: "Next" },
} as const;

interface Props {
  extras: string | null | undefined;
  address?: string | null;
  color: string;
  lang: CardLang;
}

function Section({ title, icon, children, aside }: { title: string; icon: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-gray-900 animate-rise">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Optional sections under the public card: gallery, video, hours, map. */
export function CardExtrasView({ extras, address, color, lang }: Props) {
  const ex = useMemo(() => parseExtras(extras), [extras]);
  const t = T[lang];
  const [lightbox, setLightbox] = useState<number | null>(null);
  // "open now" depends on the current time: compute after mount only (no hydration mismatch).
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [todayJs, setTodayJs] = useState<number | null>(null);
  useEffect(() => {
    setIsOpen(openNow(ex));
    try {
      const wd = new Intl.DateTimeFormat("en-US", { timeZone: ex.timeZone || undefined, weekday: "short" }).format(new Date());
      setTodayJs(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd));
    } catch { setTodayJs(new Date().getDay()); }
  }, [ex]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i + 1) % ex.gallery.length));
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i - 1 + ex.gallery.length) % ex.gallery.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, ex.gallery.length]);

  const embed = ex.videoUrl ? videoEmbedUrl(ex.videoUrl) : null;
  const showMap = ex.showMap && !!address?.trim();
  const hasHours = Object.keys(ex.hours).length > 0;
  if (!ex.gallery.length && !ex.videoUrl && !hasHours && !showMap) return null;

  return (
    <div className="mt-6 w-full max-w-sm space-y-4" dir={lang === "en" ? "ltr" : "rtl"}>
      {ex.gallery.length > 0 && (
        <Section title={t.gallery} icon={<span className="h-2 w-2 rounded-full" style={{ background: color }} />}>
          <div className="grid grid-cols-3 gap-1.5">
            {ex.gallery.map((url, i) => (
              <button key={url + i} type="button" onClick={() => setLightbox(i)}
                className="aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus-visible:ring-2" style={{ ["--tw-ring-color" as string]: color }}>
                <img src={url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
              </button>
            ))}
          </div>
        </Section>
      )}

      {ex.videoUrl && (
        <Section title={t.video} icon={<PlayCircle className="h-4 w-4" style={{ color }} />}>
          {embed ? (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <iframe src={embed} title={t.video} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen className="absolute inset-0 h-full w-full border-0" />
            </div>
          ) : (
            <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold" style={{ borderColor: color, color }}>
              <PlayCircle className="h-4 w-4" /> {t.watch}
            </a>
          )}
        </Section>
      )}

      {hasHours && (
        <Section
          title={t.hours}
          icon={<Clock className="h-4 w-4" style={{ color }} />}
          aside={isOpen !== null && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isOpen ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {isOpen ? t.openNow : t.closedNow}
            </span>
          )}
        >
          <ul className="space-y-1 text-sm">
            {WEEK_DAYS.filter((d) => d.key in ex.hours).map((d) => {
              const v = ex.hours[d.key];
              const today = todayJs === d.js;
              return (
                <li key={d.key} className={`flex justify-between rounded-md px-2 py-1 ${today ? "font-semibold" : "text-muted-foreground"}`}
                  style={today ? { background: `${color}14`, color } : undefined}>
                  <span>{lang === "en" ? d.en : d.ar}{today && <span className="text-xs font-normal"> · {t.today}</span>}</span>
                  <bdi dir="ltr">{v ? `${v.open} – ${v.close}` : t.closed}</bdi>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {showMap && (
        <Section title={t.map} icon={<MapPin className="h-4 w-4" style={{ color }} />}
          aside={
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address!)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
              {t.openMaps} <ExternalLink className="h-3 w-3" />
            </a>
          }>
          <p className="mb-2 text-sm text-muted-foreground">{address}</p>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
            <iframe title={t.map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address!)}&z=15&output=embed&hl=${lang}`} />
          </div>
        </Section>
      )}

      {lightbox !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button className="absolute top-4 end-4 rounded-full bg-white/10 p-2 text-white" aria-label={t.close} onClick={() => setLightbox(null)}><X className="h-5 w-5" /></button>
          {ex.gallery.length > 1 && (
            <>
              <button className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white" aria-label={t.prev}
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + ex.gallery.length) % ex.gallery.length); }}>
                <ChevronRight className="h-6 w-6 ltr:rotate-180" />
              </button>
              <button className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white" aria-label={t.next}
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % ex.gallery.length); }}>
                <ChevronLeft className="h-6 w-6 ltr:rotate-180" />
              </button>
            </>
          )}
          <img src={ex.gallery[lightbox]} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain animate-pop" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
