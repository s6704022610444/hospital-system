import { createClient } from "@/src/lib/supabase/client";

export interface InvoiceSummary {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
}

export async function generateVisitInvoice(
  visitId: string
): Promise<{ data: InvoiceSummary | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("generate_visit_invoice", {
      p_visit_id: visitId,
    });

    if (error) return { data: null, error: error.message };

    return {
      data: {
        invoiceId: data.invoice_id,
        invoiceNumber: data.invoice_number,
        totalAmount: Number(data.total_amount || 0),
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to generate invoice",
    };
  }
}
