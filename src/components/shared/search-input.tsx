"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface SearchInputProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  label?: string;
}

/** Campo de busca com debounce: só dispara a consulta quando o usuário para de digitar. */
export function SearchInput({ onSearch, placeholder, label }: Readonly<SearchInputProps>) {
  const t = useTranslations("common");
  const [value, setValue] = useState("");
  const debounced = useDebouncedValue(value);

  useEffect(() => {
    onSearch(debounced.trim());
  }, [debounced, onSearch]);

  return (
    <div className="relative w-full sm:w-72">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        aria-label={label ?? t("search")}
        placeholder={placeholder ?? t("searchPlaceholder")}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-8"
      />
    </div>
  );
}
