import { T } from "@/components/i18n/I18nProvider";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Smartphone, Nfc, ExternalLink, Copy } from "lucide-react";

export const metadata = { title: "NFC-Tag einrichten" };

export default async function NfcPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session!.user as { id: string };

  const card = await db.card.findFirst({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }],
    select: { slug: true },
  });

  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  const cardUrl = card ? `${baseUrl}/c/${card.slug}` : null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold"><T text={"NFC-Tag einrichten"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Mit einem NFC-Tag kannst du deine digitale Karte per Antippen teilen."} /></p>
      </div>

      {cardUrl && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-sm font-medium mb-2"><T text={"Deine Karten-URL (auf NFC-Tag schreiben):"} /></p>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-border px-3 py-2">
            <code className="text-sm flex-1 text-primary font-mono truncate">{cardUrl}</code>
            <a href={cardUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold"><T text={"So geht es"} /></h2>

        <Step n={1} icon={Smartphone} title="NFC-Tag kaufen"><T text={"Kaufe einen beschreibbaren NFC-Tag (NTAG213 oder NTAG215). Empfohlen: NFC-Aufkleber, Visitenkarten-NFC oder NFC-Armband. Preis: ca. 0,50 &ndash; 2,00 &euro; pro Tag."} /></Step>

        <Step n={2} icon={Nfc} title="App installieren"><T text={"Installiere eine NFC-Schreib-App auf deinem Smartphone:"} /><ul className="mt-2 space-y-1 list-disc list-inside text-sm text-muted-foreground">
            <li><strong><T text={"iOS:"} /></strong>{" "}<T text={"NFC Tools (App Store)"} /></li>
            <li><strong><T text={"Android:"} /></strong>{" "}<T text={"NFC Tools oder NFC TagWriter by NXP"} /></li>
          </ul>
        </Step>

        <Step n={3} icon={Copy} title="URL auf den Tag schreiben">
          <ol className="space-y-1 list-decimal list-inside text-sm text-muted-foreground mt-1">
            <li><T text={"App offnen und \"Schreiben\" / \"Write\" auswahlen"} /></li>
            <li><T text={"Datensatz hinzufugen &rarr; URL/URI"} /></li>
            <li><T text={"Deine Karten-URL einfugen (siehe oben)"} /></li>
            <li><T text={"Auf \"Schreiben\" tippen und Tag ans Handy halten"} /></li>
          </ol>
        </Step>

        <Step n={4} icon={Smartphone} title="Testen"><T text={"Halte ein Smartphone (ohne App) an den Tag &mdash; die Karte sollte sich direkt im Browser offnen. iOS ab iPhone 7, Android ab 4.4 unterstuetzt NFC."} /></Step>
      </div>

      <div className="bg-muted rounded-2xl p-5 space-y-2">
        <p className="font-semibold text-sm"><T text={"Empfohlene NFC-Tag Quellen"} /></p>
        <div className="space-y-1">
          {[
            { label: "Amazon: NFC-Tags (NTAG213)", url: "https://www.amazon.de/s?k=nfc+tags+ntag213" },
            { label: "nfctag.de – deutsche Shop", url: "https://www.nfctag.de" },
            { label: "nfcshop.eu", url: "https://www.nfcshop.eu" },
          ].map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step({
  n, icon: Icon, title, children,
}: {
  n: number; icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 bg-card border border-border rounded-xl p-5">
      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
        {n}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="font-semibold text-sm">{title}</p>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
