"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScanBarcode } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Checkbox, Input } from "@/components/ui/input";
import { REALTIME_INVALIDATIONS } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { separacoesApi } from "@/services/api";
import { toApiError } from "@/services/http/errors";
import type { ItemPedido, Pedido } from "@/types/api";
import { itemPorCodigo, progressoChecklist } from "../checklist";

interface SeparacaoChecklistProps {
  pedido: Pedido;
  /** Separação em andamento; ausente = só leitura. */
  separacaoId?: number;
  editavel: boolean;
}

interface Marcacao {
  item: number;
  separado: boolean;
}

/** Marca itens na API e mostra a marcação na hora, sem esperar a resposta. */
function useMarcarItem(separacaoId: number | undefined) {
  const queryClient = useQueryClient();
  // Marcações ainda não confirmadas pela API (item -> separado).
  const [otimistas, setOtimistas] = useState<ReadonlyMap<number, boolean>>(new Map());
  const definir = (item: number, valor: boolean) =>
    setOtimistas((atual) => new Map(atual).set(item, valor));
  // Só descarta se ninguém clicou de novo no mesmo item enquanto a API respondia.
  const descartar = ({ item, separado }: Marcacao) =>
    setOtimistas((atual) => {
      if (atual.get(item) !== separado) return atual;
      const proximo = new Map(atual);
      proximo.delete(item);
      return proximo;
    });

  const mutation = useMutation({
    mutationFn: ({ item, separado }: Marcacao) => {
      if (separacaoId === undefined) throw new Error("Nenhuma separação em andamento.");
      return separacoesApi.marcarItem(separacaoId, item, separado);
    },
    onMutate: ({ item, separado }) => definir(item, separado),
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: async (_data, _error, marcacao) => {
      await Promise.all(
        REALTIME_INVALIDATIONS.pedido.map((domain) =>
          queryClient.invalidateQueries({ queryKey: [domain] }),
        ),
      );
      descartar(marcacao);
    },
  });
  return { marcar: mutation.mutate, otimistas };
}

function LeitorCodigo({ onLido }: Readonly<{ onLido: (codigo: string) => void }>) {
  const t = useTranslations("separacao");
  const id = useId();
  const [codigo, setCodigo] = useState("");
  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!codigo.trim()) return;
    onLido(codigo);
    setCodigo("");
  };
  return (
    <form onSubmit={enviar} className="grid gap-1">
      <label htmlFor={id} className="sr-only">
        {t("bipar")}
      </label>
      <div className="relative">
        <ScanBarcode
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          placeholder={t("bipar")}
          autoComplete="off"
          enterKeyHint="done"
          aria-describedby={`${id}-dica`}
          className="pl-8 font-mono"
        />
      </div>
      <p id={`${id}-dica`} className="text-xs text-muted-foreground">
        {t("biparDica")}
      </p>
    </form>
  );
}

/** Checklist dos itens do pedido para o separador conferir o que já foi colocado. */
export function SeparacaoChecklist({
  pedido,
  separacaoId,
  editavel,
}: Readonly<SeparacaoChecklistProps>) {
  const t = useTranslations("separacao");
  const { marcar, otimistas } = useMarcarItem(separacaoId);
  const itens: ItemPedido[] = pedido.itens.map((item) => ({
    ...item,
    separado: otimistas.get(item.id) ?? item.separado,
  }));
  const progresso = progressoChecklist(itens);
  const baseId = useId();

  const handleLido = (codigo: string) => {
    const item = itemPorCodigo(itens, codigo);
    if (!item) {
      toast.error(t("biparNaoEncontrado", { codigo: codigo.trim() }));
    } else if (item.separado) {
      toast.info(t("biparJaMarcado", { nome: item.produto_nome }));
    } else {
      marcar({ item: item.id, separado: true });
      toast.success(t("biparMarcado", { nome: item.produto_nome }));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{t("checklist", { codigo: pedido.codigo })}</span>
        <span
          className={cn(
            "tabular-nums",
            progresso.completo ? "text-success" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {t("progresso", { feitos: progresso.feitos, total: progresso.total })}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={t("checklist", { codigo: pedido.codigo })}
        aria-valuemin={0}
        aria-valuemax={progresso.total}
        aria-valuenow={progresso.feitos}
      >
        <div
          className="h-full bg-primary transition-[width]"
          style={{ width: `${progresso.total ? (progresso.feitos / progresso.total) * 100 : 0}%` }}
        />
      </div>
      <ul className="divide-y rounded-md border text-sm">
        {itens.map((item) => (
          <li
            key={item.id}
            className={cn("flex items-start gap-3 px-3 py-2", editavel && "hover:bg-muted/50")}
          >
            <Checkbox
              id={`${baseId}-${item.id}`}
              className="mt-0.5 size-5 shrink-0"
              checked={item.separado}
              disabled={!editavel}
              aria-label={t("marcarItem", {
                quantidade: item.quantidade,
                nome: item.produto_nome,
              })}
              onChange={(event) => marcar({ item: item.id, separado: event.target.checked })}
            />
            <label
              htmlFor={`${baseId}-${item.id}`}
              className={cn("grid min-w-0 flex-1", editavel && "cursor-pointer")}
            >
              <span className={cn(item.separado && "text-muted-foreground line-through")}>
                <span className="font-semibold tabular-nums">{item.quantidade}×</span>{" "}
                {item.produto_nome}
              </span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {item.produto_sku} · {item.produto_codigo_barras || t("semCodigo")}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {editavel && <LeitorCodigo onLido={handleLido} />}
    </div>
  );
}
