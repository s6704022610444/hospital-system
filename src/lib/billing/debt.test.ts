import { afterEach, describe, expect, it, vi } from "vitest";
import { markVisitUnpaidDebt, requestVoidOrRefund } from "./debt";
import { createClient } from "@/src/lib/supabase/client";

vi.mock("@/src/lib/supabase/client", () => ({ createClient: vi.fn() }));
const mockCreateClient = vi.mocked(createClient);

describe("Walkout Debt & Void/Refund Management", () => {
  afterEach(() => vi.clearAllMocks());

  it("calls mark_visit_unpaid_debt RPC with amount and reason", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ rpc } as never);

    const res = await markVisitUnpaidDebt("visit-1", 850, "Patient walked out without paying");
    expect(res.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith("mark_visit_unpaid_debt", {
      p_visit_id: "visit-1",
      p_outstanding_amount: 850,
      p_reason: "Patient walked out without paying",
    });
  });

  it("calls request_void_or_refund RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ rpc } as never);

    const res = await requestVoidOrRefund("rcp-1", "Lab cancelled due to machine error", true);
    expect(res.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith("request_void_or_refund", {
      p_receipt_id: "rcp-1",
      p_reason: "Lab cancelled due to machine error",
      p_refund: true,
    });
  });
});
