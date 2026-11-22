"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DataTableFacetedOption {
  label: string;
  value: string;
  colorClass?: string;
}

export interface DataTableFacetedFilter {
  id: string;
  title: string;
  options: DataTableFacetedOption[];
  filterFn?: (row: any, filterValue: string) => boolean;
}

export interface DataTableQuickFilter<TData> {
  id: string;
  label: string;
  color?: "emerald" | "amber" | "rose" | "purple" | "blue" | "default";
  predicate: (row: TData) => boolean;
}

export interface DataTableBulkAction<TData> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRows: TData[]) => void;
  variant?: "outline" | "ghost" | "default";
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  kicker?: string;
  badge?: React.ReactNode;
  searchPlaceholder?: string;
  facetedFilters?: DataTableFacetedFilter[];
  quickFilters?: DataTableQuickFilter<TData>[];
  bulkActions?: DataTableBulkAction<TData>[];
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableDensityToggle?: boolean;
  enableExport?: boolean;
  exportFilenamePrefix?: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string | undefined;
  emptyMessage?: string;
  defaultSorting?: SortingState;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  kicker = "DATA EXPLORER (TANSTACK TABLE)",
  badge,
  searchPlaceholder = "Search records…",
  facetedFilters = [],
  quickFilters = [],
  bulkActions = [],
  enableRowSelection = true,
  enableColumnVisibility = true,
  enableDensityToggle = true,
  enableExport = true,
  exportFilenamePrefix = "export",
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  getRowClassName,
  emptyMessage = "No records found matching your filters.",
  defaultSorting = [],
  className = "",
}: DataTableProps<TData, TValue>) {
  // Sorting & Global Filter
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Dynamic Faceted Filters state
  const [facetValues, setFacetValues] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    facetedFilters.forEach((f) => {
      initial[f.id] = "all";
    });
    return initial;
  });

  // Quick Filter state
  const [activeQuickFilter, setActiveQuickFilter] = React.useState<string>("all");

  // Selection & Column Visibility & Density
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [isCompact, setIsCompact] = React.useState(false);
  const [copiedBatch, setCopiedBatch] = React.useState(false);

  // Filtered dataset
  const filteredData = React.useMemo(() => {
    return data.filter((row: any) => {
      // Faceted filters
      for (const facet of facetedFilters) {
        const selectedVal = facetValues[facet.id];
        if (selectedVal && selectedVal !== "all") {
          if (facet.filterFn) {
            if (!facet.filterFn(row, selectedVal)) return false;
          } else {
            const rowVal = String(row[facet.id] ?? "").toLowerCase();
            if (rowVal !== selectedVal.toLowerCase()) return false;
          }
        }
      }

      // Quick filter pill
      if (activeQuickFilter !== "all") {
        const qf = quickFilters.find((q) => q.id === activeQuickFilter);
        if (qf && !qf.predicate(row)) return false;
      }

      return true;
    });
  }, [data, facetValues, facetedFilters, activeQuickFilter, quickFilters]);

  // Enhance columns with selection column if enabled
  const finalColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    if (!enableRowSelection) return columns;

    const selectionCol: ColumnDef<TData, any> = {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-1">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(val) => table.toggleAllPageRowsSelected(Boolean(val))}
            aria-label="Select all rows"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-1" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(val) => row.toggleSelected(Boolean(val))}
            aria-label={`Select row`}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 36,
    };

    return [selectionCol, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data: filteredData,
    columns: finalColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  });

  // Selected rows
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedItems = React.useMemo(() => selectedRows.map((r) => r.original), [selectedRows]);

  // Copy IDs if rows have 'id'
  const handleCopySelectedIds = () => {
    if (selectedItems.length === 0) return;
    const ids = selectedItems
      .map((item: any) => item.id || item.traceId || item.key || JSON.stringify(item))
      .filter(Boolean)
      .join(", ");
    navigator.clipboard?.writeText(ids);
    setCopiedBatch(true);
    toast.success(`Copied ${selectedItems.length} IDs to clipboard!`);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  // Export handlers
  const handleExportJson = (onlySelected = false) => {
    const dataset = onlySelected ? selectedItems : filteredData;
    if (dataset.length === 0) {
      toast.error("No records to export");
      return;
    }
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilenamePrefix}-${onlySelected ? "selected" : "all"}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dataset.length} records as JSON`);
  };

  const handleExportCsv = (onlySelected = false) => {
    const dataset = onlySelected ? selectedItems : filteredData;
    if (dataset.length === 0) {
      toast.error("No records to export");
      return;
    }
    // Extract keys from first item
    const first = dataset[0] as any;
    const keys = Object.keys(first).filter((k) => typeof first[k] !== "object");
    const csvRows = dataset.map((item: any) =>
      keys
        .map((k) => {
          const val = String(item[k] ?? "").replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    );
    const csvContent = [keys.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilenamePrefix}-${onlySelected ? "selected" : "all"}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dataset.length} records as CSV`);
  };

  return (
    <section className={`panel-card traces-panel flex flex-col gap-3 ${className}`}>
      {/* Table Header Row */}
      {(title ||
        kicker ||
        facetedFilters.length > 0 ||
        enableColumnVisibility ||
        enableDensityToggle ||
        enableExport) && (
        <div className="table-heading flex flex-wrap items-center justify-between gap-3">
          <div>
            {kicker && <div className="section-kicker font-sans">{kicker}</div>}
            <div className="table-title-row flex items-center gap-2 mt-0.5">
              {title && <h2 className="text-sm font-bold text-[var(--ot-text)]">{title}</h2>}
              <Badge
                variant="secondary"
                size="sm"
                className="font-semibold tabular-nums text-muted-foreground"
              >
                {filteredData.length} total
              </Badge>
              {badge}
            </div>
          </div>

          {/* Action Controls & Facets */}
          <div className="table-actions flex flex-wrap items-center gap-2">
            {/* Dynamic Faceted Selects */}
            {facetedFilters.map((facet) => {
              const selectedValue = facetValues[facet.id] || "all";
              const selectedOption = facet.options.find((opt) => opt.value === selectedValue);
              const isFiltered = selectedValue !== "all";
              const displayLabel =
                isFiltered && selectedOption ? selectedOption.label : facet.title;

              return (
                <Select
                  key={facet.id}
                  value={selectedValue}
                  onValueChange={(val) => {
                    if (val) {
                      setFacetValues((prev) => ({ ...prev, [facet.id]: val }));
                    }
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className={cn(
                      "h-7 text-xs px-2.5 py-0 rounded-md border-border bg-background hover:bg-muted text-foreground shadow-xs min-w-[110px] font-sans gap-1.5 cursor-pointer",
                      isFiltered &&
                        "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                    )}
                  >
                    <span className="truncate">{displayLabel}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                      {facet.title}
                    </SelectItem>
                    {facet.options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={cn("text-xs font-sans cursor-pointer", opt.colorClass)}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })}

            {/* Column Visibility Dropdown */}
            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-7 text-xs gap-1.5 border-border bg-background hover:bg-muted text-foreground cursor-pointer font-sans"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>Columns</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-40 text-xs">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                      Toggle Columns
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                      .getAllLeafColumns()
                      .filter((col) => col.id !== "select" && col.id !== "stt")
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize text-xs cursor-pointer font-sans"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Density Toggle */}
            {enableDensityToggle && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-7 text-xs gap-1.5 border-border bg-background hover:bg-muted text-foreground cursor-pointer font-sans"
                onClick={() => setIsCompact(!isCompact)}
                title={isCompact ? "Switch to Comfortable density" : "Switch to Compact density"}
              >
                {isCompact ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                <span>{isCompact ? "Compact" : "Comfortable"}</span>
              </Button>
            )}

            {/* Export Dropdown */}
            {enableExport && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-7 text-xs gap-1.5 border-border bg-background hover:bg-muted text-foreground cursor-pointer font-sans"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-36 text-xs">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="text-xs cursor-pointer font-sans"
                      onClick={() => handleExportCsv(false)}
                    >
                      Export CSV ({filteredData.length})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs cursor-pointer font-sans"
                      onClick={() => handleExportJson(false)}
                    >
                      Export JSON ({filteredData.length})
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {enableRowSelection && selectedRows.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300 font-sans">
              {selectedRows.length} record{selectedRows.length > 1 ? "s" : ""} selected
            </span>
            <span className="text-muted-foreground text-[11px] font-sans">
              (of {filteredData.length} total)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-6.5 text-[11px] gap-1 bg-background hover:bg-muted border-border cursor-pointer font-sans"
              onClick={handleCopySelectedIds}
            >
              {copiedBatch ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>{copiedBatch ? "Copied" : "Copy IDs"}</span>
            </Button>

            {/* Custom Bulk Actions */}
            {bulkActions.map((action, i) => (
              <Button
                key={i}
                type="button"
                variant={action.variant || "outline"}
                size="xs"
                className="h-6.5 text-[11px] gap-1 bg-background hover:bg-muted border-border cursor-pointer font-sans"
                onClick={() => action.onClick(selectedItems)}
              >
                {action.icon}
                <span>{action.label}</span>
              </Button>
            ))}

            {enableExport && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-6.5 text-[11px] gap-1 bg-background hover:bg-muted border-border cursor-pointer font-sans"
                  onClick={() => handleExportCsv(true)}
                >
                  <Download className="h-3 w-3" />
                  <span>CSV</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-6.5 text-[11px] gap-1 bg-background hover:bg-muted border-border cursor-pointer font-sans"
                  onClick={() => handleExportJson(true)}
                >
                  <Download className="h-3 w-3" />
                  <span>JSON</span>
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-6.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer font-sans"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              <X className="h-3 w-3" />
              <span>Deselect</span>
            </Button>
          </div>
        </div>
      )}

      {/* Search Bar & Quick Filters Toolbar */}
      <div className="table-controls flex flex-wrap items-center justify-between gap-2.5">
        <label className="trace-search flex-1 min-w-[240px]">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="font-sans"
          />
          {globalFilter && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              onClick={() => setGlobalFilter("")}
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </label>

        {/* Quick Filter Pills */}
        {quickFilters.length > 0 && (
          <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border border-border/80">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className={cn(
                "h-6 px-2 text-[11px] rounded font-medium transition-all cursor-pointer font-sans",
                activeQuickFilter === "all"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
              onClick={() => setActiveQuickFilter("all")}
            >
              All
            </Button>
            {quickFilters.map((qf) => {
              const isActive = activeQuickFilter === qf.id;
              let activeColorClass =
                "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold shadow-2xs";
              if (qf.color === "amber")
                activeColorClass =
                  "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold shadow-2xs";
              if (qf.color === "rose")
                activeColorClass =
                  "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-semibold shadow-2xs";
              if (qf.color === "purple")
                activeColorClass =
                  "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 font-semibold shadow-2xs";
              if (qf.color === "blue")
                activeColorClass =
                  "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 font-semibold shadow-2xs";

              return (
                <Button
                  key={qf.id}
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn(
                    "h-6 px-2 text-[11px] rounded font-medium transition-all cursor-pointer font-sans",
                    isActive
                      ? activeColorClass
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  )}
                  onClick={() => setActiveQuickFilter(qf.id)}
                >
                  {qf.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Reset Sorting Button */}
        {sorting.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6.5 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 cursor-pointer font-sans"
            onClick={() => setSorting(defaultSorting)}
            title="Reset sorting"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Sort</span>
          </Button>
        )}
      </div>

      {/* Table Container */}
      <div className="trace-table-scroll border border-border rounded-lg overflow-hidden bg-card shadow-2xs">
        <table
          className={`trace-table w-full border-collapse font-sans ${isCompact ? "is-compact" : ""}`}
        >
          <thead className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-3.5 py-2.5 text-left font-semibold text-[11px] text-muted-foreground uppercase tracking-wider font-sans select-none whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "group transition-colors hover:bg-muted/40 cursor-pointer",
                  row.getIsSelected() ? "bg-emerald-500/10 dark:bg-emerald-950/20" : "",
                  getRowClassName ? getRowClassName(row.original) || "" : ""
                )}
                tabIndex={0}
                role="button"
                onClick={() => onRowClick?.(row.original)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick?.(row.original);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-3.5 text-xs text-foreground align-middle font-sans",
                      isCompact ? "py-1.5" : "py-2.5"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={finalColumns.length}
                  className="px-4 py-12 text-center text-xs text-muted-foreground font-sans"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <footer className="table-footer flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans">
          <span>
            Showing <strong className="text-foreground font-medium">{table.getRowModel().rows.length}</strong> of{" "}
            <strong className="text-foreground font-medium">{filteredData.length}</strong> records
          </span>

          <span className="text-muted-foreground/30">•</span>

          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-sans">Rows per page:</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(val) => {
                if (val) table.setPageSize(Number(val));
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-7 text-xs w-[68px] px-2.5 bg-background border-border text-foreground font-sans cursor-pointer shadow-2xs"
              >
                <SelectValue placeholder={String(initialPageSize)} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground text-xs shadow-md">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs font-sans cursor-pointer">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1 font-sans">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="cursor-pointer"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
            aria-label="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="cursor-pointer"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <span className="text-[11px] text-muted-foreground px-2 tabular-nums font-sans">
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount() || 1}</strong>
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="cursor-pointer"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="cursor-pointer"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
