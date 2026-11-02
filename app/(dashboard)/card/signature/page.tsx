import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SignatureClient } from "./client";
import type { CardData } from "@/types";

export const metadata = { title: "توقيع البريد" };

export default async function SignaturePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };

  const raw = await db.card.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (raw.length === 0) redirect("/card");

  const cards = raw.map((c) => ({
    ...c,
    firstName:   c.firstName ?? "",
    lastName:    c.lastName  ?? "",
    customLinks: JSON.parse(c.customLinks as unknown as string || "[]"),
  })) as CardData[];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">توقيع البريد الإلكتروني</h1>
        <p className="text-muted-foreground mt-1">
          انسخ كود HTML مباشرة إلى Outlook أو Gmail أو Apple Mail.
        </p>
      </div>
      <SignatureClient card={cards[0]} allCards={cards} />
    </div>
  );
}
