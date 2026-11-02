import { T } from "@/components/i18n/I18nProvider";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminCardEditClient } from "./client";
import type { CardData } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `Karte bearbeiten: ${slug}` };
}

export default async function AdminCardEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const raw = await db.card.findUnique({
    where: { slug },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!raw) notFound();

  const card = {
    ...raw,
    customLinks: JSON.parse(raw.customLinks),
  } as CardData & { user: { id: string; name: string; email: string } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/admin/cards">
              <ArrowLeft className="h-3.5 w-3.5" /><T text={"Alle Karten"} /></Link>
          </Button>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/c/${slug}`} target="_blank">
            <ExternalLink className="h-3.5 w-3.5" /><T text={"Karte ansehen"} /></Link>
        </Button>
      </div>

      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold"><T text={"Karte bearbeiten"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Inhaber:"} />{" "}
          <span className="font-medium text-foreground">{card.user.name}</span>
          {" · "}
          <span className="text-sm">{card.user.email}</span>
          {" · "}
          <span className="font-mono text-sm">/c/{slug}</span>
        </p>
      </div>

      <AdminCardEditClient card={card} />
    </div>
  );
}
