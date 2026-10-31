import { createClient } from "@/src/lib/supabase/client";

export interface PatientSingleViewPayload {
  hn: string;
  vn?: string | null;
  fullName?: string;
  gender?: "M" | "F" | "Other";
  age?: number;
  birthDate?: string;
  bloodGroup?: string;
  insuranceScheme?: string;
  outstandingBalance?: number;
  allergies?: Array<{ drugName: string; severity: string }>;
  access_timestamp?: string;
}

export async function fetchPatientSingleView(
  hn: string,
  vn?: string | null,
  reason: string = "Clinical Review"
): Promise<{ data: PatientSingleViewPayload | null; error: string | null }> {
  try {
    const supabase = createClient();

    // Strict RPC Barrier: Every access must pass through log_access to record Read Audit Log
    const { data, error } = await supabase.rpc("log_access", {
      p_hn: hn,
      p_vn: vn || null,
      p_reason: reason,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as PatientSingleViewPayload, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch patient data",
    };
  }
}
