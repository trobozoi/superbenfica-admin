"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { NativeSelect } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { lojasApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useFilialStore } from "@/store/filial-store";

/** Lista de filiais (cacheada por 5 min: muda raramente). */
export function useLojas() {
  return useQuery({
    queryKey: queryKeys.list(lojasApi.name, { page: 1 }),
    queryFn: () => lojasApi.list({ page: 1 }),
    staleTime: 5 * 60_000,
    select: (data) => data.results,
  });
}

/** Seletor de filial do ADMIN. Demais perfis ficam presos à própria filial. */
export function FilialSelector() {
  const t = useTranslations("filial");
  const role = useAuthStore((state) => state.user?.role);
  const selected = useFilialStore((state) => state.selectedLojaId);
  const setSelected = useFilialStore((state) => state.setSelectedLojaId);
  const { data: lojas } = useLojas();

  if (role !== "ADMIN") return null;

  return (
    <NativeSelect
      aria-label={t("label")}
      className="h-8 w-40 sm:w-52"
      value={selected ?? ""}
      onChange={(event) => setSelected(event.target.value ? Number(event.target.value) : null)}
    >
      <option value="">{t("all")}</option>
      {lojas?.map((loja) => (
        <option key={loja.id} value={loja.id}>
          {loja.nome}
        </option>
      ))}
    </NativeSelect>
  );
}
