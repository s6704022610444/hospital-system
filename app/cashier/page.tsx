"use client";

import React, { useState } from "react";
import { CreditCard, QrCode, CheckCircle2, RefreshCw, FileText } from "lucide-react";
import { generateVisitInvoice, InvoiceSummary } from "@/src/lib/billing/invoices";

export default function CashierPage() {
  const [visitId, setVisitId] = useState("");
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerateInvoice = async () => {
    if (!visitId) return;
    setIsGenerating(true);
    setMessage(null);
    setQrUrl(null);

    const { data, error } = await generateVisitInvoice(visitId);
    setIsGenerating(false);

    if (error) {
      setMessage(error);
    } else if (data) {
      setInvoice(data);
      try {
        const qrRes = await fetch("/api/mock/payment/generate-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId: data.invoiceId, amount: data.totalAmount }),
        });
        const qrJson = await qrRes.json();
        if (qrJson.qr_display_url) {
          setQrUrl(qrJson.qr_display_url);
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!invoice) return;
    setIsPaying(true);
    setMessage(null);

    try {
      const res = await fetch("/api/mock/payment/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.invoiceId,
          amount: invoice.totalAmount,
          transactionRef: `MOCK-PAY-${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        setMessage("ชำระเงินสำเร็จแล้ว! ระบบทำการตัดสต็อกยาจริง และส่งคนไข้ไปยังคิวรับยา (dispensing) เรียบร้อย");
        setQrUrl(null);
        setInvoice(null);
      } else {
        setMessage(json.error || "เกิดข้อผิดพลาดในการยืนยันชำระเงิน");
      }
    } catch {
      setMessage("ไม่สามารถส่ง Webhook ชำระเงินได้");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-600" />
          การเงิน: ออกใบแจ้งหนี้รวมยอด & ชำระเงิน (Cashier & Invoicing)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          รวมยอด Post-paid Orders + ค่ายา + ค่าบริการ (Consolidated Single Invoice) และรับชำระผ่าน PromptPay QR
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Invoice Generator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          สร้างใบแจ้งหนี้รวมยอด (Consolidated Invoice)
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={visitId}
            onChange={(e) => setVisitId(e.target.value)}
            placeholder="ใส่ Visit ID (UUID) ของผู้ป่วย"
            className="w-full sm:flex-1 px-3 py-2 text-sm border rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={isGenerating}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
          >
            {isGenerating ? "กำลังรวมยอด..." : "ออกใบแจ้งหนี้ (Generate Invoice)"}
          </button>
        </div>
      </div>

      {/* Invoice Details & QR Simulation */}
      {invoice && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="text-xs text-gray-500 block">เลขที่ใบแจ้งหนี้</span>
            <span className="text-lg font-bold text-gray-900 font-mono block mb-3">
              {invoice.invoiceNumber}
            </span>

            <span className="text-xs text-gray-500 block">ยอดรวมทั้งสิ้น (Total Amount)</span>
            <span className="text-3xl font-extrabold text-amber-700 font-mono block mb-4">
              {invoice.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
            </span>

            <button
              type="button"
              onClick={handleSimulatePaymentSuccess}
              disabled={isPaying}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-md shadow-emerald-500/20"
            >
              {isPaying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>จำลองผู้ป่วยสแกนจ่ายสำเร็จ (Simulate Paid)</span>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="PromptPay QR Code" className="w-48 h-48 rounded-lg shadow-sm" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                <QrCode className="w-16 h-16 animate-pulse" />
              </div>
            )}
            <span className="text-xs text-gray-500 mt-2 font-mono">PromptPay QR Code (Simulated)</span>
          </div>
        </div>
      )}
    </div>
  );
}
