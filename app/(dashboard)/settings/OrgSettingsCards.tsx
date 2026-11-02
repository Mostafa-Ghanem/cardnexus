"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Palette, LayoutTemplate, Type, Users } from "lucide-react";
import type { DeptPolicyOverride } from "@/types";

interface DeptRow { name: string; policy: DeptPolicyOverride }

interface OrgBasicProps {
  orgName: string; setOrgName: (v: string) => void;
  orgColor: string; setOrgColor: (v: string) => void;
  orgDisplayName: string;
}
export function OrgInfoCard({ orgName, setOrgName, orgColor, setOrgColor, orgDisplayName }: OrgBasicProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>المؤسسة</CardTitle>
        <CardDescription>Grundlegende Informationen zu {orgDisplayName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>اسم المؤسسة</Label>
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>اللون الأساسي</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={orgColor} onChange={(e) => setOrgColor(e.target.value)}
              className="h-10 w-16 rounded-md border border-input cursor-pointer" />
            <Input value={orgColor} onChange={(e) => setOrgColor(e.target.value)} className="font-mono w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DesignDefaultsProps {
  defaultTemplate: string; setDefaultTemplate: (v: string) => void;
  defaultFont: string; setDefaultFont: (v: string) => void;
  defaultLayout: string; setDefaultLayout: (v: string) => void;
  defaultAccent: string; setDefaultAccent: (v: string) => void;
  orgColor: string;
}
export function DesignDefaultsCard(p: DesignDefaultsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">قواعد التصميم</CardTitle>
        </div>
        <CardDescription>تُستخدم هذه القيم افتراضيًا لبطاقات الأعضاء الجدد.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>القالب الافتراضي</Label>
            <Select value={p.defaultTemplate} onValueChange={p.setDefaultTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["classic","modern","minimal","dark"].map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>الخط الافتراضي</Label>
            <Select value={p.defaultFont} onValueChange={p.setDefaultFont}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter (Sans-serif)</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="mono">Mono</SelectItem>
                <SelectItem value="display">Display</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>التخطيط الافتراضي</Label>
            <Select value={p.defaultLayout} onValueChange={p.setDefaultLayout}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">قياسي</SelectItem>
                <SelectItem value="centered">في المنتصف</SelectItem>
                <SelectItem value="compact">مختصر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>اللون المميز <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
            <div className="flex items-center gap-2">
              <input type="color" value={p.defaultAccent || p.orgColor}
                onChange={(e) => p.setDefaultAccent(e.target.value)}
                className="h-9 w-12 rounded border border-input cursor-pointer" />
              <Input value={p.defaultAccent} onChange={(e) => p.setDefaultAccent(e.target.value)}
                placeholder="مثل الأساسي" className="font-mono" maxLength={7} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BrandColorsProps {
  brandColors: string[]; newColor: string; setNewColor: (v: string) => void;
  onAdd: () => void; onRemove: (c: string) => void;
}
export function BrandColorsCard({ brandColors, newColor, setNewColor, onAdd, onRemove }: BrandColorsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">ألوان الهوية</CardTitle>
        </div>
        <CardDescription>هذه الألوان تظهر للأعضاء للاختيار السريع. فارغة = اختيار حر.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {brandColors.map((c) => (
            <div key={c} className="group relative">
              <div className="h-10 w-10 rounded-lg border-2 border-border" style={{ backgroundColor: c }} title={c} />
              <button type="button" onClick={() => onRemove(c)}
                className="absolute -top-1.5 -end-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white text-[10px]">
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
            className="h-9 w-12 rounded border border-input cursor-pointer" />
          <Input value={newColor} onChange={(e) => setNewColor(e.target.value)} className="font-mono w-28" maxLength={7} />
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PermissionsProps {
  allowTemplateChange: boolean; setAllowTemplateChange: (v: boolean) => void;
  allowColorChange: boolean; setAllowColorChange: (v: boolean) => void;
  allowFontChange: boolean; setAllowFontChange: (v: boolean) => void;
  allowLayoutChange: boolean; setAllowLayoutChange: (v: boolean) => void;
  analyticsEnabled: boolean; setAnalyticsEnabled: (v: boolean) => void;
}
export function PermissionsCard(p: PermissionsProps) {
  const rows = [
    { label: "اختيار القالب",  sub: "يمكن للأعضاء اختيار قالبهم",  val: p.allowTemplateChange, set: p.setAllowTemplateChange },
    { label: "اختيار اللون",       sub: "يمكن للأعضاء تعديل اللون الأساسي",          val: p.allowColorChange,    set: p.setAllowColorChange },
    { label: "اختيار الخط",    sub: "يمكن للأعضاء اختيار الخط",         val: p.allowFontChange,     set: p.setAllowFontChange },
    { label: "اختيار التخطيط",    sub: "يمكن للأعضاء اختيار التخطيط",             val: p.allowLayoutChange,   set: p.setAllowLayoutChange },
    { label: "الإحصائيات",      sub: "تسجيل الزيارات والنقرات",                     val: p.analyticsEnabled,    set: p.setAnalyticsEnabled },
  ];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">الصلاحيات العامة</CardTitle>
        </div>
        <CardDescription>حدد ما يسمح للأعضاء بتعديله افتراضيًا. قواعد الأقسام يمكنها تجاوز هذه القيم.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ label, sub, val, set }) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <Switch checked={val} onCheckedChange={set} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface DeptPoliciesProps {
  deptRows: DeptRow[]; newDeptName: string; setNewDeptName: (v: string) => void;
  onAdd: () => void; onRemove: (name: string) => void;
  onUpdatePolicy: (name: string, key: keyof DeptPolicyOverride, v: boolean) => void;
}
export function DeptPoliciesCard({ deptRows, newDeptName, setNewDeptName, onAdd, onRemove, onUpdatePolicy }: DeptPoliciesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">قواعد الأقسام</CardTitle>
        </div>
        <CardDescription>
          خصص الصلاحيات لكل قسم.
          يجب أن يطابق الاسم حقل «القسم» في بطاقة العضو تمامًا.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {deptRows.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-start px-3 py-2">القسم</th>
                  <th className="text-center px-2 py-2">القالب</th>
                  <th className="text-center px-2 py-2">اللون</th>
                  <th className="text-center px-2 py-2">الخط</th>
                  <th className="text-center px-2 py-2">التخطيط</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deptRows.map(({ name, policy }) => (
                  <tr key={name} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{name}</td>
                    {(["allowTemplateChange","allowColorChange","allowFontChange","allowLayoutChange"] as const).map((k) => (
                      <td key={k} className="text-center px-2 py-2">
                        <Switch checked={policy[k] ?? true} onCheckedChange={(v) => onUpdatePolicy(name, k, v)} />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(name)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input placeholder="اسم القسم، مثل التسويق" value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()} className="flex-1" />
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">الأقسام الجديدة ترث الصلاحيات العامة كبداية.</p>
      </CardContent>
    </Card>
  );
}

interface TemplateCardProps {
  templateCompany: string; setTemplateCompany: (v: string) => void;
  templateColor: string; setTemplateColor: (v: string) => void;
  templateId: string; setTemplateId: (v: string) => void;
  orgName: string;
}
export function TemplateCardSection(p: TemplateCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">قالب البطاقات (الاستيراد الجماعي)</CardTitle>
        </div>
        <CardDescription>تُستخدم هذه القيم افتراضيًا للبطاقات الجديدة عند استيراد CSV.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>اسم الشركة</Label>
          <Input value={p.templateCompany} onChange={(e) => p.setTemplateCompany(e.target.value)} placeholder={p.orgName} />
          <p className="text-xs text-muted-foreground">يُستخدم إذا لم يحتوِ ملف CSV على اسم الشركة.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>القالب</Label>
            <Select value={p.templateId} onValueChange={p.setTemplateId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["classic","modern","minimal","dark","bold","glass","retro","neon","corporate"].map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>اللون الأساسي</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={p.templateColor} onChange={(e) => p.setTemplateColor(e.target.value)}
                className="h-9 w-12 rounded border border-input cursor-pointer" />
              <Input value={p.templateColor} onChange={(e) => p.setTemplateColor(e.target.value)} className="font-mono" maxLength={7} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
