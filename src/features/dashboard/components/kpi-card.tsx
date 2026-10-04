import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  isLoading?: boolean;
  footer?: ReactNode;
}

/** Número de destaque: quando o dado é um único valor, um card vale mais que um gráfico. */
export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  isLoading,
  footer,
}: Readonly<KpiCardProps>) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{label}</span>
          <Icon className="size-4" aria-hidden />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {footer}
      </CardContent>
    </Card>
  );
}
