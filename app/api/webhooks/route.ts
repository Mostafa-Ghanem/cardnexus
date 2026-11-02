import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().refine((u) => u.startsWith("https://"), {
    message: "يجب أن يبدأ الرابط بـ https://",
  }),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://"), { message: "يجب أن يبدأ الرابط بـ https://" })
    .optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const webhooks = await db.webhook.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, url: true, events: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: webhooks });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const count = await db.webhook.count({ where: { userId: session.user.id } });
  if (count >= 10) {
    return NextResponse.json({ error: "الحد الأقصى 10 Webhooks" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const webhook = await db.webhook.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      url: parsed.data.url,
      events: JSON.stringify(parsed.data.events),
      secret: parsed.data.secret ?? null,
    },
  });

  return NextResponse.json({ data: webhook }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, events, ...rest } = parsed.data;

  const existing = await db.webhook.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const webhook = await db.webhook.update({
    where: { id },
    data: {
      ...rest,
      ...(events ? { events: JSON.stringify(events) } : {}),
    },
  });

  return NextResponse.json({ data: webhook });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { id } = await request.json();
  const existing = await db.webhook.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await db.webhook.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
