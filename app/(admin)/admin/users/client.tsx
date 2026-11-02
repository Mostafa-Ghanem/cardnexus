"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useState, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, getRoleLabel, formatDate } from "@/lib/utils";
import { Search, Pencil, CalendarDays, X, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  super_admin: "default",
  company_admin: "warning",
  team_leader: "secondary",
  member: "outline",
};

const PLAN_VARIANT: Record<string, string> = {
  free:     "bg-gray-100 text-gray-600",
  pro:      "bg-blue-100 text-blue-700",
  business: "bg-amber-100 text-amber-700",
};

interface AdminUser {
  id: string; name: string; email: string; image?: string | null;
  role: string; plan: string; planExpiresAt?: string | null; createdAt: string;
  bannedAt?: string | null;
  cards?: { slug: string; isPublic: boolean }[] | null;
  organization?: { id: string; name: string } | null;
}

interface OrgOption { id: string; name: string }

export function AdminUsersClient({
  users: initial, orgs, currentUserId, initialSearch = "",
}: {
  users: AdminUser[];
  orgs: OrgOption[];
  currentUserId: string;
  initialSearch?: string;
}) {
  const tI18n = useI18n().t;
  const router   = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [users, setUsers] = useState(initial);
  const [expiryEdit, setExpiryEdit] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search navigates to the server — the page re-renders with DB-filtered results.
  const handleSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }, [pathname, router, searchParams]);

  const filtered = users; // filtering is done server-side

  async function patch(userId: string, data: Record<string, unknown>) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });
    return res.ok;
  }

  async function changeRole(userId: string, role: string) {
    if (!await patch(userId, { role })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  async function changePlan(userId: string, plan: string) {
    if (!await patch(userId, { plan, planExpiresAt: null })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan, planExpiresAt: null } : u)));
  }

  async function changeOrg(userId: string, orgId: string) {
    const organizationId = orgId === "__none__" ? null : orgId;
    if (!await patch(userId, { organizationId })) return;
    const org = orgs.find((o) => o.id === orgId) ?? null;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, organization: org } : u)));
  }

  async function setExpiry(userId: string, dateStr: string) {
    const planExpiresAt = dateStr ? new Date(dateStr).toISOString() : null;
    if (!await patch(userId, { planExpiresAt })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, planExpiresAt } : u)));
    setExpiryEdit(null);
  }

  async function banUser(userId: string) {
    const bannedAt = new Date().toISOString();
    if (!await patch(userId, { bannedAt })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, bannedAt } : u)));
  }

  async function unbanUser(userId: string) {
    if (!await patch(userId, { bannedAt: null })) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, bannedAt: null } : u)));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingDelete.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
        toast.success("Benutzer gelöscht");
      } else {
        toast.error(`Fehler: ${json.error ?? res.status}`);
      }
    } catch (e) {
      toast.error(`Netzwerkfehler: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <>
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tI18n("Suchen…")}
          defaultValue={initialSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border overflow-x-auto bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border !bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground"><T text={"Benutzer"} /></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell"><T text={"Organisation"} /></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground"><T text={"Rolle"} /></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground"><T text={"Plan"} /></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell"><T text={"Karte"} /></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell"><T text={"Seit"} /></th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"><T text={"Aktionen"} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:!bg-muted/20">
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium flex items-center gap-1.5">
                        {user.name}
                        {user.id === currentUserId && <span className="text-muted-foreground text-xs"><T text={"(Ich)"} /></span>}
                        {user.bannedAt && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium"><T text={"Gesperrt"} /></span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Org */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <Select value={user.organization?.id ?? "__none__"} onValueChange={(v) => changeOrg(user.id, v)}>
                    <SelectTrigger className="h-7 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__"><T text={"— Keine —"} /></SelectItem>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Role */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)}>
                    <SelectTrigger className="h-7 w-auto min-w-[7rem] max-w-[10rem] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin"><T text={"Super Admin"} /></SelectItem>
                      <SelectItem value="company_admin"><T text={"Admin"} /></SelectItem>
                      <SelectItem value="team_leader"><T text={"Team Leader"} /></SelectItem>
                      <SelectItem value="member"><T text={"Mitglied"} /></SelectItem>
                    </SelectContent>
                  </Select>
                </td>

                {/* Plan */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Select value={user.plan} onValueChange={(v) => changePlan(user.id, v)}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${PLAN_VARIANT[user.plan]?.split(" ")[0] ?? "bg-gray-400"}`} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free"><T text={"Free"} /></SelectItem>
                        <SelectItem value="pro"><T text={"Pro"} /></SelectItem>
                        <SelectItem value="business"><T text={"Business"} /></SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Expiry */}
                    {user.plan !== "free" && (
                      expiryEdit === user.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            className="h-7 text-xs border border-border rounded px-1.5 bg-background"
                            defaultValue={user.planExpiresAt ? user.planExpiresAt.split("T")[0] : ""}
                            onBlur={(e) => setExpiry(user.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setExpiry(user.id, (e.target as HTMLInputElement).value);
                              if (e.key === "Escape") setExpiryEdit(null);
                            }}
                            autoFocus
                          />
                          <button onClick={() => setExpiryEdit(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpiryEdit(user.id)}
                          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          title={tI18n("Ablaufdatum setzen")}
                        >
                          <CalendarDays className="h-3 w-3" />
                          {user.planExpiresAt
                            ? new Date(user.planExpiresAt).toLocaleDateString("de-DE")
                            : <span className="opacity-50">&#8734;</span>}
                        </button>
                      )
                    )}
                  </div>
                </td>

                {/* Card */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  {user.cards?.[0] ? (
                    <div className="flex items-center gap-2">
                      <a href={`/c/${user.cards[0].slug}`} target="_blank" className="text-xs text-primary hover:underline">
                        {user.cards[0].slug}
                      </a>
                      <Link href={`/admin/cards/${user.cards[0].slug}`} className="text-muted-foreground hover:text-foreground" title={tI18n("Karte bearbeiten")}>
                        <Pencil className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : <span className="text-muted-foreground text-xs">—</span>}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell whitespace-nowrap">
                  {formatDate(user.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {user.id !== currentUserId && (
                    <div className="flex items-center justify-end gap-1">
                      {user.bannedAt ? (
                        <button
                          onClick={() => unbanUser(user.id)}
                          title={tI18n("Entsperren")}
                          className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => banUser(user.id)}
                          title={tI18n("Sperren")}
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          <ShieldOff className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setPendingDelete({ id: user.id, name: user.name })}
                        title={tI18n("Löschen")}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle><T text={"Benutzer löschen"} /></AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{pendingDelete?.name}</strong><T text={"wird unwiderruflich gelöscht — inklusive aller Karten, Analytics und Leads. Diese Aktion kann nicht rückgängig gemacht werden."} /></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}><T text={"Abbrechen"} /></AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? "Wird gelöscht…" : "Endgültig löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
