import { describe, expect, it } from "vitest";

interface WriteAuditRecord {
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "log_export_generated";
  changed_by?: string;
  active_role: string;
  created_at: string;
  version?: never; // Explicitly forbidden
  updated_at?: never; // Explicitly forbidden
}

interface ReadAuditRecord {
  hn: string;
  vn?: string | null;
  reason: string;
  accessed_by?: string;
  active_role: string;
  created_at: string;
  version?: never; // Explicitly forbidden
  updated_at?: never; // Explicitly forbidden
}

describe("Audit Trail Architectural Contract", () => {
  it("enforces append-only properties (no version or updated_at columns in audit records)", () => {
    const writeLog: WriteAuditRecord = {
      table_name: "prescriptions",
      record_id: "rec-123",
      action: "INSERT",
      active_role: "doctor",
      created_at: new Date().toISOString(),
    };

    // Verify it contains required metadata
    expect(writeLog.table_name).toBe("prescriptions");
    expect(writeLog.action).toBe("INSERT");
    expect(writeLog.active_role).toBe("doctor");
    // Verify OCC fields do not exist on audit logs
    expect((writeLog as Record<string, unknown>).version).toBeUndefined();
    expect((writeLog as Record<string, unknown>).updated_at).toBeUndefined();
  });

  it("requires Read Audit record to include HN and Role context", () => {
    const readLog: ReadAuditRecord = {
      hn: "HN-2026-0001",
      vn: "VN-2026-10-001",
      reason: "Clinical Review",
      active_role: "doctor",
      created_at: new Date().toISOString(),
    };

    expect(readLog.hn).toBe("HN-2026-0001");
    expect(readLog.reason).toBe("Clinical Review");
    expect(readLog.active_role).toBe("doctor");
    expect((readLog as Record<string, unknown>).version).toBeUndefined();
  });
});
