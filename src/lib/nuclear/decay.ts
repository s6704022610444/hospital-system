import { createClient } from "@/src/lib/supabase/client";

export type Radionuclide = "I-131" | "Tc-99m";

export const isotopeHalfLivesHours: Record<Radionuclide, number> = {
  "I-131": 8.02 * 24,
  "Tc-99m": 6.01,
};

export function calculateDecayedActivity(
  initialActivity: number,
  elapsedHours: number,
  radionuclide: Radionuclide
): number {
  if (initialActivity < 0 || elapsedHours < 0) return 0;
  const halfLife = isotopeHalfLivesHours[radionuclide];
  return initialActivity * Math.pow(0.5, elapsedHours / halfLife);
}

export interface RadiationDoseSnapshot {
  radionuclide: Radionuclide;
  calibrated_dose_mci: number;
  calibration_datetime: string;
  administered_dose_mci: number;
  administered_datetime: string;
  decay_factor: number;
  lot_number: string;
}

export async function recordAdministeredDose(
  orderId: string,
  snapshot: RadiationDoseSnapshot
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { data: current, error: readError } = await supabase
      .from("orders")
      .select("details")
      .eq("id", orderId)
      .single();

    if (readError) return { success: false, error: readError.message };

    const { error } = await supabase
      .from("orders")
      .update({ details: { ...(current.details || {}), radiation_dose_snapshot: snapshot } })
      .eq("id", orderId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save dose snapshot",
    };
  }
}
