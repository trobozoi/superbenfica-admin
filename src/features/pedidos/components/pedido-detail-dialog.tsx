"use client";

import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/shared/feedback";
import {
  PedidoStatusBadge,
  SeparacaoStatusBadge,
  TipoEntregaBadge,
} from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { pedidosApi } from "@/services/api";

import { PedidoActions } from "./pedido-actions";

interface PedidoDetailDialogProps {
  pedidoId: number | null;
  onClose: () => void;
}

export function PedidoDetailDialog({ pedidoId, onClose }: Readonly<PedidoDetailDialogProps>) {
  const t = useTranslations();
  const query = useQuery({
    queryKey: queryKeys.detail(pedidosApi.name, pedidoId ?? 0),
    queryFn: () => pedidosApi.get(pedidoId ?? 0),
    enabled: pedidoId !== null,
  });
  const pedido = query.data;

  const renderBody = () => {
    if (query.isLoading) return <Skeleton className="h-48" />;
    if (query.error || !pedido)
      return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
    return (
      <div className="space-y-4 text-sm">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-muted-foreground">{t("pedidos.cliente")}</dt>
            <dd className="font-medium">{pedido.cliente_nome}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("common.filial")}</dt>
            <dd className="font-medium">{pedido.loja_nome}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("common.status")}</dt>
            <dd>
              <PedidoStatusBadge status={pedido.status} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("pedidos.formaPagamento")}</dt>
            <dd className="font-medium">
              {pedido.forma_pagamento_nome ?? t("pedidos.semFormaPagamento")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("pedidos.criadoEm")}</dt>
            <dd>{formatDateTime(pedido.data_criacao)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("pedidos.entrega")}</dt>
            <dd>
              <TipoEntregaBadge tipo={pedido.tipo_entrega} />
            </dd>
          </div>
          {pedido.tipo_entrega === "DOMICILIO" && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">{t("pedidos.enderecoEntrega")}</dt>
              <dd className="font-medium">{pedido.endereco_entrega}</dd>
            </div>
          )}
        </dl>

        <div>
          <h3 className="mb-2 font-medium">{t("pedidos.itens")}</h3>
          <ul className="divide-y rounded-md border">
            {pedido.itens.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 px-3 py-2">
                <span className="flex items-center gap-2">
                  {item.separado && (
                    <>
                      <Check className="size-4 text-success" aria-hidden />
                      <span className="sr-only">{t("pedidos.itemSeparado")}</span>
                    </>
                  )}
                  {item.quantidade}× {item.produto_nome}
                </span>
                <span className="tabular-nums">{formatCurrency(item.subtotal)}</span>
              </li>
            ))}
            <li className="flex justify-between px-3 py-2 font-semibold">
              <span>{t("common.total")}</span>
              <span className="tabular-nums">{formatCurrency(pedido.total)}</span>
            </li>
          </ul>
        </div>

        {pedido.observacao && (
          <p>
            <span className="text-muted-foreground">{t("pedidos.observacao")}: </span>
            {pedido.observacao}
          </p>
        )}

        {pedido.separacoes.length > 0 && (
          <div>
            <h3 className="mb-2 font-medium">{t("pedidos.separacoes")}</h3>
            <ul className="space-y-1">
              {pedido.separacoes.map((separacao) => (
                <li key={separacao.id} className="flex flex-wrap items-center gap-2">
                  <SeparacaoStatusBadge status={separacao.status} />
                  <span>{separacao.usuario_nome}</span>
                  <span className="text-muted-foreground">
                    {formatDateTime(separacao.data_inicio)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <PedidoActions pedido={pedido} size="default" />
      </div>
    );
  };

  return (
    <Dialog open={pedidoId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent closeLabel={t("common.close")} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{pedido?.codigo ?? t("common.details")}</DialogTitle>
          <DialogDescription className="sr-only">{t("common.details")}</DialogDescription>
        </DialogHeader>
        {renderBody()}
      </DialogContent>
    </Dialog>
  );
}
