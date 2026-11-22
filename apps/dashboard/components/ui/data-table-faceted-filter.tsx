"use client";

import { CirclePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import type { DataTableFacetedOption } from "./data-table-types";

interface DataTableFacetedFilterMenuProps {
  title: string;
  options: DataTableFacetedOption[];
  selected: string[];
  counts: Record<string, number>;
  onChange: (values: string[]) => void;
}

export function DataTableFacetedFilterMenu({
  title,
  options,
  selected,
  counts,
  onChange,
}: DataTableFacetedFilterMenuProps) {
  const { t } = useI18n();
  const selectedOptions = options.filter((option) => selected.includes(option.value));

  const toggle = (value: string, checked: boolean) => {
    onChange(checked ? [...selected, value] : selected.filter((item) => item !== value));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-7 cursor-pointer gap-1.5 border-dashed bg-transparent px-2 text-xs font-medium",
              selected.length > 0 && "border-solid border-emerald-500/40 bg-emerald-500/5"
            )}
          />
        }
      >
        <CirclePlus className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span>{title}</span>
        {selectedOptions.length > 0 && (
          <>
            <span className="h-3.5 w-px bg-border" aria-hidden="true" />
            {selectedOptions.length > 2 ? (
              <Badge variant="success" size="sm">
                {t("table.selectedCount", { count: selectedOptions.length })}
              </Badge>
            ) : (
              selectedOptions.map((option) => (
                <Badge key={option.value} variant="success" size="sm">
                  {option.label}
                </Badge>
              ))
            )}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 text-xs">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
            {title}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, Boolean(checked))}
            className="cursor-pointer text-xs"
          >
            {option.icon}
            <span className={cn("truncate", option.colorClass)}>{option.label}</span>
            <span className="ml-auto pr-1 font-mono text-[11px] tabular-nums text-muted-foreground">
              {counts[option.value] ?? 0}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center text-xs"
              onClick={() => onChange([])}
            >
              {t("table.clearFilter")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
