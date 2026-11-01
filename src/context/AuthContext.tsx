"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { HospitalRole, UserProfile, ROLE_CONFIGS } from "@/src/types/auth";
import { useRouter } from "next/navigation";

export const DEMO_USERS: Record<HospitalRole, UserProfile> = {
  registrar: {
    id: "user-reg-01",
    staffId: "STF-68-0102",
    email: "registrar@hospital.local",
    fullName: "นาย วิชัย เวชสถิติ",
    professionalTitle: "เจ้าพนักงานเวชสถิติชำนาญงาน",
    departmentName: "กลุ่มงานเวชระเบียนและเวชสถิติ",
    assignedStation: "โต๊ะรับลงทะเบียนผู้ป่วย 01 (OPD ด้านหน้า)",
    licenseNumber: "วส.2560/089",
    activeRole: "registrar",
    assignedRoles: ["registrar"],
  },
  nurse: {
    id: "user-nurse-01",
    staffId: "STF-68-0245",
    email: "nurse@hospital.local",
    fullName: "พว. มาลี มีสุข",
    professionalTitle: "พยาบาลวิชาชีพชำนาญการ (RN)",
    departmentName: "กลุ่มงานการพยาบาลผู้ป่วยนอก (OPD)",
    assignedStation: "จุดคัดกรอง คลินิกอายุรกรรมทั่วไป",
    licenseNumber: "พย.11029845",
    activeRole: "nurse",
    assignedRoles: ["nurse", "registrar"],
  },
  doctor: {
    id: "user-doc-01",
    staffId: "STF-68-0018",
    email: "doctor@hospital.local",
    fullName: "นพ. ทวี ยิ่งสง่า",
    professionalTitle: "นายแพทย์เชี่ยวชาญ (เวชศาสตร์นิวเคลียร์)",
    departmentName: "กลุ่มงานเวชศาสตร์นิวเคลียร์ รังสีวิทยา",
    assignedStation: "ห้องตรวจ 101 (คลินิกไทรอยด์และกลืนแร่)",
    licenseNumber: "ว.33174",
    activeRole: "doctor",
    assignedRoles: ["doctor", "director"],
  },
  med_tech: {
    id: "user-lab-01",
    staffId: "STF-68-0381",
    email: "medtech@hospital.local",
    fullName: "ทนพ. กิตติ ชันสูตร",
    professionalTitle: "นักเทคนิคการแพทย์ปฏิบัติการ",
    departmentName: "กลุ่มงานพยาธิวิทยาคลินิกและชันสูตร",
    assignedStation: "ห้องปฏิบัติการกลาง (Central Lab ชั้น 2)",
    licenseNumber: "ทนพ.4412",
    activeRole: "med_tech",
    assignedRoles: ["med_tech"],
  },
  nuclear_med: {
    id: "user-nuc-01",
    staffId: "STF-68-0409",
    email: "nuclearmed@hospital.local",
    fullName: "นาย อนุชา รังสี",
    professionalTitle: "นักรังสีการแพทย์ชำนาญการ (นิวเคลียร์)",
    departmentName: "หน่วยเวชศาสตร์นิวเคลียร์",
    assignedStation: "ห้องตรวจสแกนกระดูก (Bone Scan & PET-CT)",
    licenseNumber: "รังสี.8821",
    activeRole: "nuclear_med",
    assignedRoles: ["nuclear_med"],
  },
  cashier: {
    id: "user-cash-01",
    staffId: "STF-68-0512",
    email: "cashier@hospital.local",
    fullName: "นาง ชุติกาญจน์ กาวกระโทก",
    professionalTitle: "เจ้าพนักงานการเงินและบัญชีชำนาญงาน",
    departmentName: "กลุ่มงานการเงินและรับชำระค่ารักษา",
    assignedStation: "ช่องรับชำระเงิน 03 (OPD Cashier)",
    licenseNumber: "กง.2561/014",
    activeRole: "cashier",
    assignedRoles: ["cashier"],
  },
  pharmacist: {
    id: "user-pharma-01",
    staffId: "STF-68-0199",
    email: "pharmacist@hospital.local",
    fullName: "ภญ. พรรณี จ่ายยา",
    professionalTitle: "เภสัชกรชำนาญการพิเศษ",
    departmentName: "กลุ่มงานเภสัชกรรมผู้ป่วยนอก",
    assignedStation: "ห้องจ่ายยาผู้ป่วยนอก ช่อง 02",
    licenseNumber: "ภ.18934",
    activeRole: "pharmacist",
    assignedRoles: ["pharmacist"],
  },
  warehouse: {
    id: "user-wh-01",
    staffId: "STF-68-0620",
    email: "warehouse@hospital.local",
    fullName: "นาย สมบูรณ์ สต็อกมั่นคง",
    professionalTitle: "เจ้าพนักงานพัสดุการแพทย์",
    departmentName: "กลุ่มงานบริหารเวชภัณฑ์และคลังยา",
    assignedStation: "คลังยาและเวชภัณฑ์กลาง ชั้น 1",
    activeRole: "warehouse",
    assignedRoles: ["warehouse"],
  },
  director: {
    id: "user-dir-01",
    staffId: "STF-68-0001",
    email: "director@hospital.local",
    fullName: "นพ. ภักดี ผู้อำนวยการ",
    professionalTitle: "ผู้อำนวยการโรงพยาบาล (นายแพทย์ทรงคุณวุฒิ)",
    departmentName: "สำนักงานผู้อำนวยการ โรงพยาบาลมหาราชนครราชสีมา",
    assignedStation: "ห้องปฏิบัติการผู้บริหาร ชั้น 9 อาคารเฉลิมพระเกียรติ",
    licenseNumber: "ว.19820",
    activeRole: "director",
    assignedRoles: ["doctor", "director", "admin"],
  },
  admin: {
    id: "user-adm-01",
    staffId: "STF-68-0005",
    email: "admin@hospital.local",
    fullName: "นาย สุริยา ระบบเซิร์ฟเวอร์",
    professionalTitle: "นักวิชาการคอมพิวเตอร์ชำนาญการ",
    departmentName: "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร (IT)",
    assignedStation: "ห้องควบคุมระบบสารสนเทศ (Data Center ชั้น 4)",
    licenseNumber: "IT-SEC-2568",
    activeRole: "admin",
    assignedRoles: ["admin", "registrar", "nurse", "doctor", "cashier", "pharmacist"],
  },
};

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginAsRole: (role: HospitalRole) => void;
  switchActiveRole: (role: HospitalRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("hospital_auth_session") ||
        localStorage.getItem("hospital_demo_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          parsed.activeRole &&
          ROLE_CONFIGS[parsed.activeRole as HospitalRole]
        ) {
          setUser(parsed);
        } else {
          setUser(DEMO_USERS.registrar);
        }
      } else {
        setUser(DEMO_USERS.registrar);
      }
    } catch {
      setUser(DEMO_USERS.registrar);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsRole = (role: HospitalRole) => {
    const profile = DEMO_USERS[role] || DEMO_USERS.registrar;
    setUser(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem("hospital_auth_session", JSON.stringify(profile));
    }
    const targetPath = ROLE_CONFIGS[role]?.defaultPath || "/dashboard/registrar";
    router.push(targetPath);
  };

  const switchActiveRole = (role: HospitalRole) => {
    if (!user) return;
    if (!user.assignedRoles.includes(role)) {
      alert(`คุณไม่ได้รับสิทธิ์ในบทบาท: ${ROLE_CONFIGS[role].title}`);
      return;
    }
    const updated: UserProfile = {
      ...user,
      activeRole: role,
    };
    setUser(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("hospital_auth_session", JSON.stringify(updated));
    }
    router.push(ROLE_CONFIGS[role].defaultPath);
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hospital_auth_session");
    }
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsRole, switchActiveRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
