"use client";

import React from "react";
import { Printer, X, Tag } from "lucide-react";
import { formatHnDisplay, formatVnDisplay } from "@/src/lib/utils/formatters";

export interface BarcodeLabelData {
  hn: string;
  vn: string;
  patientName: string;
  gender: string;
  age: number;
  clinic: string;
  visitDate: string;
}

interface BarcodeLabelsModalProps {
  data: BarcodeLabelData | null;
  isOpen: boolean;
  onClose: () => void;
  labelCount?: number;
}

export function BarcodeLabelsModal({
  data,
  isOpen,
  onClose,
  labelCount = 6,
}: BarcodeLabelsModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => window.print();
  const displayHn = formatHnDisplay(data.hn);
  const displayVn = formatVnDisplay(data.vn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200">
        {/* Modal Controls (Not Printed) */}
        <div className="print-hidden flex justify-between items-center px-6 py-4 bg-[#5f7c44] text-white">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-olive-200" />
            <div>
              <h3 className="font-bold text-sm">สติกเกอร์บาร์โค้ดประจำตัวผู้ป่วย</h3>
              <span className="text-[11px] text-olive-100 block">Barcode Label Stickers • ADR 0004</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#4e6737] hover:bg-olive-50 text-xs font-bold rounded-lg shadow-sm">
              <Printer className="w-4 h-4" /><span>พิมพ์สติกเกอร์</span>
            </button>
            <button type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 bg-gray-50 max-h-[75vh] overflow-y-auto">
          <div className="text-xs text-gray-500 font-medium mb-3 print-hidden flex justify-between">
            <span>ตัวอย่างแผ่นสติกเกอร์ ({labelCount} ดวง/แผ่น)</span>
            <span className="font-mono text-[11px] text-gray-400">ขนาดอ้างอิง: 50 x 30 มม. (ปรับตามเครื่องจริง)</span>
          </div>
          <div data-print-target="labels" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 print:grid-cols-2 print:gap-2 print:m-0">
            {Array.from({ length: labelCount }).map((_, idx) => (
              <div key={idx} className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-3 text-left flex flex-col justify-between h-28 print:border-solid print:border-gray-800 print:rounded-none print:shadow-none print:break-inside-avoid">
                <div>
                  <div className="flex justify-between items-start leading-tight">
                    <span className="font-extrabold text-xs text-gray-900 truncate max-w-[170px]">{data.patientName}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{data.gender === "M" ? "ช" : "ญ"} {data.age}ป.</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[11px] font-bold text-gray-800 mt-0.5">
                    <span className="bg-gray-100 px-1 rounded">{displayHn}</span>
                    <span className="text-[#5f7c44]">{displayVn}</span>
                  </div>
                </div>
                <div className="text-center my-0.5">
                  {/* Placeholder bars only. Replace with barcode renderer & scanner validation before clinical use. */}
                  <div className="font-mono text-sm tracking-[0.2em] font-black text-gray-900 leading-none py-0.5 select-none">||| | ||||| || |||||| | |||||</div>
                  <span className="text-[9px] font-mono text-gray-400 block leading-tight">*{displayHn}*</span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-500 border-t border-gray-100 pt-0.5">
                  <span className="truncate max-w-[140px]">{data.clinic.split(" (")[0]}</span>
                  <span className="font-mono">{new Date(data.visitDate).toLocaleDateString("th-TH")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="print-hidden px-6 py-3 bg-white border-t border-gray-100 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}
