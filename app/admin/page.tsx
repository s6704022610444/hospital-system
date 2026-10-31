"use client";

import React, { useEffect, useState } from "react";
import { Shield, Users, FileText, Download, CheckCircle2, RefreshCw } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

interface AuditLogItem {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  active_role: string;
  created_at: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "users">("audit");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, table_name, record_id, action, active_role, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setLogs(data as AuditLogItem[]);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-600" />
            ผู้ดูแลระบบ (Admin Console & Audit Trail Viewer)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ตรวจสอบ Append-Only Audit Trail (Write & Read Logs), จัดการผู้ใช้ และส่งออกข้อมูล
          </p>
        </div>

        <a
          href="/api/audit/export?startDate=2026-01-01"
          download
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log (CSV)</span>
        </a>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "audit"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          ประวัติการตรวจสอบ (Audit Trail Viewer)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "users"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          บัญชีผู้ใช้และบทบาท (10 Roles Management)
        </button>
      </div>

      {/* Tab: Audit Logs */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-sm font-bold text-gray-800">
              บันทึกกิจกรรมล่าสุด (Append-Only Log Stream - ห้ามแก้ไข/ห้ามลบ)
            </h2>
            <button
              type="button"
              onClick={fetchAuditLogs}
              disabled={isLoading}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              รีเฟรช Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">วันเวลา (Timestamp)</th>
                  <th className="px-4 py-3">ตาราง (Table)</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Active Role</th>
                  <th className="px-4 py-3">Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {new Date(log.created_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{log.table_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px]">
                          {log.active_role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 truncate max-w-xs">{log.record_id}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 font-sans">
                      ยังไม่พบรายการ Audit Log (เริ่มใช้งานระบบเพื่อบันทึกประวัติอัตโนมัติ)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users & Roles */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">บัญชีทดสอบ 10 บทบาท (Demo Test Accounts)</h2>
          <p className="text-xs text-gray-500 mb-4">
            ทุกบัญชีใช้รหัสผ่าน: <code className="bg-gray-100 px-1 py-0.5 rounded font-bold font-mono">Password123!</code>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">1. เวชระเบียน: registrar@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: registrar</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">2. พยาบาล: nurse@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: nurse</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">3. แพทย์: doctor@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: doctor</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">4. เทคนิคการแพทย์: medtech@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: med_tech</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">5. เวชศาสตร์นิวเคลียร์: nuclearmed@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: nuclear_med</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">6. การเงิน: cashier@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: cashier</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">7. เภสัชกร: pharmacist@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: pharmacist</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">8. คลังสินค้า: warehouse@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: warehouse</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">9. ผู้ดูแลระบบ: admin@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: admin</span>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <span className="font-bold text-gray-900 block">10. ผู้อำนวยการ: director@hospital.local</span>
              <span className="text-gray-500 font-mono">Role: director</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
