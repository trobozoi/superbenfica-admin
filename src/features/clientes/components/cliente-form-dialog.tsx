"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { LojaField } from "@/components/shared/loja-field";
import { PhoneInput } from "@/components/shared/phone-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { applyFieldErrors } from "@/hooks/use-resource";
import { formatTelefone } from "@/lib/telefone";
import { toApiError } from "@/services/http/errors";
import type { Cliente } from "@/types/api";
import { type ClienteFormInput, type ClienteFormValues, clienteSchema } from "../schemas";
import { EnderecoSaveError, enderecoPrincipal, enderecoToForm, salvarCliente } from "../service";
import { EnderecoFields } from "./endereco-fields";

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
}

function toFormValues(cliente?: Cliente | null): ClienteFormInput {
  return {
    nome: cliente?.nome ?? "",
    email: cliente?.email ?? "",
    telefone: formatTelefone(cliente?.telefone ?? ""),
    loja: cliente?.loja ?? "",
    endereco: enderecoToForm(enderecoPrincipal(cliente)),
  };
}

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
}: Readonly<ClienteFormDialogProps>) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  // Se o cliente foi criado mas o endereço falhou, o próximo envio edita esse cliente.
  const [savedCliente, setSavedCliente] = useState<Cliente | null>(null);
  const current = cliente ?? savedCliente;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<ClienteFormInput, unknown, ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: toFormValues(cliente),
  });

  useEffect(() => {
    if (open) reset(toFormValues(cliente));
  }, [open, cliente, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setSavedCliente(null);
    onOpenChange(next);
  };

  const save = useMutation({
    mutationFn: (values: ClienteFormValues) =>
      salvarCliente({
        id: current?.id,
        enderecoId: enderecoPrincipal(current)?.id,
        values,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(t("common.saved"));
      handleOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof EnderecoSaveError) {
        setSavedCliente(error.cliente);
        const apiError = toApiError(error.original);
        for (const [field, message] of Object.entries(apiError.fieldErrors)) {
          setError(`endereco.${field}` as "endereco.cep", { type: "server", message });
        }
        toast.error(t("clientes.enderecoFalhou", { detalhe: apiError.message }));
        return;
      }
      const apiError = toApiError(error);
      applyFieldErrors(setError, apiError);
      toast.error(apiError.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent closeLabel={t("common.close")} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{current ? t("clientes.editTitle") : t("clientes.new")}</DialogTitle>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => save.mutate(values))}
        >
          <FormField label={t("clientes.nome")} error={errors.nome?.message}>
            <Input autoComplete="off" {...register("nome")} />
          </FormField>
          <FormField label={t("clientes.email")} error={errors.email?.message}>
            <Input type="email" autoComplete="off" {...register("email")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("clientes.telefone")} error={errors.telefone?.message}>
              <PhoneInput {...register("telefone")} />
            </FormField>
            <LojaField
              control={control}
              name="loja"
              label={t("clientes.lojaPreferida")}
              error={errors.loja?.message}
            />
          </div>
          <EnderecoFields
            key={String(open)}
            control={control}
            register={register}
            setValue={setValue}
            setFocus={setFocus}
            errors={errors.endereco}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
