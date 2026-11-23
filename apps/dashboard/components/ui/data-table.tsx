"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Braces,
  ClipboardCopy,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FilterX,
  RotateCcw,
  Rows3,
  Rows4,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { DataTableFacetedFilterMenu } from "./data-table-faceted-filter";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableRowActions } from "./data-table-row-actions";
import type {
  DataTableActionContext,
  DataTableBulkAction,
  DataTableFacetedFilter,
  DataTableQuickFilter,
  DataTableRowAction,
} from "./data-table-types";
import {
  copyToClipboard,
  defaultSearchText,
  downloadFile,
  rowsToCsv,
} from "./data-table-utils";

export { DataTableColumnHeader } from "./data-table-column-header";
export type {
  DataTableActionContext,
  DataTableBulkAction,
  DataTableFacetedFilter,
  DataTableFacetedOption,
  DataTableQuickFilter,
  DataTableRowAction,
} from "./data-table-types";

type Density = "comfortable" | "compact";

const QUICK_FILTER_ACTIVE: Record<NonNullable<DataTableQuickFilter<unknown>["color"]>, string> = {
  default:
    "bg-card text-foreground shadow-xs ring-1 ring-(--ot-border) dark:bg-(--ot-text) dark:text-(color:--ot-panel) dark:shadow-none dark:ring-0",
  emerald: "bg-emerald-700 text-white dark:bg-emerald-600",
  amber: "bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-black",
  rose: "bg-rose-600 text-white",
  purple: "bg-purple-600 text-white",
  blue: "bg-sky-700 text-white dark:bg-sky-600",
};

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  searchPlaceholder?: string;
  /** Text the global search matches against. Must be referentially stable. */
  getSearchText?: (row: TData) => string;
  getRowId?: (row: TData, index: number) => string;
  facetedFilters?: DataTableFacetedFilter<TData>[];
  quickFilters?: DataTableQuickFilter<TData>[];
  onRowClick?: (row: TData) => void;
  rowActions?: (row: TData, ctx: DataTableActionContext) => DataTableRowAction[];
  bulkActions?: DataTableBulkAction<TData>[];
  toolbarActions?: React.ReactNode;
  enableRowSelection?: boolean;
  isLoading?: boolean;
  exportFileName?: string;
  emptyMessage?: string;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  getRowClassName?: (row: TData) => string | undefined;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

function selectRange<TData>(table: Table<TData>, fromId: string, toId: string) {
  const rows = table.getRowModel().rows;
  const a = rows.findIndex((row) => row.id === fromId);
  const b = rows.findIndex((row) => row.id === toId);
  if (a < 0 || b < 0) return false;
  const [start, end] = a < b ? [a, b] : [b, a];
  const range = rows.slice(start, end + 1);
  table.setRowSelection((old) => {
    const next = { ...old };
    for (const row of range) next[row.id] = true;
    return next;
  });
  return true;
}

export function DataTable<TData>({
  columns,
  data,
  title,
  description,
  badge,
  searchPlaceholder,
  getSearchText,
  getRowId,
  facetedFilters = [],
  quickFilters = [],
  onRowClick,
  rowActions,
  bulkActions = [],
  toolbarActions,
  enableRowSelection = true,
  isLoading = false,
  exportFileName = "export",
  emptyMessage,
  initialSorting = [],
  initialColumnVisibility = {},
  initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  getRowClassName,
}: DataTableProps<TData>) {
  const { t } = useI18n();
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("table.searchPlaceholder");
  const resolvedEmptyMessage = emptyMessage ?? t("table.emptyDefault");

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [density, setDensity] = React.useState<Density>("comfortable");
  const [search, setSearch] = React.useState("");
  const [facetValues, setFacetValues] = React.useState<Record<string, string[]>>({});
  const [activeQuickFilter, setActiveQuickFilter] = React.useState("all");

  const deferredSearch = React.useDeferredValue(search);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const lastSelectedId = React.useRef<string | null>(null);

  const resetPage = React.useCallback(
    () => setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })),
    []
  );

  const updateSearch = React.useCallback(
    (value: string) => {
      setSearch(value);
      resetPage();
    },
    [resetPage]
  );

  const copy = React.useCallback(
    async (text: string, label?: string) => {
      const ok = await copyToClipboard(text);
      if (ok) {
        toast.success(t("table.copiedToClipboard", { label: label ?? t("table.value") }));
      } else {
        toast.error(t("table.clipboardError"));
      }
    },
    [t]
  );

  const actionContext = React.useMemo<DataTableActionContext>(
    () => ({ setSearch: updateSearch, copy }),
    [updateSearch, copy]
  );

  // Focus search with "/" like most developer tools.
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "")) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ------------------------------ filtering ------------------------------ */

  const searchIndex = React.useMemo(
    () => data.map((row) => (getSearchText ? getSearchText(row) : defaultSearchText(row)).toLowerCase()),
    [data, getSearchText]
  );

  const searchTerms = React.useMemo(
    () => deferredSearch.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [deferredSearch]
  );

  const matchesFacet = React.useCallback(
    (facet: DataTableFacetedFilter<TData>, row: TData, value: string) => {
      if (facet.filterFn) return facet.filterFn(row, value);
      const raw = facet.getValue
        ? facet.getValue(row)
        : (row as Record<string, unknown>)[facet.id];
      return String(raw ?? "").toLowerCase() === value.toLowerCase();
    },
    []
  );

  const filterRows = React.useCallback(
    (exclude?: { facet?: string; quick?: boolean }) => {
      const quick = exclude?.quick
        ? undefined
        : quickFilters.find((filter) => filter.id === activeQuickFilter);
      return data.filter((row, index) => {
        if (searchTerms.length > 0 && !searchTerms.every((term) => searchIndex[index].includes(term))) {
          return false;
        }
        for (const facet of facetedFilters) {
          if (facet.id === exclude?.facet) continue;
          const values = facetValues[facet.id];
          if (values?.length && !values.some((value) => matchesFacet(facet, row, value))) {
            return false;
          }
        }
        return quick ? quick.predicate(row) : true;
      });
    },
    [
      data,
      searchIndex,
      searchTerms,
      facetedFilters,
      facetValues,
      quickFilters,
      activeQuickFilter,
      matchesFacet,
    ]
  );

  const filteredData = React.useMemo(() => filterRows(), [filterRows]);

  const facetCounts = React.useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    for (const facet of facetedFilters) {
      const base = filterRows({ facet: facet.id });
      result[facet.id] = Object.fromEntries(
        facet.options.map((option) => [
          option.value,
          base.filter((row) => matchesFacet(facet, row, option.value)).length,
        ])
      );
    }
    return result;
  }, [facetedFilters, filterRows, matchesFacet]);

  const quickCounts = React.useMemo(() => {
    const base = filterRows({ quick: true });
    return Object.fromEntries(
      quickFilters.map((filter) => [filter.id, base.filter(filter.predicate).length])
    ) as Record<string, number>;
  }, [quickFilters, filterRows]);

  const hasActiveFilters =
    searchTerms.length > 0 ||
    Object.values(facetValues).some((values) => values.length > 0) ||
    activeQuickFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setFacetValues({});
    setActiveQuickFilter("all");
    resetPage();
  };

  /* -------------------------------- columns ------------------------------ */

  const selectionColumn = React.useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: "select",
      size: 44,
      enableSorting: false,
      enableHiding: false,
      meta: { label: t("table.select"), align: "center" },
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
            aria-label={t("table.selectAllRows")}
          />
        </div>
      ),
      cell: ({ row, table }) => (
        <div
          className="flex items-center justify-center"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onClickCapture={(event) => {
            const anchor = lastSelectedId.current;
            if (event.shiftKey && anchor && anchor !== row.id && selectRange(table, anchor, row.id)) {
              event.preventDefault();
              event.stopPropagation();
              lastSelectedId.current = row.id;
            }
          }}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              lastSelectedId.current = row.id;
              row.toggleSelected(value);
            }}
            aria-label={t("table.selectRow", { id: row.id })}
          />
        </div>
      ),
    }),
    [t]
  );

  const allColumns = React.useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [enableRowSelection, selectionColumn, columns]
  );

  /* --------------------------------- table ------------------------------- */

  const table = useReactTable({
    data: filteredData,
    columns: allColumns,
    getRowId: getRowId ?? ((row, index) => {
      const id = (row as { id?: unknown }).id;
      return id !== undefined && id !== null ? String(id) : String(index);
    }),
    state: { sorting, rowSelection, columnVisibility, pagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      resetPage();
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = table.getPageCount();
  React.useEffect(() => {
    if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
      setPagination((prev) => ({ ...prev, pageIndex: Math.max(pageCount - 1, 0) }));
    }
  }, [pageCount, pagination.pageIndex]);

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const pageRows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns();
  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  const hasHiddenColumns = hideableColumns.some((column) => !column.getIsVisible());
  const showSelectAll =
    selectedCount > 0 && table.getIsAllPageRowsSelected() && selectedCount < filteredData.length;

  const columnLabel = (id: string) => {
    const column = table.getColumn(id);
    const header = column?.columnDef.header;
    return column?.columnDef.meta?.label ?? (typeof header === "string" ? header : id);
  };

  /* -------------------------------- actions ------------------------------ */

  const exportData = (format: "csv" | "json", scope: "all" | "selected") => {
    const items = scope === "selected" ? selectedRows.map((row) => row.original) : filteredData;
    if (items.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const suffix = scope === "selected" ? "-selected" : "";
    if (format === "csv") {
      downloadFile(
        `\uFEFF${rowsToCsv(items)}`,
        `${exportFileName}${suffix}-${stamp}.csv`,
        "text/csv;charset=utf-8"
      );
    } else {
      downloadFile(
        JSON.stringify(items, null, 2),
        `${exportFileName}${suffix}-${stamp}.json`,
        "application/json"
      );
    }
    toast.success(
      t(items.length === 1 ? "table.exportedOne" : "table.exportedMany", {
        count: items.length,
        format: format.toUpperCase(),
      })
    );
  };

  const buildRowActions = (row: Row<TData>): DataTableRowAction[] => [
    ...(onRowClick
      ? [
          {
            label: t("table.viewDetails"),
            icon: <Eye />,
            onSelect: () => onRowClick(row.original),
          },
        ]
      : []),
    ...(rowActions?.(row.original, actionContext) ?? []),
    {
      label: t("table.copyRowId"),
      icon: <Copy />,
      onSelect: () => copy(row.id, t("table.rowId")),
      separatorBefore: true,
    },
    {
      label: t("table.copyAsJson"),
      icon: <Braces />,
      onSelect: () => copy(JSON.stringify(row.original, null, 2), t("table.rowJson")),
    },
  ];

  const handleRowClick = (row: Row<TData>) => {
    if (!onRowClick) return;
    // Let users select text inside a row without opening it.
    if (window.getSelection()?.toString()) return;
    onRowClick(row.original);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, row: Row<TData>) => {
    if (event.target !== event.currentTarget) return;
    const current = event.currentTarget;
    switch (event.key) {
      case "Enter":
        if (onRowClick) {
          event.preventDefault();
          onRowClick(row.original);
        }
        break;
      case " ":
        if (enableRowSelection) {
          event.preventDefault();
          lastSelectedId.current = row.id;
          row.toggleSelected();
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        (current.nextElementSibling as HTMLElement | null)?.focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        (current.previousElementSibling as HTMLElement | null)?.focus();
        break;
      case "Escape":
        if (selectedCount > 0) table.resetRowSelection();
        break;
    }
  };

  const cellPadding = density === "compact" ? "px-3 py-1.5" : "px-3 py-3";
  const colSpan = visibleColumns.length + 1;

  return (
    <section className="panel-card flex min-w-0 flex-col overflow-hidden" aria-label={title}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {title && <h2 className="text-sm font-semibold text-(color:--ot-text)">{title}</h2>}
            <Badge variant="secondary" size="sm" className="font-mono tabular-nums">
              {hasActiveFilters
                ? `${filteredData.length} ${t("table.of")} ${data.length}`
                : data.length}
            </Badge>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-xs text-(color:--ot-muted)">{description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {toolbarActions}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" size="sm" className="h-7 cursor-pointer gap-1.5 text-xs" />
              }
            >
              <SlidersHorizontal aria-hidden="true" />
              <span className="hidden sm:inline">{t("table.columns")}</span>
              {hasHiddenColumns && (
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-label={t("table.columnsHidden")}
                />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                  {t("table.toggleColumns")}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {hideableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  className="cursor-pointer text-xs"
                >
                  {columnLabel(column.id)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer justify-center text-xs"
                onClick={() => setColumnVisibility(initialColumnVisibility)}
              >
                {t("table.resetColumns")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-7 cursor-pointer"
            onClick={() => setDensity((prev) => (prev === "comfortable" ? "compact" : "comfortable"))}
            aria-label={
              density === "comfortable" ? t("table.switchToCompact") : t("table.switchToComfortable")
            }
            title={density === "comfortable" ? t("table.compactRows") : t("table.comfortableRows")}
          >
            {density === "comfortable" ? <Rows4 /> : <Rows3 />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" size="sm" className="h-7 cursor-pointer gap-1.5 text-xs" />
              }
            >
              <Download aria-hidden="true" />
              <span className="hidden sm:inline">{t("table.export")}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                  {t(filteredData.length === 1 ? "table.filteredRecord" : "table.filteredRecords", {
                    count: filteredData.length,
                  })}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                disabled={filteredData.length === 0}
                onClick={() => exportData("csv", "all")}
              >
                <FileSpreadsheet /> {t("table.downloadCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                disabled={filteredData.length === 0}
                onClick={() => exportData("json", "all")}
              >
                <Braces /> {t("table.downloadJson")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                disabled={filteredData.length === 0}
                onClick={() =>
                  copy(JSON.stringify(filteredData, null, 2), t("table.filteredRecordsLabel"))
                }
              >
                <ClipboardCopy /> {t("table.copyAsJson")}
              </DropdownMenuItem>
              {selectedCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                      {t("table.selectedCount", { count: selectedCount })}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer text-xs"
                    onClick={() => exportData("csv", "selected")}
                  >
                    <FileSpreadsheet /> {t("table.selectedAsCsv")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-xs"
                    onClick={() => exportData("json", "selected")}
                  >
                    <Braces /> {t("table.selectedAsJson")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-(--ot-border) px-4 pb-3">
        <div className="relative w-full min-w-0 sm:w-64 sm:flex-none lg:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                if (search) updateSearch("");
                else event.currentTarget.blur();
              }
            }}
            placeholder={resolvedSearchPlaceholder}
            aria-label={resolvedSearchPlaceholder}
            className="h-7 w-full rounded-md border border-(--ot-border) bg-background pr-8 pl-8 text-xs text-foreground shadow-2xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-emerald-500/60 focus-visible:ring-2 focus-visible:ring-emerald-500/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {search ? (
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              onClick={() => {
                updateSearch("");
                searchRef.current?.focus();
              }}
              aria-label={t("table.clearSearch")}
              className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground p-0"
            >
              <X className="size-3" />
            </Button>
          ) : (
            <kbd className="pointer-events-none absolute top-1/2 right-2 hidden h-4 -translate-y-1/2 items-center rounded border border-(--ot-border) bg-muted/50 px-1 font-mono text-[10px] text-muted-foreground sm:flex">
              /
            </kbd>
          )}
        </div>

        {facetedFilters.map((facet) => (
          <DataTableFacetedFilterMenu
            key={facet.id}
            title={facet.title}
            options={facet.options}
            selected={facetValues[facet.id] ?? []}
            counts={facetCounts[facet.id] ?? {}}
            onChange={(values) => {
              setFacetValues((prev) => ({ ...prev, [facet.id]: values }));
              resetPage();
            }}
          />
        ))}

        {quickFilters.length > 0 && (
          <div
            role="group"
            aria-label={t("table.quickFilters")}
            className="flex items-center gap-0.5 rounded-md border border-(--ot-border) bg-muted/40 p-0.5"
          >
            {[{ id: "all", label: t("table.all"), color: "default" as const }, ...quickFilters].map((filter) => {
              const active = activeQuickFilter === filter.id;
              const count = filter.id === "all" ? undefined : quickCounts[filter.id];
              return (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="xs"
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setActiveQuickFilter(filter.id);
                    resetPage();
                  }}
                  className={cn(
                    "flex h-6 cursor-pointer items-center gap-1.5 rounded px-2 text-[11px] font-medium transition-colors",
                    active
                      ? QUICK_FILTER_ACTIVE[filter.color ?? "default"]
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  {filter.label}
                  {count !== undefined && (
                    <span className={cn("font-mono text-[10px] tabular-nums", active ? "opacity-80" : "opacity-60")}>
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 cursor-pointer gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={resetFilters}
            >
              <FilterX aria-hidden="true" /> {t("table.clearFilters")}
            </Button>
          )}
          {sorting.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 cursor-pointer gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSorting([])}
            >
              <RotateCcw aria-hidden="true" /> {t("table.resetSort")}
            </Button>
          )}
        </div>
      </div>

      {/* Selection bar */}
      {selectedCount > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 border-b border-emerald-500/25 bg-emerald-500/8 px-4 py-2 animate-in fade-in slide-in-from-top-1"
        >
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {t("table.selectedCount", { count: selectedCount })}
          </span>
          {showSelectAll && (
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-6 cursor-pointer px-1 text-xs"
              onClick={() => table.toggleAllRowsSelected(true)}
            >
              {t("table.selectAllCount", { count: filteredData.length })}
            </Button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant={action.variant ?? "outline"}
                size="xs"
                className="cursor-pointer gap-1.5 bg-background/60 text-xs"
                onClick={() => action.onClick(selectedRows.map((row) => row.original), actionContext)}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="cursor-pointer gap-1 text-xs"
              onClick={() => table.resetRowSelection()}
            >
              <X /> {t("table.clear")}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-h-[min(68vh,720px)] min-h-0 overflow-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-xs whitespace-nowrap">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const sorted = header.column.getIsSorted();
                  const fixedWidth = header.column.columnDef.size;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                      }
                      style={fixedWidth ? { width: fixedWidth } : undefined}
                      className={cn(
                        "h-9 border-b border-(--ot-border) bg-(--ot-panel-raised) px-3 text-[11px] font-medium uppercase tracking-wider text-(color:--ot-muted) first:pl-4",
                        meta?.align === "right" && "text-right",
                        meta?.align === "center" && "text-center",
                        meta?.headerClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
                <th
                  scope="col"
                  style={{ width: 48 }}
                  className="h-9 border-b border-(--ot-border) bg-(--ot-panel-raised) pr-3"
                >
                  <span className="sr-only">{t("table.actions")}</span>
                </th>
              </tr>
            ))}
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: Math.min(pagination.pageSize, 6) }, (_, index) => (
                <tr key={index}>
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className={cn("border-b border-(--ot-border)/60 first:pl-4", cellPadding)}
                    >
                      <Skeleton className="h-4 w-full max-w-24" />
                    </td>
                  ))}
                  <td className={cn("border-b border-(--ot-border)/60", cellPadding)} />
                </tr>
              ))
            ) : pageRows.length > 0 ? (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={() => handleRowClick(row)}
                  onKeyDown={(event) => handleRowKeyDown(event, row)}
                  className={cn(
                    "group/row outline-none transition-colors",
                    "hover:bg-(--ot-table-hover) focus-visible:bg-(--ot-table-hover) focus-visible:shadow-[inset_2px_0_0_0_var(--color-emerald-500)]",
                    "data-[state=selected]:bg-emerald-500/8",
                    "[&:last-child>td]:border-b-0",
                    onRowClick && "cursor-pointer",
                    getRowClassName?.(row.original)
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "border-b border-(--ot-border)/60 align-middle text-(color:--ot-text) first:pl-4",
                          cellPadding,
                          meta?.align === "right" && "text-right",
                          meta?.align === "center" && "text-center",
                          meta?.cellClassName
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                  <td className={cn("border-b border-(--ot-border)/60 pr-3 align-middle", density === "compact" ? "py-1" : "py-2")}>
                    <DataTableRowActions getActions={() => buildRowActions(row)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colSpan} className="px-4 py-16">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-full border border-(--ot-border) bg-muted/50 text-muted-foreground">
                      <SearchX className="size-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-(color:--ot-text)">
                        {hasActiveFilters ? t("table.noMatching") : resolvedEmptyMessage}
                      </p>
                      {hasActiveFilters && (
                        <p className="text-xs text-(color:--ot-muted)">{t("table.tryDifferent")}</p>
                      )}
                    </div>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 cursor-pointer gap-1.5 text-xs"
                        onClick={resetFilters}
                      >
                        <FilterX aria-hidden="true" /> {t("table.clearFilters")}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination
        table={table}
        totalRows={filteredData.length}
        pageSizeOptions={pageSizeOptions}
      />
    </section>
  );
}
