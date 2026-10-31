"use client";

import React, { useState } from "react";
import { ClipboardList, HeartPulse, Send, AlertTriangle } from "lucide-react";
import { calculateBmi, completeTriage } from "@/src/lib/triage/triage";

export default function NurseTriagePage() {
  const [visitId, setVisitId] = useState("");
  const [hn, setHn] = useState("");
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [pulseRate, setPulseRate] = useState("75");
  const [bodyTemp, setBodyTemp] = useState("36.8");
  const [respRate, setRespRate] = useState("18");
  const [weight, setWeight] = useState("65");
  const [height, setHeight] = useState("170");
  const [triageLevel, setTriageLevel] = useState<"routine" | "urgent" | "emergency">("routine");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [drugAllergy, setDrugAllergy] = useState("");
  const [allergySeverity, setAllergySeverity] = useState<"mild" | "moderate" | "severe_anaphylaxis">("moderate");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentBmi = calculateBmi(Number(weight) || 0, Number(height) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId || !hn) {
      setStatusMessage("กรุณาระบุ Visit ID และ HN ของผู้ป่วย");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const allergies = drugAllergy.trim()
      ? [{ drug_name: drugAllergy.trim(), severity: allergySeverity }]
      : [];

    const { success, error } = await completeTriage({
      visitId,
      hn,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulseRate: Number(pulseRate),
      bodyTemperature: Number(bodyTemp),
      respiratoryRate: Number(respRate),
      weightKg: Number(weight),
      heightCm: Number(height),
      triageLevel,
      chiefComplaint,
      allergies,
    });

    setIsSubmitting(false);

    if (success) {
      setStatusMessage("บันทึกสัญญาณชีพและส่งตัวเข้าคิวตรวจของแพทย์ (triaged) สำเร็จแล้ว");
      setChiefComplaint("");
      setDrugAllergy("");
    } else {
      setStatusMessage(error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-emerald-600" />
          จุดคัดกรองพยาบาล: บันทึกสัญญาณชีพและคัดกรองอาการ (Nurse Triage)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          บันทึก Vital Signs คำนวณ BMI อัตโนมัติ บันทึกประวัติแพ้ยา และส่งต่อผู้ป่วยเข้าสู่คิวแพทย์ (triaged)
        </p>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Visit ID (UUID)</label>
            <input
              type="text"
              required
              value={visitId}
              onChange={(e) => setVisitId(e.target.value)}
              placeholder="UUID ของ Visit ปัจจุบัน"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            สัญญาณชีพ (Vital Signs)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ความดันตัวบน (Systolic)</label>
              <input
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">ความดันตัวล่าง (Diastolic)</label>
              <input
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">ชีพจร (Pulse /min)</label>
              <input
                type="number"
                value={pulseRate}
                onChange={(e) => setPulseRate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">อุณหภูมิ (°C)</label>
              <input
                type="number"
                step="0.1"
                value={bodyTemp}
                onChange={(e) => setBodyTemp(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">หายใจ (Resp /min)</label>
              <input
                type="number"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">น้ำหนัก (kg)</label>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">ส่วนสูง (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200 flex flex-col justify-center">
              <span className="text-xs text-emerald-800 font-medium">BMI อัตโนมัติ</span>
              <span className="text-lg font-bold text-emerald-900">{currentBmi}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">อาการสำคัญ (Chief Complaint)</label>
          <textarea
            required
            rows={2}
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="ระบุอาการสำคัญ เช่น แน่นหน้าอก หายใจไม่อิ่ม 1 ชั่วโมงก่อนมา"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="border-t pt-4 bg-red-50/50 p-4 rounded-xl border border-red-100">
          <h3 className="text-xs font-bold text-red-900 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            ลงทะเบียนประวัติแพ้ยา (Drug Allergy Registration)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-700 mb-1">ชื่อยาที่แพ้ (ถ้ามี)</label>
              <input
                type="text"
                value={drugAllergy}
                onChange={(e) => setDrugAllergy(e.target.value)}
                placeholder="เช่น Penicillin, Amoxicillin, Ibuprofen"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">ระดับความรุนแรง</label>
              <select
                value={allergySeverity}
                onChange={(e) => setAllergySeverity(e.target.value as "mild" | "moderate" | "severe_anaphylaxis")}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              >
                <option value="mild">ผื่นเล็กน้อย / คัน (Mild)</option>
                <option value="moderate">ลมพิษ บวม (Moderate)</option>
                <option value="severe_anaphylaxis">แพ้รุนแรง / Anaphylaxis (Severe)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "กำลังส่งต่อ..." : "บันทึกคัดกรองและส่งต่อแพทย์ (triaged)"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
