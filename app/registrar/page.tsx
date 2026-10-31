"use client";

import React, { useState } from "react";
import { registerOrOpenVisit, RegisterPatientInput, RegistrationResult } from "@/src/lib/patient/registration";
import { CreditCard, CheckCircle2, AlertCircle, UserPlus, RefreshCw, AlertTriangle } from "lucide-react";

export default function RegistrarPage() {
  const [formData, setFormData] = useState<RegisterPatientInput>({
    nationalId: "",
    firstName: "",
    lastName: "",
    gender: "M",
    birthDate: "",
    phone: "",
    address: "",
    bloodGroup: "O",
    insuranceScheme: "Universal Coverage",
    chiefComplaint: "",
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateSmartCard = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/mock/health-id/scan");
      const json = await res.json();
      if (json.status === "success" && json.data) {
        setFormData((prev) => ({
          ...prev,
          nationalId: json.data.nationalId,
          firstName: json.data.firstName,
          lastName: json.data.lastName,
          gender: json.data.gender,
          birthDate: json.data.birthDate,
          bloodGroup: json.data.bloodGroup,
          insuranceScheme: json.data.insuranceScheme,
          phone: json.data.phone,
          address: json.data.address,
        }));
      }
    } catch {
      setError("ไม่สามารถอ่านข้อมูลจำลองจาก Health ID Smart Card ได้");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const { data, error: regError } = await registerOrOpenVisit(formData);
    setIsSubmitting(false);

    if (regError) {
      setError(regError);
    } else if (data) {
      setResult(data);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-teal-600" />
            เวชระเบียน: ลงทะเบียนผู้ป่วย & เปิด Visit (OPD Registration)
          </h1>
          <p className="text-sm text-gray-500">
            ออกเลข HN ถาวร และเปิดรหัส Visit (VN) ส่งต่อเข้าคิวพยาบาลคัดกรอง
          </p>
        </div>

        {/* Simulate Smart Card Button */}
        <button
          type="button"
          onClick={handleSimulateSmartCard}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 font-medium text-sm transition-colors shadow-sm"
        >
          {isScanning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4 text-teal-600" />
          )}
          <span>จำลองอ่านบัตร Smart Card (Health ID)</span>
          <span className="text-xs bg-teal-200/60 text-teal-800 px-1.5 py-0.5 rounded font-mono">
            simulated
          </span>
        </button>
      </div>

      {/* Outstanding Balance Warning Banner (Debt Alert) */}
      {result && result.outstandingBalance > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">แจ้งเตือนยอดหนี้ค้างชำระ (Outstanding Balance Alert)</h4>
            <p className="text-xs mt-0.5">
              ผู้ป่วย HN นี้มียอดหนี้ค้างชำระสะสมจากการรับบริการครั้งก่อนจำนวน{" "}
              <span className="font-bold text-red-700 underline">
                {result.outstandingBalance.toLocaleString()} บาท
              </span>{" "}
              กรุณาแนะนำผู้ป่วยเคลียร์ค่าใช้จ่ายที่ห้องการเงินก่อนรับบริการ
            </p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {result && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {result.isExistingPatient
                ? "เปิด Visit ใหม่สำเร็จสำหรับผู้ป่วยเดิม (Existing Patient)"
                : "ลงทะเบียนผู้ป่วยใหม่และเปิด Visit สำเร็จ"}
            </h4>
            <div className="text-xs mt-1 flex flex-wrap gap-4 font-mono">
              <span>HN: <strong>{result.hn}</strong></span>
              <span>VN: <strong>{result.vn}</strong></span>
              <span>สถานะคิว: <strong className="text-teal-700">registered (ส่งต่อไปจุดคัดกรองแล้ว)</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          ข้อมูลประจำตัวผู้ป่วย (Patient Demographics)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              เลขบัตรประชาชน 13 หลัก (National ID)
            </label>
            <input
              type="text"
              required
              maxLength={13}
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
              placeholder="1103700543219"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ (First Name)</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">นามสกุล (Last Name)</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เพศ (Gender)</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="M">ชาย (Male)</option>
              <option value="F">หญิง (Female)</option>
              <option value="Other">อื่นๆ (Other)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">วันเดือนปีเกิด (Birth Date)</label>
            <input
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">หมู่โลหิต (Blood Group)</label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">สิทธิการรักษา (Insurance)</label>
            <select
              value={formData.insuranceScheme}
              onChange={(e) => setFormData({ ...formData, insuranceScheme: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Universal Coverage">บัตรทอง (Universal Coverage)</option>
              <option value="Social Security">ประกันสังคม (Social Security)</option>
              <option value="Civil Servant">ข้าราชการ (Civil Servant)</option>
              <option value="Self-pay">ชำระเงินเอง (Self-pay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์ (Phone)</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="081-234-5678"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">อาการสำคัญเบื้องต้น (Chief Complaint)</label>
            <input
              type="text"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              placeholder="เช่น มีไข้ ไอ เจ็บคอ 2 วัน"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Address */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 mb-1">ที่อยู่ตามทะเบียนบ้าน (Address)</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>บันทึกและเปิด Visit (Open VN)</span>
          </button>
        </div>
      </form>
    </div>
  );
}
