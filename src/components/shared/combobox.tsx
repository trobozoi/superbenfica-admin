"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Texto secundário (ex.: e-mail do cliente, preço do produto). */
  description?: string;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText?: string;
  /** Texto do item selecionado quando ele não está entre as opções atuais (busca remota). */
  selectedLabel?: string;
  /**
   * Busca no servidor: recebe o texto digitado e desliga o filtro local.
   * Sem ele, as opções são filtradas no navegador.
   */
  onSearchChange?: (search: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  // Repassados pelo FormField para ligar label e mensagens de erro ao botão.
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Select com campo de busca DENTRO da lista (padrão combobox do shadcn/ui).
 * Teclado: Enter/Espaço abre, digitar filtra, setas navegam, Enter seleciona, Esc fecha.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  selectedLabel,
  onSearchChange,
  isLoading = false,
  disabled = false,
  className,
  id,
  ...aria
}: Readonly<ComboboxProps>) {
  const t = useTranslations("common");
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Item destacado (setas/Enter). Se ele saiu da lista (nova busca), destaca o primeiro:
  // assim Enter nunca escolhe um resultado antigo.
  const [highlighted, setHighlighted] = useState("");
  const activeValue = options.some((option) => option.value === highlighted)
    ? highlighted
    : (options[0]?.value ?? "");
  const selected = options.find((option) => option.value === value);
  const label = selected?.label ?? (value ? selectedLabel : undefined);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && search) {
      setSearch("");
      onSearchChange?.("");
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    onSearchChange?.(text);
  };

  return (
    // modal: dentro de um Dialog, mantém foco e rolagem da lista funcionando.
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          {...aria}
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30",
            className,
          )}
        >
          <span className={cn("truncate", !label && "text-muted-foreground")}>
            {label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <Command
          shouldFilter={!onSearchChange}
          loop
          value={onSearchChange ? activeValue : undefined}
          onValueChange={setHighlighted}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            value={search}
            onValueChange={handleSearch}
          />
          <CommandList id={listId}>
            {isLoading && (
              <div
                className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden /> {t("loading")}
              </div>
            )}
            {!isLoading && <CommandEmpty>{emptyText ?? t("emptyTitle")}</CommandEmpty>}
            {!isLoading &&
              options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label, option.description ?? ""]}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value);
                    handleOpenChange(false);
                  }}
                >
                  <Check
                    className={cn(option.value === value ? "opacity-100" : "opacity-0")}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
