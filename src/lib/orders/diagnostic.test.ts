import { afterEach, describe, expect, it, vi } from "vitest";
import { canCancelOrder, createDiagnosticOrder, reportLabResult } from "./diagnostic";
import { createClient } from "@/src/lib/supabase/client";

vi.mock("@/src/lib/supabase/client", () => ({ createClient: vi.fn() }));
const mockCreateClient = vi.mocked(createClient);

describe("Diagnostic Orders & Lab Results Logic", () => {
  afterEach(() => vi.clearAllMocks());

  it("permits cancellation only in ordered or scheduled state", () => {
    expect(canCancelOrder("ordered")).toBe(true);
    expect(canCancelOrder("scheduled")).toBe(true);
    expect(canCancelOrder("in_prep")).toBe(false);
    expect(canCancelOrder("in_procedure")).toBe(false);
    expect(canCancelOrder("completed")).toBe(false);
  });

  it("defaults nuclear orders to post_paid", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "ord-1" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    mockCreateClient.mockReturnValue({ from } as never);

    const res = await createDiagnosticOrder({
      visitId: "v-1", hn: "HN-1", orderType: "nuclear", itemCode: "NUC-I131", itemName: "I-131 Scan",
    });

    expect(res.orderId).toBe("ord-1");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      order_type: "nuclear",
      payment_type: "post_paid",
    }));
  });

  it("reports lab result and marks order completed", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "lab_results") return { insert };
      if (table === "orders") return { update };
      return {};
    });
    mockCreateClient.mockReturnValue({ from } as never);

    const res = await reportLabResult({
      orderId: "ord-1", visitId: "v-1", hn: "HN-1", testName: "CBC", resultValue: "Normal",
    });

    expect(res.success).toBe(true);
    expect(update).toHaveBeenCalledWith({ status: "completed" });
  });
});
