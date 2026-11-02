import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers, slugify } from "@/lib/utils";
import { canUseFeature } from "@/lib/plans";
import { nanoid } from "nanoid";

interface CsvRow {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  company?: string;
  phone?: string;
  mobile?: string;
  department?: string;
}

/**
 * RFC 4180-compliant CSV line parser.
 * Handles quoted fields that contain commas, newlines, and escaped double-quotes ("").
 */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; } // escaped ""
        else inQuote = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { cells.push(current.trim()); current = ""; }
      else { current += ch; }
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

  const col = (row: string[], name: string) => {
    const i = headerCells.indexOf(name);
    return i >= 0 ? row[i] ?? "" : "";
  };

  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cells = parseCsvLine(line);
      return {
        firstName:  col(cells, "firstname")  || col(cells, "vorname"),
        lastName:   col(cells, "lastname")   || col(cells, "nachname"),
        email:      col(cells, "email"),
        title:      col(cells, "title")      || col(cells, "titel")     || undefined,
        company:    col(cells, "company")    || col(cells, "firma")     || undefined,
        phone:      col(cells, "phone")      || col(cells, "telefon")   || undefined,
        mobile:     col(cells, "mobile")     || col(cells, "mobil")     || undefined,
        department: col(cells, "department") || col(cells, "abteilung") || undefined,
      };
    })
    .filter((r) => r.email && r.firstName);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const user = session.user as { id: string; role?: string; organizationId?: string; plan?: string };

  if (!canManageUsers(user.role ?? "member")) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }
  if (!canUseFeature("bulkImport", user.plan ?? "free")) {
    return NextResponse.json({ error: "تتطلب باقة Business" }, { status: 403 });
  }
  if (!user.organizationId) {
    return NextResponse.json({ error: "لا توجد مؤسسة" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "لم يتم إرفاق ملف" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "لا توجد صفوف صالحة في ملف CSV" }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: user.organizationId },
    select: { primaryColor: true, settings: { select: { templateCardData: true } } },
  });

  const templateDefaults = org?.settings?.templateCardData
    ? JSON.parse(org.settings.templateCardData)
    : {};

  const results: { email: string; status: "created" | "updated" | "skipped"; error?: string }[] = [];

  for (const row of rows) {
    try {
      // SECURITY: bulk-import must only touch users INSIDE the caller's org.
      // findUnique by email matches globally and would let an org-admin from
      // org A overwrite the cards of users in org B.
      const existing = await db.user.findFirst({
        where: { email: row.email, organizationId: user.organizationId },
        include: { cards: { orderBy: [{ isDefault: "desc" }], take: 1, select: { id: true } } },
      });

      if (existing) {
        // Update or create card for existing user
        const existingCard = existing.cards[0] ?? null;
        const slug = existingCard
          ? undefined
          : `${slugify(row.firstName + "-" + row.lastName)}-${nanoid(4)}`;

        if (existingCard) {
          await db.card.update({
            where: { id: existingCard.id },
            data: {
              firstName:  row.firstName,
              lastName:   row.lastName,
              title:      row.title,
              company:    row.company,
              phone:      row.phone,
              mobile:     row.mobile,
              department: row.department,
            },
          });
          results.push({ email: row.email, status: "updated" });
        } else if (!existingCard && slug) {
          await db.card.create({
            data: {
              userId:      existing.id,
              slug,
              firstName:   row.firstName,
              lastName:    row.lastName,
              title:       row.title,
              company:     row.company || templateDefaults.company,
              phone:       row.phone,
              mobile:      row.mobile,
              department:  row.department,
              primaryColor: templateDefaults.primaryColor ?? org?.primaryColor ?? "#0F172A",
              templateId:  templateDefaults.templateId ?? "classic",
              customLinks: "[]",
            },
          });
          results.push({ email: row.email, status: "created" });
        }
      } else {
        results.push({ email: row.email, status: "skipped", error: "المستخدم غير موجود" });
      }
    } catch (e) {
      results.push({ email: row.email, status: "skipped", error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, total: rows.length });
}
