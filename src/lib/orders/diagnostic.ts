import { createClient } from "@/src/lib/supabase/client";

export interface CreateOrderInput {
  visitId: string;
  hn: string;
  orderType: "lab" | "xray" | "nuclear";
  itemCode: string;
  itemName: string;
  paymentType?: "pre_paid" | "post_paid";
  price?: number;
  details?: Record<string, unknown>;
}

export interface ReportLabResultInput {
  orderId: string;
  visitId: string;
  hn: string;
  testName: string;
  resultValue: string;
  referenceRange?: string;
  unit?: string;
  flag?: "normal" | "high" | "low" | "critical";
}

export function canCancelOrder(status: string): boolean {
  return status === "ordered" || status === "scheduled";
}

export async function createDiagnosticOrder(
  input: CreateOrderInput
): Promise<{ orderId: string | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        visit_id: input.visitId,
        hn: input.hn,
        order_type: input.orderType,
        item_code: input.itemCode,
        item_name: input.itemName,
        payment_type: input.paymentType || (input.orderType === "nuclear" ? "post_paid" : "pre_paid"),
        price: input.price || 0,
        details: input.details || {},
      })
      .select("id")
      .single();

    if (error) return { orderId: null, error: error.message };
    return { orderId: data.id, error: null };
  } catch (err: unknown) {
    return {
      orderId: null,
      error: err instanceof Error ? err.message : "Failed to create order",
    };
  }
}

export async function reportLabResult(
  input: ReportLabResultInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();

    const { error: resultError } = await supabase.from("lab_results").insert({
      order_id: input.orderId,
      visit_id: input.visitId,
      hn: input.hn,
      test_name: input.testName,
      result_value: input.resultValue,
      reference_range: input.referenceRange || null,
      unit: input.unit || null,
      flag: input.flag || "normal",
    });

    if (resultError) return { success: false, error: resultError.message };

    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", input.orderId);

    if (orderError) return { success: false, error: orderError.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to report lab result",
    };
  }
}
