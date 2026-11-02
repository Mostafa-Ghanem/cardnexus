"use client";
import { T } from "@/components/i18n/I18nProvider";


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
          <p className="font-medium"><T text={"Karte wartet auf Freigabe"} /></p>
          <p className="text-amber-700 mt-0.5"><T text={"Deine letzte Änderung wird von einem Administrator geprüft. Die Karte bleibt bis zur Freigabe in ihrem bisherigen Zustand sichtbar."} /></p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium"><T text={"Änderung abgelehnt"} /></p>
          {note && <p className="text-red-700 mt-0.5">{note}</p>}
          <p className="text-red-600 mt-1 text-xs"><T text={"Bitte überarbeite deine Karte und speichere erneut."} /></p>
        </div>
      </div>
    );
  }

  return null;
}
