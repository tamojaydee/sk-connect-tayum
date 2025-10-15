import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  barangay_id: string | null;
  details: any;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  barangays: {
    name: string;
  } | null;
}

export const AuditLogs = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          barangays(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = data?.map(log => log.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Map profiles to logs
      const logsWithProfiles = data?.map(log => ({
        ...log,
        profiles: profilesData?.find(p => p.id === log.user_id) || { full_name: "Unknown", email: "Unknown" }
      }));

      return logsWithProfiles as AuditLog[];
    },
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("create")) return "default";
    if (action.includes("update")) return "secondary";
    if (action.includes("delete")) return "destructive";
    return "outline";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Track all system activities and changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "PPp")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.profiles.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.profiles.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.table_name}
                    </TableCell>
                    <TableCell>
                      {log.barangays?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                    {log.details ? (
                      typeof log.details === 'object' ? (
                        <div className="text-xs space-y-1 max-w-[220px]">
                          {'role' in log.details && (
                            <div><span className="font-medium">Role:</span> {String(log.details.role)}</div>
                          )}
                          {'full_name' in log.details && (
                            <div><span className="font-medium">Name:</span> {String(log.details.full_name)}</div>
                          )}
                          {'email' in log.details && (
                            <div><span className="font-medium">Email:</span> {String(log.details.email)}</div>
                          )}
                          {'barangay' in log.details && (
                            <div><span className="font-medium">Barangay:</span> {String(log.details.barangay)}</div>
                          )}
                          {'title' in log.details && (
                            <div><span className="font-medium">Title:</span> {String(log.details.title)}</div>
                          )}
                          {'budget' in log.details && (
                            <div>
                              <span className="font-medium">Budget:</span> ₱
                              {Number(log.details.budget).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {'amount' in log.details && (
                            <div>
                              <span className="font-medium">Amount:</span> ₱
                              {Number(log.details.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {'transaction_type' in log.details && (
                            <div><span className="font-medium">Type:</span> {String(log.details.transaction_type)}</div>
                          )}
                          {'description' in log.details && log.details.description && (
                            <div><span className="font-medium">Description:</span> {String(log.details.description)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs">{String(log.details)}</span>
                      )
                    ) : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};