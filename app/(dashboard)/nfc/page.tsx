import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Smartphone, Nfc, ExternalLink, Copy } from "lucide-react";

export const metadata = { title: "إعداد بطاقة NFC" };

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
        <h1 className="text-2xl font-bold">إعداد بطاقة NFC</h1>
        <p className="text-muted-foreground mt-1">
          ببطاقة أو ملصق NFC تقدر تشارك بطاقتك الرقمية بلمسة واحدة.
        </p>
      </div>

      {cardUrl && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-sm font-medium mb-2">رابط بطاقتك (اكتبه على شريحة NFC):</p>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-border px-3 py-2">
            <code className="text-sm flex-1 text-primary font-mono truncate">{cardUrl}</code>
            <a href={cardUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">الخطوات</h2>

        <Step n={1} icon={Smartphone} title="اشترِ شريحة NFC">
          اشترِ شريحة NFC قابلة للكتابة (NTAG213 أو NTAG215).
          يُنصح بملصق NFC أو بطاقة أعمال NFC أو سوار NFC.
          Preis: ca. 0,50 &ndash; 2,00 &euro; pro Tag.
        </Step>

        <Step n={2} icon={Nfc} title="ثبّت التطبيق">
          ثبّت تطبيقًا لكتابة NFC على جوالك:
          <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-muted-foreground">
            <li><strong>iOS:</strong> NFC Tools (App Store)</li>
            <li><strong>Android:</strong> NFC Tools أو NFC TagWriter by NXP</li>
          </ul>
        </Step>

        <Step n={3} icon={Copy} title="اكتب الرابط على الشريحة">
          <ol className="space-y-1 list-decimal list-inside text-sm text-muted-foreground mt-1">
            <li>افتح التطبيق واختر &quot;Write&quot; (كتابة)</li>
            <li>أضف سجلًا &larr; URL/URI</li>
            <li>الصق رابط بطاقتك (بالأعلى)</li>
            <li>اضغط &quot;Write&quot; وقرّب الشريحة من الجوال</li>
          </ol>
        </Step>

        <Step n={4} icon={Smartphone} title="جرّب">
          قرّب أي جوال (بدون تطبيق) من الشريحة &mdash;
          يجب أن تفتح البطاقة مباشرة في المتصفح.
          يدعم NFC من iPhone 7 فما بعد ومعظم أجهزة Android.
        </Step>
      </div>

      <div className="bg-muted rounded-2xl p-5 space-y-2">
        <p className="font-semibold text-sm">أين تشتري شرائح NFC</p>
        <div className="space-y-1">
          {[
            { label: "Amazon: شرائح NFC (NTAG213)", url: "https://www.amazon.com/s?k=nfc+tags+ntag213" },
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
