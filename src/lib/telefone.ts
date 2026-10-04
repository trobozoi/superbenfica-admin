import { z } from "zod";

const MAX_DIGITS = 11;

const DDI_BRASIL = "55";

/** Só os dígitos, sem o DDI +55 quando o número for colado no formato internacional. */
export function telefoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  const semDdi =
    digits.length > MAX_DIGITS && digits.startsWith(DDI_BRASIL) ? digits.slice(2) : digits;
  return semDdi.slice(0, MAX_DIGITS);
}

/**
 * Máscara de telefone brasileiro com DDD, aplicada enquanto o usuário digita:
 * fixo (10 dígitos) -> (85) 3200-1000 | celular (11 dígitos) -> (85) 99999-9999.
 */
export function formatTelefone(value: string): string {
  const digits = telefoneDigits(value);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const numero = digits.slice(2);
  // Até 8 dígitos o hífen fica após o 4º (fixo); com 9 dígitos, após o 5º (celular).
  const split = numero.length > 8 ? 5 : 4;
  if (numero.length <= split) return `(${ddd}) ${numero}`;
  return `(${ddd}) ${numero.slice(0, split)}-${numero.slice(split)}`;
}

/** Telefone opcional: vazio é aceito; preenchido precisa ter DDD + 8 ou 9 dígitos. */
export const telefoneSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || [10, 11].includes(telefoneDigits(value).length), {
    error: "telefone",
  });
