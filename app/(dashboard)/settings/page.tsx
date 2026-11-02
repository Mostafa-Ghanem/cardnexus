import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClientPage } from "./client";

export const metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as {
    id: string; name: string; email: string;
    role?: string; organizationId?: string;
  };

  const [dbUser, org] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true, leadNotification: true },
    }),
    user.organizationId
      ? db.organization.findUnique({
          where: { id: user.organizationId },
          include: { settings: true },
        })
      : null,
  ]);

  return (
    <SettingsClientPage
      user={{
        ...user,
        role: user.role ?? "member",
        twoFactorEnabled: dbUser?.twoFactorEnabled ?? false,
        leadNotification: dbUser?.leadNotification ?? "off",
      }}
      org={org ? { ...org, settings: org.settings } : null}
    />
  );
}
