"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type Control, Controller } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { formasPagamentoApi } from "@/services/api";
import type { PedidoFormInput, PedidoFormValues } from "../schemas";

const PARAMS = { ativa: true, ordering: "ordem" } as const;

/** Formas de pagamento ativas, na ordem definida no cadastro. */
export function useFormasPagamentoAtivas() {
  return useQuery({
    queryKey: queryKeys.list(formasPagamentoApi.name, PARAMS),
    queryFn: () => formasPagamentoApi.list(PARAMS),
    select: (data) => data.results,
  });
}

interface FormaPagamentoFieldProps {
  control: Control<PedidoFormInput, unknown, PedidoFormValues>;
  error?: string;
}

/** Select controlado (as opções chegam da API depois que o formulário abre; veja LojaField). */
export function FormaPagamentoField({ control, error }: Readonly<FormaPagamentoFieldProps>) {
  const t = useTranslations("pedidos");
  const { data: formas, isLoading } = useFormasPagamentoAtivas();
  const semFormas = !isLoading && formas?.length === 0;

  return (
    <Controller
      control={control}
      name="forma_pagamento"
      render={({ field }) => {
        const escolhida = formas?.find((forma) => String(forma.id) === String(field.value));
        let hint: string | undefined;
        if (semFormas) hint = t("formasPagamentoVazio");
        else if (escolhida?.permite_troco) hint = t("trocoDica");
        return (
          <FormField label={t("formaPagamento")} error={error} hint={hint}>
            <NativeSelect
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-busy={isLoading}
              value={field.value === undefined ? "" : String(field.value)}
              onChange={(event) =>
                field.onChange(event.target.value ? Number(event.target.value) : "")
              }
            >
              <option value="">{t("selectFormaPagamento")}</option>
              {formas?.map((forma) => (
                <option key={forma.id} value={forma.id}>
                  {forma.nome}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        );
      }}
    />
  );
}
