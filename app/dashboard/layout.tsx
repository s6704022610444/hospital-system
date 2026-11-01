"use client";

import React from "react";
import { AppSidebar } from "@/src/components/layout/AppSidebar";
import { useAuth } from "@/src/context/AuthContext";
import { ROLE_CONFIGS, HospitalRole } from "@/src/types/auth";
import { Bell, Calendar, ShieldCheck } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const activeRole: HospitalRole =
    user?.activeRole && ROLE_CONFIGS[user.activeRole]
      ? user.activeRole
      : "registrar";
  const roleConfig = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.registrar;

  const todayThai = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8faf8]">
      {/* 1. Left Sidebar (Olive Green Theme) */}
      <AppSidebar />

      {/* 2. Main Workspace (Right Canvas) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs bg-olive-50 text-[#5f7c44] font-bold px-2.5 py-1 rounded-lg border border-olive-200">
              {roleConfig.title}
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              {roleConfig.department}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#5f7c44]" />
              <span>{todayThai}</span>
            </div>

            <div className="h-4 w-px bg-gray-200 hidden md:block" />

            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold hidden sm:inline">เชื่อมต่อปลอดภัย</span>
              <span className="text-[10px] font-mono text-emerald-600">(PDPA Compliant)</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8faf8]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
