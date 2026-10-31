import { createClient } from "@/src/lib/supabase/client";

export interface RegisterPatientInput {
  nationalId?: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  insuranceScheme?: string;
  chiefComplaint?: string;
}

export interface RegistrationResult {
  patientId: string;
  hn: string;
  vn: string;
  visitId: string;
  isExistingPatient: boolean;
  outstandingBalance: number;
}

export async function registerOrOpenVisit(
  input: RegisterPatientInput
): Promise<{ data: RegistrationResult | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("register_or_open_visit", {
      p_national_id: input.nationalId || null,
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_gender: input.gender,
      p_birth_date: input.birthDate,
      p_phone: input.phone || null,
      p_address: input.address || null,
      p_blood_group: input.bloodGroup || null,
      p_insurance_scheme: input.insuranceScheme || "Self-pay",
      p_chief_complaint: input.chiefComplaint || null,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        patientId: data.patient_id,
        hn: data.hn,
        vn: data.vn,
        visitId: data.visit_id,
        isExistingPatient: data.is_existing_patient,
        outstandingBalance: Number(data.outstanding_balance || 0),
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to register patient",
    };
  }
}
