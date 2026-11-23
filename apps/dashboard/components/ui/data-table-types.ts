import type * as React from "react";
import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human readable name used by the column picker and header. */
    label?: string;
    align?: "left" | "center" | "right";
    headerClassName?: string;
    cellClassName?: string;
  }
}

export interface DataTableFacetedOption {
  label: string;
  value: string;
  colorClass?: string;
  icon?: React.ReactNode;
}

export interface DataTableFacetedFilter<TData = any> {
  id: string;
  title: string;
  options: DataTableFacetedOption[];
  /** Read the comparable value from a row. Defaults to `row[id]`. */
  getValue?: (row: TData) => string | number | null | undefined;
  /** Full control over matching a single selected option. */
  filterFn?: (row: TData, filterValue: string) => boolean;
}

export interface DataTableQuickFilter<TData> {
  id: string;
  label: string;
  color?: "emerald" | "amber" | "rose" | "purple" | "blue" | "default";
  predicate: (row: TData) => boolean;
}

export interface DataTableActionContext {
  setSearch: (value: string) => void;
  copy: (text: string, label?: string) => void;
}

export interface DataTableRowAction {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  variant?: "default" | "destructive";
  separatorBefore?: boolean;
  disabled?: boolean;
}

export interface DataTableBulkAction<TData> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRows: TData[], ctx: DataTableActionContext) => void;
  variant?: "outline" | "ghost" | "default";
}
