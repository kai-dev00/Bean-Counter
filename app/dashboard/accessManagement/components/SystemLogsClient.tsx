"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { PageCard } from "@/components/PageCard";
import { DataTable, Column } from "@/components/DataTable";
import { CustomModal } from "@/components/CustomModal";
import CustomButton from "@/components/CustomButton";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LogSnapshot } from "../actions/logs";

export type LogRow = {
  id: string;
  recordId: string | null;
  module: string;
  submodule: string | null;
  action: string;
  createdAt: Date;
  performedBy: string;
  performedByEmail: string | null;
  before: LogSnapshot;
  after: LogSnapshot;
};

// Flattened, searchable version of a log row
type TableRow = LogRow & {
  when: string;
  area: string;
  record: string;
};

const actionStyles: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// The submodule falls back to the record id when none was given; hide that
function areaLabel(log: LogRow) {
  const sub =
    log.submodule && log.submodule !== log.recordId ? log.submodule : "";
  return [titleCase(log.module), sub && titleCase(sub)]
    .filter(Boolean)
    .join(" / ");
}

// Best human-readable name for the affected record
function recordLabel(log: LogRow) {
  const snap = log.after ?? log.before;
  if (!snap) return log.recordId ?? "";
  for (const key of ["name", "fullName", "email", "poNumber", "title"]) {
    if (typeof snap[key] === "string" && snap[key]) return snap[key] as string;
  }
  if (typeof snap.firstName === "string") {
    return `${snap.firstName} ${snap.lastName ?? ""}`.trim();
  }
  return log.recordId ?? "";
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

// Field-by-field view: changed fields for updates, all fields otherwise
function changedFields(log: LogRow) {
  const before = log.before ?? {};
  const after = log.after ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const rows = keys.map((key) => ({
    key,
    before: before[key],
    after: after[key],
    changed: JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  }));
  return log.action === "update" ? rows.filter((r) => r.changed) : rows;
}

export function SystemLogsClient({ logs }: { logs: LogRow[] }) {
  const [selected, setSelected] = useState<LogRow | null>(null);

  const rows: TableRow[] = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        when: formatDateTime(log.createdAt),
        area: areaLabel(log),
        record: recordLabel(log),
      })),
    [logs],
  );

  const moduleOptions = useMemo(
    () =>
      [...new Set(logs.map((l) => l.module))]
        .sort()
        .map((m) => ({ label: titleCase(m), value: m })),
    [logs],
  );

  const columns: Column<TableRow>[] = [
    {
      key: "when",
      header: "Date & Time",
      cell: (row) => <span className="whitespace-nowrap">{row.when}</span>,
    },
    {
      key: "performedBy",
      header: "User",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.performedBy}</span>
          {row.performedByEmail && (
            <span className="text-xs text-muted-foreground">
              {row.performedByEmail}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <Badge className={cn("capitalize", actionStyles[row.action])}>
          {row.action}
        </Badge>
      ),
    },
    { key: "area", header: "Module" },
    {
      key: "record",
      header: "Record",
      cell: (row) => (
        <span className="block max-w-64 truncate" title={row.record}>
          {row.record || "—"}
        </span>
      ),
    },
    {
      key: "details",
      header: "",
      className: "text-end",
      cell: (row) => (
        <div className="flex justify-center">
          <CustomTooltip content="View details">
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={() => setSelected(row)}
            >
              <Eye className="h-4 w-4" />
            </CustomButton>
          </CustomTooltip>
        </div>
      ),
    },
  ];

  const fields = selected ? changedFields(selected) : [];

  return (
    <PageCard>
      <DataTable<TableRow>
        data={rows}
        columns={columns}
        keyField="id"
        dateRangeKey="createdAt"
        filters={[
          {
            key: "action",
            label: "Action",
            options: [
              { label: "Create", value: "create" },
              { label: "Update", value: "update" },
              { label: "Delete", value: "delete" },
            ],
          },
          { key: "module", label: "Module", options: moduleOptions },
        ]}
      />

      <CustomModal
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title="Log Details"
        description={
          selected
            ? `${selected.performedBy} ${selected.action}d ${
                areaLabel(selected) || "a record"
              } on ${formatDateTime(selected.createdAt)}`
            : undefined
        }
        size="xl"
      >
        {selected && (
          <div className="max-h-[60vh] overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-2 text-left font-semibold">Field</th>
                  {selected.action !== "create" && (
                    <th className="p-2 text-left font-semibold">Before</th>
                  )}
                  {selected.action !== "delete" && (
                    <th className="p-2 text-left font-semibold">After</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No field changes were recorded.
                    </td>
                  </tr>
                ) : (
                  fields.map((f) => (
                    <tr key={f.key} className="border-t align-top">
                      <td className="p-2 font-medium whitespace-nowrap">
                        {f.key}
                      </td>
                      {selected.action !== "create" && (
                        <td
                          className={cn(
                            "p-2 whitespace-pre-wrap break-all font-mono text-xs",
                            selected.action === "update" &&
                              "text-red-700 dark:text-red-400",
                          )}
                        >
                          {display(f.before)}
                        </td>
                      )}
                      {selected.action !== "delete" && (
                        <td
                          className={cn(
                            "p-2 whitespace-pre-wrap break-all font-mono text-xs",
                            selected.action === "update" &&
                              "text-green-700 dark:text-green-400",
                          )}
                        >
                          {display(f.after)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CustomModal>
    </PageCard>
  );
}
