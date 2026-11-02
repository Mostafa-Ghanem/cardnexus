"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CardData } from "@/types";

interface Props {
  card: Partial<CardData>;
  update: <K extends keyof CardData>(key: K, value: CardData[K] | null) => void;
  allowedDomains?: string[];
  canCustomDomain?: boolean;
}

export function DomainSection({ card, update, allowedDomains, canCustomDomain }: Props) {
  if (!((allowedDomains && allowedDomains.length > 0) || canCustomDomain)) return null;

  return (
    <section className="space-y-3">
      <Label className="text-base">دومين البطاقة</Label>
      <p className="text-xs text-muted-foreground">
        على أي دومين تريد أن تفتح بطاقتك؟
      </p>
      <div className="space-y-2">
        <button type="button"
          onClick={() => update("cardDomain", null)}
          className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${
            !card.cardDomain ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
          }`}>
          الافتراضي (دومين المنصة)
        </button>
        {allowedDomains?.map((d) => (
          <button key={d} type="button"
            onClick={() => update("cardDomain", d)}
            className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${
              card.cardDomain === d ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
            }`}>
            {d}
          </button>
        ))}
        {canCustomDomain && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">دومين خاص (Pro)</p>
            <Input
              value={card.cardDomain && !allowedDomains?.includes(card.cardDomain) ? card.cardDomain : ""}
              onChange={(e) => update("cardDomain", (e.target.value as CardData["cardDomain"]) || null)}
              placeholder="my-domain.com"
            />
          </div>
        )}
      </div>
    </section>
  );
}
