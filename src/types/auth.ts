export type HospitalRole =
  | "registrar"
  | "nurse"
  | "doctor"
  | "med_tech"
  | "nuclear_med"
  | "cashier"
  | "pharmacist"
  | "warehouse"
  | "director"
  | "admin";

export interface RoleConfig {
  id: HospitalRole;
  title: string;
  workstationTitle?: string;
  department: string;
  defaultPath: string;
}

export interface MenuItem {
  id: string;
  label: string;
  iconName: string;
  path: string;
  badge?: string;
}

export interface UserProfile {
  id: string;
  staffId?: string;
  email: string;
  fullName: string;
  professionalTitle?: string;
  departmentName?: string;
  assignedStation?: string;
  licenseNumber?: string;
  activeRole: HospitalRole;
  assignedRoles: HospitalRole[];
}

export const ROLE_CONFIGS: Record<HospitalRole, RoleConfig> = {
  registrar: {
    id: "registrar",
    title: "เจ้าหน้าที่เวชระเบียน",
    workstationTitle: "ระบบงานเวชระเบียนและลงทะเบียน",
    department: "กลุ่มงานเวชระเบียนและเวชสถิติ",
    defaultPath: "/dashboard/registrar",
  },
  nurse: {
    id: "nurse",
    title: "พยาบาลวิชาชีพ",
    workstationTitle: "ระบบงานการพยาบาลผู้ป่วยนอก (OPD Nursing)",
    department: "กลุ่มงานการพยาบาลผู้ป่วยนอก",
    defaultPath: "/dashboard/nurse",
  },
  doctor: {
    id: "doctor",
    title: "แพทย์ผู้ตรวจรักษา",
    workstationTitle: "ระบบงานตรวจรักษาและสั่งการแพทย์ (OPD Clinic)",
    department: "กลุ่มงานการแพทย์ผู้ป่วยนอก",
    defaultPath: "/dashboard/doctor",
  },
  med_tech: {
    id: "med_tech",
    title: "นักเทคนิคการแพทย์",
    workstationTitle: "ระบบงานห้องปฏิบัติการชันสูตร (Laboratory)",
    department: "กลุ่มงานพยาธิวิทยาคลินิกและชันสูตร",
    defaultPath: "/dashboard/lab",
  },
  nuclear_med: {
    id: "nuclear_med",
    title: "เจ้าหน้าที่เวชศาสตร์นิวเคลียร์",
    workstationTitle: "ระบบงานเวชศาสตร์นิวเคลียร์ (Nuclear Medicine)",
    department: "หน่วยเวชศาสตร์นิวเคลียร์ กลุ่มงานรังสีวิทยา",
    defaultPath: "/dashboard/nuclear",
  },
  cashier: {
    id: "cashier",
    title: "เจ้าหน้าที่การเงิน",
    workstationTitle: "ระบบงานการเงินและรับชำระเงิน (Cashier & Billing)",
    department: "กลุ่มงานการเงินและรับชำระค่ารักษา",
    defaultPath: "/dashboard/cashier",
  },
  pharmacist: {
    id: "pharmacist",
    title: "เภสัชกร",
    workstationTitle: "ระบบงานเภสัชกรรมและห้องจ่ายยา (Pharmacy)",
    department: "กลุ่มงานเภสัชกรรมผู้ป่วยนอก",
    defaultPath: "/dashboard/pharmacy",
  },
  warehouse: {
    id: "warehouse",
    title: "เจ้าหน้าที่คลังยาและเวชภัณฑ์",
    workstationTitle: "ระบบบริหารคลังยาและเวชภัณฑ์ (Inventory)",
    department: "กลุ่มงานบริหารเวชภัณฑ์และคลังยา",
    defaultPath: "/dashboard/warehouse",
  },
  director: {
    id: "director",
    title: "ผู้อำนวยการโรงพยาบาล",
    workstationTitle: "ระบบบริหารและติดตามสถิติ (Executive Dashboard)",
    department: "สำนักงานผู้อำนวยการ โรงพยาบาลมหาราชนครราชสีมา",
    defaultPath: "/dashboard/director",
  },
  admin: {
    id: "admin",
    title: "ผู้ดูแลระบบสารสนเทศ (IT)",
    workstationTitle: "ระบบบริหารจัดการสิทธิ์และความปลอดภัย (Admin Console)",
    department: "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (IT)",
    defaultPath: "/dashboard/admin",
  },
};

export const ROLE_MENUS: Record<HospitalRole, MenuItem[]> = {
  registrar: [
    { id: "reg-search", label: "ค้นหาผู้ป่วย / เปิด Visit (VN)", iconName: "Search", path: "/dashboard/registrar?tab=search" },
    { id: "reg-new", label: "ลงทะเบียนผู้ป่วยใหม่", iconName: "UserPlus", path: "/dashboard/registrar?tab=new_patient" },
    { id: "reg-queue", label: "คิวผู้ป่วยนอกวันนี้", iconName: "Users", path: "/dashboard/registrar?tab=today_queue" },
    { id: "reg-appointments", label: "ตรวจสอบใบนัดล่วงหน้า", iconName: "Calendar", path: "/dashboard/registrar?tab=appointments" },
  ],
  nurse: [
    { id: "nurse-queue", label: "คิวรอคัดกรอง (Triage)", iconName: "Clock", path: "/dashboard/nurse?tab=queue" },
    { id: "nurse-vitals", label: "แผ่นชาร์ต & สัญญาณชีพ", iconName: "HeartPulse", path: "/dashboard/nurse?tab=chart" },
    { id: "nurse-history", label: "คัดกรองเสร็จแล้ววันนี้", iconName: "CheckCircle2", path: "/dashboard/nurse?tab=triaged_history" },
  ],
  doctor: [
    { id: "doc-queue", label: "คิวตรวจผู้ป่วย", iconName: "Users", path: "/dashboard/doctor", badge: "คิวสด" },
    { id: "doc-review", label: "คิวรอฟังผลแล็บ/เอกซเรย์", iconName: "FileCheck", path: "/dashboard/doctor" },
    { id: "doc-opdcard", label: "ตรวจรักษา (OPD Card)", iconName: "Stethoscope", path: "/dashboard/doctor" },
    { id: "doc-orders", label: "สั่งตรวจ Lab / X-ray / นิวเคลียร์", iconName: "FlaskConical", path: "/dashboard/doctor" },
    { id: "doc-rx", label: "สั่งจ่ายยา (Prescription)", iconName: "Pill", path: "/dashboard/doctor" },
    { id: "doc-cert", label: "ออกใบรับรองแพทย์", iconName: "FileText", path: "/dashboard/doctor" },
    { id: "doc-appointment", label: "ออกใบนัดตรวจครั้งถัดไป", iconName: "CalendarPlus", path: "/dashboard/doctor" },
  ],
  med_tech: [
    { id: "lab-queue", label: "รายการสิ่งส่งตรวจ (Worklist)", iconName: "ListFilter", path: "/dashboard/lab" },
    { id: "lab-entry", label: "บันทึกผลการตรวจ (CBC/Chem)", iconName: "FlaskConical", path: "/dashboard/lab" },
    { id: "lab-verify", label: "ตรวจสอบ & รับรองผล", iconName: "CheckCircle", path: "/dashboard/lab" },
  ],
  nuclear_med: [
    { id: "nuc-queue", label: "คิวตรวจเวชศาสตร์นิวเคลียร์", iconName: "Radiation", path: "/dashboard/nuclear" },
    { id: "nuc-bone", label: "คิว Bone Scan / นัด Online", iconName: "Activity", path: "/dashboard/nuclear" },
    { id: "nuc-i131", label: "กลืนแร่ I-131 (Thyroid)", iconName: "ShieldAlert", path: "/dashboard/nuclear" },
    { id: "nuc-decay", label: "คำนวณการสลายตัวสารรังสี (Decay)", iconName: "Calculator", path: "/dashboard/nuclear" },
    { id: "nuc-safety", label: "ตรวจความปลอดภัย (ตั้งครรภ์/UPT)", iconName: "AlertOctagon", path: "/dashboard/nuclear" },
  ],
  cashier: [
    { id: "cash-queue", label: "คิวรอชำระเงิน", iconName: "Receipt", path: "/dashboard/cashier" },
    { id: "cash-bill", label: "ออกใบแจ้งหนี้รวม (Invoice)", iconName: "FileText", path: "/dashboard/cashier" },
    { id: "cash-pay", label: "รับชำระเงิน (เงินสด/เงินโอน)", iconName: "CreditCard", path: "/dashboard/cashier" },
    { id: "cash-receipt", label: "พิมพ์ใบเสร็จรับเงิน (PAID)", iconName: "Printer", path: "/dashboard/cashier" },
  ],
  pharmacist: [
    { id: "pharma-queue", label: "คิวรอจัดยา", iconName: "Clock", path: "/dashboard/pharmacy" },
    { id: "pharma-dispense", label: "ตรวจสอบ & จัดยา", iconName: "Pill", path: "/dashboard/pharmacy" },
    { id: "pharma-label", label: "พิมพ์ฉลากยาติดซอง", iconName: "Printer", path: "/dashboard/pharmacy" },
    { id: "pharma-confirm", label: "ส่งมอบยาและคำแนะนำ", iconName: "CheckCircle2", path: "/dashboard/pharmacy" },
  ],
  warehouse: [
    { id: "wh-stock", label: "ยอดสต็อกยาและเวชภัณฑ์", iconName: "Boxes", path: "/dashboard/warehouse" },
    { id: "wh-stockin", label: "รับยาเข้าคลัง (Stock In)", iconName: "PackagePlus", path: "/dashboard/warehouse" },
    { id: "wh-alert", label: "รายงานยาใกล้หมดสต็อก", iconName: "AlertTriangle", path: "/dashboard/warehouse" },
  ],
  director: [
    { id: "dir-dash", label: "ภาพรวมโรงพยาบาล (Executive)", iconName: "BarChart3", path: "/dashboard/director" },
    { id: "dir-kpi", label: "ระยะเวลารอคอย & สถิติ OPD", iconName: "Timer", path: "/dashboard/director" },
    { id: "dir-audit", label: "ตรวจสอบความปลอดภัยข้อมูล (Audit)", iconName: "ShieldCheck", path: "/dashboard/director" },
  ],
  admin: [
    { id: "adm-users", label: "จัดการผู้ใช้งาน & กำหนดสิทธิ์", iconName: "UserCog", path: "/dashboard/admin" },
    { id: "adm-audit", label: "ระบบสืบค้น Audit Trail", iconName: "FileSearch", path: "/dashboard/admin" },
    { id: "adm-system", label: "ตั้งค่าระบบโรงพยาบาล", iconName: "Settings", path: "/dashboard/admin" },
  ],
};
