"use client";

import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { useLojas } from "@/components/layout/filial-selector";
import { NativeSelect } from "@/components/ui/input";
import { FormField } from "./form-field";

interface LojaFieldProps<TForm extends FieldValues, TOutput extends FieldValues> {
  control: Control<TForm, unknown, TOutput>;
  name: Path<TForm>;
  label: string;
  error?: string;
  disabled?: boolean;
  emptyLabel?: string;
}

/**
 * Select de filial CONTROLADO. Com `register` (não controlado), o valor era aplicado
 * antes de a lista de filiais chegar da API; sem a <option> correspondente o navegador
 * descartava o valor e o campo aparecia vazio. Controlado, ele se ajusta quando as
 * opções carregam.
 */
export function LojaField<TForm extends FieldValues, TOutput extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled,
  emptyLabel = "-",
}: Readonly<LojaFieldProps<TForm, TOutput>>) {
  const { data: lojas, isLoading } = useLojas();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormField label={label} error={error}>
          <NativeSelect
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-busy={isLoading}
            value={field.value === null || field.value === undefined ? "" : String(field.value)}
            onChange={(event) =>
              field.onChange(event.target.value ? Number(event.target.value) : "")
            }
          >
            <option value="">{emptyLabel}</option>
            {lojas?.map((loja) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      )}
    />
  );
}
