"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { PedidoStatus, SeparacaoStatus } from "@/types/api";

export const PEDIDO_STATUS_VARIANT: Record<PedidoStatus, BadgeVariant> = {
  PENDENTE: "warning",
  EM_SEPARACAO: "info",
  SEPARADO: "default",
  FINALIZADO: "success",
  CANCELADO: "secondary",
};

const SEPARACAO_STATUS_VARIANT: Record<SeparacaoStatus, BadgeVariant> = {
  EM_ANDAMENTO: "info",
  CONCLUIDA: "success",
  CANCELADA: "secondary",
};

export function PedidoStatusBadge({ status }: Readonly<{ status: PedidoStatus }>) {
  const t = useTranslations("pedidoStatus");
  return <Badge variant={PEDIDO_STATUS_VARIANT[status]}>{t(status)}</Badge>;
}

export function SeparacaoStatusBadge({ status }: Readonly<{ status: SeparacaoStatus }>) {
  const t = useTranslations("separacaoStatus");
  return <Badge variant={SEPARACAO_STATUS_VARIANT[status]}>{t(status)}</Badge>;
}

export function ActiveBadge({ active }: Readonly<{ active: boolean | undefined }>) {
  const t = useTranslations("common");
  return active === false ? (
    <Badge variant="secondary">{t("inactive")}</Badge>
  ) : (
    <Badge variant="success">{t("active")}</Badge>
  );
}
