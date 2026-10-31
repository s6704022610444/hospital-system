import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/client";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Authenticate user and verify active_role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const activeRole = (user?.app_metadata as Record<string, unknown> | undefined)?.active_role as string | undefined;

    // Check authorization: only admin and director may export audit logs
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: login required to export audit logs." }, { status: 401 });
    }

    if (!activeRole || !["admin", "director"].includes(activeRole)) {
      return NextResponse.json({ error: "Forbidden: only admin or director may export audit logs." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || "2026-01-01";
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 2. Self-audit every export request with verified caller context (ADR 0007)
    await supabase.from("audit_logs").insert({
      table_name: "audit_logs",
      record_id: "export-" + Date.now(),
      action: "log_export_generated",
      new_data: {
        filter_start_date: startDate,
        filter_end_date: endDate,
        rows_exported: logs?.length || 0,
        exported_at: new Date().toISOString(),
        exported_by: user.id,
      },
      changed_by: user.id,
      active_role: activeRole as "admin" | "director",
    });

    const csvHeader = "id,table_name,record_id,action,active_role,created_at\n";
    const csvRows = (logs || [])
      .map((l) => `"${l.id}","${l.table_name}","${l.record_id}","${l.action}","${l.active_role}","${l.created_at}"`)
      .join("\n");

    return new NextResponse(csvHeader + csvRows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit_log_export_${Date.now()}.csv"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
