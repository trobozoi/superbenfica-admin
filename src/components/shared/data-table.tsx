"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "./feedback";
import { Pagination } from "./pagination";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Esconde a coluna em telas pequenas. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: readonly Column<T>[];
  rows: readonly T[] | undefined;
  getRowId: (row: T) => string | number;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  page?: number;
  count?: number;
  onPageChange?: (page: number) => void;
  toolbar?: ReactNode;
  empty?: ReactNode;
}

const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

function columnClass<T>(column: Column<T>) {
  return cn(column.hideOnMobile && "hidden md:table-cell", column.className);
}

/** Tabela genérica com estados de carregamento, erro, vazio e paginação da API. */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  error,
  onRetry,
  page,
  count,
  onPageChange,
  toolbar,
  empty,
}: Readonly<DataTableProps<T>>) {
  const renderBody = () => {
    if (isLoading) {
      return SKELETON_ROWS.map((id) => (
        <TableRow key={id}>
          {columns.map((column) => (
            <TableCell key={column.key} className={columnClass(column)}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }
    return rows?.map((row) => (
      <TableRow key={getRowId(row)}>
        {columns.map((column) => (
          <TableCell key={column.key} className={columnClass(column)}>
            {column.cell(row)}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  const showError = Boolean(error) && !isLoading;
  const showEmpty = !isLoading && !error && rows?.length === 0;

  return (
    <Card className="overflow-hidden">
      {toolbar && <div className="flex flex-wrap items-end gap-3 border-b p-3">{toolbar}</div>}
      {showError && <ErrorState error={error} onRetry={onRetry} />}
      {showEmpty && (empty ?? <EmptyState />)}
      {!showError && !showEmpty && (
        <Table aria-busy={isLoading}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={columnClass(column)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      )}
      {onPageChange && page !== undefined && count !== undefined && count > 0 && (
        <Pagination page={page} count={count} onPageChange={onPageChange} />
      )}
    </Card>
  );
}
