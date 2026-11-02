import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Smartphone, Nfc, QrCode, Users, BarChart2,
  ArrowRight, Check, Zap, Mail, FileText,
  Shield, Megaphone, CalendarDays, Download,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { FaqSection } from "./FaqSection";
import { T } from "@/components/i18n/I18nProvider";

const features = [
  { icon: Nfc,          title: "NFC-Ready",           desc: "Kontakt per Antippen teilen – einfach Smartphone halten, fertig." },
  { icon: QrCode,       title: "QR-Code",             desc: "Automatisch generierter QR-Code, immer aktuell." },
  { icon: Smartphone,   title: "Mobile First",         desc: "Lädt in unter einer Sekunde. Kein App-Download nötig." },
  { icon: Users,        title: "Team-Verwaltung",      desc: "Ganze Teams zentral verwalten – Rollen, Abteilungen, Branding." },
  { icon: BarChart2,    title: "Analytics",            desc: "Aufrufe, Scans und Downloads in Echtzeit im Blick." },
  { icon: Megaphone,    title: "Kampagnen-Tracking",   desc: "UTM-Links für Messen und Events mit eigener Klick-Statistik." },
  { icon: Mail,         title: "E-Mail-Signatur",      desc: "Professionelle Signatur für Gmail, Outlook und Apple Mail." },
  { icon: CalendarDays, title: "Terminbuchung",        desc: "Direkt buchbar per Calendly, Cal.com oder eigenem Link." },
  { icon: Download,     title: "PDF / Print-Export",   desc: "Karte als PDF exportieren oder druckfertig aufbereiten." },
  { icon: FileText,     title: "Lead Capture",         desc: "Besucher hinterlassen Kontaktdaten – direkt im Dashboard." },
  { icon: Shield,       title: "Datenschutz (DSGVO)",  desc: "Server in Deutschland. Keine Tracker. Vollständig DSGVO-konform." },
  { icon: Zap,          title: "Whitelabel",           desc: "Eigene Domain, eigenes Branding – ohne CardNexus-Badge." },
];

const steps = [
  { n: 1, title: "Account erstellen",       desc: "Registriere dich kostenlos in weniger als 60 Sekunden." },
  { n: 2, title: "Karte gestalten",         desc: "Wähle ein Template, füge deine Daten ein und passe Farben an." },
  { n: 3, title: "Teilen & Vernetzen",      desc: "Link verschicken, QR-Code scannen lassen oder NFC-Tag beschreiben." },
];

const planList = [PLANS.free, PLANS.pro, PLANS.business];

const PLAN_FEATURES: Record<string, string[]> = {
  free:     ["1 digitale Visitenkarte", "QR-Code & vCard-Download", "Lead Capture", "4 Templates", `Bis zu ${PLANS.free.features.maxCustomLinks} eigene Links`, `Analytics (${PLANS.free.features.analyticsRetention} Tage)`],
  pro:      ["Alle 9 Templates", "Whitelabel (kein Badge)", "Eigene Domain", "PDF & Print-Export", "Kampagnen-Tracking", "Terminbuchungs-Link", "Meilenstein-Benachrichtigungen", `Analytics (${PLANS.pro.features.analyticsRetention} Tage)`],
  business: ["Alles aus Pro", "Team & Abteilungsverwaltung", "Bulk CSV-Import", "Organisations-Vorlage", "Team-Verzeichnis", `Analytics (${PLANS.business.features.analyticsRetention} Tage)`],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-gray-900 dark:text-gray-100">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                <span className="text-xs font-bold text-white"><T text={"CN"} /></span>
              </div>
              <span className="font-semibold"><T text={"CardNexus"} /></span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#features" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"><T text={"Features"} /></a>
              <a href="#how"      className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"><T text={"So funktioniert es"} /></a>
              <a href="#pricing"  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"><T text={"Preise"} /></a>
              <a href="#faq"      className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"><T text={"FAQ"} /></a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden sm:block"><T text={"Anmelden"} /></Link>
              <Button asChild size="sm">
                <Link href="/register"><T text={"Kostenlos starten"} /></Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <Zap className="h-3.5 w-3.5 text-amber-500" /><T text={"Digitale Visitenkarte der nächsten Generation"} /></div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6"><T text={"Deine Karte."} /><br />
          <span className="text-gray-400"><T text={"In Sekunden geteilt."} /></span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed"><T text={"Erstelle deine digitale Visitenkarte, teile sie per NFC, QR-Code oder Link – und behalte den Überblick mit Analytics, Lead Capture und Team-Verwaltung."} /></p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register"><T text={"Jetzt kostenlos starten"} /><ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/c/demo"><T text={"Live-Demo ansehen"} /></Link>
          </Button>
        </div>

        {/* Mock card */}
        <div className="mt-20 relative max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-gray-900" />
            <div className="p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg shrink-0"><T text={"MH"} /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900"><T text={"Max Hoffmann"} /></h3>
                  <p className="text-sm font-medium text-gray-500"><T text={"Head of Product"} /></p>
                  <p className="text-sm text-gray-400"><T text={"TechCorp GmbH"} /></p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {["+49 170 1234567", "max@techcorp.de", "techcorp.de"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                    </div>
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="bg-gray-50 dark:bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3"><T text={"So funktioniert es"} /></h2>
            <p className="text-gray-500 dark:text-gray-400"><T text={"In drei Schritten zur fertigen Karte."} /></p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">{n}</div>
                <h3 className="font-semibold text-lg mb-2"><T text={title} /></h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed"><T text={desc} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3"><T text={"Alles was du brauchst"} /></h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto"><T text={"Von der persönlichen Karte bis zur unternehmensweiten Lösung."} /></p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1"><T text={title} /></h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"><T text={desc} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 dark:bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3"><T text={"Einfache Preise"} /></h2>
            <p className="text-gray-500 dark:text-gray-400"><T text={"Kein Kleingedrucktes. Jederzeit kündbar."} /></p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {planList.map((plan) => {
              const featured = plan.id === "pro";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 border-2 flex flex-col ${
                    featured ? "border-gray-900 bg-gray-900 text-white" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"
                  }`}
                >
                  {featured && (
                    <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full self-start mb-3"><T text={"Empfohlen"} /></span>
                  )}
                  <p className={`text-sm font-medium mb-1 ${featured ? "opacity-60" : "text-gray-500"}`}><T text={plan.description} /></p>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">€{plan.monthlyPrice}</span>
                    <span className={`text-sm ${featured ? "opacity-60" : "text-gray-400"}`}>/Monat</span>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {(PLAN_FEATURES[plan.id] ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${featured ? "text-white" : "text-emerald-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={featured ? "secondary" : "default"} className="w-full">
                    <Link href="/register">{plan.id === "free" ? "Kostenlos starten" : `${plan.name} testen`}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8"><T text={"Alle Pläne inkl. DSGVO-konformer Datenspeicherung in Deutschland."} /></p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3"><T text={"Häufige Fragen"} /></h2>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-bold mb-4"><T text={"Bereit loszulegen?"} /></h2>
          <p className="text-gray-400 mb-8"><T text={"Kostenlos starten – keine Kreditkarte erforderlich."} /></p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register"><T text={"Jetzt kostenlos registrieren"} /><ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-gray-900">
                  <span className="text-[10px] font-bold text-white"><T text={"CN"} /></span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100"><T text={"CardNexus"} /></span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed"><T text={"Die smarte digitale Visitenkarte für Professionals und Teams."} /></p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300"><T text={"Produkt"} /></p>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li><a href="#features"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"><T text={"Features"} /></a></li>
                <li><a href="#pricing"   className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"><T text={"Preise"} /></a></li>
                <li><Link href="/c/demo" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"><T text={"Demo"} /></Link></li>
                <li><Link href="/login"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"><T text={"Anmelden"} /></Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300"><T text={"Rechtliches"} /></p>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li><Link href="/impressum"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"><T text={"Impressum"} /></Link></li>
                <li><Link href="/datenschutz" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"><T text={"Datenschutz"} /></Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400 dark:text-gray-500">
            <p><T text={"&copy;"} />{" "}{new Date().getFullYear()}{" "}<T text={"CardNexus. Alle Rechte vorbehalten."} /></p>
            <p><T text={"Made in Germany 🇩🇪"} /></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
