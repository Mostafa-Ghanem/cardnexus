import { getPlatformSettings } from "@/lib/platform";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Mail, Globe, Phone } from "lucide-react";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgSlug } = await params;
  const org = await db.organization.findUnique({ where: { slug: orgSlug }, select: { name: true } });
  if (!org) return { title: "الفريق غير موجود" };
  return { title: `فريق ${org.name}`, description: `بطاقات الأعمال الرقمية لفريق ${org.name}` };
}

export default async function PublicTeamPage({ params }: Props) {
  const { orgSlug } = await params;

  const [org, orgUsers] = await Promise.all([
    db.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true, slug: true, logo: true, primaryColor: true },
    }),
    db.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        settings: { select: { teamDirectoryEnabled: true } },
        users: {
          select: {
            id: true, name: true,
            cards: {
              where: { isPublic: true, showInTeamDirectory: true, isDefault: true },
              select: {
                slug: true, firstName: true, lastName: true, title: true,
                department: true, avatarUrl: true, email: true, phone: true,
                website: true, address: true, primaryColor: true,
              },
              take: 1,
            },
          },
          orderBy: { name: "asc" },
        },
      },
    }),
  ]);

  if (!org) notFound();

  // Directory disabled by org admin → 404
  if (orgUsers?.settings && orgUsers.settings.teamDirectoryEnabled === false) notFound();

  // Only show members who have a public card and opted in
  const members = (orgUsers?.users ?? [])
    .filter((u) => u.cards.length > 0)
    .map((u) => ({ ...u.cards[0]! }));

  const color = org.primaryColor ?? "#0F172A";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="w-full" style={{ backgroundColor: color }}>
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center text-white">
          {org.logo && (
            <img
              src={org.logo}
              alt={org.name}
              className="h-16 w-16 rounded-2xl object-cover mb-4 shadow-lg"
            />
          )}
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <p className="text-white/70 mt-2">
            {members.length} {members.length === 1 ? "عضو" : "أعضاء"}
          </p>
        </div>
      </div>

      {/* Members grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {members.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">لا توجد بطاقات عامة بعد.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <MemberCard key={member.slug} member={member} orgColor={color} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-gray-400">
          صُنعت بواسطة{" "}
          <a href="/" className="hover:text-gray-600 transition-colors font-medium">{(await getPlatformSettings()).appName}</a>
        </p>
      </div>
    </div>
  );
}

function MemberCard({
  member,
  orgColor,
}: {
  member: {
    slug: string; firstName?: string | null; lastName?: string | null;
    title?: string | null; department?: string | null; avatarUrl?: string | null;
    email?: string | null; phone?: string | null; website?: string | null;
    address?: string | null; primaryColor: string;
  };
  orgColor: string;
}) {
  const color = member.primaryColor ?? orgColor;
  const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`;

  return (
    <Link
      href={`/c/${member.slug}`}
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Color bar */}
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div
            className="h-14 w-14 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: color }}
          >
            {member.avatarUrl
              ? <img src={member.avatarUrl} alt={name} className="h-full w-full object-cover" />
              : initials}
          </div>

          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">
              {name || "بدون اسم"}
            </p>
            {member.title && (
              <p className="text-xs font-medium mt-0.5 truncate" style={{ color }}>
                {member.title}
              </p>
            )}
            {member.department && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{member.department}</p>
            )}
          </div>
        </div>

        {/* Contact snippets */}
        <div className="space-y-1">
          {member.email && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{member.phone}</span>
            </div>
          )}
          {member.website && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{member.website.replace(/^https?:\/\//, "")}</span>
            </div>
          )}
          {member.address && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{member.address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <span className="text-xs font-medium text-primary group-hover:underline">
          عرض البطاقة ←
        </span>
      </div>
    </Link>
  );
}
