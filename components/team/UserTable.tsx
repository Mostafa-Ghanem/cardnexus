"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, getRoleLabel, formatDate } from "@/lib/utils";
import type { Role } from "@/types";
import { MoreHorizontal, ExternalLink, Trash2 } from "lucide-react";

interface TableUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  createdAt: string | Date;
  card?: { slug: string; isPublic: boolean } | null;
}

interface UserTableProps {
  users: TableUser[];
  currentUserId: string;
  currentUserRole: string;
  onRoleChange: (userId: string, role: Role) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  super_admin: "default",
  company_admin: "warning",
  team_leader: "secondary",
  member: "outline",
};

export function UserTable({ users, currentUserId, currentUserRole, onRoleChange, onDelete }: UserTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: string) {
    setLoadingId(userId);
    try {
      await onRoleChange(userId, role as Role);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Benutzer wirklich löschen?")) return;
    setLoadingId(userId);
    try {
      await onDelete(userId);
    } finally {
      setLoadingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm"><T text={"Keine Benutzer gefunden"} /></p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground"><T text={"Benutzer"} /></th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell"><T text={"Rolle"} /></th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell"><T text={"Karte"} /></th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell"><T text={"Seit"} /></th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="text-xs text-muted-foreground"><T text={"(Ich)"} /></span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {currentUserRole === "super_admin" || currentUserRole === "company_admin" ? (
                  <Select
                    value={user.role}
                    onValueChange={(v) => handleRoleChange(user.id, v)}
                    disabled={loadingId === user.id || user.id === currentUserId}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUserRole === "super_admin" && (
                        <SelectItem value="company_admin"><T text={"Admin"} /></SelectItem>
                      )}
                      <SelectItem value="team_leader"><T text={"Team Leader"} /></SelectItem>
                      <SelectItem value="member"><T text={"Mitglied"} /></SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={roleBadgeVariant[user.role] ?? "outline"}>
                    {getRoleLabel(user.role)}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                {user.card ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="success"><T text={"Aktiv"} /></Badge>
                    <a href={`/c/${user.card.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <Badge variant="outline"><T text={"Keine Karte"} /></Badge>
                )}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-4 py-3">
                {user.id !== currentUserId && (currentUserRole === "super_admin" || currentUserRole === "company_admin") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.card && (
                        <DropdownMenuItem asChild>
                          <a href={`/c/${user.card.slug}`} target="_blank"><T text={"Karte ansehen"} /></a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /><T text={"Löschen"} /></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
