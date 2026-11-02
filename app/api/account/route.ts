import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmailChangeNotification } from "@/lib/email";
import { z } from "zod";

const patchSchema = z.object({
  name:             z.string().min(1).max(100).optional(),
  email:            z.string().email().optional(),
  leadNotification: z.enum(["off", "instant", "daily"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });

  const { name, email, leadNotification } = body.data;
  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates.name = name;

  if (leadNotification !== undefined) {
    updates.leadNotification = leadNotification;
  }

  const oldEmail = session.user.email; // capture before any update

  if (email !== undefined && email !== oldEmail) {
    // Don't reveal whether the email is already taken — return success either way
    // and only update if the address is free. This prevents email enumeration.
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!existing || existing.id === session.user.id) {
      updates.email = email;
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.user.update({ where: { id: session.user.id }, data: updates });
  }

  // Notify the OLD address when email changes — security alert in case the
  // change was not initiated by the account owner.
  if (updates.email && oldEmail) {
    sendEmailChangeNotification({ to: oldEmail, newEmail: updates.email as string }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/account
 * Permanently removes the current user, all their cards, organizations
 * memberships, leads etc. (cascade). DSGVO Art. 17 (Right to erasure).
 */
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role === "super_admin") {
    return NextResponse.json(
      { error: "لا يمكن حذف مدير المنصة. أزل الدور أولًا." },
      { status: 400 }
    );
  }

  await db.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ success: true });
}
