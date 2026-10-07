"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { type Control, Controller, useWatch, type UseFormSetValue } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/ui/input";
import { enderecoPrincipal, formatarEndereco } from "@/features/clientes/service";
import { queryKeys } from "@/lib/query-keys";
import { clientesApi } from "@/services/api";
import { TIPOS_ENTREGA, type TipoEntrega } from "@/types/api";
import type { PedidoFormInput, PedidoFormValues } from "../schemas";

interface EntregaFieldsProps {
  control: Control<PedidoFormInput, unknown, PedidoFormValues>;
  setValue: UseFormSetValue<PedidoFormInput>;
  errors: { tipo_entrega?: string; endereco?: string };
}

/** Forma de entrega e, na entrega em domicílio, um dos endereços do cliente escolhido. */
export function EntregaFields({ control, setValue, errors }: Readonly<EntregaFieldsProps>) {
  const t = useTranslations();
  const clienteValue = useWatch({ control, name: "cliente" });
  const tipoEntrega = useWatch({ control, name: "tipo_entrega" });
  const clienteId = Number(clienteValue) || null;
  const domicilio = tipoEntrega === "DOMICILIO";

  const { data: cliente, isLoading } = useQuery({
    queryKey: queryKeys.detail(clientesApi.name, clienteId ?? 0),
    queryFn: () => clientesApi.get(clienteId as number),
    enabled: domicilio && clienteId !== null,
  });
  const enderecos = cliente?.enderecos ?? [];

  // Ao trocar de cliente (ou passar para entrega), sugere o endereço principal dele.
  useEffect(() => {
    if (!domicilio) return;
    setValue("endereco", enderecoPrincipal(cliente)?.id ?? "", { shouldValidate: false });
  }, [cliente, domicilio, setValue]);

  let hint: string | undefined;
  if (clienteId === null) hint = t("pedidos.selectClientePrimeiro");
  else if (cliente && enderecos.length === 0) hint = t("pedidos.clienteSemEndereco");

  return (
    <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
      <Controller
        control={control}
        name="tipo_entrega"
        render={({ field }) => (
          <FormField label={t("pedidos.entrega")} error={errors.tipo_entrega}>
            <NativeSelect
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value as TipoEntrega)}
            >
              {TIPOS_ENTREGA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {t(`tipoEntrega.${tipo}`)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        )}
      />
      {domicilio && (
        <Controller
          control={control}
          name="endereco"
          render={({ field }) => (
            <FormField label={t("pedidos.enderecoEntrega")} error={errors.endereco} hint={hint}>
              <NativeSelect
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                aria-busy={isLoading}
                disabled={enderecos.length === 0}
                value={field.value === undefined ? "" : String(field.value)}
                onChange={(event) =>
                  field.onChange(event.target.value ? Number(event.target.value) : "")
                }
              >
                <option value="">{t("pedidos.selectEndereco")}</option>
                {enderecos.map((endereco) => (
                  <option key={endereco.id} value={endereco.id}>
                    {formatarEndereco(endereco)}
                    {endereco.principal ? ` (${t("pedidos.enderecoPrincipal")})` : ""}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          )}
        />
      )}
    </div>
  );
}
