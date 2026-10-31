import { createClient } from "@/src/lib/supabase/client";

export interface Icd10DiagnosisInput {
  icd10_code: string;
  icd10_description: string;
  diagnosis_type?: "primary" | "secondary" | "complication" | "comorbidity";
}

export interface SaveEncounterInput {
  visitId: string;
  hn: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  physicalExam?: string;
  diagnoses?: Icd10DiagnosisInput[];
}

export async function callPatientToDoctor(
  visitId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("call_patient_to_doctor", {
      p_visit_id: visitId,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to call patient",
    };
  }
}

export async function saveClinicalEncounter(
  input: SaveEncounterInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("save_clinical_encounter", {
      p_visit_id: input.visitId,
      p_hn: input.hn,
      p_subjective: input.subjective,
      p_objective: input.objective,
      p_assessment: input.assessment,
      p_plan: input.plan,
      p_physical_exam: input.physicalExam || null,
      p_diagnoses: input.diagnoses || [],
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save encounter",
    };
  }
}
