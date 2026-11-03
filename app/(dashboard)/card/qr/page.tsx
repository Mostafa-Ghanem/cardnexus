import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { QrDesigner } from "@/components/card/QrDesigner";
import type { CardData } from "@/types";

export const metadata = { title: "QR Designer" };

export default async function QrDesignerPage({
  searchParams,
}: { searchParams: Promise<{ card?: string }> }) {
  const session=await auth.api.getSession({headers:await headers()});
  if(!session?.user)redirect("/login");
  const params=await searchParams;
  const raw=params.card
    ? await db.card.findFirst({where:{id:params.card,userId:session.user.id}})
    : await db.card.findFirst({where:{userId:session.user.id},orderBy:[{isDefault:"desc"},{createdAt:"asc"}]});
  if(!raw)notFound();
  const card:CardData={...raw,customLinks:JSON.parse(raw.customLinks||"[]")} as CardData;
  return <QrDesigner card={card} />;
}
