"use client";

import { ImageOff, ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { mediaSrc } from "@/lib/media";
import { FOTO_TIPOS, type FotoErro, validarFoto } from "../foto";
import type { FotoAlteracao } from "../estoque";

interface FotoFieldProps {
  /** URL da foto atual na API (edição). */
  atual: string | null | undefined;
  value: FotoAlteracao;
  onChange: (value: FotoAlteracao) => void;
}

/** Escolha da foto com pré-visualização. Nada é enviado até o usuário salvar o produto. */
export function FotoField({ atual, value, onChange }: Readonly<FotoFieldProps>) {
  const t = useTranslations("produtos");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [erro, setErro] = useState<FotoErro | null>(null);

  // Libera a URL temporária da pré-visualização quando ela muda ou o campo sai da tela.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const atualSrc = value === null ? null : mediaSrc(atual);
  const src = value instanceof File ? preview : atualSrc;

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    const problema = validarFoto(file);
    setErro(problema);
    if (problema) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleRemove = () => {
    setErro(null);
    setPreview(null);
    // Sem foto salva, remover só descarta a escolha; com foto salva, apaga na API.
    onChange(atual ? null : undefined);
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium" id={`${inputId}-label`}>
        {t("foto")}
      </span>
      <div className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: e rota própria; next/image não otimiza blob.
            <img src={src} alt={t("fotoAlt")} className="size-full object-cover" />
          ) : (
            <ImageOff className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="grid gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={FOTO_TIPOS.join(",")}
            className="sr-only"
            aria-labelledby={`${inputId}-label`}
            aria-describedby={`${inputId}-hint`}
            onChange={handleFile}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <ImagePlus aria-hidden /> {src ? t("fotoTrocar") : t("fotoEscolher")}
            </Button>
            {src && (
              <Button variant="ghost" size="sm" onClick={handleRemove}>
                <Trash2 aria-hidden /> {t("fotoRemover")}
              </Button>
            )}
          </div>
          <p
            id={`${inputId}-hint`}
            className={erro ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
            role={erro ? "alert" : undefined}
          >
            {erro ? t(erro) : t("fotoDica")}
          </p>
        </div>
      </div>
    </div>
  );
}
