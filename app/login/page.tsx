"use client";

import React, { useState } from "react";
import { useAuth, DEMO_USERS } from "@/src/context/AuthContext";
import { HospitalRole, ROLE_CONFIGS } from "@/src/types/auth";
import { HospitalLogo } from "@/src/components/layout/HospitalLogo";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Radiation,
  CreditCard,
  Pill,
  Boxes,
  Shield,
  BarChart3,
  RefreshCw,
} from "lucide-react";

const DEMO_ROLES_LIST: Array<{
  role: HospitalRole;
  title: string;
  name: string;
  icon: React.ElementType;
}> = [
  { role: "registrar", title: "เจ้าหน้าที่เวชระเบียน", name: "นาย วิชัย เวชสถิติ", icon: Users },
  { role: "nurse", title: "พยาบาลวิชาชีพ", name: "พว. มาลี มีสุข (RN)", icon: ClipboardList },
  { role: "doctor", title: "แพทย์ผู้ตรวจรักษา", name: "นพ. ทวี ยิ่งสง่า", icon: Stethoscope },
  { role: "med_tech", title: "นักเทคนิคการแพทย์", name: "ทนพ. กิตติ ชันสูตร", icon: FlaskConical },
  { role: "nuclear_med", title: "เจ้าหน้าที่เวชศาสตร์นิวเคลียร์", name: "นาย อนุชา รังสี", icon: Radiation },
  { role: "cashier", title: "เจ้าหน้าที่การเงิน", name: "นาง ชุติกาญจน์ กาวกระโทก", icon: CreditCard },
  { role: "pharmacist", title: "เภสัชกร", name: "ภญ. พรรณี จ่ายยา", icon: Pill },
  { role: "warehouse", title: "เจ้าหน้าที่คลังยาและเวชภัณฑ์", name: "นาย สมบูรณ์ สต็อกมั่นคง", icon: Boxes },
  { role: "director", title: "ผู้อำนวยการโรงพยาบาล", name: "นพ. ภักดี ผู้อำนวยการ", icon: BarChart3 },
  { role: "admin", title: "ผู้ดูแลระบบสารสนเทศ (IT)", name: "นาย สุริยา ระบบเซิร์ฟเวอร์", icon: Shield },
];

export default function LoginPage() {
  const { loginAsRole } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<HospitalRole>("doctor");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Find matching role by email/username or fall back to selected role
    setTimeout(() => {
      loginAsRole(selectedRole);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Subtle Watermark Header */}
      <header className="p-6 flex justify-between items-center z-10">
        <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
          เข้าสู่ระบบบุคลากรโรงพยาบาล
        </span>
        <div className="flex items-center gap-2 text-xs text-[#55733d] font-semibold">
          <span>โรงพยาบาลมหาราชนครราชสีมา</span>
        </div>
      </header>

      {/* Main Centered Login Section matching หน้า login.png */}
      <main className="w-full max-w-md mx-auto px-6 py-6 z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <HospitalLogo size="md" showText={false} />
          </div>

          {/* Tag above heading */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf4e8] border border-[#dce8d4] text-[#55733d] text-xs font-semibold mb-3 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#55733d]" />
            <span>สำหรับบุคลากรโรงพยาบาล</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f2d18] tracking-tight">
            ยินดีต้อนรับเข้าสู่ระบบ
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            เข้าสู่ระบบด้วยบัญชีบุคลากรของโรงพยาบาล
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-7 shadow-lg shadow-gray-200/50">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Input: Username */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้ของคุณ"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f7c44] focus:border-[#5f7c44] outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Input: Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f7c44] focus:border-[#5f7c44] outline-none transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox: Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#5f7c44] focus:ring-[#5f7c44]"
                />
                <span>จดจำชื่อผู้ใช้</span>
              </label>

              <button
                type="button"
                onClick={() => alert("กรุณาติดต่อศูนย์เทคโนโลยีสารสนเทศ (IT) โทร. 1104")}
                className="text-[#55733d] hover:underline font-semibold"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Action Submit Button matching color #4d6736 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#4d6736] hover:bg-[#435a2e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#4d6736]/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice Box matching exact screenshot */}
          <div className="mt-5 p-3.5 rounded-2xl bg-[#f0f5ec] border border-[#dce8d4] flex items-start gap-3 text-left">
            <ShieldCheck className="w-4 h-4 text-[#55733d] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#415531] leading-relaxed">
              เพื่อความปลอดภัยของข้อมูลผู้ป่วย กรุณาไม่เปิดเผยข้อมูลให้ผู้อื่น และออกจากระบบทุกครั้งหลังใช้งานเสร็จ
            </p>
          </div>
        </div>

        {/* 1-Click Role Selector for fast testing and preview */}
        <div className="mt-6 bg-white/90 backdrop-blur-xs rounded-2xl border border-gray-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b mb-3">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#55733d]" />
              <span>เข้าสู่ระบบด่วนตามบทบาท (1-Click Selector)</span>
            </span>
            <span className="text-[10px] text-gray-400">สำหรับทดสอบ 10 บทบาท</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DEMO_ROLES_LIST.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => loginAsRole(item.role)}
                  className="p-2 rounded-xl border border-gray-200 hover:border-[#5f7c44] hover:bg-[#edf4e8]/60 text-left transition-all flex flex-col justify-between group"
                >
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-[#5f7c44] mb-1" />
                  <div>
                    <span className="text-[11px] font-bold text-gray-800 block truncate group-hover:text-[#415531]">
                      {item.title}
                    </span>
                    <span className="text-[9px] text-gray-400 block truncate font-mono">
                      {item.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-gray-400 border-t border-gray-100 z-10">
        โรงพยาบาลมหาราชนครราชสีมา • สำนักงานปลัดกระทรวงสาธารณสุข
      </footer>
    </div>
  );
}
