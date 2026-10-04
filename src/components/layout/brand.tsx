import { ShoppingBasket } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function Brand({ compact = false }: Readonly<{ compact?: boolean }>) {
  const t = useTranslations("app");
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShoppingBasket className="size-4" aria-hidden />
      </span>
      <div className={cn("leading-tight", compact && "sr-only")}>
        <p className="text-sm font-semibold">{t("name")}</p>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
    </div>
  );
}
