"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Copy, Check } from "lucide-react";

interface InviteModalProps {
  onInvited?: () => void;
}

export function InviteModal({ onInvited }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "حدث خطأ");
      setInviteUrl(json.inviteUrl);
      onInvited?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setEmail("");
    setRole("member");
    setError("");
    setInviteUrl("");
    setCopied(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          دعوة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>دعوة مستخدم</DialogTitle>
        </DialogHeader>

        {!inviteUrl ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الدور</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_leader">قائد فريق</SelectItem>
                  <SelectItem value="member">عضو</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleInvite} disabled={!email || loading} className="w-full">
              {loading ? "جارٍ الإرسال…" : "إنشاء الدعوة"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm font-medium text-foreground mb-1">تم إنشاء الدعوة!</p>
              <p className="text-xs text-muted-foreground">أرسل الرابط إلى {email} (صالح 7 أيام)</p>
            </div>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" onClick={reset} className="w-full">
              دعوة شخص آخر
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
