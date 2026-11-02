"use client";

import { useMemo } from "react";
import { X, ArrowUp, Video, Clock, MapPin, Images } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { EMPTY_EXTRAS, WEEK_DAYS, parseExtras, videoEmbedUrl, type CardExtras, type DayKey } from "@/lib/card-extras";

interface Props {
  value: string | null | undefined;
  onChange: (json: string | null) => void;
  hasAddress: boolean;
}

/** Editor tab for the optional public-page sections. */
export function ExtrasTab({ value, onChange, hasAddress }: Props) {
  const ex = useMemo(() => parseExtras(value), [value]);

  function set(patch: Partial<CardExtras>) {
    const next = { ...ex, ...patch };
    const empty = JSON.stringify(next) === JSON.stringify(EMPTY_EXTRAS);
    onChange(empty ? null : JSON.stringify(next));
  }

  function setDay(day: DayKey, v: { open: string; close: string } | null | undefined) {
    const hours = { ...ex.hours };
    if (v === undefined) delete hours[day]; else hours[day] = v;
    set({ hours, timeZone: ex.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone });
  }

  function preset(kind: "week" | "all" | "clear") {
    if (kind === "clear") return set({ hours: {} });
    const hours: CardExtras["hours"] = {};
    for (const d of WEEK_DAYS) {
      hours[d.key] = kind === "all" || d.key !== "fri" ? { open: "09:00", close: "17:00" } : null;
    }
    set({ hours, timeZone: ex.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone });
  }

  const videoOk = !ex.videoUrl || !!videoEmbedUrl(ex.videoUrl);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">أقسام اختيارية تظهر أسفل بطاقتك العامة. اترك أي قسم فارغًا لإخفائه.</p>

      {/* Gallery */}
      <section className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2"><Images className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">معرض الأعمال</p>
          <span className="text-xs text-muted-foreground">({ex.gallery.length}/12)</span></div>
        {ex.gallery.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ex.gallery.map((url, i) => (
              <div key={url + i} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-1 top-1 flex justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button type="button" aria-label="حذف" onClick={() => set({ gallery: ex.gallery.filter((_, j) => j !== i) })}
                    className="rounded-full bg-black/60 p-1 text-white"><X className="h-3 w-3" /></button>
                  {i > 0 && (
                    <button type="button" aria-label="تقديم" onClick={() => { const g = [...ex.gallery]; [g[i - 1], g[i]] = [g[i], g[i - 1]]; set({ gallery: g }); }}
                      className="rounded-full bg-black/60 p-1 text-white"><ArrowUp className="h-3 w-3 -rotate-90 rtl:rotate-90" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {ex.gallery.length < 12 && (
          <ImageUpload key={ex.gallery.length} value={null} onChange={(u) => u && set({ gallery: [...ex.gallery, u] })} label="إضافة صورة" shape="wide" className="h-20" />
        )}
      </section>

      {/* Video */}
      <section className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">فيديو تعريفي</p></div>
        <Input type="url" dir="ltr" placeholder="https://youtube.com/watch?v=…" value={ex.videoUrl} onChange={(e) => set({ videoUrl: e.target.value.trim() })} />
        <p className={`text-xs ${videoOk ? "text-muted-foreground" : "text-amber-600"}`}>
          {videoOk ? "يوتيوب أو Vimeo يظهر داخل الصفحة، وأي رابط آخر يظهر كزر." : "سيظهر كزر رابط لأنه ليس من يوتيوب أو Vimeo."}
        </p>
      </section>

      {/* Hours */}
      <section className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">مواعيد العمل</p></div>
          <div className="flex flex-wrap gap-1">
            <Button type="button" size="sm" variant="outline" onClick={() => preset("week")}>السبت–الخميس 9–5</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => preset("all")}>كل الأيام</Button>
            {Object.keys(ex.hours).length > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => preset("clear")}>إخفاء</Button>}
          </div>
        </div>
        {Object.keys(ex.hours).length > 0 && (
          <div className="space-y-2">
            {WEEK_DAYS.map((d) => {
              const v = ex.hours[d.key];
              const open = !!v;
              return (
                <div key={d.key} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0">{d.ar}</span>
                  <Switch checked={open} onCheckedChange={(on) => setDay(d.key, on ? { open: "09:00", close: "17:00" } : null)} aria-label={`${d.ar} مفتوح`} />
                  {open ? (
                    <div className="flex items-center gap-1.5" dir="ltr">
                      <Input type="time" className="h-8 w-[110px]" value={v!.open} onChange={(e) => setDay(d.key, { ...v!, open: e.target.value })} aria-label="من" />
                      <span className="text-muted-foreground">–</span>
                      <Input type="time" className="h-8 w-[110px]" value={v!.close} onChange={(e) => setDay(d.key, { ...v!, close: e.target.value })} aria-label="إلى" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">مغلق</span>
                  )}
                </div>
              );
            })}
            {ex.timeZone && <p className="text-xs text-muted-foreground">المنطقة الزمنية: <bdi dir="ltr">{ex.timeZone}</bdi> (لحساب «مفتوح الآن»)</p>}
          </div>
        )}
      </section>

      {/* Map */}
      <section className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <Label className="text-sm font-semibold">خريطة الموقع</Label>
            <p className="text-xs text-muted-foreground">{hasAddress ? "تعرض العنوان من تبويب التواصل على خريطة Google." : "أضف العنوان في تبويب التواصل أولًا."}</p>
          </div>
        </div>
        <Switch checked={ex.showMap && hasAddress} disabled={!hasAddress} onCheckedChange={(v) => set({ showMap: v })} />
      </section>
    </div>
  );
}
