"use client";

import { useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useResourceList } from "@/hooks/use-resource";
import type { ListParams, Paginated } from "@/types/api";
import { Combobox, type ComboboxOption } from "./combobox";

interface RemoteComboboxProps<T extends { id: number }> {
  service: { name: string; list: (params?: ListParams) => Promise<Paginated<T>> };
  value: number | "" | undefined;
  onChange: (id: number | "") => void;
  getLabel: (item: T) => string;
  getDescription?: (item: T) => string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  extraParams?: ListParams;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Combobox com busca no servidor (?search=): a API pagina em 20 itens, então a lista
 * completa não cabe no navegador. A busca fica dentro da lista suspensa.
 */
export function RemoteCombobox<T extends { id: number }>({
  service,
  value,
  onChange,
  getLabel,
  getDescription,
  extraParams,
  ...props
}: Readonly<RemoteComboboxProps<T>>) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const { data, isFetching, isPlaceholderData } = useResourceList(service, {
    search: debounced,
    ...extraParams,
  });
  // Guarda o rótulo escolhido: ele continua visível mesmo que a busca mude as opções.
  const [selectedLabel, setSelectedLabel] = useState<string>();

  const options: ComboboxOption[] = (data?.results ?? []).map((item) => ({
    value: String(item.id),
    label: getLabel(item),
    description: getDescription?.(item),
  }));

  return (
    <Combobox
      {...props}
      options={options}
      value={value === "" || value === undefined ? "" : String(value)}
      selectedLabel={selectedLabel}
      // Enquanto a busca digitada não voltou, esconde os resultados anteriores.
      isLoading={search !== debounced || isPlaceholderData || (isFetching && options.length === 0)}
      onSearchChange={setSearch}
      onChange={(next) => {
        setSelectedLabel(options.find((option) => option.value === next)?.label);
        onChange(next ? Number(next) : "");
      }}
    />
  );
}
