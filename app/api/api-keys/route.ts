import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1).max(100) });

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: keys });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const count = await db.apiKey.count({ where: { userId: session.user.id } });
  if (count >= 10) {
    return NextResponse.json({ error: "الحد الأقصى 10 مفاتيح API" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rawKey = "fk_" + randomBytes(24).toString("hex");
  const prefix = rawKey.slice(0, 12);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await db.apiKey.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      keyHash,
      prefix,
    },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });

  // Return full key only once
  return NextResponse.json({ data: { ...apiKey, key: rawKey } }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { id } = await request.json();
  const existing = await db.apiKey.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await db.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
