import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateSettingsCache } from "@/lib/platform";
import { z } from "zod";

const schema = z.object({
  appName: z.string().min(1).optional(),
  appUrl: z.string().url().optional(),
  faviconUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  supportEmail: z.string().email().nullable().optional(),
  footerText: z.string().nullable().optional(),
  allowedDomains: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "super_admin") {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const settings = await db.platformSettings.upsert({
    where: { id: "main" },
    create: { id: "main" },
    update: {},
  });

  return NextResponse.json({ data: settings });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "super_admin") {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "البيانات غير صحيحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const settings = await db.platformSettings.upsert({
    where: { id: "main" },
    create: { id: "main", ...parsed.data },
    update: parsed.data,
  });

  invalidateSettingsCache();

  return NextResponse.json({ data: settings });
}
