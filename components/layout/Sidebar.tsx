"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CreditCard, Users, BarChart2,
  Settings, LogOut, Shield, UserCheck, Mail,
  Megaphone, Nfc, Zap, Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { T } from "@/components/i18n/I18nProvider";
import { useI18n } from "@/components/i18n/I18nProvider";

interface NavSection {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; indented?: boolean }[];
}

const sections: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
      { href: "/card",      label: "Meine Karte", icon: CreditCard },
      { href: "/card/signature", label: "Signatur", icon: Mail, indented: true },
    ],
  },
  {
    label: "Wachstum",
    items: [
      { href: "/leads",     label: "Leads",       icon: UserCheck },
      { href: "/campaigns", label: "Kampagnen",   icon: Megaphone },
      { href: "/analytics", label: "Analytics",   icon: BarChart2 },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/team",      label: "Team",          icon: Users },
      { href: "/nfc",       label: "NFC",           icon: Nfc },
      { href: "/widget",    label: "Widget",        icon: Code2 },
      { href: "/settings",  label: "Einstellungen", icon: Settings },
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
  userRole, orgName, appName = "CardNexus", logoUrl, onNavigate, className,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useI18n();

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
        {logoUrl ? (
          <img src={logoUrl} alt={appName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground shrink-0">
            <span className="text-xs font-bold text-background">
              {appName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span className="font-semibold text-sm truncate">{appName}</span>
      </div>

      {/* Org name */}
      {orgName && (
        <div className="px-6 py-3 border-b border-border shrink-0">
          <p className="text-xs text-muted-foreground truncate">{orgName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav aria-label={locale === "ar-SA" ? "التنقل الرئيسي" : locale === "en" ? "Main navigation" : "Hauptnavigation"} className="flex-1 space-y-4 p-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
              <T text={section.label} />
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
                    <T text={label} />
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
          Upgrade
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
            Super Admin
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
          Abmelden
        </button>
      </div>
    </aside>
  );
}

// Backwards-compatible default export name used elsewhere
export const Sidebar = SidebarNav;
