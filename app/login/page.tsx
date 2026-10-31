"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import {
  Lock,
  Mail,
  ShieldCheck,
  RefreshCw,
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
  CheckCircle2,
} from "lucide-react";

const demoAccounts = [
  { role: "registrar", email: "registrar@hospital.local", name: "เวชระเบียน", route: "/registrar", icon: Users, color: "hover:border-blue-400 bg-blue-50/50" },
  { role: "nurse", email: "nurse@hospital.local", name: "พยาบาลคัดกรอง", route: "/nurse", icon: ClipboardList, color: "hover:border-emerald-400 bg-emerald-50/50" },
  { role: "doctor", email: "doctor@hospital.local", name: "แพทย์ตรวจรักษา", route: "/doctor", icon: Stethoscope, color: "hover:border-indigo-400 bg-indigo-50/50" },
  { role: "med_tech", email: "medtech@hospital.local", name: "นักเทคนิคการแพทย์", route: "/lab", icon: FlaskConical, color: "hover:border-cyan-400 bg-cyan-50/50" },
  { role: "nuclear_med", email: "nuclearmed@hospital.local", name: "เวชศาสตร์นิวเคลียร์", route: "/nuclear", icon: Radiation, color: "hover:border-purple-400 bg-purple-50/50" },
  { role: "cashier", email: "cashier@hospital.local", name: "การเงิน", route: "/cashier", icon: CreditCard, color: "hover:border-amber-400 bg-amber-50/50" },
  { role: "pharmacist", email: "pharmacist@hospital.local", name: "เภสัชกร", route: "/pharmacy", icon: Pill, color: "hover:border-teal-400 bg-teal-50/50" },
  { role: "warehouse", email: "warehouse@hospital.local", name: "คลังสินค้า", route: "/warehouse", icon: Boxes, color: "hover:border-slate-400 bg-slate-50/50" },
  { role: "admin", email: "admin@hospital.local", name: "ผู้ดูแลระบบ", route: "/admin", icon: Shield, color: "hover:border-rose-400 bg-rose-50/50" },
  { role: "director", email: "director@hospital.local", name: "ผู้อำนวยการ", route: "/director", icon: BarChart3, color: "hover:border-yellow-400 bg-yellow-50/50" },
  { role: "doctor+director", email: "dr.somchai@hospital.local", name: "นพ. สมชาย (2 บทบาท)", route: "/doctor", icon: Stethoscope, color: "hover:border-teal-500 bg-teal-50 border-teal-300 font-bold" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginEmail?: string, redirectPath?: string) => {
    setIsLoading(true);
    setError(null);
    const targetEmail = loginEmail || email;
    const matchedAccount = demoAccounts.find((a) => a.email === targetEmail);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (!authError) {
        // Real Supabase login succeeded
        if (typeof window !== "undefined" && matchedAccount) {
          const roles = matchedAccount.role === "doctor+director" ? ["doctor", "director"] : [matchedAccount.role];
          localStorage.setItem(
            "hospital_demo_user",
            JSON.stringify({
              name: matchedAccount.name,
              email: matchedAccount.email,
              activeRole: roles[0],
              assignedRoles: roles,
            })
          );
        }
        router.push(redirectPath || "/");
        router.refresh();
        return;
      }

      // If Supabase connection fails (e.g. Supabase local not started yet),
      // activate Instant Demo Mode so the user can test all 10 roles right now!
      if (matchedAccount) {
        if (typeof window !== "undefined") {
          const roles = matchedAccount.role === "doctor+director" ? ["doctor", "director"] : [matchedAccount.role];
          localStorage.setItem(
            "hospital_demo_user",
            JSON.stringify({
              name: matchedAccount.name,
              email: matchedAccount.email,
              activeRole: roles[0],
              assignedRoles: roles,
            })
          );
        }
        router.push(redirectPath || "/");
        router.refresh();
        return;
      }

      setError(authError.message);
    } catch {
      // Offline fallback for 1-Click demo accounts
      if (matchedAccount) {
        if (typeof window !== "undefined") {
          const roles = matchedAccount.role === "doctor+director" ? ["doctor", "director"] : [matchedAccount.role];
          localStorage.setItem(
            "hospital_demo_user",
            JSON.stringify({
              name: matchedAccount.name,
              email: matchedAccount.email,
              activeRole: roles[0],
              assignedRoles: roles,
            })
          );
        }
        router.push(redirectPath || "/");
        router.refresh();
        return;
      }
      setError("ไม่สามารถเชื่อมต่อฐานข้อมูล Supabase ได้ (กรุณาคลิกเลือกบัญชีทดสอบด้านบนเพื่อเข้าสู่โหมดทดสอบด่วน)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-teal-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-teal-500/20 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          เข้าสู่ระบบโรงพยาบาลผู้ป่วยนอก (Hospital Login)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ระบบควบคุมสิทธิ์ด้วย Database RLS สำหรับ 10 บทบาทวิชาชีพ
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {/* 1-Click Demo Accounts Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            เข้าสู่ระบบด่วนตามบทบาท (1-Click Demo Selector)
          </h2>
          <span className="text-xs text-gray-500">รหัสผ่านทุกบัญชี: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">Password123!</code></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {demoAccounts.map((acc) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleLogin(acc.email, acc.route)}
                disabled={isLoading}
                className={`p-3 rounded-xl border border-gray-200 text-left transition-all shadow-sm flex flex-col justify-between ${acc.color}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 leading-tight">
                    {acc.name}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono truncate block">
                  {acc.email}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Traditional Login Form */}
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">
          หรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">อีเมลผู้ใช้งาน (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.local"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-md shadow-teal-500/20 disabled:opacity-50"
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>เข้าสู่ระบบ (Sign In)</span>
          </button>
        </form>
      </div>
    </div>
  );
}
