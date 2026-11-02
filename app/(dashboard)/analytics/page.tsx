import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { PageHeader } from "@/components/layout/PageHeader";
import { canManageOrganization } from "@/lib/utils";
import Link from "next/link";
import { Users } from "lucide-react";

export const metadata = { title: "الإحصائيات" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ cardId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; role?: string; organizationId?: string };
  const { cardId } = await searchParams;

  const cards = await db.card.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true },
  });

  const validCardId = cardId && cards.some((c) => c.id === cardId) ? cardId : undefined;
  const isOrgAdmin = canManageOrganization(user.role ?? "member") && !!user.organizationId;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="الإحصائيات"
          description="كيف يتفاعل الناس مع بطاقتك؟"
        />
        {isOrgAdmin && (
          <Link
            href="/analytics/org"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          >
            <Users className="h-4 w-4" />
            إحصائيات الفريق
          </Link>
        )}
      </div>
      <AnalyticsOverview cards={cards} initialCardId={validCardId} />
    </div>
  );
}
