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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { applyFieldErrors, useApiMutation } from "@/hooks/use-resource";
import { REALTIME_INVALIDATIONS } from "@/lib/query-keys";
import { estoquesApi } from "@/services/api";
import type { EstoqueLocal } from "@/types/api";
import { type AjusteFormInput, type AjusteFormValues, ajusteSchema } from "../schemas";

interface AjusteDialogProps {
  estoque: EstoqueLocal | null;
  onClose: () => void;
}

export function AjusteDialog({ estoque, onClose }: Readonly<AjusteDialogProps>) {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AjusteFormInput, unknown, AjusteFormValues>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: { delta: "", motivo: "" },
  });

  useEffect(() => {
    if (estoque) reset({ delta: "", motivo: "" });
  }, [estoque, reset]);

  const ajustar = useApiMutation({
    mutationFn: (values: AjusteFormValues) => {
      if (!estoque) throw new Error("Nenhum estoque selecionado.");
      return estoquesApi.ajustar(estoque.id, values);
    },
    invalidate: REALTIME_INVALIDATIONS.estoque,
    onSuccess: onClose,
    onError: (error) => applyFieldErrors(setError, error),
  });

  return (
    <Dialog open={estoque !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("estoque.ajusteTitle")}</DialogTitle>
          <DialogDescription>
            {estoque?.produto_nome} · {estoque?.loja_nome} · {t("estoque.quantidade")}:{" "}
            {estoque?.quantidade}
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => ajustar.mutate(values))}
        >
          <FormField label={t("estoque.delta")} error={errors.delta?.message}>
            <Input type="number" step={1} inputMode="numeric" {...register("delta")} />
          </FormField>
          <FormField label={t("estoque.motivo")} error={errors.motivo?.message}>
            <Input placeholder={t("estoque.motivoPlaceholder")} {...register("motivo")} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={ajustar.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
