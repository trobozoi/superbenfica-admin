"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { useDeleteResource, useResourceList } from "@/hooks/use-resource";
import { formatDate } from "@/lib/format";
import { clientesApi } from "@/services/api";
import type { Cliente } from "@/types/api";
import { ClienteDetailDialog } from "./cliente-detail-dialog";
import { ClienteFormDialog } from "./cliente-form-dialog";

export function ClientesView() {
  const t = useTranslations();
  const canWrite = usePermission("clientes:write");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [viewing, setViewing] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);

  const query = useResourceList(clientesApi, { page, search, ordering: "nome" });
  const remove = useDeleteResource(clientesApi, () => setDeleting(null));

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openForm = (cliente: Cliente | null) => {
    setEditing(cliente);
    setFormOpen(true);
  };

  const columns: Column<Cliente>[] = [
    {
      key: "nome",
      header: t("clientes.nome"),
      cell: (c) => <span className="font-medium">{c.nome}</span>,
    },
    { key: "email", header: t("clientes.email"), cell: (c) => c.email, hideOnMobile: true },
    {
      key: "telefone",
      header: t("clientes.telefone"),
      cell: (c) => c.telefone || "-",
      hideOnMobile: true,
    },
    {
      key: "cadastro",
      header: t("clientes.cadastro"),
      cell: (c) => formatDate(c.data_cadastro),
      hideOnMobile: true,
    },
    {
      key: "acoes",
      header: t("common.actions"),
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t("common.details")} ${c.nome}`}
            onClick={() => setViewing(c)}
          >
            <Eye aria-hidden />
          </Button>
          {canWrite && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${t("common.edit")} ${c.nome}`}
                onClick={() => openForm(c)}
              >
                <Pencil aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${t("common.delete")} ${c.nome}`}
                onClick={() => setDeleting(c)}
              >
                <Trash2 aria-hidden />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("clientes.title")}
        description={t("clientes.description")}
        actions={
          <Can permission="clientes:create">
            <Button onClick={() => openForm(null)}>
              <Plus aria-hidden /> {t("clientes.new")}
            </Button>
          </Can>
        }
      />
      <DataTable
        columns={columns}
        rows={query.data?.results}
        getRowId={(c) => c.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={page}
        count={query.data?.count}
        onPageChange={setPage}
        toolbar={<SearchInput onSearch={handleSearch} />}
      />
      <ClienteFormDialog open={formOpen} onOpenChange={setFormOpen} cliente={editing} />
      <ClienteDetailDialog cliente={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        isPending={remove.isPending}
        description={deleting?.nome}
        confirmLabel={t("common.delete")}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
