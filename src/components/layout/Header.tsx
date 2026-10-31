"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HospitalRole } from "@/src/lib/auth/roles";
import { RoleSwitcher } from "@/src/components/auth/RoleSwitcher";
import { Activity, Bell, Building2, User } from "lucide-react";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    activeRole: HospitalRole;
    assignedRoles: HospitalRole[];
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [currentUser, setCurrentUser] = useState(
    user || {
      name: "นพ. สมชาย มุ่งมั่น",
      email: "doctor.somchai@hospital.mock",
      activeRole: "doctor" as HospitalRole,
      assignedRoles: ["doctor", "director"] as HospitalRole[],
    }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hospital_demo_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
        }
      } catch {
        // fallback
      }
    }
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition-colors">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-gray-900 tracking-tight block leading-none">
                  HOSPITAL OPD
                </span>
                <span className="text-xs text-teal-600 font-medium tracking-wide">
                  Single Patient View System
                </span>
              </div>
            </Link>
          </div>

          {/* Right Section: Role Switcher & User Profile */}
          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                Active Role:
              </span>
              <RoleSwitcher
                currentRole={currentUser.activeRole}
                assignedRoles={currentUser.assignedRoles}
              />
            </div>

            {/* User Profile & Login Link */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                title="หน้าเข้าสู่ระบบและสลับบัญชีทดสอบ 10 บทบาท"
              >
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>เข้าสู่ระบบ (Login)</span>
              </Link>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-gray-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-xs text-gray-500">{currentUser.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
