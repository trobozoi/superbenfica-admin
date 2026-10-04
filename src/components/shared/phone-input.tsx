"use client";

import type { ChangeEvent, ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatTelefone } from "@/lib/telefone";

/**
 * Campo de telefone com máscara (85) 99999-9999. Funciona com `register` do
 * react-hook-form: o valor é formatado no próprio evento antes de seguir adiante.
 */
export function PhoneInput({ onChange, ...props }: Readonly<ComponentProps<"input">>) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = formatTelefone(event.target.value);
    onChange?.(event);
  };
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(00) 00000-0000"
      maxLength={15}
      onChange={handleChange}
      {...props}
    />
  );
}
