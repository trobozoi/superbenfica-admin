"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { PhoneInput } from "@/components/shared/phone-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyFieldErrors, useSaveResource } from "@/hooks/use-resource";
import { formatTelefone } from "@/lib/telefone";
import { lojasApi } from "@/services/api";
import type { Loja } from "@/types/api";
import { type LojaFormValues, lojaSchema } from "../schemas";

interface LojaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loja?: Loja | null;
}

function toFormValues(loja?: Loja | null): LojaFormValues {
  return {
    nome: loja?.nome ?? "",
    endereco: loja?.endereco ?? "",
    telefone: formatTelefone(loja?.telefone ?? ""),
    // A API envia "08:00:00"; o <input type="time"> usa "08:00".
    horario_abertura: loja?.horario_abertura.slice(0, 5) ?? "08:00",
    horario_fechamento: loja?.horario_fechamento.slice(0, 5) ?? "22:00",
    ativa: loja?.ativa ?? true,
  };
}

export function LojaFormDialog({ open, onOpenChange, loja }: Readonly<LojaFormDialogProps>) {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<LojaFormValues>({
    resolver: zodResolver(lojaSchema),
    defaultValues: toFormValues(loja),
  });

  useEffect(() => {
    if (open) reset(toFormValues(loja));
  }, [open, loja, reset]);

  const save = useSaveResource(lojasApi, {
    onSuccess: () => onOpenChange(false),
    onError: (error) => applyFieldErrors(setError, error),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>
            {loja ? t("configuracoes.editFilial") : t("configuracoes.newFilial")}
          </DialogTitle>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => save.mutate({ id: loja?.id, input: values }))}
        >
          <FormField label={t("configuracoes.nome")} error={errors.nome?.message}>
            <Input {...register("nome")} />
          </FormField>
          <FormField label={t("configuracoes.endereco")} error={errors.endereco?.message}>
            <Input {...register("endereco")} />
          </FormField>
          <FormField label={t("configuracoes.telefone")} error={errors.telefone?.message}>
            <PhoneInput {...register("telefone")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("configuracoes.abertura")} error={errors.horario_abertura?.message}>
              <Input type="time" {...register("horario_abertura")} />
            </FormField>
            <FormField
              label={t("configuracoes.fechamento")}
              error={errors.horario_fechamento?.message}
            >
              <Input type="time" {...register("horario_fechamento")} />
            </FormField>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="loja-ativa" {...register("ativa")} />
            <Label htmlFor="loja-ativa">{t("common.active")}</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
