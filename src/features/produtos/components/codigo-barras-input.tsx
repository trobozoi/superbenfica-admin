"use client";

import { Loader2, Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CodigoBarrasInputProps extends ComponentProps<"input"> {
  onBuscar: () => void;
  buscando: boolean;
  buscarLabel: string;
}

/**
 * Campo do código de barras com o botão de buscar o produto. Recebe do FormField o id e
 * os atributos ARIA no próprio input, para o label continuar ligado a ele.
 */
export function CodigoBarrasInput({
  onBuscar,
  buscando,
  buscarLabel,
  ...props
}: Readonly<CodigoBarrasInputProps>) {
  return (
    <div className="flex gap-2">
      <Input {...props} />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={onBuscar}
        disabled={buscando}
        aria-label={buscarLabel}
        title={buscarLabel}
      >
        {buscando ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
      </Button>
    </div>
  );
}
