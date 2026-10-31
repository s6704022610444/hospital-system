"use client";

import React, { useState } from "react";
import { FlaskConical, Send, CheckCircle2 } from "lucide-react";
import { reportLabResult } from "@/src/lib/orders/diagnostic";

export default function MedTechLabPage() {
  const [orderId, setOrderId] = useState("");
  const [visitId, setVisitId] = useState("");
  const [hn, setHn] = useState("");
  const [testName, setTestName] = useState("CBC (Complete Blood Count)");
  const [resultValue, setResultValue] = useState("");
  const [refRange, setRefRange] = useState("WBC: 4,500 - 10,000 /uL");
  const [unit, setUnit] = useState("/uL");
  const [flag, setFlag] = useState<"normal" | "high" | "low" | "critical">("normal");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !visitId || !hn || !resultValue) {
      setMessage("กรุณาระบุ Order ID, Visit ID, HN และผลการตรวจ");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { success, error } = await reportLabResult({
      orderId,
      visitId,
      hn,
      testName,
      resultValue,
      referenceRange: refRange,
      unit,
      flag,
    });

    setIsSubmitting(false);

    if (success) {
      setMessage("รายงานผลแล็บสำเร็จและสถานะ Order เปลี่ยนเป็น completed (ระบบจะส่งคนไข้กลับคิว doctor_review อัตโนมัติเมื่อผลครบทุกใบ)");
      setResultValue("");
    } else {
      setMessage(error || "เกิดข้อผิดพลาดในการรายงานผล");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-cyan-600" />
          ห้องปฏิบัติการ (Medical Technologist - Lab Queue)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          รับสิ่งส่งตรวจ รายงานผลแล็บ และทริกเกอร์ส่งผู้ป่วยกลับไปพบแพทย์ (doctor_review loop-back)
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 pb-2 border-b">บันทึกผลการตรวจวิเคราะห์ (Lab Result Entry)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Order ID (UUID)</label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="UUID ของ Order"
              className="w-full px-3 py-1.5 text-sm border rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Visit ID (UUID)</label>
            <input
              type="text"
              required
              value={visitId}
              onChange={(e) => setVisitId(e.target.value)}
              placeholder="UUID ของ Visit"
              className="w-full px-3 py-1.5 text-sm border rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">HN</label>
            <input
              type="text"
              required
              value={hn}
              onChange={(e) => setHn(e.target.value)}
              placeholder="HN-2026-000001"
              className="w-full px-3 py-1.5 text-sm border rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อรายการตรวจ (Test Name)</label>
            <input
              type="text"
              required
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ผลการตรวจ (Result Value)</label>
            <input
              type="text"
              required
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="เช่น WBC 6,200, Platelet 250,000"
              className="w-full px-3 py-1.5 text-sm border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ช่วงค่าอ้างอิงปกติ (Reference Range)</label>
            <input
              type="text"
              value={refRange}
              onChange={(e) => setRefRange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">การประเมิน (Flag)</label>
            <select
              value={flag}
              onChange={(e) => setFlag(e.target.value as "normal" | "high" | "low" | "critical")}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            >
              <option value="normal">ปกติ (Normal)</option>
              <option value="high">สูงกว่าเกณฑ์ (High)</option>
              <option value="low">ต่ำกว่าเกณฑ์ (Low)</option>
              <option value="critical">วิกฤต (Critical)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm transition-colors shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "กำลังส่งผล..." : "ยืนยันผลแล็บ & เสร็จสิ้น Order (Complete)"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
