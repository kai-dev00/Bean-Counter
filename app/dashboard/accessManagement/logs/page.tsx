import { requirePermission } from "@/lib/auth-guard";
import { getActionLogs } from "../actions/logs";
import { SystemLogsClient } from "../components/SystemLogsClient";

export default async function SystemLogsPage() {
  await requirePermission("access-management:read:logs");

  const logs = await getActionLogs();

  return <SystemLogsClient logs={logs} />;
}

export const metadata = { title: "System Logs" };
