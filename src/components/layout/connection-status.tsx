"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRealtimeStore } from "@/store/realtime-store";
import type { ConnectionStatus as Status } from "@/types/realtime";

const DOT_CLASS: Record<Status, string> = {
  idle: "bg-muted-foreground",
  connecting: "bg-warning animate-pulse",
  reconnecting: "bg-warning animate-pulse",
  open: "bg-success",
  forbidden: "bg-destructive",
  closed: "bg-destructive",
};

/** Indicador do WebSocket. O texto fica visível no desktop e como tooltip no mobile. */
export function ConnectionStatus() {
  const t = useTranslations("realtime");
  const status = useRealtimeStore((state) => state.status);
  const label = t(status);
  return (
    <output
      aria-live="polite"
      title={status === "idle" ? t("selectFilial") : label}
      className="flex items-center gap-2 rounded-md px-2 text-xs text-muted-foreground"
    >
      <span className={cn("size-2 rounded-full", DOT_CLASS[status])} aria-hidden />
      <span className="hidden xl:inline">{label}</span>
      <span className="sr-only xl:hidden">{label}</span>
    </output>
  );
}
