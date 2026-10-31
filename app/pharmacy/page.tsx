"use client";

import React, { useState } from "react";
import { Pill, CheckCircle2, UserCheck, AlertTriangle } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

export default function PharmacyPage() {
  const [prescriptionId, setPrescriptionId] = useState("");
  const [visitId, setVisitId] = useState("");
  const [isDispensing, setIsDispensing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleDispenseMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionId || !visitId) return;

    setIsDispensing(true);
    setMessage(null);

    try {
      const supabase = createClient();
      // 1. Mark prescription as dispensed
      const { error: rxError } = await supabase
        .from("prescriptions")
        .update({ status: "dispensed" })
        .eq("id", prescriptionId);

      if (rxError) throw rxError;

      // 2. Mark visit as completed (End of OPD Journey)
      const { error: visitError } = await supabase
        .from("visits")
        .update({ status: "completed" })
        .eq("id", visitId);

      if (visitError) throw visitError;

      setMessage("จ่ายยาและให้คำแนะนำผู้ป่วยเรียบร้อยแล้ว: สิ้นสุดกระบวนการ OPD (Visit Status: completed)");
      setPrescriptionId("");
      setVisitId("");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการจ่ายยา");
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="w-6 h-6 text-teal-600" />
          ห้องจ่ายยา (Pharmacy - Dispensing Queue)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          รับใบสั่งยาที่ชำระเงินเรียบร้อยแล้ว ตรวจสอบ Drug Allergy และกดยืนยันจ่ายยาเพื่อสิ้นสุดการรับบริการ (completed)
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleDispenseMedication} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 pb-2 border-b flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-teal-600" />
          ส่งมอบยาให้ผู้ป่วย (Dispense Medication Entry)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Prescription ID (UUID)</label>
            <input
              type="text"
              required
              value={prescriptionId}
              onChange={(e) => setPrescriptionId(e.target.value)}
              placeholder="UUID ของใบสั่งยา"
              className="w-full px-3 py-2 text-sm border rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
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
              className="w-full px-3 py-2 text-sm border rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 flex items-start gap-2 text-xs text-teal-800">
          <AlertTriangle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            คำเตือนเภสัชกรรม: ตรวจสอบฉลากยา ขนาดยา ความถี่ และชื่อผู้ป่วยให้ตรงกันก่อนส่งมอบยาทุกครั้ง
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isDispensing}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-md shadow-teal-500/20 disabled:opacity-50"
          >
            {isDispensing ? "กำลังยืนยัน..." : "กดยืนยันจ่ายยา & จบกระบวนการ (Complete Visit)"}
          </button>
        </div>
      </form>
    </div>
  );
}
