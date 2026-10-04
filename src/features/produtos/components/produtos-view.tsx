"use client";

import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { usePermission } from "@/hooks/use-permission";
import { useDeleteResource, useResourceList } from "@/hooks/use-resource";
import { formatCurrency } from "@/lib/format";
import { produtosApi } from "@/services/api";
import { CATEGORIAS, type Produto } from "@/types/api";
import { ProdutoFormDialog } from "./produto-form-dialog";
import { ProdutoImportDialog } from "./produto-import-dialog";
import { ProdutoThumb } from "./produto-thumb";

export function ProdutosView() {
  const t = useTranslations();
  const canWrite = usePermission("produtos:write");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [editing, setEditing] = useState<Produto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<Produto | null>(null);

  const query = useResourceList(produtosApi, { page, search, categoria, ordering: "nome" });
  const remove = useDeleteResource(produtosApi, () => setDeleting(null));

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openForm = (produto: Produto | null) => {
    setEditing(produto);
    setFormOpen(true);
  };

  const columns: Column<Produto>[] = [
    {
      key: "nome",
      header: t("produtos.nome"),
      cell: (p) => (
        <span className="flex items-center gap-3">
          <ProdutoThumb foto={p.foto} alt={p.nome} />
          <span className="font-medium">{p.nome}</span>
        </span>
      ),
    },
    {
      key: "sku",
      header: t("produtos.sku"),
      cell: (p) => (
        <span className="grid">
          <span>{p.sku}</span>
          {p.codigo_barras && (
            <span className="font-mono text-xs text-muted-foreground">{p.codigo_barras}</span>
          )}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "categoria",
      header: t("produtos.categoria"),
      cell: (p) => (p.categoria ? t(`categorias.${p.categoria}`) : "-"),
      hideOnMobile: true,
    },
    {
      key: "preco",
      header: t("produtos.preco"),
      cell: (p) => formatCurrency(p.preco),
      className: "tabular-nums",
    },
    { key: "ativo", header: t("common.status"), cell: (p) => <ActiveBadge active={p.ativo} /> },
  ];
  if (canWrite) {
    columns.push({
      key: "acoes",
      header: t("common.actions"),
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t("common.edit")} ${p.nome}`}
            onClick={() => openForm(p)}
          >
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t("common.delete")} ${p.nome}`}
            onClick={() => setDeleting(p)}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      ),
    });
  }

  return (
    <>
      <PageHeader
        title={t("produtos.title")}
        description={t("produtos.description")}
        actions={
          <Can permission="produtos:write">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload aria-hidden /> {t("produtos.import")}
            </Button>
            <Button onClick={() => openForm(null)}>
              <Plus aria-hidden /> {t("produtos.new")}
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
              aria-label={t("produtos.categoria")}
              className="sm:w-52"
              value={categoria}
              onChange={(event) => {
                setCategoria(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("common.allFem")}</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {t(`categorias.${c}`)}
                </option>
              ))}
            </NativeSelect>
          </>
        }
      />
      <ProdutoFormDialog open={formOpen} onOpenChange={setFormOpen} produto={editing} />
      <ProdutoImportDialog open={importOpen} onOpenChange={setImportOpen} />
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
