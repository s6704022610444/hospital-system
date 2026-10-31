"use client";

import React, { useState } from "react";
import { Stethoscope, UserCheck, BookOpen, Send, CheckCircle2 } from "lucide-react";
import { callPatientToDoctor, saveClinicalEncounter } from "@/src/lib/clinical/encounter";

export default function DoctorConsultationPage() {
  const [activeTab, setActiveTab] = useState<"triaged" | "doctor_review">("triaged");
  const [visitId, setVisitId] = useState("");
  const [hn, setHn] = useState("");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [icd10Code, setIcd10Code] = useState("E11.9");
  const [icd10Desc, setIcd10Desc] = useState("Type 2 diabetes mellitus without complications");

  const [isCalling, setIsCalling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCallPatient = async () => {
    if (!visitId) {
      setMessage("กรุณาระบุ Visit ID เพื่อเรียกเข้าห้องตรวจ");
      return;
    }
    setIsCalling(true);
    setMessage(null);
    const { success, error } = await callPatientToDoctor(visitId);
    setIsCalling(false);
    if (success) {
      setMessage("เรียกผู้ป่วยเข้าห้องตรวจสำเร็จ (สถานะเปลี่ยนเป็น in_doctor)");
    } else {
      setMessage(error || "ไม่สามารถเรียกผู้ป่วยได้");
    }
  };

  const handleSaveEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId || !hn) {
      setMessage("กรุณาระบุ Visit ID และ HN");
      return;
    }
    setIsSaving(true);
    setMessage(null);
    const { success, error } = await saveClinicalEncounter({
      visitId,
      hn,
      subjective,
      objective,
      assessment,
      plan,
      diagnoses: [{ icd10_code: icd10Code, icd10_description: icd10Desc, diagnosis_type: "primary" }],
    });
    setIsSaving(false);
    if (success) {
      setMessage("บันทึกประวัติการตรวจ (SOAP) และรหัสโรค ICD-10 สำเร็จ");
    } else {
      setMessage(error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-indigo-600" />
          ห้องตรวจแพทย์ (Doctor Consultation & Queue)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          แยกคิวคนไข้ใหม่และคนไข้วนกลับมาฟังผล (Dual Queue), บันทึก SOAP และวินิจฉัยรหัสโรคมาตรฐาน ICD-10
        </p>
      </div>

      {/* Queue Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("triaged")}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "triaged"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          คิวรอตรวจรอบแรก (triaged)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("doctor_review")}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "doctor_review"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          คิววนกลับมาฟังผลแล็บ/เอกซเรย์ (doctor_review)
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Call Patient Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          เรียกคนไข้เข้าห้องตรวจ (Change to in_doctor)
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={visitId}
            onChange={(e) => setVisitId(e.target.value)}
            placeholder="ใส่ Visit ID (UUID) จากคิว"
            className="w-full sm:flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="button"
            onClick={handleCallPatient}
            disabled={isCalling}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            {isCalling ? "กำลังเรียก..." : "กดเรียกเข้าห้องตรวจ"}
          </button>
        </div>
      </div>

      {/* SOAP & ICD-10 Form */}
      <form onSubmit={handleSaveEncounter} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          บันทึกการตรวจรักษา (SOAP) & วินิจฉัยโรค ICD-10
        </h2>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">HN</label>
          <input
            type="text"
            required
            value={hn}
            onChange={(e) => setHn(e.target.value)}
            placeholder="HN-2026-000001"
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subjective (อาการที่คนไข้บอก)</label>
            <textarea
              required
              rows={2}
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Objective (ผลการตรวจร่างกาย/แล็บ)</label>
            <textarea
              required
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assessment (การประเมิน/วินิจฉัย)</label>
            <textarea
              required
              rows={2}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Plan (แผนการรักษา/คำสั่งตรวจ/ยา)</label>
            <textarea
              required
              rows={2}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
        </div>

        {/* ICD-10 Selection */}
        <div className="border-t pt-4 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
          <label className="block text-xs font-bold text-indigo-900 mb-2">รหัสโรคมาตรฐาน ICD-10</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">รหัส ICD-10</span>
              <input
                type="text"
                required
                value={icd10Code}
                onChange={(e) => setIcd10Code(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs text-gray-600 mb-1">คำอธิบายโรค</span>
              <input
                type="text"
                required
                value={icd10Desc}
                onChange={(e) => setIcd10Desc(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSaving ? "กำลังบันทึก..." : "บันทึกประวัติการตรวจ (Save Encounter)"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
