import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { effectivePlan, getPlanFeatures } from "@/lib/plans";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { id } = await params;

  // Enforce plan card limit before cloning
  const [source, dbUser, existingCount] = await Promise.all([
    db.card.findFirst({ where: { id, userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, planExpiresAt: true } }),
    db.card.count({ where: { userId: session.user.id } }),
  ]);

  if (!source) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);
  const { maxCards } = getPlanFeatures(plan);
  if (existingCount >= maxCards) {
    return NextResponse.json(
      { error: `باقتك تسمح بحد أقصى ${maxCards} بطاقة.` },
      { status: 403 }
    );
  }

  const base = [source.firstName, source.lastName].filter(Boolean).join("-").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "karte";
  let slug = `${base}-${nanoid(6)}`;
  while (await db.card.findUnique({ where: { slug } })) slug = `${base}-${nanoid(6)}`;

  const omit = new Set(["id", "slug", "createdAt", "updatedAt"]);
  const data = Object.fromEntries(
    Object.entries(source).filter(([k]) => !omit.has(k))
  ) as typeof source;

  const cloned = await db.card.create({
    data: {
      ...data,
      slug,
      name: `${source.name} (نسخة)`,
      isDefault: false,
      totalViews: 0,
    } as Parameters<typeof db.card.create>[0]["data"],
  });

  return NextResponse.json(
    { ...cloned, customLinks: JSON.parse((cloned.customLinks as unknown as string) || "[]") },
    { status: 201 }
  );
}
