import { afterEach, describe, expect, it, vi } from "vitest";
import { generateVisitInvoice } from "./invoices";
import { createClient } from "@/src/lib/supabase/client";

vi.mock("@/src/lib/supabase/client", () => ({ createClient: vi.fn() }));
const mockCreateClient = vi.mocked(createClient);

describe("Consolidated Visit Invoicing Logic", () => {
  afterEach(() => vi.clearAllMocks());

  it("calls generate_visit_invoice RPC and formats summary", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        invoice_id: "inv-123",
        invoice_number: "INV-20261031-00001",
        total_amount: 1450.5,
      },
      error: null,
    });
    mockCreateClient.mockReturnValue({ rpc } as never);

    const { data, error } = await generateVisitInvoice("visit-123");

    expect(error).toBeNull();
    expect(data?.invoiceId).toBe("inv-123");
    expect(data?.totalAmount).toBe(1450.5);
    expect(rpc).toHaveBeenCalledWith("generate_visit_invoice", { p_visit_id: "visit-123" });
  });
});
