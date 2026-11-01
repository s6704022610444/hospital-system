"use client";

import React, { useState } from "react";
import { X, UserCheck, AlertTriangle, ShieldCheck, Check, RefreshCw } from "lucide-react";
import { PatientRecord } from "@/src/lib/patient/registrar-service";
import { formatHnDisplay } from "@/src/lib/utils/formatters";

interface PatientEditModalProps {
  patient: PatientRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updated: PatientRecord) => void;
}

export function PatientEditModal({
  patient,
  isOpen,
  onClose,
  onSaveSuccess,
}: PatientEditModalProps) {
  if (!isOpen || !patient) return null;

  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [nationalId, setNationalId] = useState(patient.nationalId || "");
  const [phone, setPhone] = useState(patient.phone || "");
  const [address, setAddress] = useState(patient.address || "");
  const [insuranceScheme, setInsuranceScheme] = useState(patient.insuranceScheme);
  const [affiliatedHospital, setAffiliatedHospital] = useState(patient.affiliatedHospital || "");
  const [allergies, setAllergies] = useState(patient.allergies || "ปฏิเสธประวัติแพ้ยา");
  const [emergencyContactName, setEmergencyContactName] = useState(patient.emergencyContactName || "");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(patient.emergencyContactRelationship || "ญาติ");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(patient.emergencyContactPhone || "");

  const [amendmentReason, setAmendmentReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLegalIdentityModified =
    firstName.trim() !== patient.firstName ||
    lastName.trim() !== patient.lastName ||
    nationalId.trim() !== (patient.nationalId || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLegalIdentityModified && !amendmentReason.trim()) {
      setError("การแก้ไขชื่อ-นามสกุล หรือเลขบัตรประชาชน ต้องระบุเหตุผลการแก้ไข (ADR 0005)");
      return;
    }

    setIsSaving(true);
    try {
      const updated: PatientRecord = {
        ...patient,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalId: nationalId.trim() || undefined,
        phone: phone.trim(),
        address: address.trim(),
        insuranceScheme,
        affiliatedHospital: affiliatedHospital.trim() || undefined,
        allergies: allergies.trim() || "ปฏิเสธประวัติแพ้ยา",
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactRelationship: emergencyContactName.trim() ? emergencyContactRelationship : undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      };

      onSaveSuccess(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 bg-[#5f7c44] text-white">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-olive-200" />
            <div>
              <h3 className="font-bold text-sm">แก้ไขข้อมูลผู้ป่วย ({formatHnDisplay(patient.hn)})</h3>
              <span className="text-[11px] text-olive-100 block">การแก้ไขข้อมูลสำคัญจะถูกบันทึกลง Audit Trail</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <ShieldCheck className="w-4 h-4 text-[#5f7c44]" />
              <span>ข้อมูลสำคัญทางกฎหมาย (Legal Identity Fields)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ</label>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-[#5f7c44]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">นามสกุล</label>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-[#5f7c44]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">เลขบัตรประจำตัวประชาชน 13 หลัก</label>
                <input type="text" maxLength={13} value={nationalId} onChange={(e) => setNationalId(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg font-mono focus:ring-2 focus:ring-[#5f7c44]" />
              </div>
            </div>

            {isLegalIdentityModified && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                <label className="block text-xs font-bold text-amber-900">ระบุเหตุผลการแก้ไขข้อมูลสำคัญทางกฎหมาย * (ADR 0005)</label>
                <textarea required rows={2} value={amendmentReason} onChange={(e) => setAmendmentReason(e.target.value)} placeholder="เช่น มีใบสำคัญการเปลี่ยนชื่อ-สกุล จากที่ว่าการอำเภอ" className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 bg-white" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-700">ข้อมูลติดต่อและสิทธิการรักษาทั่วไป</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">เบอร์โทรศัพท์</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">สิทธิการรักษา</label>
                <select value={insuranceScheme} onChange={(e) => setInsuranceScheme(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white">
                  <option value="Universal Coverage">บัตรทอง (Universal Coverage)</option>
                  <option value="Social Security">ประกันสังคม (Social Security)</option>
                  <option value="Civil Servant">ข้าราชการจ่ายตรง (Civil Servant)</option>
                  <option value="Self-pay">ชำระเงินเอง (Self-pay)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-red-700 mb-1">⚠️ ประวัติแพ้ยาและสารเคมี</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="เช่น ปฏิเสธประวัติแพ้ยา, แพ้ยา Penicillin"
                  className="w-full px-3 py-1.5 text-xs border rounded-lg font-medium text-red-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ผู้ติดต่อฉุกเฉิน</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="ชื่อ-สกุลญาติ"
                  className="w-full px-3 py-1.5 text-xs border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">เบอร์ติดต่อฉุกเฉิน</label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="089-xxx-xxxx"
                  className="w-full px-3 py-1.5 text-xs border rounded-lg font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">สถานพยาบาลตามสิทธิ (Affiliated Hospital)</label>
                <input type="text" value={affiliatedHospital} onChange={(e) => setAffiliatedHospital(e.target.value)} placeholder="เช่น รพช.ธัญบุรี, รพ.ชัยภูมิ" className="w-full px-3 py-1.5 text-xs border rounded-lg" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">ที่อยู่ปัจจุบัน</label>
                <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">ยกเลิก</button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white text-xs font-bold shadow-md shadow-[#5f7c44]/20 disabled:opacity-50">
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}<span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
