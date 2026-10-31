"use client";

import React, { useState } from "react";
import { BarChart3, ShieldCheck, Download, Users, Clock } from "lucide-react";

export default function DirectorDashboardPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportCsv = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const res = await fetch("/api/audit/export?startDate=2026-01-01");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setExportMessage("ส่งออกไฟล์ CSV สำเร็จ และระบบได้บันทึก Self-Auditing Log (log_export_generated) เรียบร้อยแล้ว");
    } catch {
      setExportMessage("ไม่สามารถส่งออกไฟล์ CSV ได้");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-yellow-600" />
            แดชบอร์ดผู้อำนวยการ & สถิติความปลอดภัย (Director Dashboard)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ภาพรวมการดำเนินงานของโรงพยาบาล สถิติความปลอดภัยการเข้าถึง PHI และการตรวจสอบ Audit Trail
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? "กำลังดาวน์โหลด..." : "ส่งออก Audit Log (CSV)"}</span>
        </button>
      </div>

      {exportMessage && (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">ผู้ป่วยเข้ารับบริการวันนี้</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 font-mono">184</span>
          <span className="text-xs text-teal-600 block mt-1">+12% จากสัปดาห์ก่อน</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">ระยะเวลารอคอยเฉลี่ย</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-3xl font-extrabold text-gray-900 font-mono">24 นาที</span>
          <span className="text-xs text-amber-600 block mt-1">อยู่ในเกณฑ์มาตรฐาน OPD</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">การเข้าดูข้อมูลสุขภาพ (PHI Reads)</span>
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-3xl font-extrabold text-indigo-950 font-mono">1,420</span>
          <span className="text-xs text-gray-500 block mt-1">บันทึกลง Read Audit ครบ 100%</span>
        </div>
      </div>
    </div>
  );
}
