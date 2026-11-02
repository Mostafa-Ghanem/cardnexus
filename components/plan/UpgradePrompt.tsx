import { T } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/types";

interface Props {
  feature: string;
  requiredPlan?: Plan;
  compact?: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  business: "Business",
};

export function UpgradePrompt({ feature, requiredPlan = "pro", compact }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">{feature}</span>
        <Button asChild size="sm" variant="outline" className="h-6 text-xs px-2">
          <Link href="/upgrade">{PLAN_LABELS[requiredPlan]}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Zap className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm">{feature}</p>
        <p className="text-xs text-muted-foreground mt-1"><T text={"Verfügbar ab dem"} />{PLAN_LABELS[requiredPlan]}<T text={"-Plan"} /></p>
      </div>
      <Button asChild size="sm">
        <Link href="/upgrade"><T text={"Jetzt upgraden"} /></Link>
      </Button>
    </div>
  );
}

/** Inline lock badge for use in tab labels / section headers */
export function PlanBadge({ plan }: { plan: Plan }) {
  const colors: Record<Plan, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    business: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${colors[plan]}`}>
      {plan}
    </span>
  );
}
