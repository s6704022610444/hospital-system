"use client";

import React from "react";
import { Printer, X, FileText } from "lucide-react";
import { formatHnDisplay, formatVnDisplay } from "@/src/lib/utils/formatters";

export interface OpdSlipData {
  hn: string;
  vn: string;
  queueNumber: string;
  patientName: string;
  gender: string;
  age: number;
  clinic: string;
  insuranceScheme: string;
  authenCode?: string;
  rightVerificationStatus?: string;
  actVehiclePlate?: string;
  actInsuranceCompany?: string;
  allergies?: string;
  emergencyContact?: string;
  chiefComplaint: string;
  registeredAt: string;
}

interface OpdRoutingSlipModalProps {
  data: OpdSlipData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OpdRoutingSlipModal({ data, isOpen, onClose }: OpdRoutingSlipModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(data.registeredAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(data.registeredAt).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const displayHn = formatHnDisplay(data.hn);
  const displayVn = formatVnDisplay(data.vn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        {/* Modal Controls (Not Printed) */}
        <div className="print-hidden flex justify-between items-center px-6 py-4 bg-[#5f7c44] text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-olive-200" />
            <div>
              <h3 className="font-bold text-sm">ใบนำทางผู้ป่วยนอก (OPD Routing Slip)</h3>
              <span className="text-[11px] text-olive-100 block">
                โรงพยาบาลมหาราชนครราชสีมา (ADR 0004)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#4e6737] hover:bg-olive-50 text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบนำทาง (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable OPD Slip Body (Refined matching real Maharat forms) */}
        <div data-print-target="slip" className="p-7 text-gray-900 font-sans print:p-0">
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-gray-300 flex flex-col items-center">
            <img
              src="/logo.png"
              alt="โลโก้โรงพยาบาลมหาราชนครราชสีมา"
              className="w-12 h-12 object-contain mb-1.5"
            />
            <h2 className="text-lg font-black tracking-tight text-gray-900">
              โรงพยาบาลมหาราชนครราชสีมา
            </h2>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
              Maharat Nakhon Ratchasima Hospital • OPD Slip
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              วันที่รับบริการ: {formattedDate} เวลา: {formattedTime} น.
            </p>
          </div>

          {/* Queue Callout */}
          <div className="my-4 p-3.5 bg-olive-50 rounded-2xl border border-olive-200 text-center">
            <span className="text-[11px] text-[#4e6737] font-bold tracking-wider uppercase block">
              หมายเลขคิวผู้ป่วยนอก
            </span>
            <span className="text-4xl font-black text-[#36452a] font-mono tracking-tight block my-0.5">
              {data.queueNumber}
            </span>
            <span className="text-xs font-bold text-gray-800 block">
              {data.clinic}
            </span>
          </div>

          {/* Patient Details */}
          <div className="space-y-2 py-2 text-xs border-b border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">ชื่อ-นามสกุล:</span>
              <span className="font-bold text-gray-900">{data.patientName}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-500 font-sans font-medium">เลขประจำตัว (HN):</span>
              <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                {displayHn}
              </span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-500 font-sans font-medium">ลำดับการตรวจ (VN):</span>
              <span className="font-bold text-[#4e6737]">{displayVn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">เพศ / อายุ:</span>
              <span className="font-semibold text-gray-800">
                {data.gender === "M" ? "ชาย" : "หญิง"} ({data.age} ปี)
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-500 font-medium pt-0.5">สิทธิการรักษา:</span>
              <div className="text-right">
                <span className="font-semibold text-gray-800 block">{data.insuranceScheme}</span>
                {data.authenCode && data.authenCode !== "-" && (
                  <span className="inline-block text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                    Authen Code: {data.authenCode} ✓
                  </span>
                )}
                {data.actVehiclePlate && (
                  <span className="block text-[10px] text-amber-900 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                    พ.ร.บ. ทะเบียน: {data.actVehiclePlate} ({data.actInsuranceCompany || "บ.ประกันภัย"})
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">อาการสำคัญ:</span>
              <span className="font-semibold text-gray-800 truncate max-w-[210px]">
                {data.chiefComplaint || "-"}
              </span>
            </div>
            {data.allergies && data.allergies !== "ปฏิเสธประวัติแพ้ยา" ? (
              <div className="flex justify-between items-start bg-red-50 p-1.5 rounded-lg border border-red-200">
                <span className="text-red-700 font-bold">⚠️ แพ้ยา/อาหาร:</span>
                <span className="font-bold text-red-900 text-right">{data.allergies}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">ประวัติแพ้ยา:</span>
                <span className="text-gray-700 font-medium">{data.allergies || "ปฏิเสธประวัติแพ้ยา"}</span>
              </div>
            )}
            {data.emergencyContact && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 font-medium">ผู้ติดต่อฉุกเฉิน:</span>
                <span className="font-semibold text-gray-800">{data.emergencyContact}</span>
              </div>
            )}
          </div>

          {/* Patient Instructions */}
          <div className="mt-3.5 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="font-bold text-gray-900 block mb-1">
              ขั้นตอนการเข้ารับบริการ:
            </span>
            <ol className="list-decimal list-inside space-y-0.5 text-gray-600 text-[11px]">
              <li>นำใบนำทางนี้ไปยื่นที่ <strong>จุดคัดกรองพยาบาล (Triage)</strong></li>
              <li>วัดความดันโลหิตและประเมินสัญญาณชีพ</li>
              <li>รอเรียกชื่อเข้าห้องตรวจตามหมายเลขคิว <strong>{data.queueNumber}</strong></li>
            </ol>
          </div>

          {/* Barcode representation */}
          <div className="mt-3.5 pt-3 border-t-2 border-dashed border-gray-300 text-center flex flex-col items-center">
            <div className="font-mono text-xl tracking-[0.25em] font-black text-gray-900 py-0.5 select-none">
              ||| | ||||| || |||||| | ||||| |||
            </div>
            <span className="text-[10px] text-gray-400 font-mono">*{displayVn}*</span>
          </div>
        </div>

        {/* Modal Footer (Not Printed) */}
        <div className="print-hidden px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
