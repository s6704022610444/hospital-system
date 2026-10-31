"use client";

import React, { useState } from "react";
import { Sliders, CreditCard, Radio, Shield, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";

export function SimulatorDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSimulateHealthId = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mock/health-id/scan");
      const json = await res.json();
      showToast(`จำลองเสียบบัตรสำเร็จ: ${json.data.firstName} ${json.data.lastName} (CID: ${json.data.nationalId})`);
    } catch {
      showToast("จำลองเสียบบัตรล้มเหลว");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatePaymentWebhook = async () => {
    setIsLoading(true);
    try {
      showToast("จำลองส่ง Webhook ชำระเงินจากธนาคาร: สำเร็จ (Simulated Bank Callback)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toast */}
      {notification && (
        <div className="mb-2 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl flex items-center gap-2 animate-fadeIn border border-slate-700 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Drawer Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-80 sm:w-96 transition-all duration-300">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-slate-900 text-white text-sm font-semibold flex items-center justify-between hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>Simulator Control Panel</span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30 font-mono">
              Dev Tools
            </span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="p-4 space-y-3 bg-gray-50/50">
            <div className="text-xs text-gray-500 mb-2">
              แผงควบคุมการจำลองเหตุการณ์ภายนอก (ADR 0006 Mock Services)
            </div>

            <button
              type="button"
              onClick={handleSimulateHealthId}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 hover:border-teal-400 rounded-xl text-xs font-medium text-gray-800 shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Simulate Health ID Smart Card Read</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">/health-id</span>
            </button>

            <button
              type="button"
              onClick={handleSimulatePaymentWebhook}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 hover:border-emerald-400 rounded-xl text-xs font-medium text-gray-800 shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Simulate Bank QR Payment Webhook</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">/webhook</span>
            </button>

            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2 text-xs text-purple-900">
              <Radio className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Realtime Queue: รองรับ SWR Polling Fallback 15s เมื่อหลุดการเชื่อมต่อ
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
