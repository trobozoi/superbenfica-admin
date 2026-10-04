"use client";

import { useTranslations } from "next-intl";
import { cloneElement, isValidElement, type ReactElement, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldControlProps {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

interface FormFieldProps {
  label: string;
  /** Chave de "validation" (erros do Zod) ou texto pronto (erros vindos da API). */
  error?: string;
  hint?: string;
  className?: string;
  children: ReactElement<FieldControlProps>;
}

/** Liga label, controle e mensagem de erro com os atributos ARIA corretos. */
export function FormField({ label, error, hint, className, children }: Readonly<FormFieldProps>) {
  const t = useTranslations("validation");
  const id = useId();
  const messageId = `${id}-message`;
  const message = error && t.has(error as never) ? t(error as never) : error;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": message || hint ? messageId : undefined,
      })
    : children;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {control}
      {(message ?? hint) && (
        <p
          id={messageId}
          className={cn("text-xs", message ? "text-destructive" : "text-muted-foreground")}
        >
          {message ?? hint}
        </p>
      )}
    </div>
  );
}
