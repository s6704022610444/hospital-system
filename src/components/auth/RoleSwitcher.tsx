"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { HospitalRole, roleDisplayNames, roleBadgeColors } from "@/src/lib/auth/roles";
import { ChevronDown, RefreshCw, ShieldCheck } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: HospitalRole;
  assignedRoles: HospitalRole[];
}

export function RoleSwitcher({ currentRole, assignedRoles }: RoleSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (newRole: HospitalRole) => {
    if (newRole === currentRole || isPending) return;

    setError(null);
    setIsOpen(false);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: rpcError } = await supabase.rpc("switch_active_role", {
          p_new_role: newRole,
        });

        if (rpcError) {
          // In local demo mode, update client session state
          if (typeof window !== "undefined") {
            const saved = localStorage.getItem("hospital_demo_user");
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.activeRole = newRole;
              localStorage.setItem("hospital_demo_user", JSON.stringify(parsed));
            }
          }
          window.location.reload();
          return;
        }

        // Refresh session to let Supabase re-issue JWT token with the new active_role claim
        await supabase.auth.refreshSession();
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("hospital_demo_user");
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.activeRole = newRole;
            localStorage.setItem("hospital_demo_user", JSON.stringify(parsed));
          }
        }
        window.location.reload();
      } catch {
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("hospital_demo_user");
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.activeRole = newRole;
            localStorage.setItem("hospital_demo_user", JSON.stringify(parsed));
          }
        }
        window.location.reload();
      }
    });
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isPending}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 ${
            roleBadgeColors[currentRole] || "bg-gray-100 text-gray-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{roleDisplayNames[currentRole] || currentRole}</span>
          {isPending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            assignedRoles.length > 1 && <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {error && (
        <div className="absolute right-0 mt-1 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200 z-50 whitespace-nowrap">
          {error}
        </div>
      )}

      {isOpen && assignedRoles.length > 1 && (
        <div className="absolute right-0 mt-2 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            สลับบทบาทการทำงาน
          </div>
          <div className="py-1">
            {assignedRoles.map((role) => {
              const isActive = role === currentRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    isActive ? "font-bold text-teal-700 bg-teal-50/50" : "text-gray-700"
                  }`}
                >
                  <span>{roleDisplayNames[role]}</span>
                  {isActive && <span className="text-xs text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded">ปัจจุบัน</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
