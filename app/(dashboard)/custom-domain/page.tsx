import { T } from "@/components/i18n/I18nProvider";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Server, CheckCircle } from "lucide-react";

export const metadata = { title: "Domain einrichten – CardNexus" };

export default async function CustomDomainPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "yourserver.com";
  const appHost = host;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/card" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /><T text={"Zurück zur Karte"} /></Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6" /><T text={"Eigene Domain einrichten"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"So verlinkst du deine eigene Domain mit deiner digitalen Visitenkarte."} /></p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold"><T text={"Domain kaufen oder auswählen"} /></h2>
              <p className="text-sm text-muted-foreground"><T text={"Kaufe eine Domain bei einem Anbieter deiner Wahl (z. B. Namecheap, IONOS, Hetzner, Cloudflare) oder nutze eine vorhandene Subdomain."} /></p>
              <div className="bg-muted rounded-lg p-3 text-sm font-mono"><T text={"Beispiel: karte.meinefirma.de"} /></div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold"><T text={"DNS-Eintrag setzen"} /></h2>
              <p className="text-sm text-muted-foreground"><T text={"Setze im DNS-Verwaltungsbereich deines Domain-Anbieters einen"} /><strong><T text={"CNAME-Eintrag"} /></strong><T text={"auf den Server dieser Plattform:"} /></p>
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm font-mono">
                <div className="grid grid-cols-3 gap-4 text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  <span><T text={"Typ"} /></span><span><T text={"Name"} /></span><span><T text={"Ziel"} /></span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span><T text={"CNAME"} /></span>
                  <span><T text={"karte"} /></span>
                  <span className="break-all">{appHost}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground"><T text={"Für eine Root-Domain (ohne Subdomain) nutze stattdessen einen"} /><strong><T text={"A-Eintrag"} /></strong><T text={"auf die IP-Adresse des Servers."} /></p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold"><T text={"Reverse Proxy konfigurieren"} /></h2>
              <p className="text-sm text-muted-foreground"><T text={"Damit HTTPS funktioniert, muss der Reverse Proxy (z. B. Caddy) die Domain akzeptieren und an CardNexus weiterleiten."} /></p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground"><T text={"Caddy (empfohlen — HTTPS automatisch):"} /></p>
                <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{`karte.meinefirma.de {
    reverse_proxy cardnexus:3000
}`}</pre>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground"><T text={"Nginx:"} /></p>
                <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{`server {
    listen 80;
    server_name karte.meinefirma.de;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">4</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold"><T text={"Domain in den Karteneinstellungen eintragen"} /></h2>
              <p className="text-sm text-muted-foreground"><T text={"Trage deine Domain im Tab"} /><strong><T text={"Design → Karten-Domain"} /></strong><T text={"deines Karteneditors ein. Deine QR-Codes, NFC-Links und Kampagnen-URLs verwenden dann automatisch diese Domain."} /></p>
              <Link href="/card" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <CheckCircle className="h-4 w-4" /><T text={"Zur Karte"} /></Link>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
          <Server className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium"><T text={"Middleware-Routing"} /></p>
            <p className="mt-0.5"><T text={"CardNexus erkennt automatisch Anfragen über deine Domain und leitet sie an die richtige Karte weiter — vorausgesetzt, der Reverse Proxy sendet den korrekten"} />{" "}<code className="font-mono text-xs">Host</code><T text={"-Header."} /></p>
          </div>
        </div>
      </div>
    </div>
  );
}
