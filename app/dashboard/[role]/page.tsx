"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { ROLE_CONFIGS, HospitalRole } from "@/src/types/auth";
import { Activity, Clock, Users, ArrowRight } from "lucide-react";

export default function RoleDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roleSlug = typeof params?.role === "string" ? params.role : "doctor";

  // Map slug to role safely
  const roleMap: Record<string, HospitalRole> = {
    registrar: "registrar",
    nurse: "nurse",
    doctor: "doctor",
    lab: "med_tech",
    med_tech: "med_tech",
    nuclear: "nuclear_med",
    nuclear_med: "nuclear_med",
    cashier: "cashier",
    pharmacy: "pharmacist",
    pharmacist: "pharmacist",
    warehouse: "warehouse",
    director: "director",
    admin: "admin",
  };

  const roleKey = roleMap[roleSlug] || "doctor";
  const config = ROLE_CONFIGS[roleKey] || ROLE_CONFIGS.doctor;

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5f7c44]" />
            <span className="text-xs font-bold text-[#5f7c44] uppercase tracking-wider">
              {config.department}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            พื้นที่ทำงาน: {config.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            โรงพยาบาลมหาราชนครราชสีมา • แผนกนี้จะถูกพัฒนาในก้าวถัดไปตามลำดับ
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/registrar")}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#5f7c44] hover:bg-[#4d6736] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <span>ไปที่ระบบงานเวชระเบียน</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Placeholder Info */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-8 text-center shadow-xs">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-olive-100 text-[#5f7c44] rounded-2xl mx-auto flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            แผนก {config.title} กำลังอยู่ในคิวการพัฒนา
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            ในขณะนี้แผนก <strong>เวชระเบียน (Registrar Workstation)</strong> ได้รับการพัฒนาเสร็จสมบูรณ์ 100% แล้ว คุณสามารถคลิกปุ่มด้านบน หรือเลือกเมนู &quot;ค้นหาผู้ป่วย / เปิด Visit (VN)&quot; เพื่อทดลองใช้งานเวชระเบียนได้ทันที
          </p>
        </div>
      </div>
    </div>
  );
}
