"use client";

import { Eye, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Can } from "@/components/shared/can";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { PedidoStatusBadge, TipoEntregaBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { useLojaFilter } from "@/features/dashboard/hooks";
import { useResourceList } from "@/hooks/use-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { pedidosApi } from "@/services/api";
import {
  PEDIDO_STATUS,
  type Pedido,
  type PedidoStatus,
  TIPOS_ENTREGA,
  type TipoEntrega,
} from "@/types/api";
import { PedidoActions } from "./pedido-actions";
import { PedidoDetailDialog } from "./pedido-detail-dialog";
import { PedidoFormDialog } from "./pedido-form-dialog";

function initialStatus(value: string | null): PedidoStatus | "" {
  return (PEDIDO_STATUS as readonly string[]).includes(value ?? "") ? (value as PedidoStatus) : "";
}

function initialTipoEntrega(value: string | null): TipoEntrega | "" {
  return (TIPOS_ENTREGA as readonly string[]).includes(value ?? "") ? (value as TipoEntrega) : "";
}

export function PedidosView() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const loja = useLojaFilter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => initialStatus(searchParams.get("status")));
  const [tipoEntrega, setTipoEntrega] = useState(() =>
    initialTipoEntrega(searchParams.get("tipo_entrega")),
  );
  const [detailId, setDetailId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const query = useResourceList(pedidosApi, {
    page,
    search,
    status,
    tipo_entrega: tipoEntrega,
    loja,
    ordering: "-data_criacao",
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Pedido>[] = [
    {
      key: "codigo",
      header: t("pedidos.codigo"),
      cell: (p) => <span className="font-mono text-xs font-medium">{p.codigo}</span>,
    },
    { key: "cliente", header: t("pedidos.cliente"), cell: (p) => p.cliente_nome },
    { key: "loja", header: t("common.filial"), cell: (p) => p.loja_nome, hideOnMobile: true },
    {
      key: "forma_pagamento",
      header: t("pedidos.formaPagamento"),
      cell: (p) => p.forma_pagamento_nome ?? "-",
      hideOnMobile: true,
    },
    {
      key: "tipo_entrega",
      header: t("pedidos.entrega"),
      cell: (p) => <TipoEntregaBadge tipo={p.tipo_entrega} />,
      hideOnMobile: true,
    },
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
      hideOnMobile: true,
    },
    {
      key: "data",
      header: t("common.date"),
      cell: (p) => formatDateTime(p.data_criacao),
      hideOnMobile: true,
    },
    {
      key: "acoes",
      header: t("common.actions"),
      className: "text-right",
      cell: (p) => (
        <div className="flex flex-wrap justify-end gap-2">
          <div className="hidden xl:block">
            <PedidoActions pedido={p} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t("common.details")} ${p.codigo}`}
            onClick={() => setDetailId(p.id)}
          >
            <Eye aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("pedidos.title")}
        description={t("pedidos.description")}
        actions={
          <Can permission="pedidos:create">
            <Button onClick={() => setFormOpen(true)}>
              <Plus aria-hidden /> {t("pedidos.new")}
            </Button>
          </Can>
        }
      />
      <DataTable
        columns={columns}
        rows={query.data?.results}
        getRowId={(p) => p.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={page}
        count={query.data?.count}
        onPageChange={setPage}
        toolbar={
          <>
            <SearchInput onSearch={handleSearch} />
            <NativeSelect
              aria-label={t("common.status")}
              className="sm:w-48"
              value={status}
              onChange={(event) => {
                setStatus(initialStatus(event.target.value));
                setPage(1);
              }}
            >
              <option value="">{t("common.all")}</option>
              {PEDIDO_STATUS.map((s) => (
                <option key={s} value={s}>
                  {t(`pedidoStatus.${s}`)}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label={t("pedidos.entrega")}
              className="sm:w-52"
              value={tipoEntrega}
              onChange={(event) => {
                setTipoEntrega(initialTipoEntrega(event.target.value));
                setPage(1);
              }}
            >
              <option value="">{t("common.all")}</option>
              {TIPOS_ENTREGA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {t(`tipoEntrega.${tipo}`)}
                </option>
              ))}
            </NativeSelect>
          </>
        }
      />
      <PedidoDetailDialog pedidoId={detailId} onClose={() => setDetailId(null)} />
      <PedidoFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
