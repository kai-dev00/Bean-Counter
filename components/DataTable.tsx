"use client";
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { Inbox, Search, SearchX, X } from "lucide-react";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { inventoryStatusConfig } from "@/app/dashboard/utils";
import { DateRangeFilter } from "./CustomDateRange";
import CustomDropdown from "./CustomDropdown";
import CustomButton from "./CustomButton";

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterConfig = {
  key: string;
  label: string;
  options: FilterOption[];
};
export type Column<T> = {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  /** Money/quantity columns: right-aligned with even-width digits */
  numeric?: boolean;
  exportValue?: (row: T) => string | number | null; //for excel export, if not provided it will use the cell value
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  pageSize?: number;
  headerActions?: React.ReactNode;
  filters?: FilterConfig[];
  defaultSearch?: string;
  highlightId?: string;
  dateRangeKey?: string;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  pageSize = 10,
  headerActions,
  filters = [],
  defaultSearch = "",
  highlightId = "",
  dateRangeKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [idFilter, setIdFilter] = useState(defaultSearch);

  const [currentPage, setCurrentPage] = useState(1);

  //
  // Each filter can have several values checked; a row matches any of them
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  // const filteredData = useMemo(() => {
  //   let result = data;
  //   if (idFilter) {
  //     result = result.filter((row) => String(row["id"] ?? "") === idFilter);
  //   }
  //   if (search) {
  //     const lowerSearch = search.toLowerCase();
  //     result = result.filter((row) =>
  //       columns.some((col) => {
  //         const value = String(row[col.key as keyof T] ?? "").toLowerCase();
  //         return value.includes(lowerSearch);
  //       }),
  //     );
  //   }

  //   Object.entries(activeFilters).forEach(([key, value]) => {
  //     if (value) {
  //       result = result.filter((row) => String(row[key] ?? "") === value);
  //     }
  //   });

  //   return result;
  // }, [search, data, columns, activeFilters, idFilter]);
  const filteredData = useMemo(() => {
    let result = data;

    if (idFilter) {
      result = result.filter((row) => String(row["id"] ?? "") === idFilter);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = String(row[col.key as keyof T] ?? "").toLowerCase();
          return value.includes(lowerSearch);
        }),
      );
    }

    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        result = result.filter((row) =>
          values.includes(String(row[key] ?? "")),
        );
      }
    });

    if (dateRangeKey && dateRange.from) {
      result = result.filter((row) => {
        const val = row[dateRangeKey];
        if (!val) return false;
        const date = new Date(val);
        const from = dateRange.from!;
        const to = dateRange.to
          ? new Date(new Date(dateRange.to).setHours(23, 59, 59, 999))
          : new Date(new Date(from).setHours(23, 59, 59, 999));
        return date >= from && date <= to;
      });
    }

    return result;
  }, [search, data, columns, activeFilters, idFilter, dateRange, dateRangeKey]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, pageSize]);

  const hasActiveQuery =
    Boolean(search) ||
    Boolean(idFilter) ||
    Boolean(dateRange.from) ||
    Object.values(activeFilters).some((values) => values.length > 0);

  const clearAll = () => {
    setSearch("");
    setIdFilter("");
    setActiveFilters({});
    setDateRange({ from: null, to: null });
    setCurrentPage(1);
  };

  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  return (
    <div>
      <div className="mb-2 flex justify-between items-center">
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
                setIdFilter("");
              }}
              className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent pl-8 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] placeholder:text-muted-foreground"
            />
          </div>
          {filters.map((filter) => {
            const selected = activeFilters[filter.key] ?? [];
            const single =
              selected.length === 1
                ? filter.options.find((o) => o.value === selected[0])
                : undefined;
            const setSelected = (values: string[]) => {
              setActiveFilters((prev) => ({ ...prev, [filter.key]: values }));
              setCurrentPage(1);
            };

            return (
              <CustomDropdown
                key={filter.key}
                multiple
                options={filter.options}
                value={selected}
                onChange={setSelected}
                searchable={filter.options.length > 7}
                menuClassName="min-w-48"
                trigger={
                  <CustomButton
                    variant="outline"
                    size="sm"
                    className={cn(
                      "font-normal",
                      selected.length > 0 && "border-primary text-primary",
                    )}
                  >
                    {filter.label}
                    {selected.length > 0 && (
                      <Badge
                        className={cn(
                          "flex items-center gap-1",
                          // One status picked: show it in that status's color
                          filter.key === "status" && single
                            ? inventoryStatusConfig[
                                single.value as keyof typeof inventoryStatusConfig
                              ]?.className
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {single ? single.label : `${selected.length} selected`}
                        <span
                          onClick={(e) => {
                            // clear without opening the menu
                            e.stopPropagation();
                            setSelected([]);
                          }}
                          className="hover:opacity-70 cursor-pointer"
                        >
                          <X className="size-4" />
                        </span>
                      </Badge>
                    )}
                    ▾
                  </CustomButton>
                }
              />
            );
          })}
          {dateRangeKey && (
            <DateRangeFilter
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  col.numeric && "text-right",
                  col.className,
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="h-[480px] flex flex-col items-center justify-center gap-3 text-center">
                  <div className="rounded-full bg-muted p-3 text-muted-foreground">
                    {hasActiveQuery ? (
                      <SearchX className="size-6" />
                    ) : (
                      <Inbox className="size-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {hasActiveQuery
                        ? "No results match your filters"
                        : "Nothing here yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasActiveQuery
                        ? "Try a different search or clear the filters."
                        : "Records you add will show up here."}
                    </p>
                  </div>
                  {hasActiveQuery && (
                    <CustomButton
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                    >
                      Clear filters
                    </CustomButton>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {paginatedData.map((row) => (
                <TableRow key={String(row[keyField])} className="h-10">
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      className={cn(
                        col.numeric && "text-right tabular-nums",
                        col.className,
                      )}
                    >
                      {col.cell
                        ? col.cell(row)
                        : String(row[col.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {Array.from({ length: 11 - paginatedData.length }).map((_, i) => (
                <TableRow
                  key={`empty-${i}`}
                  className="h-12 hover:bg-transparent"
                >
                  {columns.map((col, j) => (
                    <TableCell key={j}>&nbsp;</TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}

      <div className="mt-3 flex justify-end items-center space-x-2 text-sm">
        <span className="px-2 text-muted-foreground">
          Page {currentPage} of {totalPages || 1}
        </span>

        <div className="flex gap-1">
          <CustomButton
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            <MdKeyboardDoubleArrowLeft />
          </CustomButton>
          <CustomButton
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <MdKeyboardArrowLeft />
          </CustomButton>
          <CustomButton
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <MdKeyboardArrowRight />
          </CustomButton>
          <CustomButton
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Last page"
          >
            <MdKeyboardDoubleArrowRight />
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
