"use client";

import { Boxes } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { ProdutoFormInput } from "../schemas";

interface EstoqueFieldsProps {
  /** Itens do useFieldArray (valores ainda não convertidos pelo Zod). */
  rows: readonly (ProdutoFormInput["estoques"][number] & { id: string })[];
  register: UseFormRegister<ProdutoFormInput>;
  errors: FieldErrors<ProdutoFormInput>["estoques"];
  isLoading: boolean;
}

const NUMBER_INPUT = { type: "number", min: 0, step: 1, inputMode: "numeric" } as const;

/**
 * Estoque inicial e quantidade mínima de cada filial (um grupo por filial). Para um
 * estoque que já existe, só o mínimo é editável: o saldo muda pelo "Ajustar", que
 * registra o motivo.
 */
export function EstoqueFields({ rows, register, errors, isLoading }: Readonly<EstoqueFieldsProps>) {
  const t = useTranslations("produtos");

  return (
    <section aria-labelledby="estoque-por-filial" className="grid gap-3 rounded-lg border p-4">
      <h3 id="estoque-por-filial" className="flex items-center gap-1.5 text-sm font-medium">
        <Boxes className="size-4" aria-hidden /> {t("estoqueTitulo")}
      </h3>
      <p className="text-xs text-muted-foreground">{t("estoqueDescricao")}</p>

      {isLoading ? (
        <div aria-busy="true">
          <span className="sr-only">{t("estoqueCarregando")}</span>
          <Skeleton className="h-16" />
        </div>
      ) : (
        rows.map((row, index) => (
          <fieldset key={row.id} className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <legend className="float-left mb-1 w-full text-sm font-semibold sm:col-span-2">
              {row.lojaNome}
            </legend>
            {row.estoqueId === null ? (
              <FormField label={t("estoqueInicial")} error={errors?.[index]?.quantidade?.message}>
                <Input {...NUMBER_INPUT} {...register(`estoques.${index}.quantidade`)} />
              </FormField>
            ) : (
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">{t("saldoAtual")}</span>
                <p className="flex h-9 items-center text-sm tabular-nums">
                  {formatNumber(Number(row.quantidade))}
                </p>
                <p className="text-xs text-muted-foreground">{t("saldoAjuste")}</p>
              </div>
            )}
            <FormField
              label={t("quantidadeMinima")}
              error={errors?.[index]?.quantidade_minima?.message}
            >
              <Input {...NUMBER_INPUT} {...register(`estoques.${index}.quantidade_minima`)} />
            </FormField>
          </fieldset>
        ))
      )}
    </section>
  );
}
