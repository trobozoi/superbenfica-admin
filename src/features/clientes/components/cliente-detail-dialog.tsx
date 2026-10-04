"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { type Column, DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/feedback";
import { PedidoStatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResourceList } from "@/hooks/use-resource";
import { formatCurrency, formatDate } from "@/lib/format";
import { pedidosApi } from "@/services/api";
import type { Cliente, Pedido } from "@/types/api";

interface ClienteDetailDialogProps {
  cliente: Cliente | null;
  onClose: () => void;
}

/** Dados do cliente, endereços e histórico de compras (GET /pedidos/?cliente=<id>). */
export function ClienteDetailDialog({ cliente, onClose }: Readonly<ClienteDetailDialogProps>) {
  const t = useTranslations();
  const [page, setPage] = useState(1);
  const pedidos = useResourceList(
    pedidosApi,
    { cliente: cliente?.id, page, ordering: "-data_criacao" },
    { enabled: cliente !== null },
  );

  const columns: Column<Pedido>[] = [
    {
      key: "codigo",
      header: t("pedidos.codigo"),
      cell: (p) => <span className="font-mono text-xs">{p.codigo}</span>,
    },
    { key: "data", header: t("common.date"), cell: (p) => formatDate(p.data_criacao) },
    {
      key: "status",
      header: t("common.status"),
      cell: (p) => <PedidoStatusBadge status={p.status} />,
    },
    {
      key: "total",
      header: t("common.total"),
      className: "tabular-nums",
      cell: (p) => formatCurrency(p.total),
    },
  ];

  return (
    <Dialog
      open={cliente !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPage(1);
          onClose();
        }
      }}
    >
      <DialogContent closeLabel={t("common.close")} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cliente?.nome}</DialogTitle>
          <DialogDescription>
            {cliente?.email}
            {cliente?.telefone ? ` · ${cliente.telefone}` : ""}
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">{t("clientes.enderecos")}</h3>
          {cliente?.enderecos.length ? (
            <ul className="space-y-1 text-sm">
              {cliente.enderecos.map((e) => (
                <li key={e.id}>
                  {e.endereco}, {e.numero}
                  {e.complemento ? ` - ${e.complemento}` : ""} · {e.bairro}, {e.cidade}/{e.estado} ·{" "}
                  {e.cep}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("clientes.semEnderecos")}</p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">{t("clientes.historico")}</h3>
          <DataTable
            columns={columns}
            rows={pedidos.data?.results}
            getRowId={(p) => p.id}
            isLoading={pedidos.isLoading}
            error={pedidos.error}
            page={page}
            count={pedidos.data?.count}
            onPageChange={setPage}
            empty={<EmptyState description={t("clientes.semPedidos")} />}
          />
        </section>
      </DialogContent>
    </Dialog>
  );
}
