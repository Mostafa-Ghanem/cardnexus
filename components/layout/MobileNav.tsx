"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./Sidebar";
import { useI18n } from "@/components/i18n/I18nProvider";

interface Props {
  userRole?: string;
  orgName?: string;
  appName?: string;
  logoUrl?: string | null;
}

export function MobileNav(props: Props) {
  const [open, setOpen] = useState(false);
  const { locale } = useI18n();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent"
        aria-label={locale === "ar-SA" ? "فتح القائمة" : locale === "en" ? "Open navigation" : "Navigation öffnen"}
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side={locale === "ar-SA" ? "right" : "left"} className="p-0 w-72">
        <SheetTitle className="sr-only">{locale === "ar-SA" ? "التنقل الرئيسي" : locale === "en" ? "Main navigation" : "Hauptnavigation"}</SheetTitle>
        <SidebarNav {...props} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
