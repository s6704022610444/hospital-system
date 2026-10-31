import { afterEach, describe, expect, it, vi } from "vitest";
import { registerOrOpenVisit } from "./registration";
import { createClient } from "@/src/lib/supabase/client";

vi.mock("@/src/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe("registerOrOpenVisit", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens a new VN against the existing HN when CID already exists", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        patient_id: "patient-1",
        hn: "HN-2026-000001",
        vn: "VN-20261031-0002",
        visit_id: "visit-2",
        is_existing_patient: true,
        outstanding_balance: 120,
      },
      error: null,
    });
    mockCreateClient.mockReturnValue({ rpc } as never);

    const { data, error } = await registerOrOpenVisit({
      nationalId: "1103700543219",
      firstName: "สมศักดิ์",
      lastName: "รักสงบ",
      gender: "M",
      birthDate: "1985-04-12",
    });

    expect(error).toBeNull();
    expect(data?.hn).toBe("HN-2026-000001");
    expect(data?.isExistingPatient).toBe(true);
    expect(data?.outstandingBalance).toBe(120);
    expect(rpc).toHaveBeenCalledWith("register_or_open_visit", expect.objectContaining({
      p_national_id: "1103700543219",
    }));
  });

  it("returns a friendly error when registration RPC fails", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "Duplicate CID" } });
    mockCreateClient.mockReturnValue({ rpc } as never);

    const { data, error } = await registerOrOpenVisit({
      nationalId: "1103700543219",
      firstName: "สมศักดิ์",
      lastName: "รักสงบ",
      gender: "M",
      birthDate: "1985-04-12",
    });

    expect(data).toBeNull();
    expect(error).toBe("Duplicate CID");
  });
});
