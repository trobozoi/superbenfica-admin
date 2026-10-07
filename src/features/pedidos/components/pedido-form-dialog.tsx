"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { LojaField } from "@/components/shared/loja-field";
import { RemoteCombobox } from "@/components/shared/remote-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { useLojaFilter } from "@/features/dashboard/hooks";
import { applyFieldErrors, useApiMutation } from "@/hooks/use-resource";
import { formatCurrency } from "@/lib/format";
import { REALTIME_INVALIDATIONS } from "@/lib/query-keys";
import { clientesApi, pedidosApi, produtosApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { EntregaFields } from "./entrega-fields";
import { FormaPagamentoField } from "./forma-pagamento-field";
import { type PedidoFormInput, type PedidoFormValues, pedidoSchema } from "../schemas";

interface PedidoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NEW_ITEM = { produto: "", quantidade: 1 } as const;

export function PedidoFormDialog({ open, onOpenChange }: Readonly<PedidoFormDialogProps>) {
  const t = useTranslations();
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const lojaPadrao = useLojaFilter();

  const defaults: PedidoFormInput = {
    cliente: "",
    loja: lojaPadrao ?? "",
    forma_pagamento: "",
    itens: [{ ...NEW_ITEM }],
    observacao: "",
    tipo_entrega: "RETIRADA",
    endereco: "",
  };
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<PedidoFormInput, unknown, PedidoFormValues>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: defaults,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  useEffect(() => {
    if (open)
      reset({
        cliente: "",
        loja: lojaPadrao ?? "",
        forma_pagamento: "",
        itens: [{ ...NEW_ITEM }],
        observacao: "",
        tipo_entrega: "RETIRADA",
        endereco: "",
      });
  }, [open, lojaPadrao, reset]);

  const create = useApiMutation({
    mutationFn: (values: PedidoFormValues) => pedidosApi.create(values),
    invalidate: REALTIME_INVALIDATIONS.pedido,
    onSuccess: () => onOpenChange(false),
    onError: (error) => applyFieldErrors(setError, error),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("common.close")} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("pedidos.new")}</DialogTitle>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => create.mutate(values))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="cliente"
              render={({ field }) => (
                <FormField label={t("pedidos.cliente")} error={errors.cliente?.message}>
                  <RemoteCombobox
                    service={clientesApi}
                    value={field.value as number | ""}
                    onChange={field.onChange}
                    getLabel={(c) => c.nome}
                    getDescription={(c) => c.email}
                    placeholder={t("pedidos.selectCliente")}
                    searchPlaceholder={t("pedidos.searchCliente")}
                    emptyText={t("pedidos.clienteNaoEncontrado")}
                  />
                </FormField>
              )}
            />
            <LojaField
              control={control}
              name="loja"
              label={t("common.filial")}
              error={errors.loja?.message}
              disabled={!isAdmin}
            />
          </div>

          <EntregaFields
            control={control}
            setValue={setValue}
            errors={{
              tipo_entrega: errors.tipo_entrega?.message,
              endereco: errors.endereco?.message,
            }}
          />

          <fieldset className="grid gap-3">
            <legend className="mb-2 text-sm font-medium">{t("pedidos.itens")}</legend>
            {fields.map((item, index) => (
              <div key={item.id} className="grid items-end gap-2 sm:grid-cols-[1fr_6rem_auto]">
                <Controller
                  control={control}
                  name={`itens.${index}.produto`}
                  render={({ field }) => (
                    <FormField
                      label={t("pedidos.produto")}
                      error={errors.itens?.[index]?.produto?.message}
                    >
                      <RemoteCombobox
                        service={produtosApi}
                        extraParams={{ ativo: true }}
                        value={field.value as number | ""}
                        onChange={field.onChange}
                        getLabel={(p) => p.nome}
                        getDescription={(p) => `${p.sku} · ${formatCurrency(p.preco)}`}
                        placeholder={t("pedidos.selectProduto")}
                        searchPlaceholder={t("pedidos.searchProduto")}
                        emptyText={t("pedidos.produtoNaoEncontrado")}
                      />
                    </FormField>
                  )}
                />
                <FormField
                  label={t("pedidos.quantidade")}
                  error={errors.itens?.[index]?.quantidade?.message}
                >
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    {...register(`itens.${index}.quantidade`)}
                  />
                </FormField>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("pedidos.removeItem")}
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            ))}
            {errors.itens?.message && (
              <p className="text-xs text-destructive">
                {t(`validation.${errors.itens.message as "minItems"}`)}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => append({ ...NEW_ITEM })}
            >
              <Plus aria-hidden /> {t("pedidos.addItem")}
            </Button>
          </fieldset>

          <FormaPagamentoField control={control} error={errors.forma_pagamento?.message} />

          <FormField label={t("pedidos.observacao")} error={errors.observacao?.message}>
            <Textarea rows={2} {...register("observacao")} />
          </FormField>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
