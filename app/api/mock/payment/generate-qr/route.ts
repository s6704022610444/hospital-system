import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, amount } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: "Missing invoiceId or amount" }, { status: 400 });
    }

    const qrPayload = `00020101021229370016A000000677010111011300668123456785802TH5303764540${Number(amount).toFixed(2)}6304MOCK`;

    return NextResponse.json({
      status: "success",
      is_simulated: true,
      invoice_id: invoiceId,
      amount: Number(amount),
      qr_payload: qrPayload,
      qr_display_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate QR" },
      { status: 500 }
    );
  }
}
