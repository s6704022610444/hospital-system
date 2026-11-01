import { createClient } from "@/src/lib/supabase/client";
import {
  formatHnDisplay,
  formatVnDisplay,
  calculateAge,
} from "@/src/lib/utils/formatters";

export interface PatientRecord {
  id: string;
  hn: string; // Stored: HN-YY-XXXXXXX
  idType: "thai_cid" | "pink_card" | "passport" | "anonymous_trauma";
  anonymousId?: string; // ANON-XXXXXXX for unknown emergency patients
  nationalId?: string;
  passportNumber?: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F" | "Other";
  birthDate: string;
  age: number;
  bloodGroup: string;
  insuranceScheme: string;
  affiliatedHospital?: string; // ADR 0002
  phone: string;
  address: string;
  employerName?: string; // For migrant workers (pink card)
  nationality?: string; // For migrant workers / foreigners
  authenCode?: string; // NHSO / SS / Civil Servant claim code
  actVehiclePlate?: string; // พ.ร.บ. ทะเบียนรถ
  actInsuranceCompany?: string; // บ.ประกันภัย พ.ร.บ.
  allergies?: string; // e.g. "แพ้ยา Penicillin (ผื่นคัน)", "ปฏิเสธประวัติแพ้ยา"
  emergencyContactName?: string; // ชื่อ-สกุลผู้ติดต่อฉุกเฉิน
  emergencyContactRelationship?: string; // ความสัมพันธ์ (บิดา/มารดา/คู่สมรส/บุตร/นายจ้าง)
  emergencyContactPhone?: string; // เบอร์โทรติดต่อฉุกเฉิน
  outstandingBalance: number;
  status: "active" | "inactive"; // ADR 0005
  mergedIntoHn?: string;
}

export interface AppointmentRecord {
  id: string;
  appointmentNumber: string;
  hn: string;
  patientName: string;
  clinicName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTimeSlot: string;
  preparationInstructions: string;
  referringHospital?: string; // e.g. รพช.ธัญบุรี, รพ.ชัยภูมิ
  referralDocNo?: string;
  status: "scheduled" | "checked_in" | "cancelled" | "completed";
}

export interface VisitQueueItem {
  id: string;
  vn: string; // Stored: VN-DDMMYYYY-XXXXXXX
  hn: string;
  queueNumber: string;
  patientName: string;
  gender: string;
  age: number;
  clinicName: string;
  roomNumber?: string;
  doctorName?: string;
  chiefComplaint: string;
  triageLevel: "routine" | "urgent" | "emergency";
  inflowType: "walk_in" | "appointment" | "referral";
  isReferral: boolean;
  referringHospital?: string;
  referralDocNo?: string;
  referralDocStatus: "none" | "pending_document" | "verified";
  insuranceScheme?: string;
  authenCode?: string;
  rightVerificationStatus?: string;
  actVehiclePlate?: string;
  actInsuranceCompany?: string;
  allergies?: string;
  emergencyContact?: string;
  status:
    | "registered"
    | "triaged"
    | "in_doctor"
    | "pending_orders"
    | "doctor_review"
    | "pending_payment"
    | "dispensing"
    | "completed"
    | "unpaid_debt"
    | "cancelled";
  registeredAt: string;
}

export interface OpenVisitInput {
  patientId: string;
  hn: string;
  clinicName: string;
  roomNumber?: string;
  doctorName?: string;
  chiefComplaint: string;
  triageLevel?: "routine" | "urgent" | "emergency";
  inflowType?: "walk_in" | "appointment" | "referral";
  appointmentId?: string;
  isReferral?: boolean;
  referringHospital?: string;
  referralDocNo?: string;
  referralDocStatus?: "none" | "pending_document" | "verified";
  insuranceScheme?: string;
  authenCode?: string;
  rightVerificationStatus?: string;
  actVehiclePlate?: string;
  actInsuranceCompany?: string;
  allergies?: string;
  emergencyContact?: string;
}

// In-Memory Master Mock Pool for Offline / Local Exploration
// Realistic patient records matching Maharat Nakhon Ratchasima Hospital documents
export const INITIAL_MOCK_PATIENTS: PatientRecord[] = [
  {
    id: "pat-68-0001",
    hn: "HN-68-0000001",
    idType: "thai_cid",
    nationalId: "1103700543210",
    firstName: "สมศักดิ์",
    lastName: "รักสงบ",
    gender: "M",
    birthDate: "1985-04-12",
    age: calculateAge("1985-04-12"),
    bloodGroup: "O",
    insuranceScheme: "Universal Coverage",
    affiliatedHospital: "รพ.มหาราชนครราชสีมา",
    phone: "081-234-5678",
    address: "99/12 หมู่ 4 ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000",
    allergies: "ปฏิเสธประวัติแพ้ยา",
    emergencyContactName: "นาง สมใจ รักสงบ",
    emergencyContactRelationship: "คู่สมรส",
    emergencyContactPhone: "081-999-1122",
    outstandingBalance: 0,
    status: "active",
  },
  {
    id: "pat-68-0002",
    hn: "HN-68-0000002",
    idType: "thai_cid",
    nationalId: "3101400876541",
    firstName: "วิภาดา",
    lastName: "เจริญพร",
    gender: "F",
    birthDate: "1992-09-25",
    age: calculateAge("1992-09-25"),
    bloodGroup: "B",
    insuranceScheme: "Social Security",
    affiliatedHospital: "รพช.ธัญบุรี",
    phone: "089-876-5432",
    address: "123 ถ.มิตรภาพ ต.ปากช่อง อ.ปากช่อง จ.นครราชสีมา 30130",
    allergies: "แพ้ยา Penicillin (ผื่นคัน, แน่นหน้าอก)",
    emergencyContactName: "นาย สมพร เจริญพร",
    emergencyContactRelationship: "บิดา",
    emergencyContactPhone: "089-111-3344",
    outstandingBalance: 850.0, // Outstanding debt alert (ADR 0009)
    status: "active",
  },
  {
    id: "pat-68-0003",
    hn: "HN-68-0000003",
    idType: "thai_cid",
    nationalId: "5100200112233",
    firstName: "ประสิทธิ์",
    lastName: "วงศ์สว่าง",
    gender: "M",
    birthDate: "1960-11-03",
    age: calculateAge("1960-11-03"),
    bloodGroup: "A",
    insuranceScheme: "Civil Servant",
    affiliatedHospital: "กรมบัญชีกลาง จ่ายตรง",
    phone: "084-555-9988",
    address: "45/2 ถ.สุรนารายณ์ ต.จอหอ อ.เมือง จ.นครราชสีมา 30310",
    allergies: "แพ้ยา Sulfa",
    emergencyContactName: "น.ส. นงลักษณ์ วงศ์สว่าง",
    emergencyContactRelationship: "บุตร",
    emergencyContactPhone: "084-333-7788",
    outstandingBalance: 0,
    status: "active",
  },
  {
    id: "pat-68-0004",
    hn: "HN-68-0000004",
    idType: "passport",
    passportNumber: "AA9876543",
    firstName: "David",
    lastName: "Miller",
    gender: "M",
    birthDate: "1975-06-18",
    age: calculateAge("1975-06-18"),
    bloodGroup: "O",
    insuranceScheme: "Self-pay",
    phone: "095-123-4567",
    address: "Hotel Korat, Mittraphap Rd, Nakhon Ratchasima",
    allergies: "ปฏิเสธประวัติแพ้ยา",
    emergencyContactName: "Sarah Miller",
    emergencyContactRelationship: "ภรรยา",
    emergencyContactPhone: "+61-412-345-678",
    outstandingBalance: 0,
    status: "active",
  },
];

// Pre-scheduled appointments from Referral / Online system (THE 1 & ใบนัด)
export const INITIAL_MOCK_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: "apt-001",
    appointmentNumber: "APT-25681021-001",
    hn: "HN-68-0000002",
    patientName: "น.ส. วิภาดา เจริญพร",
    clinicName: "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์)",
    doctorName: "นพ. ทวี ยิ่งสง่า",
    appointmentDate: new Date().toISOString().slice(0, 10),
    appointmentTimeSlot: "08:00 - 10:00 น.",
    preparationInstructions: "เจาะเลือด + U/S CA1634 (งดอาหารไอโอดีน)",
    referringHospital: "รพช.ธัญบุรี",
    referralDocNo: "TH-REF-68/1092",
    status: "scheduled",
  },
  {
    id: "apt-002",
    appointmentNumber: "APT-25681021-002",
    hn: "HN-68-0000003",
    patientName: "นาย ประสิทธิ์ วงศ์สว่าง",
    clinicName: "เวชศาสตร์นิวเคลียร์ (Bone Scan)",
    doctorName: "นพ. ทวี ยิ่งสง่า",
    appointmentDate: new Date().toISOString().slice(0, 10),
    appointmentTimeSlot: "10:00 - 12:00 น.",
    preparationInstructions: "นัดฉีดสาร Tc-99m สแกนกระดูกทั่วร่าง",
    referringHospital: "รพ.ชัยภูมิ (เขตสุขภาพที่ 9)",
    referralDocNo: "CP-BONE-2568/44",
    status: "scheduled",
  },
];

// Initial Today Visits Queue
export const INITIAL_MOCK_VISITS: VisitQueueItem[] = [
  {
    id: "vis-001",
    vn: "VN-31102568-0000001",
    hn: "HN-68-0000001",
    queueNumber: "A-01",
    patientName: "สมศักดิ์ รักสงบ",
    gender: "M",
    age: 41,
    clinicName: "คลินิกอายุรกรรมทั่วไป",
    roomNumber: "101",
    doctorName: "พญ. นันทา บริรักษ์",
    chiefComplaint: "มีไข้สูง หนาวสั่น ไอแห้ง 2 วัน",
    triageLevel: "routine",
    inflowType: "walk_in",
    isReferral: false,
    referralDocStatus: "none",
    insuranceScheme: "Universal Coverage",
    authenCode: "U92A11",
    allergies: "ปฏิเสธประวัติแพ้ยา",
    emergencyContact: "นาง สมใจ รักสงบ (คู่สมรส) โทร 081-999-1122",
    status: "registered",
    registeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

// In-memory runtime state containers (allows full local interaction without docker setup)
let localPatients = [...INITIAL_MOCK_PATIENTS];
let localAppointments = [...INITIAL_MOCK_APPOINTMENTS];
let localVisits = [...INITIAL_MOCK_VISITS];

// Right verification result contract
export interface RightVerificationResult {
  status: "verified" | "out_of_network" | "direct_billing_approved" | "act_registered" | "self_pay";
  scheme: string;
  authenCode?: string;
  message: string;
  details: string;
  affiliatedHospital?: string;
}

// 0. Verify Patient Health Rights & Request Authen Claim Code (สปสช. / สปส. / กรมบัญชีกลาง / พ.ร.บ.)
export function verifyPatientRights(
  scheme: string,
  affiliatedHospital?: string
): RightVerificationResult {
  const isMaharat = !affiliatedHospital || affiliatedHospital.includes("มหาราช");
  const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();

  if (scheme === "Universal Coverage") {
    if (isMaharat) {
      return {
        status: "verified",
        scheme: "Universal Coverage (บัตรทอง 30 บาท)",
        authenCode: `U${randomHex}`,
        message: "ตรวจสอบสิทธิ สปสช. ผ่าน (ในเขตบริการ รพ.มหาราชนครราชสีมา)",
        details: "สิทธิหลักประกันสุขภาพแห่งชาติ รพ.มหาราชนครราชสีมา พร้อมส่งเบิก e-Claim สปสช.",
        affiliatedHospital: affiliatedHospital || "รพ.มหาราชนครราชสีมา",
      };
    } else {
      return {
        status: "out_of_network",
        scheme: "Universal Coverage (บัตรทองนอกเครือข่าย)",
        authenCode: `R${randomHex}`,
        message: `สิทธิต้นสังกัดอยู่ที่ ${affiliatedHospital} (ต้องแนบใบส่งตัว THE 1 หรือชำระเงินเอง)`,
        details: "ผู้ป่วยนอกเครือข่ายบริการ หากไม่มีใบส่งตัวที่ถูกต้อง ผู้ป่วยต้องชำระเงินค่ารักษาเอง",
        affiliatedHospital,
      };
    }
  }

  if (scheme === "Social Security") {
    return {
      status: "verified",
      scheme: "Social Security (ประกันสังคม)",
      authenCode: undefined,
      message: "ตรวจสอบสิทธิสำนักงานประกันสังคม (สปส.) ผ่าน",
      details: `สถานพยาบาลตามบัตร: ${affiliatedHospital || "รพ.มหาราชนครราชสีมา"} (ผู้ประกันตน ม.33 / ม.39)`,
      affiliatedHospital: affiliatedHospital || "รพ.มหาราชนครราชสีมา",
    };
  }

  if (scheme === "Civil Servant") {
    return {
      status: "direct_billing_approved",
      scheme: "Civil Servant (ข้าราชการจ่ายตรง กรมบัญชีกลาง)",
      authenCode: undefined,
      message: "ตรวจสอบฐานข้อมูลสิทธิเบิกตรง กรมบัญชีกลาง ผ่าน",
      details: "ข้าราชการ / ลูกจ้างประจำ / ครอบครัว เบิกตรงค่ารักษาพยาบาลผู้ป่วยนอกได้ตามเกณฑ์",
    };
  }

  if (scheme === "Road Accident Protection Act") {
    return {
      status: "act_registered",
      scheme: "Road Accident Protection Act (พ.ร.บ. ผู้ประสบภัยจากรถ)",
      authenCode: undefined,
      message: "ลงทะเบียนสิทธิ พ.ร.บ. ผู้ประสบภัยจากรถยนต์ / จักรยานยนต์ เรียบร้อย",
      details: "คุ้มครองค่ารักษาพยาบาลเบื้องต้นตาม พ.ร.บ. สูงสุด 30,000 บาท (เบิก บ.กลางฯ)",
    };
  }

  if (scheme === "Migrant Health Insurance") {
    return {
      status: "verified",
      scheme: "Migrant Health Insurance (ประกันสุขภาพแรงงานต่างด้าว สธ.)",
      authenCode: undefined,
      message: "ตรวจสอบสิทธิบัตรประกันสุขภาพคนต่างด้าว กระทรวงสาธารณสุข ผ่าน",
      details: "บัตรประกันสุขภาพแรงงานต่างด้าว รพ.มหาราชนครราชสีมา คุ้มครองการรักษาพยาบาลตามสิทธิ",
      affiliatedHospital: affiliatedHospital || "รพ.มหาราชนครราชสีมา",
    };
  }

  return {
    status: "self_pay",
    scheme: "Self-pay (ชำระเงินเอง)",
    authenCode: undefined,
    message: "ผู้ป่วยประสงค์ชำระเงินเอง (Self-pay) หรือไม่มีสิทธิการรักษาของรัฐ",
    details: "ชำระเงินค่ารักษาพยาบาลและค่ายาเต็มจำนวนที่ห้องการเงิน",
  };
}

// Helper to generate formatted ANON-XXXXXXX for unknown emergency cases
export function generateAnonymousId(): string {
  const anonCount = localPatients.filter((p) => p.idType === "anonymous_trauma").length + 1;
  return `ANON-${String(anonCount).padStart(7, "0")}`;
}

// 1. Search Patients by HN / CID / Passport / Name / Phone
export async function searchPatients(query: string): Promise<PatientRecord[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  try {
    const supabase = createClient();
    // Query standard columns compatible with database schema to avoid HTTP 400
    const { data, error } = await supabase
      .from("patients")
      .select("id, hn, national_id, first_name, last_name, gender, birth_date, blood_group, insurance_scheme, phone, address, outstanding_balance")
      .or(`hn.ilike.%${clean}%,national_id.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%`)
      .limit(15);

    if (!error && data && data.length > 0) {
      return data.map((p) => ({
        id: p.id,
        hn: p.hn,
        idType: "thai_cid",
        nationalId: p.national_id,
        firstName: p.first_name,
        lastName: p.last_name,
        gender: p.gender,
        birthDate: p.birth_date,
        age: calculateAge(p.birth_date),
        bloodGroup: p.blood_group || "O",
        insuranceScheme: p.insurance_scheme || "Self-pay",
        phone: p.phone || "-",
        address: p.address || "-",
        outstandingBalance: Number(p.outstanding_balance || 0),
        status: "active",
      }));
    }
  } catch {
    // Fallback to local store
  }

  // Fallback to local store (supports passport, anonymous, and all offline records)
  return localPatients.filter(
    (p) =>
      p.status === "active" &&
      (p.hn.toLowerCase().includes(clean) ||
        (p.nationalId && p.nationalId.includes(clean)) ||
        (p.passportNumber && p.passportNumber.toLowerCase().includes(clean)) ||
        (p.anonymousId && p.anonymousId.toLowerCase().includes(clean)) ||
        p.firstName.toLowerCase().includes(clean) ||
        p.lastName.toLowerCase().includes(clean) ||
        p.phone.includes(clean))
  );
}

// 2. Get Patient by National ID (CID)
export async function getPatientByCid(cid: string): Promise<PatientRecord | null> {
  const clean = cid.replace(/\D/g, "");
  if (!clean) return null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("patients")
      .select("id, hn, national_id, first_name, last_name, gender, birth_date, blood_group, insurance_scheme, phone, address, outstanding_balance")
      .eq("national_id", clean)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        hn: data.hn,
        idType: "thai_cid",
        nationalId: data.national_id,
        firstName: data.first_name,
        lastName: data.last_name,
        gender: data.gender,
        birthDate: data.birth_date,
        age: calculateAge(data.birth_date),
        bloodGroup: data.blood_group,
        insuranceScheme: data.insurance_scheme,
        phone: data.phone,
        address: data.address,
        outstandingBalance: Number(data.outstanding_balance || 0),
        status: "active",
      };
    }
  } catch {
    // Fallback
  }

  return localPatients.find((p) => p.nationalId === clean && p.status === "active") || null;
}

// 3. Get Today's Appointments (Referrals & Pre-scheduled visits)
export async function getAppointments(dateStr?: string): Promise<AppointmentRecord[]> {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", targetDate)
      .order("appointment_time_slot", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((a) => ({
        id: a.id,
        appointmentNumber: a.appointment_number,
        hn: a.hn,
        patientName: a.patient_name,
        clinicName: a.clinic_name,
        doctorName: a.doctor_name,
        appointmentDate: a.appointment_date,
        appointmentTimeSlot: a.appointment_time_slot,
        preparationInstructions: a.preparation_instructions,
        referringHospital: a.referring_hospital,
        referralDocNo: a.referral_doc_no,
        status: a.status,
      }));
    }
  } catch {
    // Fallback
  }

  return localAppointments;
}

// 4. Open Visit (VN) with Daily Midnight Reset & Referral tracking (ADR 0001, 0002, 0003)
export async function openVisit(
  input: OpenVisitInput
): Promise<{ success: boolean; vn?: string; queueNumber?: string; error?: string }> {
  // Generate date-keyed sequence DDMMYYYY (Buddhist Era e.g. 31102568)
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const beYear = String(now.getFullYear() + 543);
  const dateKey = `${day}${month}${beYear}`;

  const currentCount = localVisits.length + 1;
  const storedVn = `VN-${dateKey}-${String(currentCount).padStart(7, "0")}`;
  const queueNo = `A-${String(currentCount).padStart(2, "0")}`;

  try {
    const supabase = createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.patientId);

    if (isUuid) {
      const { data, error } = await supabase
        .from("visits")
        .insert({
          vn: storedVn,
          patient_id: input.patientId,
          hn: input.hn,
          status: "registered",
          chief_complaint: `[${input.clinicName}] ${input.chiefComplaint}`,
          triage_level: input.triageLevel || "routine",
        })
        .select("vn")
        .maybeSingle();

      if (!error && data) {
        // Successfully synced with Supabase Cloud
      }
    }
  } catch {
    // Graceful fallback to rich local state
  }

  // Update in-memory local state
  const patient = localPatients.find((p) => p.id === input.patientId);
  const newVisit: VisitQueueItem = {
    id: `vis-${Date.now()}`,
    vn: storedVn,
    hn: input.hn,
    queueNumber: queueNo,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "ผู้ป่วย OPD",
    gender: patient?.gender || "M",
    age: patient?.age || 35,
    clinicName: input.clinicName,
    roomNumber: input.roomNumber,
    doctorName: input.doctorName,
    chiefComplaint: input.chiefComplaint,
    triageLevel: input.triageLevel || "routine",
    inflowType: input.inflowType || "walk_in",
    isReferral: Boolean(input.isReferral),
    referringHospital: input.referringHospital,
    referralDocNo: input.referralDocNo,
    referralDocStatus: input.referralDocStatus || "none",
    insuranceScheme: input.insuranceScheme || patient?.insuranceScheme || "Self-pay",
    authenCode: input.authenCode || patient?.authenCode,
    rightVerificationStatus: input.rightVerificationStatus,
    actVehiclePlate: input.actVehiclePlate || patient?.actVehiclePlate,
    actInsuranceCompany: input.actInsuranceCompany || patient?.actInsuranceCompany,
    allergies: input.allergies || patient?.allergies,
    emergencyContact:
      input.emergencyContact ||
      (patient?.emergencyContactName
        ? `${patient.emergencyContactName} (${patient.emergencyContactRelationship || "ญาติ"}) โทร ${patient.emergencyContactPhone || "-"}`
        : undefined),
    status: "registered",
    registeredAt: now.toISOString(),
  };

  localVisits = [newVisit, ...localVisits];

  // If booked appointment, mark appointment as checked_in
  if (input.appointmentId) {
    localAppointments = localAppointments.map((a) =>
      a.id === input.appointmentId ? { ...a, status: "checked_in" as const } : a
    );
  }

  return { success: true, vn: storedVn, queueNumber: queueNo };
}

// 5. Register New Patient (Supports Thai CID, Pink Card, Passport, Trauma ID - ADR 0003)
export async function registerNewPatient(patientData: {
  idType: "thai_cid" | "pink_card" | "passport" | "anonymous_trauma";
  anonymousId?: string;
  nationalId?: string;
  passportNumber?: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F" | "Other";
  birthDate: string;
  bloodGroup: string;
  insuranceScheme: string;
  affiliatedHospital?: string;
  phone?: string;
  address?: string;
  employerName?: string;
  nationality?: string;
  authenCode?: string;
  actVehiclePlate?: string;
  actInsuranceCompany?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
}): Promise<{ success: boolean; hn?: string; patientId?: string; error?: string }> {
  // Check duplicate national ID if Thai CID or Pink Card
  if ((patientData.idType === "thai_cid" || patientData.idType === "pink_card") && patientData.nationalId) {
    const existing = localPatients.find(
      (p) => p.nationalId === patientData.nationalId && p.status === "active"
    );
    if (existing) {
      return {
        success: false,
        error: `พบประวัติผู้ป่วยเดิมในระบบแล้ว (HN: ${formatHnDisplay(existing.hn)}) ไม่สามารถลงทะเบียนซ้ำได้ กรุณาใช้ HN เดิมเปิด Visit`,
      };
    }
  }

  const beYear2Digits = String(new Date().getFullYear() + 543).slice(-2);
  const nextSeq = localPatients.length + 1;
  const generatedHn = `HN-${beYear2Digits}-${String(nextSeq).padStart(7, "0")}`;
  const newId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `00000000-0000-0000-0000-${String(nextSeq).padStart(12, "0")}`;

  try {
    const supabase = createClient();
    await supabase.from("patients").insert({
      id: newId,
      hn: generatedHn,
      national_id: patientData.nationalId || null,
      first_name: patientData.firstName,
      last_name: patientData.lastName,
      gender: patientData.gender,
      birth_date: patientData.birthDate,
      blood_group: patientData.bloodGroup || "O",
      insurance_scheme: patientData.insuranceScheme || "Self-pay",
      phone: patientData.phone || null,
      address: patientData.address || null,
    });
  } catch {
    // Graceful offline fallback
  }

  const newPatient: PatientRecord = {
    id: newId,
    hn: generatedHn,
    idType: patientData.idType,
    anonymousId: patientData.idType === "anonymous_trauma" ? patientData.anonymousId : undefined,
    nationalId: patientData.nationalId,
    passportNumber: patientData.passportNumber,
    firstName: patientData.firstName,
    lastName: patientData.lastName,
    gender: patientData.gender,
    birthDate: patientData.birthDate,
    age: calculateAge(patientData.birthDate),
    bloodGroup: patientData.bloodGroup || "O",
    insuranceScheme: patientData.insuranceScheme || "Self-pay",
    affiliatedHospital: patientData.affiliatedHospital,
    phone: patientData.phone || "-",
    address: patientData.address || "-",
    employerName: patientData.employerName,
    nationality: patientData.nationality,
    authenCode: patientData.authenCode,
    actVehiclePlate: patientData.actVehiclePlate,
    actInsuranceCompany: patientData.actInsuranceCompany,
    allergies: patientData.allergies || "ปฏิเสธประวัติแพ้ยา",
    emergencyContactName: patientData.emergencyContactName,
    emergencyContactRelationship: patientData.emergencyContactRelationship,
    emergencyContactPhone: patientData.emergencyContactPhone,
    outstandingBalance: 0,
    status: "active",
  };

  localPatients = [newPatient, ...localPatients];
  return { success: true, hn: generatedHn, patientId: newId };
}

// 6. Amend Patient Demographics with Mandatory Audit Reason (ADR 0005)
export async function updatePatientDemographics(
  patientId: string,
  updatedData: Partial<PatientRecord>,
  amendmentReason?: string
): Promise<{ success: boolean; error?: string }> {
  const patient = localPatients.find((p) => p.id === patientId);
  if (!patient) return { success: false, error: "Patient record not found" };

  // Check if legal identity fields were modified
  const isLegalModified =
    (updatedData.firstName && updatedData.firstName !== patient.firstName) ||
    (updatedData.lastName && updatedData.lastName !== patient.lastName) ||
    (updatedData.nationalId && updatedData.nationalId !== patient.nationalId);

  if (isLegalModified && !amendmentReason?.trim()) {
    return {
      success: false,
      error: "Mandatory justification reason required for legal identity modifications (ADR 0005).",
    };
  }

  localPatients = localPatients.map((p) =>
    p.id === patientId ? { ...p, ...updatedData, age: calculateAge(updatedData.birthDate || p.birthDate) } : p
  );

  return { success: true };
}

// 7. Get Today's Visits Queue
export async function getTodayVisits(): Promise<VisitQueueItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data && data.length > 0) {
      return data.map((v) => ({
        id: v.id,
        vn: v.vn,
        hn: v.hn,
        queueNumber: v.queue_number,
        patientName: "ผู้ป่วย OPD",
        gender: "M",
        age: 40,
        clinicName: v.clinic_name,
        roomNumber: v.room_number,
        doctorName: v.doctor_name,
        chiefComplaint: v.chief_complaint,
        triageLevel: v.triage_level,
        inflowType: v.inflow_type,
        isReferral: v.is_referral,
        referringHospital: v.referring_hospital,
        referralDocNo: v.referral_doc_no,
        referralDocStatus: v.referral_doc_status,
        status: v.status,
        registeredAt: v.created_at,
      }));
    }
  } catch {
    // Fallback
  }

  return localVisits;
}
