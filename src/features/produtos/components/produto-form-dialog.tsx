"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLojas } from "@/components/layout/filial-selector";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyFieldErrors } from "@/hooks/use-resource";
import { queryKeys } from "@/lib/query-keys";
import { estoquesApi } from "@/services/api";
import { toApiError } from "@/services/http/errors";
import { useAuthStore } from "@/store/auth-store";
import { CATEGORIAS, type Produto } from "@/types/api";
import {
  buildEstoqueRows,
  type FotoAlteracao,
  ProdutoParcialError,
  salvarProduto,
} from "../estoque";
import { type ProdutoFormInput, type ProdutoFormValues, produtoFormSchema } from "../schemas";
import { EstoqueFields } from "./estoque-fields";
import { FotoField } from "./foto-field";

interface ProdutoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente = criação. */
  produto?: Produto | null;
}

function toFormValues(produto?: Produto | null): ProdutoFormInput {
  return {
    nome: produto?.nome ?? "",
    sku: produto?.sku ?? "",
    codigo_barras: produto?.codigo_barras ?? "",
    preco: produto?.preco ?? "",
    categoria: produto?.categoria,
    descricao: produto?.descricao ?? "",
    ativo: produto?.ativo ?? true,
    estoques: [],
  };
}

/** O leitor de código de barras "digita" o código e tecla Enter: não pode enviar o formulário. */
function ignorarEnterDoLeitor(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}

/** Linhas de estoque por filial: filiais visíveis + estoques já existentes do produto. */
function useEstoqueRows(open: boolean, produtoId: number | undefined) {
  const user = useAuthStore((state) => state.user);
  const lojas = useLojas();
  const estoques = useQuery({
    queryKey: queryKeys.list(estoquesApi.name, { produto: produtoId }),
    queryFn: () => estoquesApi.list({ produto: produtoId }),
    enabled: open && produtoId !== undefined,
  });
  const isLoading = lojas.isLoading || (produtoId !== undefined && estoques.isLoading);
  const lojaRestrita = user?.role === "ADMIN" ? null : (user?.lojaId ?? null);
  const rows =
    isLoading || !lojas.data
      ? null
      : buildEstoqueRows(lojas.data, estoques.data?.results ?? [], lojaRestrita);
  return { rows, isLoading };
}

export function ProdutoFormDialog({
  open,
  onOpenChange,
  produto,
}: Readonly<ProdutoFormDialogProps>) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  // Se o produto foi criado mas o estoque falhou, o próximo envio edita esse produto.
  const [savedProduto, setSavedProduto] = useState<Produto | null>(null);
  // Foto escolhida: só é enviada ao salvar (File = nova, null = remover).
  const [foto, setFoto] = useState<FotoAlteracao>(undefined);
  const current = produto ?? savedProduto;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProdutoFormInput, unknown, ProdutoFormValues>({
    resolver: zodResolver(produtoFormSchema),
    defaultValues: toFormValues(produto),
  });
  const { fields, replace } = useFieldArray({ control, name: "estoques" });
  const { rows, isLoading } = useEstoqueRows(open, current?.id);

  useEffect(() => {
    if (open) reset(toFormValues(produto));
  }, [open, produto, reset]);

  // As filiais e os estoques chegam da API depois que o formulário abre.
  const rowsKey = rows ? JSON.stringify(rows) : null;
  useEffect(() => {
    if (open && rowsKey) replace(JSON.parse(rowsKey) as ProdutoFormInput["estoques"]);
  }, [open, rowsKey, replace]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSavedProduto(null);
      setFoto(undefined);
    }
    onOpenChange(next);
  };

  const save = useMutation({
    mutationFn: (values: ProdutoFormValues) => salvarProduto(current?.id, values, foto),
    onSuccess: async () => {
      await Promise.all(
        ["produtos", "estoques", "relatorios"].map((domain) =>
          queryClient.invalidateQueries({ queryKey: [domain] }),
        ),
      );
      toast.success(t("common.saved"));
      handleOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ProdutoParcialError) {
        setSavedProduto(error.produto);
        void queryClient.invalidateQueries({ queryKey: ["produtos"] });
        void queryClient.invalidateQueries({ queryKey: ["estoques"] });
        const detalhe = toApiError(error.original).message;
        const chave = error.etapa === "foto" ? "produtos.fotoFalhou" : "produtos.estoqueFalhou";
        toast.error(t(chave, { detalhe }));
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
          <DialogTitle>{current ? t("produtos.editTitle") : t("produtos.new")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => save.mutate(values))}
          noValidate
          className="grid gap-4"
        >
          <FormField label={t("produtos.nome")} error={errors.nome?.message}>
            <Input {...register("nome")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("produtos.sku")} error={errors.sku?.message}>
              <Input {...register("sku")} />
            </FormField>
            <FormField
              label={t("produtos.codigoBarras")}
              error={errors.codigo_barras?.message}
              hint={t("produtos.codigoBarrasDica")}
            >
              <Input
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                className="font-mono"
                onKeyDown={ignorarEnterDoLeitor}
                {...register("codigo_barras")}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("produtos.preco")} error={errors.preco?.message}>
              <Input inputMode="decimal" placeholder="0,00" {...register("preco")} />
            </FormField>
            <FormField label={t("produtos.categoria")} error={errors.categoria?.message}>
              <NativeSelect
                {...register("categoria", { setValueAs: (value: string) => value || undefined })}
              >
                <option value="">-</option>
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {t(`categorias.${categoria}`)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          <FormField label={t("produtos.descricao")} error={errors.descricao?.message}>
            <Textarea rows={2} {...register("descricao")} />
          </FormField>
          <FotoField key={String(open)} atual={current?.foto} value={foto} onChange={setFoto} />
          <div className="flex items-center gap-2">
            <Checkbox id="produto-ativo" {...register("ativo")} />
            <Label htmlFor="produto-ativo">{t("produtos.ativo")}</Label>
          </div>
          <EstoqueFields
            rows={fields}
            register={register}
            errors={errors.estoques}
            isLoading={isLoading || (rows !== null && fields.length === 0 && rows.length > 0)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending || isLoading}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
