import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateBmi, completeTriage } from "./triage";
import { createClient } from "@/src/lib/supabase/client";

vi.mock("@/src/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe("Triage and Vital Signs Logic", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calculates BMI correctly from weight and height", () => {
    expect(calculateBmi(70, 175)).toBe(22.9);
    expect(calculateBmi(50, 160)).toBe(19.5);
    expect(calculateBmi(0, 170)).toBe(0);
  });

  it("calls complete_triage RPC with structured vital signs and allergies", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    mockCreateClient.mockReturnValue({ rpc } as never);

    const result = await completeTriage({
      visitId: "visit-123",
      hn: "HN-2026-000001",
      systolic: 120,
      diastolic: 80,
      pulseRate: 72,
      bodyTemperature: 36.8,
      respiratoryRate: 18,
      weightKg: 65,
      heightCm: 170,
      triageLevel: "routine",
      chiefComplaint: "ปวดศีรษะ 1 วัน",
      allergies: [{ drug_name: "Amoxicillin", severity: "severe_anaphylaxis" }],
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(rpc).toHaveBeenCalledWith(
      "complete_triage",
      expect.objectContaining({
        p_visit_id: "visit-123",
        p_hn: "HN-2026-000001",
        p_systolic: 120,
        p_allergies: [{ drug_name: "Amoxicillin", severity: "severe_anaphylaxis" }],
      })
    );
  });
});
