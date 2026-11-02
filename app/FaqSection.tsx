"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "هل الخدمة مجانية فعلًا؟",
    a: "نعم. الباقة المجانية دائمة وتشمل بطاقة رقمية كاملة مع رمز QR وتنزيل جهة الاتصال (vCard) وجمع بيانات العملاء المحتملين، بدون بطاقة ائتمان.",
  },
  {
    q: "هل أحتاج تطبيقًا لمشاركة بطاقتي؟",
    a: "لا. بطاقتك صفحة ويب عادية تفتح على أي متصفح، والزائر لا يحتاج أي تطبيق. لبطاقات NFC تحتاج تطبيق كتابة مرة واحدة فقط، وبعدها تعمل بدون أي شيء.",
  },
  {
    q: "كيف تعمل بطاقة NFC؟",
    a: "تكتب رابط بطاقتك مرة واحدة على ملصق أو بطاقة NFC رخيصة. عندما يقرّب أحد جواله منها تفتح بطاقتك الرقمية فورًا، على iPhone 7 وما بعده وعلى معظم أجهزة Android.",
  },
  {
    q: "هل أقدر أستخدم المنصة لفريق عملي؟",
    a: "نعم. باقة Business تتيح لك إدارة عدد غير محدود من الأعضاء، وتوزيع الأدوار، والاستيراد من ملف CSV، وتوحيد تصميم البطاقات لكل الشركة.",
  },
  {
    q: "ماذا يحدث عند انتهاء اشتراكي؟",
    a: "يتحول حسابك إلى الباقة المجانية. تبقى بطاقتك تعمل، لكن مزايا Pro وBusiness مثل إزالة الشارة والحملات تتوقف حتى تجدد الاشتراك.",
  },
  {
    q: "كيف ألغي الاشتراك؟",
    a: "راسلنا بالبريد في أي وقت. لا توجد مدة التزام، وتقدر تلغي شهريًا.",
  },
  {
    q: "هل بياناتي وبيانات عملائي آمنة؟",
    a: "نعم. الاتصال مشفّر بالكامل، ولا نستخدم ملفات تتبع إعلانية من أطراف خارجية، ولا نبيع أو نشارك بياناتك أو بيانات عملائك مع أي جهة.",
  },
  {
    q: "هل أقدر أستخدم دومين خاص؟",
    a: "نعم، بدءًا من باقة Pro. تقدر تخلي بطاقتك تفتح على دومينك الخاص (مثل card.yourcompany.com).",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 pe-4">{faq.q}</span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
