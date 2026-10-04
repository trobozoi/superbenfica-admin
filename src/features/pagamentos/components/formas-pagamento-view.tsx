"use client";

import { Ban, Check, Minus, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { type Column, DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/feedback";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { useApiMutation, useResourceList } from "@/hooks/use-resource";
import { formasPagamentoApi } from "@/services/api";
import type { FormaPagamento } from "@/types/api";
import { FormaPagamentoFormDialog } from "./forma-pagamento-form-dialog";

const ORDEM_PASSO = 10;

export function FormasPagamentoView() {
  const t = useTranslations();
  const canWrite = usePermission("pagamentos:write");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FormaPagamento | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [desativando, setDesativando] = useState<FormaPagamento | null>(null);

  const query = useResourceList(formasPagamentoApi, { page, search, ordering: "ordem" });
  // A exclusão na API só desativa a forma (os pedidos antigos continuam com ela).
  const desativar = useApiMutation({
    mutationFn: (id: number) => formasPagamentoApi.remove(id),
    invalidate: [formasPagamentoApi.name],
    successMessage: t("pagamentos.desativada"),
    onSuccess: () => setDesativando(null),
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openForm = (forma: FormaPagamento | null) => {
    setEditing(forma);
    setFormOpen(true);
  };

  const maiorOrdem = Math.max(0, ...(query.data?.results ?? []).map((forma) => forma.ordem));

  const columns: Column<FormaPagamento>[] = [
    {
      key: "ordem",
      header: t("pagamentos.ordem"),
      cell: (f) => f.ordem,
      className: "w-20 tabular-nums",
      hideOnMobile: true,
    },
    {
      key: "nome",
      header: t("pagamentos.nome"),
      cell: (f) => <span className="font-medium">{f.nome}</span>,
    },
    {
      key: "tipo",
      header: t("pagamentos.tipo"),
      cell: (f) => <Badge variant="outline">{t(`tiposPagamento.${f.tipo}`)}</Badge>,
    },
    {
      key: "troco",
      header: t("pagamentos.permiteTroco"),
      hideOnMobile: true,
      cell: (f) =>
        f.permite_troco ? (
          <Check className="size-4 text-success" aria-label={t("common.yes")} />
        ) : (
          <Minus className="size-4 text-muted-foreground" aria-label={t("common.no")} />
        ),
    },
    { key: "ativa", header: t("common.status"), cell: (f) => <ActiveBadge active={f.ativa} /> },
  ];
  if (canWrite) {
    columns.push({
      key: "acoes",
      header: t("common.actions"),
      className: "text-right",
      cell: (f) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t("common.edit")} ${f.nome}`}
            onClick={() => openForm(f)}
          >
            <Pencil aria-hidden />
          </Button>
          {f.ativa && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${t("pagamentos.desativar")} ${f.nome}`}
              onClick={() => setDesativando(f)}
            >
              <Ban aria-hidden />
            </Button>
          )}
        </div>
      ),
    });
  }

  return (
    <>
      <PageHeader
        title={t("pagamentos.title")}
        description={t("pagamentos.description")}
        actions={
          <Can permission="pagamentos:write">
            <Button onClick={() => openForm(null)}>
              <Plus aria-hidden /> {t("pagamentos.new")}
            </Button>
          </Can>
        }
      />
      {!canWrite && (
        <p className="mb-3 text-sm text-muted-foreground">{t("pagamentos.somenteAdmin")}</p>
      )}
      <DataTable
        columns={columns}
        rows={query.data?.results}
        getRowId={(f) => f.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={page}
        count={query.data?.count}
        onPageChange={setPage}
        empty={<EmptyState description={t("pagamentos.vazio")} />}
        toolbar={<SearchInput onSearch={handleSearch} />}
      />
      <FormaPagamentoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        forma={editing}
        proximaOrdem={maiorOrdem + ORDEM_PASSO}
      />
      <ConfirmDialog
        open={desativando !== null}
        onOpenChange={(open) => !open && setDesativando(null)}
        title={t("pagamentos.confirmDesativar", { nome: desativando?.nome ?? "" })}
        description={t("pagamentos.confirmDesativarDescricao")}
        confirmLabel={t("pagamentos.desativar")}
        destructive
        isPending={desativar.isPending}
        onConfirm={() => desativando && desativar.mutate(desativando.id)}
      />
    </>
  );
}
