"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { API_PAGE_SIZE } from "@/config/endpoints";

interface PaginationProps {
  page: number;
  count: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, count, onPageChange }: Readonly<PaginationProps>) {
  const t = useTranslations("common");
  const totalPages = Math.max(1, Math.ceil(count / API_PAGE_SIZE));
  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col items-center justify-between gap-2 border-t px-3 py-3 text-sm sm:flex-row"
    >
      <span className="text-muted-foreground">{t("totalRecords", { count })}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden />
          {t("previous")}
        </Button>
        <span aria-live="polite">{t("pageOf", { page, total: totalPages })}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("next")}
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
