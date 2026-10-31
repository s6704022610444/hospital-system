import { afterEach, describe, expect, it, vi } from "vitest";
import { saveClinicalEncounter } from "./encounter";
import { createClient } from "@/src/lib/supabase/client";

vi.mock("@/src/lib/supabase/client", () => ({ createClient: vi.fn() }));
const mockCreateClient = vi.mocked(createClient);

describe("saveClinicalEncounter", () => {
  afterEach(() => vi.clearAllMocks());

  it("saves SOAP notes and ICD-10 diagnoses through the RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ rpc } as never);

    const result = await saveClinicalEncounter({
      visitId: "visit-1",
      hn: "HN-1",
      subjective: "Headache",
      objective: "No focal deficit",
      assessment: "Tension headache",
      plan: "Hydration and follow-up",
      diagnoses: [{ icd10_code: "G44.2", icd10_description: "Tension-type headache" }],
    });

    expect(result).toEqual({ success: true, error: null });
    expect(rpc).toHaveBeenCalledWith("save_clinical_encounter", expect.objectContaining({
      p_visit_id: "visit-1",
      p_diagnoses: [{ icd10_code: "G44.2", icd10_description: "Tension-type headache" }],
    }));
  });

  it("returns the database error when save fails", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "conflict" } });
    mockCreateClient.mockReturnValue({ rpc } as never);
    const result = await saveClinicalEncounter({
      visitId: "visit-1", hn: "HN-1", subjective: "S", objective: "O", assessment: "A", plan: "P",
    });
    expect(result).toEqual({ success: false, error: "conflict" });
  });
});
