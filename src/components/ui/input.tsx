import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30";

export function Input({ className, type = "text", ...props }: Readonly<ComponentProps<"input">>) {
  return (
    <input
      type={type}
      className={cn(fieldBase, "h-9 py-1 file:mr-3 file:border-0 file:bg-transparent", className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: Readonly<ComponentProps<"textarea">>) {
  return <textarea className={cn(fieldBase, "min-h-20 py-2", className)} {...props} />;
}

/** Select nativo estilizado: acessível por padrão e funciona bem no mobile. */
export function NativeSelect({ className, ...props }: Readonly<ComponentProps<"select">>) {
  // Cores explícitas nas opções: a lista nativa não herda o tema em todos os navegadores.
  const optionColors = "[&_option]:bg-popover [&_option]:text-popover-foreground";
  return <select className={cn(fieldBase, "h-9 py-1 pr-8", optionColors, className)} {...props} />;
}

export function Checkbox({ className, ...props }: Readonly<Omit<ComponentProps<"input">, "type">>) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 rounded border-input accent-primary", className)}
      {...props}
    />
  );
}
