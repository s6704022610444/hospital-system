"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth, DEMO_USERS } from "@/src/context/AuthContext";
import { ROLE_CONFIGS, ROLE_MENUS, HospitalRole, MenuItem } from "@/src/types/auth";
import { HospitalLogo } from "./HospitalLogo";
import {
  UserPlus,
  Search,
  Users,
  Calendar,
  Clock,
  HeartPulse,
  AlertTriangle,
  Send,
  FileCheck,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  CalendarPlus,
  ListFilter,
  CheckCircle,
  Radiation,
  Activity,
  ShieldAlert,
  Calculator,
  AlertOctagon,
  Receipt,
  CreditCard,
  Printer,
  CheckCircle2,
  Boxes,
  PackagePlus,
  BarChart3,
  Timer,
  ShieldCheck,
  UserCog,
  FileSearch,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Shield,
  X,
  MapPin,
  Building,
  Mail,
} from "lucide-react";

// Icon mapping dictionary
const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus,
  Search,
  Users,
  Calendar,
  Clock,
  HeartPulse,
  AlertTriangle,
  Send,
  FileCheck,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  CalendarPlus,
  ListFilter,
  CheckCircle,
  Radiation,
  Activity,
  ShieldAlert,
  Calculator,
  AlertOctagon,
  Receipt,
  CreditCard,
  Printer,
  CheckCircle2,
  Boxes,
  PackagePlus,
  BarChart3,
  Timer,
  ShieldCheck,
  UserCog,
  FileSearch,
  Settings,
};

function SidebarNav({ menus }: { menus: MenuItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "search";

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
      <div className="text-[11px] font-semibold text-olive-200 px-3 pb-1 tracking-wide">
        เมนูการปฏิบัติงาน
      </div>

      {menus.map((item) => {
        const IconComponent = ICON_MAP[item.iconName] || FileText;

        let isActive = false;
        if (item.path.includes("?tab=")) {
          const [basePath, itemTab] = item.path.split("?tab=");
          const defaultTab = basePath === "/dashboard/nurse" ? "queue" : "search";
          const currentRoleTab = searchParams.get("tab") || defaultTab;
          isActive = pathname.startsWith(basePath) && currentRoleTab === itemTab;
        } else {
          isActive = pathname === item.path;
        }

        return (
          <Link
            key={item.id}
            href={item.path}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
              isActive
                ? "bg-white text-[#4a6333] shadow-md font-bold scale-[1.02]"
                : "text-white/90 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <IconComponent
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-[#5f7c44]" : "text-olive-200 group-hover:text-white"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {item.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                  isActive
                    ? "bg-[#5f7c44] text-white"
                    : "bg-amber-400 text-gray-900"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, switchActiveRole, logout } = useAuth();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const activeRole: HospitalRole =
    user?.activeRole && ROLE_CONFIGS[user.activeRole]
      ? user.activeRole
      : "registrar";
  const roleConfig = ROLE_CONFIGS[activeRole] || ROLE_CONFIGS.registrar;
  const menus = ROLE_MENUS[activeRole] || [];

  return (
    <>
      <aside className="w-64 bg-[#5f7c44] text-white flex flex-col h-screen shrink-0 shadow-xl border-r border-[#4e6737] select-none">
        {/* Top Header: Hospital Logo & Title */}
        <div className="p-5 border-b border-[#4f6838] flex flex-col items-center">
          <HospitalLogo size="md" showText={true} />
        </div>

        {/* Current Department / Role Badge */}
        <div className="px-5 py-2.5 bg-[#526c3a] border-b border-[#475e32] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-olive-200 tracking-wider uppercase font-semibold block">
              สิทธิ์และฟังก์ชันการใช้งาน
            </span>
            <span className="text-xs font-bold text-white block">
              {roleConfig.title}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
            {activeRole}
          </span>
        </div>

        {/* Middle Section: Dynamic Navigation Menu based on Active Role */}
        <Suspense fallback={<nav className="flex-1 overflow-y-auto px-3 py-4" />}>
          <SidebarNav menus={menus} />
        </Suspense>

        {/* Bottom Section: Official Staff Profile & Workstation Context (Real Hospital HIS Standard) */}
        <div className="p-3 bg-[#4e6737] border-t border-[#41572d]">
          <div className="p-2.5 rounded-2xl bg-black/20 hover:bg-black/30 transition-all border border-white/10">
            <div className="flex items-start justify-between gap-2">
              {/* Clicking Name/Avatar opens Comprehensive Personal Info Modal */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-start gap-2.5 min-w-0 text-left flex-1 group"
                title="คลิกที่รูปหรือชื่อเพื่อดูข้อมูลประจำตัวบุคลากรทั้งหมด"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 text-white shadow-xs group-hover:scale-105 group-hover:bg-white/30 transition-all mt-0.5">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white block truncate leading-tight group-hover:underline">
                      {user?.fullName || "ผู้ใช้งานระบบ"}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" title="ออนไลน์เข้าเวรปฏิบัติหน้าที่" />
                  </div>
                  <span className="text-[10px] text-olive-100 font-medium block truncate mt-0.5">
                    {user?.professionalTitle || roleConfig.title}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-olive-200 mt-1">
                    <MapPin className="w-3 h-3 shrink-0 text-amber-300" />
                    <span className="truncate font-semibold text-white/90">
                      {user?.assignedStation || roleConfig.department}
                    </span>
                  </div>
                </div>
              </button>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-olive-100 hover:text-white transition-colors"
                  title="เปลี่ยนหน้าที่ / โหมดปฏิบัติการ (Switch Duty Role)"
                >
                  <Settings className="w-4 h-4 animate-spin-slow" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 hover:bg-red-500/30 rounded-lg text-olive-200 hover:text-red-200 transition-colors"
                  title="ออกจากระบบ (Sign Out)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Context Strip */}
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-olive-200 font-mono">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="hover:underline text-left truncate max-w-[140px] text-olive-100"
                title="คลิกเพื่อดูข้อมูลประจำตัวทั้งหมด"
              >
                {user?.staffId || "STF-2568"} {user?.licenseNumber ? `• ${user.licenseNumber}` : ""}
              </button>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(true)}
                className="text-white bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-md text-[9px] font-bold transition-colors shrink-0 flex items-center gap-0.5"
                title="คลิกเพื่อสลับหน้าที่ปฏิบัติการ"
              >
                <span>สลับหน้าที่ ▾</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 1. Comprehensive Staff Profile Modal (เปิดเมื่อกดที่ชื่อหรือรูป เพื่อดูข้อมูลของเราทั้งหมด) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#5f7c44] text-white">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-7 h-7 object-contain bg-white rounded-lg p-0.5"
                />
                <div>
                  <h3 className="font-bold text-sm">ข้อมูลประจำตัวบุคลากรทางการแพทย์</h3>
                  <span className="text-[11px] text-olive-100 block">
                    โรงพยาบาลมหาราชนครราชสีมา (Staff Profile & Credentials)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Complete Staff Credentials */}
            <div className="p-6 space-y-4">
              {/* Staff Identification Card Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-olive-50 to-emerald-50/40 border border-olive-200 flex items-start gap-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#5f7c44] text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0 border-2 border-white">
                  <User className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-gray-900">{user?.fullName}</span>
                    <span className="font-mono text-xs bg-white text-[#4e6737] px-2.5 py-0.5 rounded-md border border-olive-200 font-bold shadow-2xs">
                      {user?.staffId || "STF-2568"}
                    </span>
                  </div>
                  <div className="text-xs text-[#4e6737] font-bold">
                    {user?.professionalTitle || roleConfig.title}
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      กำลังปฏิบัติหน้าที่ (On Duty)
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Credentials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 block">เลขที่ใบอนุญาตประกอบวิชาชีพ</span>
                  <span className="font-bold text-gray-900 font-mono text-sm">
                    {user?.licenseNumber || "ไม่มีระบุ"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 block">อีเมลระบบ / บัญชีผู้ใช้</span>
                  <span className="font-semibold text-gray-900 font-mono truncate block">
                    {user?.email || "staff@hospital.local"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-2">
                  <span className="text-[11px] text-gray-500 block">กลุ่มงาน / แผนกต้นสังกัด</span>
                  <span className="font-semibold text-gray-900 block mt-0.5">
                    {user?.departmentName || roleConfig.department}
                  </span>
                </div>

                <div className="p-3 bg-olive-50/60 rounded-xl border border-olive-200/80 sm:col-span-2">
                  <span className="text-[11px] text-[#4e6737] font-bold block">จุดประจำการในเวรปัจจุบัน</span>
                  <div className="flex items-center gap-1.5 text-gray-900 font-bold mt-0.5">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{user?.assignedStation || roleConfig.department}</span>
                  </div>
                </div>
              </div>

              {/* Authorized Roles Section */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">
                    บทบาทหน้าที่ที่ได้รับอนุญาต ({user?.assignedRoles.length || 1} หน้าที่):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsRoleModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#5f7c44] hover:underline flex items-center gap-0.5"
                  >
                    <span>สลับหน้าที่ปฏิบัติการ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {user?.assignedRoles.map((r) => {
                    const cfg = ROLE_CONFIGS[r];
                    const isCurrent = r === activeRole;
                    return (
                      <span
                        key={r}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 ${
                          isCurrent
                            ? "bg-[#5f7c44] text-white shadow-xs"
                            : "bg-white text-gray-700 border border-gray-200"
                        }`}
                      >
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        <span>{cfg?.title || r}</span>
                        {isCurrent && <span className="text-[10px] opacity-80">(หน้าที่ปัจจุบัน)</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsRoleModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#4e6737] bg-olive-100 hover:bg-olive-200 transition-colors shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>เปิดหน้าต่างสลับหน้าที่</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Duty Switcher Modal Dialog (เปิดเมื่อกดรูปฟันเฟือง หรือปุ่มสลับหน้าที่) */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#5f7c44] text-white">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-olive-200 animate-spin-slow" />
                <div>
                  <h3 className="font-bold text-sm">เปลี่ยนหน้าที่ / สลับโหมดปฏิบัติการ</h3>
                  <span className="text-[11px] text-olive-100 block">
                    เลือกบทบาทที่ต้องการเพื่อเปลี่ยนแถบเมนูและสิทธิ์ของระบบ
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Available Roles */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-gray-600 font-semibold flex items-center justify-between">
                <span>บทบาทที่บัญชีของคุณ ({user?.fullName}) ได้รับมอบหมาย:</span>
                <span className="text-[11px] text-gray-400">คลิกเพื่อสลับทันที</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto">
                {Object.values(ROLE_CONFIGS).map((cfg) => {
                  const isCurrent = cfg.id === activeRole;
                  const isAssigned = user?.assignedRoles.includes(cfg.id) || user?.activeRole === "admin";

                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      disabled={!isAssigned}
                      onClick={() => {
                        switchActiveRole(cfg.id);
                        setIsRoleModalOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isCurrent
                          ? "border-[#5f7c44] bg-[#5f7c44]/10 ring-2 ring-[#5f7c44] shadow-xs"
                          : isAssigned
                          ? "border-gray-200 hover:border-[#5f7c44] hover:bg-olive-50/50 cursor-pointer shadow-2xs"
                          : "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-gray-900">{cfg.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-[#5f7c44] text-white px-2 py-0.5 rounded-full font-bold">
                            กำลังปฏิบัติการ
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 line-clamp-1">{cfg.department}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-center">
                * บุคลากรที่มีหลายหน้าที่ (เช่น พยาบาลที่ช่วยงานเวชระเบียน) สามารถกดสลับโหมดได้ตลอดเวลาโดยไม่ต้องลงชื่อออก
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
