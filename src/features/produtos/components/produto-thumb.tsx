import { ImageOff } from "lucide-react";
import { mediaSrc } from "@/lib/media";

interface ProdutoThumbProps {
  foto: string | null | undefined;
  alt: string;
}

/** Miniatura da foto do produto (ou um ícone neutro quando não há foto). */
export function ProdutoThumb({ foto, alt }: Readonly<ProdutoThumbProps>) {
  const src = mediaSrc(foto);
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem já otimizada (WebP) pela API.
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : (
        <ImageOff className="size-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}
