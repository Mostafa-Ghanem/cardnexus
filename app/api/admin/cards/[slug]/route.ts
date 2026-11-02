import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Shared auth guard – super_admin only
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { id: string; role?: string } | undefined;
  if (!session || user?.role !== "super_admin") return null;
  return user;
}

// Same schema as the regular cards PATCH route
const urlOrPath = z.string().refine(
  (v) => !v || v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://"),
  "مسار غير صالح"
);

const updateSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: urlOrPath.optional().nullable(),
  coverUrl: urlOrPath.optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  xing: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  customLinks: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
  templateId: z.enum(["classic", "modern", "minimal", "dark", "bold", "glass", "retro", "neon", "corporate"]).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  fontFamily: z.enum(["inter", "serif", "mono", "display"]).optional(),
  layoutStyle: z.enum(["standard", "centered", "compact"]).optional(),
  roundedStyle: z.enum(["default", "sharp", "pill"]).optional(),
  showQrOnCard: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  shadowStyle: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  socialStyle: z.enum(["icons", "outline", "minimal"]).optional(),
  avatarBorder: z.enum(["none", "ring", "glow"]).optional(),
  cardBackground: z.enum(["white", "tinted", "gradient"]).optional(),
  logoUrl: urlOrPath.optional().nullable(),
});

function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v])
  ) as T;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { slug } = await params;
  const card = await db.card.findUnique({
    where: { slug },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!card) return NextResponse.json({ error: "البطاقة غير موجودة" }, { status: 404 });

  return NextResponse.json({
    data: { ...card, customLinks: JSON.parse(card.customLinks) },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { slug } = await params;

  const body = emptyToNull(await req.json());
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "البيانات غير صحيحة";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { customLinks, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (customLinks !== undefined) updateData.customLinks = JSON.stringify(customLinks);

  try {
    const card = await db.card.update({
      where: { slug },
      data: updateData,
    });
    return NextResponse.json({
      data: { ...card, customLinks: JSON.parse(card.customLinks) },
    });
  } catch {
    return NextResponse.json({ error: "البطاقة غير موجودة" }, { status: 404 });
  }
}
