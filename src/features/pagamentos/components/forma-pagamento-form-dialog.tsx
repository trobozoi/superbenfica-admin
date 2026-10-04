"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox, Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyFieldErrors, useSaveResource } from "@/hooks/use-resource";
import { formasPagamentoApi } from "@/services/api";
import { type FormaPagamento, TIPOS_PAGAMENTO } from "@/types/api";
import {
  type FormaPagamentoFormInput,
  type FormaPagamentoFormValues,
  formaPagamentoSchema,
} from "../schemas";

interface FormaPagamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente = criação. */
  forma?: FormaPagamento | null;
  /** Ordem sugerida para uma forma nova (fim da lista). */
  proximaOrdem: number;
}

function toFormValues(
  forma: FormaPagamento | null | undefined,
  proximaOrdem: number,
): FormaPagamentoFormInput {
  return {
    nome: forma?.nome ?? "",
    tipo: forma?.tipo ?? "PIX",
    permite_troco: forma?.permite_troco ?? false,
    ativa: forma?.ativa ?? true,
    ordem: forma?.ordem ?? proximaOrdem,
  };
}

export function FormaPagamentoFormDialog({
  open,
  onOpenChange,
  forma,
  proximaOrdem,
}: Readonly<FormaPagamentoFormDialogProps>) {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormaPagamentoFormInput, unknown, FormaPagamentoFormValues>({
    resolver: zodResolver(formaPagamentoSchema),
    defaultValues: toFormValues(forma, proximaOrdem),
  });

  useEffect(() => {
    if (open) reset(toFormValues(forma, proximaOrdem));
  }, [open, forma, proximaOrdem, reset]);

  const save = useSaveResource(formasPagamentoApi, {
    onSuccess: () => onOpenChange(false),
    onError: (error) => applyFieldErrors(setError, error),
  });

  const tipo = register("tipo", {
    // Dinheiro quase sempre aceita troco: já sugere marcado ao escolher o tipo.
    onChange: (event: { target: { value: string } }) =>
      setValue("permite_troco", event.target.value === "DINHEIRO"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{forma ? t("pagamentos.editTitle") : t("pagamentos.new")}</DialogTitle>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => save.mutate({ id: forma?.id, input: values }))}
        >
          <FormField
            label={t("pagamentos.nome")}
            error={errors.nome?.message}
            hint={t("pagamentos.nomeDica")}
          >
            <Input maxLength={60} {...register("nome")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("pagamentos.tipo")} error={errors.tipo?.message}>
              <NativeSelect {...tipo}>
                {TIPOS_PAGAMENTO.map((item) => (
                  <option key={item} value={item}>
                    {t(`tiposPagamento.${item}`)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField
              label={t("pagamentos.ordem")}
              error={errors.ordem?.message}
              hint={t("pagamentos.ordemDica")}
            >
              <Input type="number" min={0} inputMode="numeric" {...register("ordem")} />
            </FormField>
          </div>
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="forma-troco"
                aria-describedby="forma-troco-dica"
                {...register("permite_troco")}
              />
              <Label htmlFor="forma-troco">{t("pagamentos.permiteTroco")}</Label>
            </div>
            <p id="forma-troco-dica" className="text-xs text-muted-foreground">
              {t("pagamentos.permiteTrocoDica")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="forma-ativa" {...register("ativa")} />
            <Label htmlFor="forma-ativa">{t("pagamentos.ativa")}</Label>
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
