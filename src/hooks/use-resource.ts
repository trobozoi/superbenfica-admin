"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { type ApiError, toApiError } from "@/services/http/errors";
import type { ResourceService } from "@/services/resource";
import type { ListParams, Paginated } from "@/types/api";

type Lister<T> = { name: string; list: (params?: ListParams) => Promise<Paginated<T>> };

/** Listagem paginada; mantém a página anterior visível enquanto a próxima carrega. */
export function useResourceList<T>(
  service: Lister<T>,
  params: ListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.list(service.name, params),
    queryFn: () => service.list(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

interface ApiMutationOptions<TVariables, TResult> {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /** Domínios de query keys a invalidar no sucesso (ex.: ["pedidos"]). */
  invalidate: readonly string[];
  successMessage?: string;
  onSuccess?: (result: TResult) => void;
  /** Recebe o erro normalizado (ex.: para preencher erros de campo). */
  onError?: (error: ApiError) => void;
}

/** Mutação padrão: invalida o cache, mostra toast e normaliza o erro do DRF. */
export function useApiMutation<TVariables, TResult>({
  mutationFn,
  invalidate,
  successMessage,
  onSuccess,
  onError,
}: ApiMutationOptions<TVariables, TResult>) {
  const queryClient = useQueryClient();
  const t = useTranslations("common");
  return useMutation({
    mutationFn,
    onSuccess: async (result) => {
      await Promise.all(
        invalidate.map((domain) => queryClient.invalidateQueries({ queryKey: [domain] })),
      );
      toast.success(successMessage ?? t("saved"));
      onSuccess?.(result);
    },
    onError: (error) => {
      const apiError = toApiError(error);
      toast.error(apiError.message);
      onError?.(apiError);
    },
  });
}

/** Salva (cria ou atualiza) um registro de um recurso CRUD. */
export function useSaveResource<T, TInput>(
  service: ResourceService<T, TInput>,
  options: Pick<ApiMutationOptions<unknown, T>, "onSuccess" | "onError"> = {},
) {
  return useApiMutation<{ id?: number; input: TInput }, T>({
    mutationFn: ({ id, input }) => (id ? service.update(id, input) : service.create(input)),
    invalidate: [service.name],
    ...options,
  });
}

export function useDeleteResource<T, TInput>(
  service: ResourceService<T, TInput>,
  onSuccess?: () => void,
) {
  const t = useTranslations("common");
  return useApiMutation<number, unknown>({
    mutationFn: (id) => service.remove(id),
    invalidate: [service.name],
    successMessage: t("deleted"),
    onSuccess,
  });
}

/** Copia os erros de campo do DRF para o react-hook-form. */
export function applyFieldErrors<TForm extends FieldValues>(
  setError: UseFormSetError<TForm>,
  error: ApiError,
): void {
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    setError(field as Path<TForm>, { type: "server", message });
  }
}
