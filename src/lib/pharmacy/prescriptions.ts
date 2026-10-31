import { createClient } from "@/src/lib/supabase/client";

export interface PrescriptionItemInput {
  medicationId: string;
  dosage: string;
  frequency: string;
  quantity: number;
  unitPrice: number;
  isCovered?: boolean;
  allergyOverrideReason?: string;
}

export interface CreatePrescriptionInput {
  visitId: string;
  hn: string;
  items: PrescriptionItemInput[];
  notes?: string;
}

export function checkAllergyMatch(
  drugNameOrClass: string,
  patientAllergies: Array<{ drug_name: string; severity: string }>
): { hasAllergy: boolean; severity?: string } {
  const normalized = drugNameOrClass.toLowerCase();
  const found = patientAllergies.find((a) =>
    normalized.includes(a.drug_name.toLowerCase()) || a.drug_name.toLowerCase().includes(normalized)
  );

  if (found) {
    return { hasAllergy: true, severity: found.severity };
  }
  return { hasAllergy: false };
}

export async function createPrescription(
  input: CreatePrescriptionInput
): Promise<{ prescriptionId: string | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data: rx, error: rxError } = await supabase
      .from("prescriptions")
      .insert({
        visit_id: input.visitId,
        hn: input.hn,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (rxError) return { prescriptionId: null, error: rxError.message };

    const itemsPayload = input.items.map((item) => ({
      prescription_id: rx.id,
      medication_id: item.medicationId,
      dosage: item.dosage,
      frequency: item.frequency,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      is_covered: item.isCovered ?? true,
      allergy_override_reason: item.allergyOverrideReason || null,
    }));

    const { error: itemsError } = await supabase
      .from("prescription_items")
      .insert(itemsPayload);

    if (itemsError) return { prescriptionId: null, error: itemsError.message };

    return { prescriptionId: rx.id, error: null };
  } catch (err: unknown) {
    return {
      prescriptionId: null,
      error: err instanceof Error ? err.message : "Failed to create prescription",
    };
  }
}
