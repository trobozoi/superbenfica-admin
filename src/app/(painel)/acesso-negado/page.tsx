import { ShieldX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function AcessoNegadoPage() {
  const t = await getTranslations("auth");
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <ShieldX className="size-12 text-destructive" aria-hidden />
      <h1 className="text-2xl font-semibold">{t("forbiddenTitle")}</h1>
      <p className="text-muted-foreground">{t("forbiddenDescription")}</p>
      <Button asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
