import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/email";
import { nanoid } from "nanoid";
import { z } from "zod";

const bulkSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  role: z.enum(["company_admin", "team_leader", "member"]).optional().default("member"),
});

async function createInvite(
  email: string,
  role: string,
  orgId: string,
  senderId: string,
  inviteUrlBase: string,
  orgName: string,
  senderName: string
) {
  const existing = await db.invitation.findFirst({
    where: { email, organizationId: orgId, acceptedAt: null },
  });
  if (existing) return { skipped: true };

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.invitation.create({
    data: { email, role, token, expiresAt, organizationId: orgId, senderId },
  });

  const inviteUrl = `${inviteUrlBase}?invite=${token}`;
  sendInvitationEmail({ to: email, senderName, orgName, role, inviteUrl }).catch(() => {});

  return { skipped: false };
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageUsers(role) || !orgId) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });
  if (!org) return NextResponse.json({ error: "المؤسسة غير موجودة" }, { status: 404 });

  const reqHeaders = await headers();
  const host = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host") ?? "localhost:3000";
  const proto = reqHeaders.get("x-forwarded-proto") ?? "http";
  const inviteUrlBase = `${proto}://${host}/register`;

  let emails: string[];
  let inviteRole = "member";
  const errors: string[] = [];

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "لم يتم إرفاق ملف" }, { status: 400 });

    const text = await file.text();
    emails = text
      .split("\n")
      .map((line) => {
        const parts = line.split(",");
        return parts[0].trim();
      })
      .filter((e) => e.includes("@"));

    if (emails.length > 50) {
      return NextResponse.json({ error: "الحد الأقصى 50 دعوة في المرة الواحدة" }, { status: 400 });
    }
  } else {
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    emails = parsed.data.emails;
    inviteRole = parsed.data.role;
  }

  // SECURITY: team_leader may only invite members.
  if (role === "team_leader" && inviteRole !== "member") {
    return NextResponse.json(
      { error: "قائد الفريق يمكنه دعوة الأعضاء فقط" },
      { status: 403 }
    );
  }

  let sent = 0;
  let skipped = 0;

  for (const email of emails) {
    try {
      const result = await createInvite(
        email,
        inviteRole,
        orgId,
        session.user.id,
        inviteUrlBase,
        org.name,
        session.user.name
      );
      if (result.skipped) skipped++;
      else sent++;
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : "حدث خطأ"}`);
    }
  }

  return NextResponse.json({ sent, skipped, errors }, { status: 201 });
}
