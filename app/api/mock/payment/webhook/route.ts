import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, amount, transactionRef } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: "Missing invoiceId or amount" }, { status: 400 });
    }

    // Use admin client with service role for server-side webhook execution (bypasses browser cookies requirement)
    const supabase = createAdminClient();

    const { data: payment, error: payError } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        amount: Number(amount),
        payment_method: "qr_mock",
        status: "paid",
        transaction_reference: transactionRef || `TXN-MOCK-${Date.now()}`,
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (payError) {
      return NextResponse.json({ error: payError.message }, { status: 400 });
    }

    return NextResponse.json({
      status: "success",
      is_simulated: true,
      message: "Payment confirmed, stock deducted, and receipt issued.",
      payment_id: payment.id,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}
