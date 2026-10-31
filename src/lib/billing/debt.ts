import { createClient } from "@/src/lib/supabase/client";

export async function markVisitUnpaidDebt(
  visitId: string,
  amount: number,
  reason: string = "Patient walkout"
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("mark_visit_unpaid_debt", {
      p_visit_id: visitId,
      p_outstanding_amount: amount,
      p_reason: reason,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to mark unpaid debt",
    };
  }
}

export async function requestVoidOrRefund(
  receiptId: string,
  reason: string,
  refund: boolean = true
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("request_void_or_refund", {
      p_receipt_id: receiptId,
      p_reason: reason,
      p_refund: refund,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to void or refund receipt",
    };
  }
}
