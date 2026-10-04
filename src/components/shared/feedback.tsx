"use client";

import { AlertTriangle, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/services/http/errors";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: Readonly<EmptyStateProps>) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div className="text-muted-foreground">
        {icon ?? <Inbox className="size-8" aria-hidden />}
      </div>
      <p className="font-medium">{title ?? t("emptyTitle")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {description ?? t("emptyDescription")}
      </p>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: Readonly<ErrorStateProps>) {
  const t = useTranslations("common");
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <p className="font-medium">{t("errorTitle")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{toApiError(error).message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
