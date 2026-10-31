import React from "react";
import Link from "next/link";
import {
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
} from "lucide-react";

const roleWorkspaces = [
  { role: "registrar", title: "เวชระเบียน (Registrar)", desc: "ลงทะเบียนผู้ป่วยใหม่ ตรวจสอบสิทธิ์ และเปิด Visit (VN)", icon: Users, href: "/registrar", color: "border-blue-200 bg-blue-50/50 hover:bg-blue-50" },
  { role: "nurse", title: "พยาบาลคัดกรอง (Nurse)", desc: "ประเมินสัญญาณชีพ (Vital Signs) คัดกรองอาการ และซักประวัติแพ้ยา", icon: ClipboardList, href: "/nurse", color: "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50" },
  { role: "doctor", title: "แพทย์ตรวจรักษา (Doctor)", desc: "ตรวจรักษา วินิจฉัยโรค ICD-10 สั่งแล็บ เอกซเรย์ และสั่งยา", icon: Stethoscope, href: "/doctor", color: "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50" },
  { role: "med_tech", title: "ห้องปฏิบัติการ (Med Tech)", desc: "รับสิ่งส่งตรวจ บันทึกผลแล็บ และรายงานผลตรวจทางห้องปฏิบัติการ", icon: FlaskConical, href: "/lab", color: "border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50" },
  { role: "nuclear_med", title: "เวชศาสตร์นิวเคลียร์", desc: "คำนวณการสลายตัวของสารรังสี I-131 / Scan และ Safety Checklist", icon: Radiation, href: "/nuclear", color: "border-purple-200 bg-purple-50/50 hover:bg-purple-50" },
  { role: "cashier", title: "การเงิน (Cashier)", desc: "ออกใบแจ้งหนี้รวมยอด ชำระเงิน QR PromptPay และออกใบเสร็จ", icon: CreditCard, href: "/cashier", color: "border-amber-200 bg-amber-50/50 hover:bg-amber-50" },
  { role: "pharmacist", title: "ห้องยา (Pharmacist)", desc: "ตรวจสอบคำเตือนการแพ้ยา จัดยา และส่งมอบยาให้ผู้ป่วย", icon: Pill, href: "/pharmacy", color: "border-teal-200 bg-teal-50/50 hover:bg-teal-50" },
  { role: "warehouse", title: "คลังสินค้า (Warehouse)", desc: "บันทึกรับยาเข้าสต็อก และตรวจสอบสต็อกยาภาพรวมของโรงพยาบาล", icon: Boxes, href: "/warehouse", color: "border-slate-200 bg-slate-50/50 hover:bg-slate-50" },
  { role: "admin", title: "ผู้ดูแลระบบ (Admin)", desc: "จัดการบัญชีผู้ใช้ กำหนดบทบาท และตรวจสอบ Audit Trail", icon: Shield, href: "/admin", color: "border-rose-200 bg-rose-50/50 hover:bg-rose-50" },
  { role: "director", title: "ผู้อำนวยการ (Director)", desc: "แดชบอร์ดภาพรวมโรงพยาบาล สถิติความปลอดภัย และการสลับบทบาท", icon: BarChart3, href: "/director", color: "border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50" },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          ระบบโรงพยาบาลผู้ป่วยนอก (Hospital OPD)
        </h1>
        <p className="text-teal-100 text-sm sm:text-base max-w-3xl">
          Single Patient View Architecture: กรอกข้อมูลครั้งเดียวใช้ได้ทุกแผนก ตรวจสอบสิทธิ์ด้วย RLS และบันทึก Audit Log 100%
        </p>
      </div>

      {/* Role Workspace Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          พื้นที่การทำงานตามบทบาท (10 Roles Workspaces)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleWorkspaces.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.role}
                href={item.href}
                className={`p-5 rounded-xl border transition-all duration-200 shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer ${item.color}`}
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 mb-3 border border-gray-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200/50 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-mono">role: {item.role}</span>
                  <span className="text-teal-700 font-bold hover:underline">เข้าสู่แผนก &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
