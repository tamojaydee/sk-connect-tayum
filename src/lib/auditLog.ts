import { supabase } from "@/integrations/supabase/client";

interface LogAuditParams {
  action: string;
  tableName: string;
  recordId?: string;
  barangayId?: string;
  details?: any;
}

export const logAudit = async ({
  action,
  tableName,
  recordId,
  barangayId,
  details,
}: LogAuditParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No user found for audit log");
      return;
    }

    const { data, error } = await supabase.from("audit_logs").insert({
      user_id: user.id,
      action,
      table_name: tableName,
      record_id: recordId || null,
      barangay_id: barangayId || null,
      details: details || null,
    });

    if (error) {
      console.error("Error logging audit:", error.message, error);
    } else {
      console.log("Audit log created:", action, tableName);
    }
  } catch (error) {
    console.error("Error in logAudit:", error);
  }
};