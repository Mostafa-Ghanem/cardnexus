"use client";

import { Clock, XCircle } from "lucide-react";

interface Props {
  status: string;
  note?: string | null;
}

export function ApprovalBanner({ status, note }: Props) {
  if (status === "pending") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">البطاقة بانتظار الموافقة</p>
          <p className="text-amber-700 mt-0.5">
            آخر تعديل لك قيد المراجعة من المدير. تبقى البطاقة بشكلها السابق حتى تتم الموافقة.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">تم رفض التعديل</p>
          {note && <p className="text-red-700 mt-0.5">{note}</p>}
          <p className="text-red-600 mt-1 text-xs">عدّل بطاقتك واحفظها مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return null;
}
