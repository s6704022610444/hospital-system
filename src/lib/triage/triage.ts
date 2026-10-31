import { createClient } from "@/src/lib/supabase/client";

export interface AllergyInput {
  drug_name: string;
  severity?: "mild" | "moderate" | "severe_anaphylaxis";
  reaction_details?: string;
}

export interface CompleteTriageInput {
  visitId: string;
  hn: string;
  systolic: number;
  diastolic: number;
  pulseRate: number;
  bodyTemperature: number;
  respiratoryRate: number;
  weightKg: number;
  heightCm: number;
  triageLevel: "resuscitation" | "emergency" | "urgent" | "semi_urgent" | "routine";
  chiefComplaint: string;
  presentIllness?: string;
  nurseNotes?: string;
  allergies?: AllergyInput[];
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export async function completeTriage(
  input: CompleteTriageInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("complete_triage", {
      p_visit_id: input.visitId,
      p_hn: input.hn,
      p_systolic: input.systolic,
      p_diastolic: input.diastolic,
      p_pulse_rate: input.pulseRate,
      p_body_temperature: input.bodyTemperature,
      p_respiratory_rate: input.respiratoryRate,
      p_weight_kg: input.weightKg,
      p_height_cm: input.heightCm,
      p_triage_level: input.triageLevel,
      p_chief_complaint: input.chiefComplaint,
      p_present_illness: input.presentIllness || null,
      p_nurse_notes: input.nurseNotes || null,
      p_allergies: input.allergies || [],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete triage",
    };
  }
}
