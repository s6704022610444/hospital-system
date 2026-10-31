"use client";

import React, { useState } from "react";
import { Radiation, Calculator, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { calculateDecayedActivity, Radionuclide } from "@/src/lib/nuclear/decay";

export default function NuclearMedicinePage() {
  const [radionuclide, setRadionuclide] = useState<Radionuclide>("I-131");
  const [initialDose, setInitialDose] = useState("150");
  const [elapsedHours, setElapsedHours] = useState("4");
  const [pregnancyChecked, setPregnancyChecked] = useState(false);
  const [lowIodineChecked, setLowIodineChecked] = useState(true);
  const [breastfeedingChecked, setBreastfeedingChecked] = useState(true);
  const [overrideReason, setOverrideReason] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentDose = calculateDecayedActivity(
    Number(initialDose) || 0,
    Number(elapsedHours) || 0,
    radionuclide
  );

  const handleStartProcedure = () => {
    // Pregnancy Test Hard Stop Check
    if (!pregnancyChecked) {
      setStatusMessage(
        "CRITICAL CLINICAL SAFETY HARD-STOP: ไม่อนุญาตให้เริ่มหัตถการสารรังสีเด็ดขาด หากยังไม่มีผลตรวจการตั้งครรภ์ (Pregnancy Test / UPT Negative) ที่ผ่านการยืนยัน"
      );
      return;
    }

    if (!lowIodineChecked || !breastfeedingChecked) {
      if (!overrideReason.trim()) {
        setStatusMessage(
          "คำเตือน: เกณฑ์การเตรียมตัวยังไม่ครบ กรุณาให้แพทย์เฉพาะทางกรอก 'Clinical Justification' เพื่อ Override"
        );
        return;
      }
    }

    setStatusMessage(
      `ยืนยันเริ่มหัตถการและบันทึก Snapshot ปริมาณรังสีที่ให้จริง (${currentDose.toFixed(2)} mCi) ลงในเวชระเบียนเรียบร้อย`
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Radiation className="w-6 h-6 text-purple-600" />
          เวชศาสตร์นิวเคลียร์ (Nuclear Medicine & Radiopharmaceuticals)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          เครื่องคำนวณการสลายตัวของสารรังสี (Decay Calc), บันทึก Snapshot ปริมาณรังสีทางกฎหมาย และ Safety Checklist Hard Stop
        </p>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-2 ${
            statusMessage.includes("HARD-STOP")
              ? "bg-red-50 border-red-200 text-red-800 font-medium"
              : "bg-purple-50 border-purple-200 text-purple-900"
          }`}
        >
          {statusMessage.includes("HARD-STOP") ? (
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Real-time Decay Calculator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-600" />
          เครื่องคำนวณการสลายตัวของสารรังสี (Radioactive Decay Calculator)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชนิดสารกัมมันตรังสี</label>
            <select
              value={radionuclide}
              onChange={(e) => setRadionuclide(e.target.value as Radionuclide)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="I-131">I-131 (Half-life ~8.02 วัน)</option>
              <option value="Tc-99m">Tc-99m (Half-life ~6.01 ชั่วโมง)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ปริมาณสอบเทียบแรก (Calibrated Dose - mCi)</label>
            <input
              type="number"
              value={initialDose}
              onChange={(e) => setInitialDose(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เวลาที่ผ่านไป (Elapsed Hours)</label>
            <input
              type="number"
              step="0.5"
              value={elapsedHours}
              onChange={(e) => setElapsedHours(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-purple-800 font-medium block">ปริมาณรังสีที่คงเหลือ ณ ปัจจุบัน (Administered Dose)</span>
            <span className="text-2xl font-bold text-purple-900 font-mono">
              {currentDose.toFixed(2)} mCi
            </span>
          </div>
          <span className="text-xs bg-purple-200/60 text-purple-900 px-2 py-1 rounded">
            Decay Factor: {initialDose ? (currentDose / Number(initialDose)).toFixed(4) : 0}
          </span>
        </div>
      </div>

      {/* Safety Checklist Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 pb-2 border-b flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          รายการตรวจสอบความปลอดภัยทางรังสี (Radiation Safety Checklist)
        </h2>

        {/* Level 1: Hard Stop */}
        <div className="p-4 bg-red-50/60 rounded-xl border border-red-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pregnancyChecked}
              onChange={(e) => setPregnancyChecked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
            />
            <div>
              <span className="text-sm font-bold text-red-900 block">
                [Level 1: Absolute Hard Stop 100%] ผลตรวจการตั้งครรภ์เป็นลบ (UPT Negative)
              </span>
              <span className="text-xs text-red-700">
                สำหรับสตรีวัยเจริญพันธุ์ ต้องได้รับการยืนยันผลแล็บ Negative ภายใน 48 ชั่วโมง มิฉะนั้นระบบจะบล็อกหัตถการเด็ดขาด
              </span>
            </div>
          </label>
        </div>

        {/* Level 2: Soft Warning */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={lowIodineChecked}
              onChange={(e) => setLowIodineChecked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600"
            />
            <span className="text-xs text-gray-700">ผู้ป่วยงดอาหารและยาที่มีสารไอโอดีน (Low Iodine Diet) ตามเกณฑ์</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={breastfeedingChecked}
              onChange={(e) => setBreastfeedingChecked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600"
            />
            <span className="text-xs text-gray-700">ผู้ป่วยไม่ได้อยู่ระหว่างให้นมบุตร (Discontinue Breastfeeding)</span>
          </label>
        </div>

        {(!lowIodineChecked || !breastfeedingChecked) && (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Clinical Justification (เหตุผลทางคลินิกสำหรับการ Override)
            </label>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="ระบุเหตุผลความจำเป็นทางการแพทย์ของผู้เชี่ยวชาญ..."
              className="w-full px-3 py-1.5 text-sm border border-red-200 bg-red-50/20 rounded-lg"
            />
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleStartProcedure}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors shadow-md shadow-purple-500/20"
          >
            เริ่มหัตถการ & บันทึก Dose Snapshot (in_procedure)
          </button>
        </div>
      </div>
    </div>
  );
}
