"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Erro inesperado de renderização dentro do painel. */
export default function PainelError({ error, reset }: Readonly<ErrorPageProps>) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-20 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-semibold">{t("errorTitle")}</h1>
      {error.digest && <p className="text-xs text-muted-foreground">Ref.: {error.digest}</p>}
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
