"use client";

import { CardEditor } from "@/components/card/CardEditor";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import type { CardData, DesignPolicy } from "@/types";

const ADMIN_POLICY: DesignPolicy = {
  allowTemplateChange: true,
  allowColorChange: true,
  allowFontChange: true,
  allowLayoutChange: true,
  canEditLogo: true,
  brandColors: [],
  defaults: { template: "classic", fontFamily: "inter", layoutStyle: "standard" },
};

interface Props {
  card: CardData & { user: { id: string; name: string; email: string } };
}

export function AdminCardEditClient({ card }: Props) {
  const saveEndpoint = `/api/admin/cards/${card.slug}`;

  return (
    <div className="space-y-8 max-w-5xl">
      <CardEditor
        initialCard={card}
        isNew={false}
        policy={ADMIN_POLICY}
        saveEndpoint={saveEndpoint}
      />

      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold mb-4">رمز QR</h2>
        <QRCodeDisplay slug={card.slug} color={card.primaryColor} />
      </div>
    </div>
  );
}
