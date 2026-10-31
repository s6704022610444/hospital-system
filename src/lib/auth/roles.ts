export const hospitalRoles = [
  "registrar",
  "nurse",
  "doctor",
  "med_tech",
  "nuclear_med",
  "cashier",
  "pharmacist",
  "warehouse",
  "admin",
  "director",
] as const;

export type HospitalRole = (typeof hospitalRoles)[number];

export const roleDisplayNames: Record<HospitalRole, string> = {
  registrar: "เวชระเบียน",
  nurse: "พยาบาลคัดกรอง",
  doctor: "แพทย์",
  med_tech: "นักเทคนิคการแพทย์",
  nuclear_med: "เวชศาสตร์นิวเคลียร์",
  cashier: "การเงิน",
  pharmacist: "เภสัชกร",
  warehouse: "คลังสินค้า",
  admin: "ผู้ดูแลระบบ",
  director: "ผู้อำนวยการ",
};

export const roleBadgeColors: Record<HospitalRole, string> = {
  registrar: "bg-blue-100 text-blue-800 border-blue-200",
  nurse: "bg-emerald-100 text-emerald-800 border-emerald-200",
  doctor: "bg-indigo-100 text-indigo-800 border-indigo-200",
  med_tech: "bg-cyan-100 text-cyan-800 border-cyan-200",
  nuclear_med: "bg-purple-100 text-purple-800 border-purple-200",
  cashier: "bg-amber-100 text-amber-800 border-amber-200",
  pharmacist: "bg-teal-100 text-teal-800 border-teal-200",
  warehouse: "bg-slate-100 text-slate-800 border-slate-200",
  admin: "bg-rose-100 text-rose-800 border-rose-200",
  director: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function canSwitchRole(assignedRoles: HospitalRole[], targetRole: HospitalRole): boolean {
  return assignedRoles.includes(targetRole);
}
