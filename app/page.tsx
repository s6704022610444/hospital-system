"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { ROLE_CONFIGS } from "@/src/types/auth";
import { RefreshCw } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        const targetPath = ROLE_CONFIGS[user.activeRole]?.defaultPath || "/dashboard/registrar";
        router.replace(targetPath);
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center text-center p-4">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#5f7c44] animate-spin" />
        <span className="text-sm font-semibold text-gray-600">
          กำลังเข้าสู่ระบบโรงพยาบาลมหาราชนครราชสีมา...
        </span>
      </div>
    </div>
  );
}
