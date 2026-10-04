"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState } from "@/components/shared/feedback";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLojaFilter } from "@/features/dashboard/hooks";
import { concluirBloqueado, separacaoEmAndamento } from "@/features/pedidos/actions";
import { PedidoActions } from "@/features/pedidos/components/pedido-actions";
import { useResourceList } from "@/hooks/use-resource";
import { useAuthStore } from "@/store/auth-store";
import { formatDateTime } from "@/lib/format";
import { pedidosApi } from "@/services/api";
import type { Pedido, PedidoStatus } from "@/types/api";
import { podeMarcarItens } from "../checklist";
import { SeparacaoChecklist } from "./separacao-checklist";

function ItensPedido({ pedido }: Readonly<{ pedido: Pedido }>) {
  return (
    <ul className="space-y-0.5 text-sm">
      {pedido.itens.map((item) => (
        <li key={item.id}>
          <span className="tabular-nums">{item.quantidade}×</span> {item.produto_nome}
        </li>
      ))}
    </ul>
  );
}

function PedidoCard({ pedido }: Readonly<{ pedido: Pedido }>) {
  const t = useTranslations("separacao");
  const user = useAuthStore((state) => state.user);
  const separacao = separacaoEmAndamento(pedido);
  const faltamItens = concluirBloqueado(pedido);
  const totalItens = pedido.itens.reduce((sum, item) => sum + item.quantidade, 0);
  return (
    <li>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-sm font-semibold">{pedido.codigo}</p>
              <p className="text-sm text-muted-foreground">{pedido.cliente_nome}</p>
            </div>
            <Badge variant="outline">{t("itens", { count: totalItens })}</Badge>
          </div>
          {separacao ? (
            <SeparacaoChecklist
              pedido={pedido}
              separacaoId={separacao.id}
              editavel={podeMarcarItens(pedido, user)}
            />
          ) : (
            <ItensPedido pedido={pedido} />
          )}
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden /> {formatDateTime(pedido.data_criacao)}
            {separacao && <> · {t("responsavel", { nome: separacao.usuario_nome })}</>}
          </p>
          <PedidoActions pedido={pedido} />
          {faltamItens && <p className="text-xs text-muted-foreground">{t("faltamItens")}</p>}
        </CardContent>
      </Card>
    </li>
  );
}

function QueueColumn({ title, status }: Readonly<{ title: string; status: PedidoStatus }>) {
  const t = useTranslations("separacao");
  const loja = useLojaFilter();
  // Mais antigos primeiro: a fila respeita a ordem de chegada.
  const query = useResourceList(pedidosApi, { status, loja, ordering: "data_criacao" });

  const renderContent = () => {
    if (query.isLoading) return <Skeleton className="h-40" />;
    if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
    if (!query.data?.results.length) return <EmptyState description={t("vazio")} />;
    return (
      <ul className="space-y-3">
        {query.data.results.map((pedido) => (
          <PedidoCard key={pedido.id} pedido={pedido} />
        ))}
      </ul>
    );
  };

  return (
    <section aria-label={title} className="space-y-3">
      <CardHeader className="flex-row items-center justify-between px-0 pb-0">
        <CardTitle>{title}</CardTitle>
        <Badge variant="secondary">{query.data?.count ?? 0}</Badge>
      </CardHeader>
      {renderContent()}
    </section>
  );
}

export function SeparacaoBoard() {
  const t = useTranslations("separacao");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <QueueColumn title={t("aguardando")} status="PENDENTE" />
        <QueueColumn title={t("emAndamento")} status="EM_SEPARACAO" />
      </div>
    </>
  );
}
