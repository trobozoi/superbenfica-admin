"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { produtosApi } from "@/services/api";
import { type CsvParseResult, CSV_TEMPLATE, parseProdutosCsv } from "../csv";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ERRORS_SHOWN = 8;

interface ProdutoImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Importação em lote: o CSV é lido e validado no navegador (com prévia) e cada linha
 * válida vira um POST /produtos/. A API não tem endpoint de lote, então os envios são
 * sequenciais para respeitar o limite de requisições (throttling).
 */
export function ProdutoImportDialog({ open, onOpenChange }: Readonly<ProdutoImportDialogProps>) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<CsvParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setResult(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setResult({ valid: [], errors: [{ line: 0, message: "Arquivo maior que 2 MB." }] });
      return;
    }
    setResult(parseProdutosCsv(await file.text()));
  };

  const runImport = async () => {
    if (!result?.valid.length) return;
    setImporting(true);
    let ok = 0;
    for (const produto of result.valid) {
      try {
        await produtosApi.create(produto);
        ok += 1;
      } catch {
        // Falhas (ex.: SKU duplicado) são contabilizadas no resumo final.
      }
    }
    setImporting(false);
    await queryClient.invalidateQueries({ queryKey: [produtosApi.name] });
    toast.success(t("produtos.importDone", { ok, failed: result.valid.length - ok }));
    setResult(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-produtos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("produtos.importTitle")}</DialogTitle>
          <DialogDescription>{t("produtos.importDescription")}</DialogDescription>
        </DialogHeader>
        <Button variant="link" className="h-auto justify-start px-0" onClick={downloadTemplate}>
          <Download aria-hidden /> {t("produtos.downloadTemplate")}
        </Button>
        <FormField label={t("produtos.importFile")}>
          <Input type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event)} />
        </FormField>
        {result && (
          <div className="space-y-2 text-sm" aria-live="polite">
            <p className="font-medium">
              {t("produtos.importPreview", {
                valid: result.valid.length,
                invalid: result.errors.length,
              })}
            </p>
            {result.errors.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md bg-destructive/10 p-3 text-destructive">
                {result.errors.slice(0, MAX_ERRORS_SHOWN).map((error) => (
                  <li key={`${error.line}-${error.message}`}>
                    {t("produtos.importLine", { line: error.line })}: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!result?.valid.length || importing} onClick={() => void runImport()}>
            {importing && <Loader2 className="animate-spin" aria-hidden />}
            {t("produtos.importRun", { count: result?.valid.length ?? 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
