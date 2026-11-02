"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserTable } from "@/components/team/UserTable";
import { InviteModal } from "@/components/team/InviteModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/types";
import {
  Search, X, Globe, Eye, EyeOff, ExternalLink, ToggleLeft, ToggleRight,
  Clock, CheckCircle, XCircle, Upload,
} from "lucide-react";

interface Member {
  id: string; name: string; email: string; image?: string | null;
  role: string; createdAt: string;
  card?: { slug: string; isPublic: boolean; showInTeamDirectory: boolean } | null;
}

interface PendingCard {
  id: string; slug: string; name: string; approvalNote?: string | null; updatedAt: string;
  user: { name: string; email: string };
}

interface Props {
  users: Member[];
  invitations: Array<{
    id: string; email: string; role: string;
    createdAt: string; expiresAt: string;
    sender: { name: string };
  }>;
  currentUserId: string;
  currentUserRole: string;
  orgName?: string;
  orgSlug?: string;
  memberCount: number;
  canManage: boolean;
  teamDirectoryEnabled: boolean;
  pendingCards?: PendingCard[];
  canImport?: boolean;
}

export function TeamClientPage({
  users: initialUsers, invitations: initialInvitations,
  currentUserId, currentUserRole, orgName, orgSlug,
  memberCount, canManage, teamDirectoryEnabled: initialDirEnabled,
  pendingCards: initialPendingCards = [],
  canImport = false,
}: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [pendingCards, setPendingCards] = useState(initialPendingCards);
  const [search, setSearch] = useState("");
  const [dirEnabled, setDirEnabled] = useState(initialDirEnabled);
  const [togglingDir, setTogglingDir] = useState(false);
  const [togglingMember, setTogglingMember] = useState<string | null>(null);
  const [approvingCard, setApprovingCard] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  async function approveCard(slug: string, status: "approved" | "rejected") {
    setApprovingCard(slug);
    try {
      const res = await fetch(`/api/cards/${slug}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: rejectNote[slug] || undefined }),
      });
      if (res.ok) {
        setPendingCards((prev) => prev.filter((c) => c.slug !== slug));
        router.refresh();
      }
    } finally {
      setApprovingCard(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = useCallback(async (userId: string, role: Role) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }, []);

  const handleDelete = useCallback(async (userId: string) => {
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const handleRevokeInvitation = useCallback(async (id: string) => {
    await fetch("/api/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  async function toggleDirectory() {
    setTogglingDir(true);
    try {
      const res = await fetch("/api/organizations/directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !dirEnabled }),
      });
      if (res.ok) setDirEnabled((v) => !v);
    } finally {
      setTogglingDir(false);
    }
  }

  async function toggleMemberVisibility(userId: string, cardSlug: string, current: boolean) {
    setTogglingMember(userId);
    try {
      const res = await fetch("/api/organizations/directory/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardSlug, showInTeamDirectory: !current }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId && u.card
              ? { ...u, card: { ...u.card, showInTeamDirectory: !current } }
              : u
          )
        );
      }
    } finally {
      setTogglingMember(null);
    }
  }

  const dirUrl = orgSlug ? `/team/${orgSlug}` : null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الفريق</h1>
          <p className="text-muted-foreground mt-1">
            {orgName ? `${orgName} · ` : ""}{memberCount} عضو
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canImport && canManage && (
            <Link href="/team/import" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Upload className="h-3.5 w-3.5" />
              استيراد CSV
            </Link>
          )}
          {canManage && <InviteModal onInvited={() => router.refresh()} />}
        </div>
      </div>

      {/* Team Directory Panel (only for orgs) */}
      {orgSlug && (
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">دليل الفريق العام</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dirEnabled
                  ? "نشط: كل الأعضاء أصحاب البطاقات العامة ظاهرون"
                  : "متوقف: الدليل غير متاح للعامة"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {dirUrl && dirEnabled && (
              <a
                href={dirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                عرض
              </a>
            )}
            {canManage && (
              <button
                onClick={toggleDirectory}
                disabled={togglingDir}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: dirEnabled ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                {dirEnabled
                  ? <ToggleRight className="h-6 w-6" />
                  : <ToggleLeft className="h-6 w-6" />}
                {dirEnabled ? "نشط" : "غير نشط"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* User table with directory visibility */}
      {orgSlug && canManage ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">عضو</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">الدور</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">البطاقة</th>
                <th className="text-start px-4 py-3 font-medium text-muted-foreground">في الدليل</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="secondary">{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.card ? (
                      <a href={`/c/${u.card.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink className="h-3 w-3" />
                        {u.card.slug}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">لا توجد بطاقة</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.card ? (
                      <button
                        onClick={() => toggleMemberVisibility(u.id, u.card!.slug, u.card!.showInTeamDirectory)}
                        disabled={togglingMember === u.id}
                        className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
                        style={{ color: u.card.showInTeamDirectory ? "var(--primary)" : "var(--muted-foreground)" }}
                        title={u.card.showInTeamDirectory ? "إزالة من الدليل" : "إظهار في الدليل"}
                      >
                        {u.card.showInTeamDirectory
                          ? <><Eye className="h-4 w-4" /> ظاهر</>
                          : <><EyeOff className="h-4 w-4" /> مخفي</>}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {/* existing role/delete actions via UserTable aren't shown here;
                        for simplicity show delete only */}
                    {currentUserRole === "super_admin" || (canManage && u.id !== currentUserId) ? (
                      <Button
                        variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(u.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <UserTable
          users={filtered}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
        />
      )}

      {/* Pending card approvals */}
      {canManage && pendingCards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            بطاقات بانتظار الموافقة
            <span className="ms-1 text-sm font-normal text-muted-foreground">({pendingCards.length})</span>
          </h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden divide-y divide-amber-100">
            {pendingCards.map((c) => (
              <div key={c.slug} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.user.name} · <a href={`/c/${c.slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">/c/{c.slug}</a>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm" variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      disabled={approvingCard === c.slug}
                      onClick={() => approveCard(c.slug, "approved")}
                    >
                      <CheckCircle className="h-4 w-4" />
                      موافقة
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      disabled={approvingCard === c.slug}
                      onClick={() => approveCard(c.slug, "rejected")}
                    >
                      <XCircle className="h-4 w-4" />
                      رفض
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="سبب الرفض (اختياري)"
                    value={rejectNote[c.slug] ?? ""}
                    onChange={(e) => setRejectNote((prev) => ({ ...prev, [c.slug]: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {canManage && invitations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">الدعوات المعلّقة</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">البريد الإلكتروني</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">الدور</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">تاريخ الدعوة</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">تنتهي في</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{inv.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{inv.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
