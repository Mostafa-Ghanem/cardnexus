"use client";

import { useEffect, useMemo, useState } from "react";
import type { CardData } from "@/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Image as ImageIcon } from "lucide-react";
import { qrArtSvg, svgToDataUrl, type QrStyle } from "@/lib/qr-art";

function saveFile(name: string, blob: Blob) {
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.download=name;link.href=url;document.body.append(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),2000);
}
export function QrDesigner({card}:{card: CardData}) {
  const {locale} = useI18n();
  const txt = locale === "ar-SA" ? {
    title:"مصمم رمز QR",desc:"خصّص الرمز بألوان الهوية البصرية. اختبر المسح قبل الطباعة.",
    color:"لون الرمز",background:"لون الخلفية",style:"شكل النقاط",
    square:"مربعات",rounded:"مستدير",dots:"نقاط",logo:"إظهار الشعار",
    downloadSvg:"تنزيل SVG",downloadPng:"تنزيل PNG",link:"فتح البطاقة",
    warning:"جرّب مسح رمز QR بجوال قبل طباعته. لا يُنصح بألوان ضعيفة التباين.",
  } : locale === "en" ? {
    title:"QR code designer",desc:"Customize your QR code with brand colors. Test scanning before printing.",
    color:"QR color",background:"Background",style:"Module style",
    square:"Squares",rounded:"Rounded",dots:"Dots",logo:"Show logo",
    downloadSvg:"Download SVG",downloadPng:"Download PNG",link:"Open card",
    warning:"Test scanning with a phone before printing. Avoid low-contrast colors.",
  } : {
    title:"QR-Code-Designer",desc:"Passe deinen QR-Code an dein Branding an. Vor dem Drucken scannen.",
    color:"QR-Farbe",background:"Hintergrund",style:"Punktstil",
    square:"Quadrate",rounded:"Abgerundet",dots:"Punkte",logo:"Logo anzeigen",
    downloadSvg:"SVG herunterladen",downloadPng:"PNG herunterladen",link:"Karte öffnen",
    warning:"Vor dem Druck mit einem Smartphone testen. Farben mit geringem Kontrast vermeiden.",
  };
  const [origin,setOrigin] = useState("");
  const [color,setColor] = useState(card.primaryColor || "#0F172A");
  const [background,setBackground] = useState("#FFFFFF");
  const [style,setStyle] = useState<QrStyle>("rounded");
  const [withLogo,setWithLogo] = useState(Boolean(card.logoUrl));
  const [embeddedLogo,setEmbeddedLogo] = useState<string|null>(null);
  const [busy,setBusy] = useState(false);
  useEffect(()=>setOrigin(window.location.origin),[]);
  useEffect(()=>{
    if(!card.logoUrl || !withLogo)return;
    let stopped=false;
    const src=card.logoUrl;
    // Only embed same-origin image data. Never fetch arbitrary external URLs.
    if(!src.startsWith("/uploads/"))return;
    (async()=>{
      try{
        const response=await fetch(src);
        if(!response.ok) return;
        const imageBlob=await response.blob();
        const bitmap=await createImageBitmap(imageBlob);
        const canvas=document.createElement("canvas");
        canvas.width=128;canvas.height=128;
        const ctx=canvas.getContext("2d");if(!ctx)return;
        ctx.clearRect(0,0,128,128);
        const scale=Math.min(128/bitmap.width,128/bitmap.height);
        const w=bitmap.width*scale,h=bitmap.height*scale;
        ctx.drawImage(bitmap,(128-w)/2,(128-h)/2,w,h);
        if(!stopped)setEmbeddedLogo(canvas.toDataURL("image/png"));
        bitmap.close();
      }catch{/* Logo stays off if reading fails. */}
    })();
    return()=>{stopped=true;};
  },[card.logoUrl,withLogo]);
  const url=origin ? `${origin}/c/${card.slug}` : `/c/${card.slug}`;
  const svg=useMemo(()=>qrArtSvg({
    text:url,color,background,style,margin:4,
    logoHref:withLogo?embeddedLogo:null,
  }),[url,color,background,style,withLogo,embeddedLogo]);
  function downloadSvg() {
    saveFile(`qr-${card.slug}.svg`,new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
  }
  async function downloadPng() {
    setBusy(true);
    try{
      const image=new Image();
      image.src=svgToDataUrl(svg);
      await image.decode();
      const canvas=document.createElement("canvas");
      canvas.width=1200;canvas.height=1200;
      const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas not available");
      ctx.drawImage(image,0,0,1200,1200);
      const png=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));
      if(png)saveFile(`qr-${card.slug}.png`,png);
    }finally{setBusy(false);}
  }
  return <section className="mx-auto grid max-w-5xl gap-7 rounded-2xl border border-border bg-card p-5 lg:grid-cols-[320px_1fr] lg:p-8">
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold">{txt.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{txt.desc}</p></div>
      <label className="flex items-center justify-between gap-4 text-sm">
        {txt.color}
        <input type="color" value={color} aria-label={txt.color} onChange={e=>setColor(e.target.value)}
          className="h-10 w-16 cursor-pointer" />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        {txt.background}
        <input type="color" value={background} aria-label={txt.background} onChange={e=>setBackground(e.target.value)}
          className="h-10 w-16 cursor-pointer" />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{txt.style}</legend>
        <div className="flex flex-wrap gap-2">
          {(["square","rounded","dots"] as const).map(x=>
            <button type="button" key={x} onClick={()=>setStyle(x)} aria-pressed={style===x}
              className={`rounded-lg border px-3 py-2 text-sm ${style===x?"border-primary bg-primary/10":"border-border"}`}>
              {txt[x]}
            </button>)}
        </div>
      </fieldset>
      {card.logoUrl && <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={withLogo} onChange={e=>setWithLogo(e.target.checked)} />
        <ImageIcon className="h-4 w-4" />{txt.logo}
      </label>}
      <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{txt.warning}</p>
    </div>
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="w-full max-w-[320px] rounded-2xl border bg-white p-4 shadow-sm">
        <img alt="QR code" className="w-full" width={320} height={320} src={svgToDataUrl(svg)} />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={downloadSvg}><Download className="h-4 w-4" />{txt.downloadSvg}</Button>
        <Button disabled={busy} onClick={()=>{void downloadPng();}}><Download className="h-4 w-4" />{txt.downloadPng}</Button>
        <Button variant="outline" asChild><a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />{txt.link}</a></Button>
      </div>
    </div>
  </section>;
}
