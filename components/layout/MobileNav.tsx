"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./Sidebar";

interface Props {
  userRole?: string;
  orgName?: string;
  appName?: string;
  logoUrl?: string | null;
}

export function MobileNav(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-72">
        <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
        <SidebarNav {...props} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
