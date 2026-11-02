"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, getRoleLabel } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Sun, Moon } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { useTheme } from "next-themes";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    organizationId?: string;
  };
  cardSlug?: string;
  appName?: string;
  orgName?: string;
  logoUrl?: string | null;
}

export function Header({ user, cardSlug, appName, orgName, logoUrl }: HeaderProps) {
  const tI18n = useI18n().t;
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 lg:px-6">
      {/* Mobile hamburger (lg:hidden inside MobileNav) */}
      <MobileNav
        userRole={user.role}
        orgName={orgName}
        appName={appName}
        logoUrl={logoUrl}
      />

      <div className="flex-1" />

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={tI18n("Theme wechseln")}
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {cardSlug && (
          <Link
            href={`/c/${cardSlug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" /><T text={"Karte ansehen"} /></Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={tI18n("Benutzermenü")}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role ?? "member")}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="w-fit mt-1 text-xs">
                  {getRoleLabel(user.role ?? "member")}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><T text={"Einstellungen"} /></Link>
            </DropdownMenuItem>
            {cardSlug && (
              <DropdownMenuItem asChild>
                <Link href={`/c/${cardSlug}`} target="_blank"><T text={"Karte ansehen"} /></Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive"><T text={"Abmelden"} /></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
