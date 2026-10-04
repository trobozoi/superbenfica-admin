"use client";

import { Check, Minus, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Can } from "@/components/shared/can";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasPermission, type Permission, PERMISSIONS, STAFF_ROLES } from "@/config/permissions";
import { usePermission } from "@/hooks/use-permission";
import { useResourceList } from "@/hooks/use-resource";
import { lojasApi, usuariosApi } from "@/services/api";
import type { Loja, Usuario } from "@/types/api";
import { LojaFormDialog } from "./loja-form-dialog";
import { UsuarioFormDialog } from "./usuario-form-dialog";

function UsuariosTab() {
  const t = useTranslations();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const query = useResourceList(usuariosApi, { page, search, ordering: "nome" });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openForm = (usuario: Usuario | null) => {
    setEditing(usuario);
    setFormOpen(true);
  };

  const columns: Column<Usuario>[] = [
    {
      key: "nome",
      header: t("configuracoes.nome"),
      cell: (u) => (
        <span>
          <span className="block font-medium">{u.nome}</span>
          <span className="block text-xs text-muted-foreground">{u.email}</span>
        </span>
      ),
    },
    {
      key: "role",
      header: t("configuracoes.perfil"),
      cell: (u) => <Badge variant="outline">{t(`roles.${u.role}`)}</Badge>,
    },
    {
      key: "loja",
      header: t("common.filial"),
      cell: (u) => u.loja_nome || "-",
      hideOnMobile: true,
    },
    {
      key: "ativo",
      header: t("common.status"),
      cell: (u) => <ActiveBadge active={u.is_active} />,
      hideOnMobile: true,
    },
    {
      key: "acoes",
      header: t("common.actions"),
      className: "text-right",
      cell: (u) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${t("common.edit")} ${u.nome}`}
          onClick={() => openForm(u)}
        >
          <Pencil aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={query.data?.results}
        getRowId={(u) => u.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        page={page}
        count={query.data?.count}
        onPageChange={setPage}
        toolbar={
          <>
            <SearchInput onSearch={handleSearch} />
            <Button className="sm:ml-auto" onClick={() => openForm(null)}>
              <Plus aria-hidden /> {t("configuracoes.newUsuario")}
            </Button>
          </>
        }
      />
      <UsuarioFormDialog open={formOpen} onOpenChange={setFormOpen} usuario={editing} />
    </>
  );
}

function FiliaisTab() {
  const t = useTranslations();
  const canWrite = usePermission("filiais:write");
  const [editing, setEditing] = useState<Loja | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const query = useResourceList(lojasApi, { ordering: "nome" });

  const openForm = (loja: Loja | null) => {
    setEditing(loja);
    setFormOpen(true);
  };

  const columns: Column<Loja>[] = [
    {
      key: "nome",
      header: t("configuracoes.nome"),
      cell: (l) => <span className="font-medium">{l.nome}</span>,
    },
    {
      key: "endereco",
      header: t("configuracoes.endereco"),
      cell: (l) => l.endereco,
      hideOnMobile: true,
    },
    {
      key: "horario",
      header: `${t("configuracoes.abertura")} / ${t("configuracoes.fechamento")}`,
      cell: (l) => `${l.horario_abertura.slice(0, 5)} - ${l.horario_fechamento.slice(0, 5)}`,
      hideOnMobile: true,
    },
    { key: "ativa", header: t("common.status"), cell: (l) => <ActiveBadge active={l.ativa} /> },
  ];
  if (canWrite) {
    columns.push({
      key: "acoes",
      header: t("common.actions"),
      className: "text-right",
      cell: (l) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${t("common.edit")} ${l.nome}`}
          onClick={() => openForm(l)}
        >
          <Pencil aria-hidden />
        </Button>
      ),
    });
  }

  return (
    <>
      <DataTable
        columns={columns}
        rows={query.data?.results}
        getRowId={(l) => l.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        toolbar={
          <Can permission="filiais:write">
            <Button className="ml-auto" onClick={() => openForm(null)}>
              <Plus aria-hidden /> {t("configuracoes.newFilial")}
            </Button>
          </Can>
        }
      />
      <LojaFormDialog open={formOpen} onOpenChange={setFormOpen} loja={editing} />
    </>
  );
}

function PermissoesTab() {
  const t = useTranslations();
  const permissions = Object.keys(PERMISSIONS) as Permission[];
  return (
    <Card className="overflow-hidden">
      <p className="border-b p-3 text-sm text-muted-foreground">
        {t("configuracoes.permissionsNote")}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("configuracoes.permission")}</TableHead>
            {STAFF_ROLES.map((role) => (
              <TableHead key={role} className="text-center">
                {t(`roles.${role}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission}>
              <TableCell className="font-mono text-xs">{permission}</TableCell>
              {STAFF_ROLES.map((role) => {
                const allowed = hasPermission(role, permission);
                return (
                  <TableCell key={role} className="text-center">
                    {allowed ? (
                      <Check className="mx-auto size-4 text-success" aria-label={t("common.yes")} />
                    ) : (
                      <Minus
                        className="mx-auto size-4 text-muted-foreground"
                        aria-label={t("common.no")}
                      />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ConfiguracoesView() {
  const t = useTranslations("configuracoes");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">{t("usuarios")}</TabsTrigger>
          <TabsTrigger value="filiais">{t("filiais")}</TabsTrigger>
          <TabsTrigger value="permissoes">{t("permissoes")}</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios">
          <UsuariosTab />
        </TabsContent>
        <TabsContent value="filiais">
          <FiliaisTab />
        </TabsContent>
        <TabsContent value="permissoes">
          <PermissoesTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
