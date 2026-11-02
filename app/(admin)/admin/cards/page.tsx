import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { Pencil, Eye, Globe, EyeOff } from "lucide-react";

export const metadata = { title: "إدارة البطاقات" };

export default async function AdminCardsPage() {
  const cards = await db.card.findMany({
    include: {
      user: { select: { name: true, email: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">كل البطاقات</h1>
        <p className="text-muted-foreground mt-1">{cards.length} بطاقة على المنصة</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-start px-4 py-3 font-medium text-muted-foreground">المالك</th>
              <th className="text-start px-4 py-3 font-medium text-muted-foreground">الرابط</th>
              <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">القالب</th>
              <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">الزيارات</th>
              <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">آخر تعديل</th>
              <th className="text-start px-4 py-3 font-medium text-muted-foreground">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={card.user.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(card.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium leading-tight">{card.user.name}</p>
                      <p className="text-xs text-muted-foreground">{card.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-mono text-xs">{card.slug}</p>
                    {card.firstName && (
                      <p className="text-xs text-muted-foreground">
                        {card.firstName} {card.lastName}
                        {card.title ? ` · ${card.title}` : ""}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Badge variant="outline" className="capitalize text-xs">
                    {card.templateId}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {card.totalViews.toLocaleString("ar-u-nu-latn")}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                  {formatDate(card.updatedAt.toISOString())}
                </td>
                <td className="px-4 py-3">
                  {card.isPublic ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Globe className="h-3 w-3" /> عامة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <EyeOff className="h-3 w-3" /> خاصة
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="عرض البطاقة">
                      <Link href={`/c/${card.slug}`} target="_blank">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-7 gap-1 text-xs">
                      <Link href={`/admin/cards/${card.slug}`}>
                        <Pencil className="h-3 w-3" />
                        تعديل
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cards.length === 0 && (
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
            لا توجد بطاقات بعد.
          </div>
        )}
      </div>
    </div>
  );
}
