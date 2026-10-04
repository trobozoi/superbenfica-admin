"use client";

import { AlertTriangle, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLojaFilter } from "@/features/dashboard/hooks";
import { usePermission } from "@/hooks/use-permission";
import { useResourceList } from "@/hooks/use-resource";
import { formatDateTime, formatNumber } from "@/lib/format";
import { estoquesApi } from "@/services/api";
import type { EstoqueLocal } from "@/types/api";
import { AjusteDialog } from "./ajuste-dialog";

export function EstoqueView() {
  const t = useTranslations();
  const canWrite = usePermission("estoque:write");
  const loja = useLojaFilter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [somenteBaixo, setSomenteBaixo] = useState(false);
  const [ajustando, setAjustando] = useState<EstoqueLocal | null>(null);

  const query = useResourceList(estoquesApi, {
    page,
    search,
    loja,
    abaixo_do_minimo: somenteBaixo || undefined,
    ordering: "produto__nome",
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<EstoqueLocal>[] = [
    {
      key: "produto",
      header: t("estoque.produto"),
      cell: (e) => (
        <span>
          <span className="block font-medium">{e.produto_nome}</span>
          <span className="block text-xs text-muted-foreground">{e.produto_sku}</span>
        </span>
      ),
    },
    { key: "loja", header: t("common.filial"), cell: (e) => e.loja_nome, hideOnMobile: true },
    {
      key: "quantidade",
      header: t("estoque.quantidade"),
      className: "tabular-nums",
      cell: (e) => formatNumber(e.quantidade),
    },
    {
      key: "minimo",
      header: t("estoque.minimo"),
      className: "tabular-nums",
      hideOnMobile: true,
      cell: (e) => formatNumber(e.quantidade_minima),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (e) =>
        e.abaixo_do_minimo ? (
          <Badge variant="warning">
            <AlertTriangle className="size-3" aria-hidden /> {t("estoque.alerta")}
          </Badge>
        ) : (
          <Badge variant="success">{t("estoque.ok")}</Badge>
        ),
    },
    {
      key: "atualizado",
      header: t("estoque.atualizado"),
      hideOnMobile: true,
      cell: (e) => formatDateTime(e.data_atualizacao),
    },
  ];
  if (canWrite) {
    columns.push({
      key: "acoes",
      header: t("common.actions"),
      className: "text-right",
      cell: (e) => (
        <Button variant="outline" size="sm" onClick={() => setAjustando(e)}>
          <SlidersHorizontal aria-hidden /> {t("estoque.ajustar")}
        </Button>
      ),
    });
  }

  return (
    <>
      <PageHeader title={t("estoque.title")} description={t("estoque.description")} />
      <DataTable
        columns={columns}
        rows={query.data?.results}
        getRowId={(e) => e.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={page}
        count={query.data?.count}
        onPageChange={setPage}
        toolbar={
          <>
            <SearchInput onSearch={handleSearch} />
            <div className="flex h-9 items-center gap-2">
              <Checkbox
                id="somente-baixo"
                checked={somenteBaixo}
                onChange={(event) => {
                  setSomenteBaixo(event.target.checked);
                  setPage(1);
                }}
              />
              <Label htmlFor="somente-baixo">{t("estoque.abaixoMinimo")}</Label>
            </div>
          </>
        }
      />
      <AjusteDialog estoque={ajustando} onClose={() => setAjustando(null)} />
    </>
  );
}
