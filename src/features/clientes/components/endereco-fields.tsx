"use client";

import { Loader2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetFocus,
  type UseFormSetValue,
} from "react-hook-form";
import { Combobox } from "@/components/shared/combobox";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { UF_NOMES } from "@/config/ufs";
import { cn } from "@/lib/utils";
import { type CepLookupResult, formatCep, isCompleteCep, lookupCep } from "@/services/cep";
import { UFS } from "@/types/api";
import type { ClienteFormInput, ClienteFormValues } from "../schemas";

type LookupState = { status: "idle" } | { status: "loading" } | CepLookupResult;

const UF_OPTIONS = UFS.map((uf) => ({ value: uf, label: uf, description: UF_NOMES[uf] }));

interface EnderecoFieldsProps {
  control: Control<ClienteFormInput, unknown, ClienteFormValues>;
  register: UseFormRegister<ClienteFormInput>;
  setValue: UseFormSetValue<ClienteFormInput>;
  setFocus: UseFormSetFocus<ClienteFormInput>;
  errors: FieldErrors<ClienteFormInput>["endereco"];
}

const FILL_OPTIONS = { shouldValidate: true, shouldDirty: true } as const;

/**
 * Bloco de endereço com preenchimento automático pelo CEP (ViaCEP).
 * A busca só dispara quando o usuário digita um CEP completo, nunca ao abrir um cliente
 * existente, para não sobrescrever um endereço já salvo.
 */
export function EnderecoFields({
  control,
  register,
  setValue,
  setFocus,
  errors,
}: Readonly<EnderecoFieldsProps>) {
  const t = useTranslations("clientes");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  // Cancela a consulta pendente ao fechar o formulário.
  useEffect(() => () => controller.current?.abort(), []);

  const runLookup = async (cep: string) => {
    controller.current?.abort();
    controller.current = new AbortController();
    const { signal } = controller.current;
    setLookup({ status: "loading" });
    const result = await lookupCep(cep, signal);
    if (signal.aborted) return;
    setLookup(result);
    if (result.status !== "found") return;
    const { endereco, bairro, cidade, estado } = result.address;
    setValue("endereco.endereco", endereco, FILL_OPTIONS);
    setValue("endereco.bairro", bairro, FILL_OPTIONS);
    setValue("endereco.cidade", cidade, FILL_OPTIONS);
    setValue("endereco.estado", estado, FILL_OPTIONS);
    setFocus("endereco.numero");
  };

  const cepField = register("endereco.cep");

  const handleCepChange = (value: string) => {
    const masked = formatCep(value);
    setValue("endereco.cep", masked);
    if (isCompleteCep(masked)) void runLookup(masked);
    else setLookup({ status: "idle" });
  };

  const messages: Record<LookupState["status"], string | null> = {
    idle: t("cepHint"),
    loading: t("cepLoading"),
    found:
      lookup.status === "found" && lookup.address.faixa
        ? t("cepFaixa", { faixa: lookup.address.faixa })
        : t("cepFound"),
    not_found: t("cepNotFound"),
    invalid: t("cepInvalid"),
    error: t("cepError"),
  };
  const isProblem = ["not_found", "invalid", "error"].includes(lookup.status);

  return (
    <fieldset className="grid gap-4 rounded-lg border p-4">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-medium">
        <MapPin className="size-4" aria-hidden /> {t("enderecoEntrega")}
      </legend>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <FormField label={t("cep")} error={errors?.cep?.message}>
          <Input
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            maxLength={9}
            {...cepField}
            onChange={(event) => handleCepChange(event.target.value)}
          />
        </FormField>
        <p
          aria-live="polite"
          className={cn(
            "flex items-center gap-1.5 self-end pb-2 text-xs",
            isProblem ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {lookup.status === "loading" && <Loader2 className="size-3 animate-spin" aria-hidden />}
          {messages[lookup.status]}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <FormField label={t("logradouro")} error={errors?.endereco?.message}>
          <Input autoComplete="address-line1" {...register("endereco.endereco")} />
        </FormField>
        <FormField label={t("numero")} error={errors?.numero?.message}>
          <Input autoComplete="off" {...register("endereco.numero")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("complemento")} error={errors?.complemento?.message}>
          <Input placeholder={t("complementoPlaceholder")} {...register("endereco.complemento")} />
        </FormField>
        <FormField label={t("bairro")} error={errors?.bairro?.message}>
          <Input {...register("endereco.bairro")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <FormField label={t("cidade")} error={errors?.cidade?.message}>
          <Input autoComplete="address-level2" {...register("endereco.cidade")} />
        </FormField>
        <Controller
          control={control}
          name="endereco.estado"
          render={({ field }) => (
            <FormField label={t("uf")} error={errors?.estado?.message}>
              <Combobox
                options={UF_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder={t("ufPlaceholder")}
                searchPlaceholder={t("ufSearch")}
                emptyText={t("ufNaoEncontrada")}
              />
            </FormField>
          )}
        />
      </div>
    </fieldset>
  );
}
