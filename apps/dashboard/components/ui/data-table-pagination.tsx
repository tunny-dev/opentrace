"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { getPageItems } from "./data-table-utils";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalRows: number;
  pageSizeOptions: number[];
}

export function DataTablePagination<TData>({
  table,
  totalRows,
  pageSizeOptions,
}: DataTablePaginationProps<TData>) {
  const { t } = useI18n();
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);
  const items = getPageItems(pageIndex, pageCount);

  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-(--ot-border) px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          <span className="font-medium text-foreground">
            {from}–{to}
          </span>{" "}
          {t("table.of")} <span className="font-medium text-foreground">{totalRows}</span>
        </span>
        <div className="flex items-center gap-2">
          <span>{t("table.rowsPerPage")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value) table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label={t("table.rowsPerPage")}
              className="h-7 w-[68px] cursor-pointer bg-background px-2.5 text-xs shadow-2xs"
            >
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="cursor-pointer text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <nav aria-label={t("table.tablePagination")} className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="cursor-pointer"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label={t("table.firstPage")}
        >
          <ChevronsLeft />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="cursor-pointer"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label={t("table.previousPage")}
        >
          <ChevronLeft />
        </Button>

        <div className="mx-1 hidden items-center gap-1 sm:flex">
          {items.map((item) =>
            typeof item === "number" ? (
              <Button
                key={item}
                type="button"
                variant={item === pageIndex ? "default" : "ghost"}
                size="icon-xs"
                aria-label={t("table.page", { n: item + 1 })}
                aria-current={item === pageIndex ? "page" : undefined}
                className={cn(
                  "cursor-pointer text-[11px] font-medium tabular-nums",
                  item === pageIndex && "bg-emerald-700 text-white hover:bg-emerald-700/90 dark:bg-emerald-600 dark:hover:bg-emerald-600/90"
                )}
                onClick={() => table.setPageIndex(item)}
              >
                {item + 1}
              </Button>
            ) : (
              <span
                key={item}
                aria-hidden="true"
                className="w-4 text-center text-xs text-muted-foreground"
              >
                …
              </span>
            )
          )}
        </div>
        <span className="mx-2 text-[11px] tabular-nums text-muted-foreground sm:hidden">
          {pageIndex + 1} / {pageCount}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="cursor-pointer"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label={t("table.nextPage")}
        >
          <ChevronRight />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="cursor-pointer"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          aria-label={t("table.lastPage")}
        >
          <ChevronsRight />
        </Button>
      </nav>
    </footer>
  );
}
