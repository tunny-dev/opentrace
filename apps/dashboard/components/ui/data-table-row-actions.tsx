"use client";

import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/i18n-context";
import type { DataTableRowAction } from "./data-table-types";

interface DataTableRowActionsProps {
  getActions: () => DataTableRowAction[];
}

export function DataTableRowActions({ getActions }: DataTableRowActionsProps) {
  const { t } = useI18n();

  return (
    // Menus are portaled, but React events still bubble to the row, so stop them here.
    <div
      className="flex items-center justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("table.rowActions")}
              className="cursor-pointer text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 group-hover/row:opacity-100 data-popup-open:bg-muted data-popup-open:opacity-100"
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 text-xs">
          {getActions().map((action) => (
            <ActionItem key={action.label} action={action} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ActionItem({ action }: { action: DataTableRowAction }) {
  return (
    <>
      {action.separatorBefore && <DropdownMenuSeparator />}
      <DropdownMenuItem
        className="cursor-pointer text-xs"
        variant={action.variant}
        disabled={action.disabled}
        onClick={action.onSelect}
      >
        {action.icon}
        {action.label}
      </DropdownMenuItem>
    </>
  );
}
