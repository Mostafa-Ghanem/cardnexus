"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CreditCard, Users, BarChart2,
  Settings, LogOut, Shield, UserCheck, Mail,
  Megaphone, Nfc, Zap, Code2,
} from "lucide-react";
import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

interface NavSection {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; indented?: boolean }[];
}

const sections: NavSection[] = [
  {
    label: "مساحة العمل",
    items: [
      { href: "/dashboard", label: "لوحة التحكم",   icon: LayoutDashboard },
      { href: "/card",      label: "بطاقتي", icon: CreditCard },
      { href: "/card/signature", label: "توقيع البريد", icon: Mail, indented: true },
    ],
  },
  {
    label: "النمو",
    items: [
      { href: "/leads",     label: "العملاء المحتملون",       icon: UserCheck },
      { href: "/campaigns", label: "الحملات",   icon: Megaphone },
      { href: "/analytics", label: "الإحصائيات",   icon: BarChart2 },
    ],
  },
  {
    label: "المؤسسة",
    items: [
      { href: "/team",      label: "الفريق",          icon: Users },
      { href: "/nfc",       label: "NFC",           icon: Nfc },
      { href: "/widget",    label: "تضمين البطاقة",        icon: Code2 },
      { href: "/settings",  label: "الإعدادات", icon: Settings },
    ],
  },
];

interface SidebarProps {
  userRole?: string;
  orgName?: string;
  appName?: string;
  logoUrl?: string | null;
  onNavigate?: () => void; // called after item click — used to close mobile Sheet
  className?: string;
}

export function SidebarNav({
  userRole, orgName, appName = "كارت نكسس", logoUrl, onNavigate, className,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/card") return pathname === "/card";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className={cn("flex h-full w-60 flex-col border-e border-border bg-card", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6 shrink-0">
        <BrandMark name={appName} logoUrl={logoUrl} />
        <span className="font-semibold text-sm truncate">{appName}</span>
      </div>

      {/* Org name */}
      {orgName && (
        <div className="px-6 py-3 border-b border-border shrink-0">
          <p className="text-xs text-muted-foreground truncate">{orgName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav aria-label="القائمة الرئيسية" className="flex-1 space-y-4 p-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, indented }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      indented && "ps-8"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <Link
          href="/upgrade"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/upgrade")
              ? "bg-primary text-primary-foreground"
              : "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
          )}
        >
          <Zap className="h-4 w-4 shrink-0" />
          ترقية الباقة
        </Link>

        {userRole === "super_admin" && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            مدير المنصة
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-3 shrink-0">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// Backwards-compatible default export name used elsewhere
export const Sidebar = SidebarNav;
