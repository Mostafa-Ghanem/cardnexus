import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { CardData } from "@/types";
import { CardPreview } from "@/components/card/CardPreview";

interface Props { params: Promise<{ slug: string }> }

export default async function PrintPage({ params }: Props) {
  const { slug } = await params;
  const raw = await db.card.findUnique({
    where: { slug },
    include: { user: { select: { name: true, email: true, plan: true } } },
  });

  if (!raw || !raw.isPublic) notFound();

  const card = { ...raw, customLinks: JSON.parse(raw.customLinks) } as CardData;
  const isPro = ["pro", "business"].includes(raw.user?.plan ?? "free");

  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{card.firstName} {card.lastName} – بطاقة أعمال</title>
        <style>{`
          @page {
            size: 85mm 54mm;
            margin: 0;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 16px;
          }
          .card-wrap {
            width: 100%;
            max-width: 384px;
          }
          .no-print { display: flex; gap: 8px; margin-bottom: 16px; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; justify-content: flex-start; }
          }
          button {
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: white;
            cursor: pointer;
            font-size: 14px;
          }
          button.primary {
            background: #0f172a;
            color: white;
            border-color: #0f172a;
          }
        `}</style>
        <link rel="stylesheet" href="/_next/static/css/app/layout.css" />
      </head>
      <body>
        <div className="no-print">
          <button onClick={() => window.print()} className="primary">طباعة / حفظ PDF</button>
          <button onClick={() => window.close()}>إغلاق</button>
        </div>
        <div className="card-wrap">
          <CardPreview card={card} />
        </div>
        {!isPro && (
          <p style={{ marginTop: 12, fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            صُنعت بواسطة منصة بطاقات الأعمال الرقمية
          </p>
        )}
      </body>
    </html>
  );
}
