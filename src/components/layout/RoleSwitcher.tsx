"use client";

import React, { useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { HospitalRole, ROLE_CONFIGS } from "@/src/types/auth";
import { ArrowLeftRight, Check, ChevronDown, ShieldCheck } from "lucide-react";

export function RoleSwitcher() {
  const { user, switchActiveRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;
  if (user.assignedRoles.length <= 1) return null;

  const handleSwitch = (role: HospitalRole) => {
    if (role === user.activeRole) return;
    switchActiveRole(role);
    setIsOpen(false);
  };

  const activeConfig =
    user.activeRole && ROLE_CONFIGS[user.activeRole]
      ? ROLE_CONFIGS[user.activeRole]
      : ROLE_CONFIGS.registrar;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ArrowLeftRight className="w-3.5 h-3.5 text-olive-200 shrink-0" />
          <div className="text-left min-w-0">
            <span className="text-[10px] text-olive-200 block leading-none">สลับโหมดใช้งาน</span>
            <span className="text-xs font-bold text-white block truncate mt-0.5">
              {activeConfig.title}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5f7c44]" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              เลือกบทบาท (Active Role)
            </span>
          </div>
          <div className="p-1.5 max-h-56 overflow-y-auto">
            {user.assignedRoles.map((role) => {
              const config = ROLE_CONFIGS[role];
              if (!config) return null;
              const isActive = role === user.activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSwitch(role)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                    isActive ? "bg-olive-50 text-[#4e6737]" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div>
                    <span className={`block text-xs font-bold ${isActive ? "text-[#4e6737]" : "text-gray-800"}`}>
                      {config.title}
                    </span>
                    <span className="block text-[10px] text-gray-500 truncate max-w-[185px]">
                      {config.department}
                    </span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-[#5f7c44] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
