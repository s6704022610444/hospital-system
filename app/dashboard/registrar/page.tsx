"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserPlus,
  Search,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Users,
  Building,
  Clock,
  Printer,
  ChevronRight,
  UserCheck,
  Activity,
  HeartPulse,
  Filter,
  FileText,
  Calendar,
  CalendarCheck,
  Tag,
  Edit3,
  Shield,
  ShieldCheck,
  HelpCircle,
  X,
  MapPin,
} from "lucide-react";
import { THAI_ADDRESS_DATA } from "@/src/lib/data/thai-address";
import {
  searchPatients,
  getPatientByCid,
  getAppointments,
  openVisit,
  registerNewPatient,
  generateAnonymousId,
  verifyPatientRights,
  RightVerificationResult,
  updatePatientDemographics,
  getTodayVisits,
  PatientRecord,
  AppointmentRecord,
  VisitQueueItem,
} from "@/src/lib/patient/registrar-service";
import {
  formatHnDisplay,
  formatVnDisplay,
  formatThaiDate,
  validateThaiNationalId,
} from "@/src/lib/utils/formatters";
import { OpdRoutingSlipModal, OpdSlipData } from "@/src/components/registrar/OpdRoutingSlipModal";
import { BarcodeLabelsModal, BarcodeLabelData } from "@/src/components/registrar/BarcodeLabelsModal";
import { PatientEditModal } from "@/src/components/registrar/PatientEditModal";

const destinationClinics = [
  "คลินิกอายุรกรรมทั่วไป (General Medicine)",
  "คลินิกเวชศาสตร์ครอบครัว (Family Medicine)",
  "คลินิกโรคเรื้อรัง NCDs (Chronic Disease)",
  "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / กลืนแร่)",
  "เวชศาสตร์นิวเคลียร์ (Bone Scan / PET-CT)",
  "คลินิกกุมารเวชกรรม (Pediatrics)",
  "แผนกอุบัติเหตุและฉุกเฉิน (Emergency ER)",
];

const statusBadgeConfig: Record<string, { label: string; color: string }> = {
  registered: { label: "1. เวชระเบียนรับตัว (รอคัดกรอง)", color: "bg-blue-100 text-blue-800 border-blue-200" },
  triaged: { label: "2. คัดกรองแล้ว (รอพบแพทย์)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  in_doctor: { label: "3. กำลังตรวจในห้องแพทย์", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  pending_orders: { label: "4. กำลังตรวจแล็บ/X-ray", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  doctor_review: { label: "5. ผลตรวจครบ (รอฟังผล)", color: "bg-purple-100 text-purple-800 border-purple-200" },
  pending_payment: { label: "6. รอชำระเงินที่การเงิน", color: "bg-amber-100 text-amber-800 border-amber-200" },
  dispensing: { label: "7. รอรับยาที่ห้องยา", color: "bg-teal-100 text-teal-800 border-teal-200" },
  completed: { label: "8. สิ้นสุดการรับบริการ", color: "bg-gray-100 text-gray-800 border-gray-200" },
  unpaid_debt: { label: "ค้างชำระ / หนีกลับ (Walkout)", color: "bg-red-100 text-red-800 border-red-200" },
  cancelled: { label: "ยกเลิกการตรวจ", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

function RegistrarContent({
  initialTab = "search",
}: {
  initialTab?: "search" | "new_patient" | "today_queue" | "appointments";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "search" | "new_patient" | "today_queue" | "appointments" | null;
  const activeTab: "search" | "new_patient" | "today_queue" | "appointments" =
    tabParam && ["search", "new_patient", "today_queue", "appointments"].includes(tabParam)
      ? tabParam
      : initialTab;

  const setActiveTab = (tab: "search" | "new_patient" | "today_queue" | "appointments") => {
    if (tab !== "new_patient") {
      setNewFirstName("");
      setNewLastName("");
      setNewAnonymousId("");
      setNewNationalId("");
      setNewPassportNumber("");
      setNewIdType("thai_cid");
    }
    router.push(`/dashboard/registrar?tab=${tab}`);
  };

  const handleIdTypeChange = (type: "thai_cid" | "pink_card" | "passport" | "anonymous_trauma") => {
    setNewIdType(type);
    if (type === "anonymous_trauma") {
      const generated = generateAnonymousId();
      setNewAnonymousId(generated);
      setNewFirstName("ผู้ป่วยฉุกเฉินไม่ทราบชื่อ");
      setNewLastName(generated);
      setNewNationalId("");
      setNewPassportNumber("");
      setAddressMode("freeform");
      setFreeformAddress("ไม่ทราบที่อยู่ (จุดรับตัว/สถานที่เกิดเหตุ: รถพยาบาล 1669 นำส่ง)");
      setNewInsuranceScheme("Universal Coverage");
    } else if (type === "passport") {
      setNewAnonymousId("");
      setNewFirstName("");
      setNewLastName("");
      setNewNationalId("");
      setNewPassportNumber("");
      setAddressMode("freeform");
      setFreeformAddress("โรงแรมใน อ.เมือง จ.นครราชสีมา");
      setForeignCountry("Australia");
      setNewInsuranceScheme("Self-pay");
    } else if (type === "pink_card") {
      setNewAnonymousId("");
      setNewFirstName("");
      setNewLastName("");
      setNewNationalId("");
      setNewPassportNumber("");
      setAddressMode("thai_standard");
      setAddressHouseNo("แคมป์คนงานก่อสร้าง");
      setNewNationality("เมียนมา");
      setNewInsuranceScheme("Social Security");
      setNewAffiliatedHospital("รพ.มหาราชนครราชสีมา");
    } else {
      setNewAnonymousId("");
      setNewFirstName("");
      setNewLastName("");
      setNewNationalId("");
      setNewPassportNumber("");
      setAddressMode("thai_standard");
      setAddressHouseNo("");
      setFreeformAddress("");
      setNewEmployerName("");
      setNewEmployerPhone("");
      setNewInsuranceScheme("Universal Coverage");
    }
  };

  // Reset emergency patient form fields whenever navigating away from new_patient tab
  useEffect(() => {
    if (activeTab !== "new_patient") {
      if (newIdType === "anonymous_trauma" || newFirstName === "ผู้ป่วยฉุกเฉินไม่ทราบชื่อ") {
        setNewIdType("thai_cid");
        setNewFirstName("");
        setNewLastName("");
        setNewAnonymousId("");
        setNewNationalId("");
        setNewPassportNumber("");
      }
    }
  }, [activeTab]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [matchedAppointment, setMatchedAppointment] = useState<AppointmentRecord | null>(null);
  const latestSearchRef = useRef("");

  // Open Visit Inputs
  const [selectedClinic, setSelectedClinic] = useState(destinationClinics[0]);
  const [visitChiefComplaint, setVisitChiefComplaint] = useState("");
  const [visitTriageLevel, setVisitTriageLevel] = useState<"routine" | "urgent" | "emergency">("routine");
  const [isReferral, setIsReferral] = useState(false);
  const [referringHospital, setReferringHospital] = useState("");
  const [referralDocNo, setReferralDocNo] = useState("");
  const [referralDocStatus, setReferralDocStatus] = useState<"none" | "pending_document" | "verified">("none");
  const [isOpeningVisit, setIsOpeningVisit] = useState(false);

  // New Patient Form State (ADR 0003: Multi-Type ID)
  const [newIdType, setNewIdType] = useState<"thai_cid" | "pink_card" | "passport" | "anonymous_trauma">("thai_cid");
  const [newNationalId, setNewNationalId] = useState("");
  const [newAnonymousId, setNewAnonymousId] = useState("");
  const [newPassportNumber, setNewPassportNumber] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newGender, setNewGender] = useState<"M" | "F" | "Other">("M");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newBloodGroup, setNewBloodGroup] = useState("O");
  const [newInsuranceScheme, setNewInsuranceScheme] = useState("Universal Coverage");
  const [newAffiliatedHospital, setNewAffiliatedHospital] = useState("รพ.มหาราชนครราชสีมา");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Cascading Address Selector State (ADR 0003 & Instant Clickable Selection)
  const [addressMode, setAddressMode] = useState<"thai_standard" | "freeform">("thai_standard");
  const [freeformAddress, setFreeformAddress] = useState("");
  const [newEmployerName, setNewEmployerName] = useState("");
  const [newEmployerPhone, setNewEmployerPhone] = useState("");
  const [newNationality, setNewNationality] = useState("เมียนมา");
  const [foreignCountry, setForeignCountry] = useState("Australia");

  // Allergy State (New Patient Form)
  const [hasAllergy, setHasAllergy] = useState(false);
  const [newAllergies, setNewAllergies] = useState("");

  // Emergency Contact State (New Patient Form)
  const [newEmergencyName, setNewEmergencyName] = useState("");
  const [newEmergencyRelation, setNewEmergencyRelation] = useState("ญาติ");
  const [newEmergencyPhone, setNewEmergencyPhone] = useState("");

  const [addressHouseNo, setAddressHouseNo] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("นครราชสีมา");
  const [selectedDistrict, setSelectedDistrict] = useState("เมืองนครราชสีมา");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("ในเมือง");
  const [selectedZipcode, setSelectedZipcode] = useState("30000");

  const computedAddress =
    addressMode === "thai_standard"
      ? [
          addressHouseNo.trim(),
          selectedSubDistrict ? `ต.${selectedSubDistrict}` : "",
          selectedDistrict ? `อ.${selectedDistrict}` : "",
          selectedProvince ? `จ.${selectedProvince}` : "",
          selectedZipcode,
          newEmployerName.trim()
            ? `[นายจ้าง/แคมป์: ${newEmployerName.trim()}${newEmployerPhone.trim() ? ` โทร ${newEmployerPhone.trim()}` : ""}]`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : [
          freeformAddress.trim(),
          newIdType === "passport" && foreignCountry.trim() ? `[ประเทศ: ${foreignCountry.trim()}]` : "",
          newEmployerName.trim()
            ? `[นายจ้าง/แคมป์: ${newEmployerName.trim()}${newEmployerPhone.trim() ? ` โทร ${newEmployerPhone.trim()}` : ""}]`
            : "",
        ]
          .filter(Boolean)
          .join(" ");

  const currentProvinceData =
    THAI_ADDRESS_DATA.find((p) => p.name === selectedProvince) || THAI_ADDRESS_DATA[0];
  const currentDistrictData =
    currentProvinceData.districts.find((d) => d.name === selectedDistrict) ||
    currentProvinceData.districts[0];

  const handleProvinceChange = (provName: string) => {
    setSelectedProvince(provName);
    const pData = THAI_ADDRESS_DATA.find((p) => p.name === provName) || THAI_ADDRESS_DATA[0];
    const firstDistrict = pData.districts[0];
    setSelectedDistrict(firstDistrict.name);
    const firstSub = firstDistrict.subDistricts[0];
    setSelectedSubDistrict(firstSub.name);
    setSelectedZipcode(firstSub.zipcode);
  };

  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    const dData =
      currentProvinceData.districts.find((d) => d.name === distName) ||
      currentProvinceData.districts[0];
    const firstSub = dData.subDistricts[0];
    setSelectedSubDistrict(firstSub.name);
    setSelectedZipcode(firstSub.zipcode);
  };

  const handleSubDistrictChange = (subName: string) => {
    setSelectedSubDistrict(subName);
    const sData = currentDistrictData.subDistricts.find((s) => s.name === subName);
    if (sData) {
      setSelectedZipcode(sData.zipcode);
    }
  };

  // Appointments (THE 1 & ใบนัดล่วงหน้า) State
  const [appointmentsList, setAppointmentsList] = useState<AppointmentRecord[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  // Today Queue State
  const [todayVisits, setTodayVisits] = useState<VisitQueueItem[]>([]);
  const [queueInflowFilter, setQueueInflowFilter] = useState<string>("all");
  const [queueSearch, setQueueSearch] = useState("");
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Modal States
  const [routingSlipData, setRoutingSlipData] = useState<OpdSlipData | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  const [barcodeLabelData, setBarcodeLabelData] = useState<BarcodeLabelData | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Right Verification & Authen Code State (Existing Patient Open Visit)
  const [existingVisitScheme, setExistingVisitScheme] = useState("Universal Coverage");
  const [existingAuthenCode, setExistingAuthenCode] = useState("");
  const [existingRightVerification, setExistingRightVerification] = useState<RightVerificationResult | null>(null);
  const [existingActPlate, setExistingActPlate] = useState("");
  const [existingActCompany, setExistingActCompany] = useState("บ.กลางคุ้มครองผู้ประสบภัยจากรถ");

  // Right Verification & Authen Code State (New Patient Form)
  const [newAuthenCode, setNewAuthenCode] = useState("");
  const [newRightVerification, setNewRightVerification] = useState<RightVerificationResult | null>(null);
  const [newActPlate, setNewActPlate] = useState("");
  const [newActCompany, setNewActCompany] = useState("บ.กลางคุ้มครองผู้ประสบภัยจากรถ");

  const handleExistingSchemeChange = (scheme: string) => {
    setExistingVisitScheme(scheme);
    const ver = verifyPatientRights(scheme, selectedPatient?.affiliatedHospital);
    setExistingRightVerification(ver);
    setExistingAuthenCode(ver.authenCode || "");
  };

  const handleNewSchemeChange = (scheme: string) => {
    setNewInsuranceScheme(scheme);
    const ver = verifyPatientRights(scheme, newAffiliatedHospital);
    setNewRightVerification(ver);
    setNewAuthenCode(ver.authenCode || "");
  };

  // Refresh Queue and Appointments
  const refreshQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const visits = await getTodayVisits();
      setTodayVisits(visits || []);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const loadAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const list = await getAppointments();
      setAppointmentsList(list || []);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    refreshQueue();
    loadAppointments();
  }, []);

  // Debounced Patient Search
  const handleSearch = async (text: string) => {
    const clean = text.trim();
    if (!clean) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    latestSearchRef.current = clean;
    try {
      const results = await searchPatients(clean);
      if (latestSearchRef.current === clean) {
        setSearchResults(results);
      }
    } finally {
      if (latestSearchRef.current === clean) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else if (!searchQuery.trim()) {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // When patient is selected, check if they have appointment today
  const handleSelectPatient = async (p: PatientRecord) => {
    setSelectedPatient(p);
    setSearchResults([]);
    setSearchQuery("");

    // Check appointment
    const foundApt = appointmentsList.find(
      (a) => a.hn === p.hn && a.status === "scheduled"
    );

    if (foundApt) {
      setMatchedAppointment(foundApt);
      setSelectedClinic(foundApt.clinicName);
      setVisitChiefComplaint(`[ใบนัดล่วงหน้า] ${foundApt.preparationInstructions}`);
      if (foundApt.referringHospital) {
        setIsReferral(true);
        setReferringHospital(foundApt.referringHospital);
        setReferralDocNo(foundApt.referralDocNo || "");
        setReferralDocStatus("verified");
      }
    } else {
      setMatchedAppointment(null);
      setSelectedClinic(destinationClinics[0]);
      setVisitChiefComplaint("");
      setIsReferral(false);
      setReferringHospital(p.affiliatedHospital || "");
      setReferralDocNo("");
      setReferralDocStatus("none");
    }

    // Verify patient rights & generate Authen Claim Code
    const scheme = p.insuranceScheme || "Universal Coverage";
    setExistingVisitScheme(scheme);
    const ver = verifyPatientRights(scheme, p.affiliatedHospital);
    setExistingRightVerification(ver);
    setExistingAuthenCode(ver.authenCode || "");
    setExistingActPlate(p.actVehiclePlate || "");
    setExistingActCompany(p.actInsuranceCompany || "บ.กลางคุ้มครองผู้ประสบภัยจากรถ");
  };

  // Smart Card Simulation (Health ID Dip-Chip)
  const handleSimulateSmartCard = async () => {
    setNotification(null);
    try {
      const res = await fetch("/api/mock/health-id/scan");
      const json = await res.json();
      if (json.status === "success" && json.data) {
        const card = json.data;
        // Search if patient exists
        const existing = await getPatientByCid(card.nationalId);
        if (existing) {
          handleSelectPatient(existing);
          setActiveTab("search");
          setNotification({
            type: "success",
            text: `อ่านบัตร Smart Card สำเร็จ: พบประวัติผู้ป่วยเดิม ${existing.firstName} ${existing.lastName} (${formatHnDisplay(existing.hn)}) พร้อมเปิด Visit ทันที`,
          });
        } else {
          // Switch to new patient form and fill data
          setNewIdType("thai_cid");
          setNewNationalId(card.nationalId);
          setNewFirstName(card.firstName);
          setNewLastName(card.lastName);
          setNewGender(card.gender);
          setNewBirthDate(card.birthDate);
          setNewBloodGroup(card.bloodGroup);
          setNewInsuranceScheme(card.insuranceScheme);
          const ver = verifyPatientRights(card.insuranceScheme, "รพ.มหาราชนครราชสีมา");
          setNewRightVerification(ver);
          setNewAuthenCode(ver.authenCode || "");
          setNewPhone(card.phone);
          setAddressHouseNo(card.address || "");
          setActiveTab("new_patient");
          setNotification({
            type: "success",
            text: "อ่านบัตร Smart Card สำเร็จ (ผู้ป่วยใหม่): นำเข้าข้อมูลประจำตัวลงฟอร์มเรียบร้อยแล้ว กรุณาตรวจสอบและบันทึก",
          });
        }
      }
    } catch {
      setNotification({ type: "error", text: "ไม่สามารถอ่านข้อมูล Smart Card จำลองได้" });
    }
  };

  // Submit Open Visit for Existing Patient
  const handleOpenVisitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsOpeningVisit(true);
    setNotification(null);

    const isAppt = Boolean(matchedAppointment);
    const result = await openVisit({
      patientId: selectedPatient.id,
      hn: selectedPatient.hn,
      clinicName: selectedClinic,
      doctorName: matchedAppointment ? matchedAppointment.doctorName : undefined,
      chiefComplaint: visitChiefComplaint || "ตรวจสุขภาพทั่วไป",
      triageLevel: visitTriageLevel,
      inflowType: isAppt ? "appointment" : isReferral ? "referral" : "walk_in",
      appointmentId: matchedAppointment?.id,
      isReferral: isReferral,
      referringHospital: isReferral ? referringHospital : undefined,
      referralDocNo: isReferral ? referralDocNo : undefined,
      referralDocStatus: isReferral ? referralDocStatus : "none",
      insuranceScheme: existingVisitScheme,
      authenCode: existingAuthenCode,
      rightVerificationStatus: existingRightVerification?.status || "verified",
      actVehiclePlate: existingVisitScheme === "Road Accident Protection Act" ? existingActPlate : undefined,
      actInsuranceCompany: existingVisitScheme === "Road Accident Protection Act" ? existingActCompany : undefined,
      allergies: selectedPatient.allergies,
      emergencyContact: selectedPatient.emergencyContactName
        ? `${selectedPatient.emergencyContactName} (${selectedPatient.emergencyContactRelationship || "ญาติ"}) โทร ${selectedPatient.emergencyContactPhone || "-"}`
        : undefined,
    });

    setIsOpeningVisit(false);

    if (result.success && result.vn && result.queueNumber) {
      const slip: OpdSlipData = {
        hn: selectedPatient.hn,
        vn: result.vn,
        queueNumber: result.queueNumber,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        gender: selectedPatient.gender,
        age: selectedPatient.age,
        clinic: selectedClinic,
        insuranceScheme: existingVisitScheme,
        authenCode: existingAuthenCode,
        rightVerificationStatus: existingRightVerification?.status,
        actVehiclePlate: existingVisitScheme === "Road Accident Protection Act" ? existingActPlate : undefined,
        actInsuranceCompany: existingVisitScheme === "Road Accident Protection Act" ? existingActCompany : undefined,
        allergies: selectedPatient.allergies,
        emergencyContact: selectedPatient.emergencyContactName
          ? `${selectedPatient.emergencyContactName} (${selectedPatient.emergencyContactRelationship || "ญาติ"}) โทร ${selectedPatient.emergencyContactPhone || "-"}`
          : undefined,
        chiefComplaint: visitChiefComplaint || "ตรวจรักษา",
        registeredAt: new Date().toISOString(),
      };
      setRoutingSlipData(slip);
      setIsSlipModalOpen(true);

      const label: BarcodeLabelData = {
        hn: selectedPatient.hn,
        vn: result.vn,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        gender: selectedPatient.gender,
        age: selectedPatient.age,
        clinic: selectedClinic,
        visitDate: new Date().toISOString(),
      };
      setBarcodeLabelData(label);

      setNotification({
        type: "success",
        text: `เปิด Visit สำเร็จ! ${formatVnDisplay(result.vn)} (คิว: ${result.queueNumber}) - ข้อมูลส่งต่อไปยังจุดคัดกรองพยาบาลแล้ว`,
      });
      refreshQueue();
      loadAppointments();
    } else {
      setNotification({ type: "error", text: result.error || "เกิดข้อผิดพลาดในการเปิด Visit" });
    }
  };

  // Submit New Patient Form
  const handleSubmitNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (newIdType === "thai_cid" && !validateThaiNationalId(newNationalId)) {
      setNotification({ type: "error", text: "เลขประจำตัวประชาชน 13 หลักไม่ถูกต้องตามหลักการคำนวณ Checksum" });
      return;
    }

    setIsSubmittingNew(true);
    const resolvedAllergies = hasAllergy && newAllergies.trim() ? newAllergies.trim() : "ปฏิเสธประวัติแพ้ยา";
    const resolvedEmergency = newEmergencyName.trim()
      ? `${newEmergencyName.trim()} (${newEmergencyRelation}) โทร ${newEmergencyPhone.trim() || "-"}`
      : undefined;

    const regRes = await registerNewPatient({
      idType: newIdType,
      anonymousId: newIdType === "anonymous_trauma" ? (newAnonymousId || "ANON-0000001") : undefined,
      nationalId: (newIdType === "thai_cid" || newIdType === "pink_card") ? newNationalId : undefined,
      passportNumber: newIdType === "passport" ? newPassportNumber : undefined,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      gender: newGender,
      birthDate: newBirthDate,
      bloodGroup: newBloodGroup,
      insuranceScheme: newInsuranceScheme,
      authenCode: newAuthenCode || undefined,
      actVehiclePlate: newInsuranceScheme === "Road Accident Protection Act" ? newActPlate : undefined,
      actInsuranceCompany: newInsuranceScheme === "Road Accident Protection Act" ? newActCompany : undefined,
      affiliatedHospital: newAffiliatedHospital,
      phone: newPhone,
      address: computedAddress || "ไม่ระบุที่อยู่",
      employerName: newEmployerName.trim() || undefined,
      nationality: newIdType === "pink_card" ? newNationality : (newIdType === "passport" ? foreignCountry : "ไทย"),
      allergies: resolvedAllergies,
      emergencyContactName: newEmergencyName.trim() || undefined,
      emergencyContactRelationship: newEmergencyName.trim() ? newEmergencyRelation : undefined,
      emergencyContactPhone: newEmergencyPhone.trim() || undefined,
    });

    if (!regRes.success || !regRes.hn || !regRes.patientId) {
      setIsSubmittingNew(false);
      setNotification({ type: "error", text: regRes.error || "ลงทะเบียนไม่สำเร็จ" });
      return;
    }

    // Immediately open first visit
    const visitRes = await openVisit({
      patientId: regRes.patientId,
      hn: regRes.hn,
      clinicName: selectedClinic,
      chiefComplaint: "ลงทะเบียนผู้ป่วยใหม่และตรวจทั่วไป",
      triageLevel: "routine",
      inflowType: "walk_in",
      insuranceScheme: newInsuranceScheme,
      authenCode: newAuthenCode,
      rightVerificationStatus: newRightVerification?.status || "verified",
      actVehiclePlate: newInsuranceScheme === "Road Accident Protection Act" ? newActPlate : undefined,
      actInsuranceCompany: newInsuranceScheme === "Road Accident Protection Act" ? newActCompany : undefined,
      allergies: resolvedAllergies,
      emergencyContact: resolvedEmergency,
    });

    setIsSubmittingNew(false);

    if (visitRes.success && visitRes.vn && visitRes.queueNumber) {
      const slip: OpdSlipData = {
        hn: regRes.hn,
        vn: visitRes.vn,
        queueNumber: visitRes.queueNumber,
        patientName: `${newFirstName} ${newLastName}`,
        gender: newGender,
        age: 30,
        clinic: selectedClinic,
        insuranceScheme: newInsuranceScheme,
        authenCode: newAuthenCode,
        rightVerificationStatus: newRightVerification?.status,
        actVehiclePlate: newInsuranceScheme === "Road Accident Protection Act" ? newActPlate : undefined,
        actInsuranceCompany: newInsuranceScheme === "Road Accident Protection Act" ? newActCompany : undefined,
        allergies: resolvedAllergies,
        emergencyContact: resolvedEmergency,
        chiefComplaint: "ผู้ป่วยใหม่เปิดประวัติ",
        registeredAt: new Date().toISOString(),
      };
      setRoutingSlipData(slip);
      setIsSlipModalOpen(true);

      const label: BarcodeLabelData = {
        hn: regRes.hn,
        vn: visitRes.vn,
        patientName: `${newFirstName} ${newLastName}`,
        gender: newGender,
        age: 30,
        clinic: selectedClinic,
        visitDate: new Date().toISOString(),
      };
      setBarcodeLabelData(label);

      setNotification({
        type: "success",
        text: `ลงทะเบียนผู้ป่วยใหม่และเปิด Visit สำเร็จ! ${formatHnDisplay(regRes.hn)} | ${formatVnDisplay(visitRes.vn)} (คิว: ${visitRes.queueNumber})`,
      });

      // Clear form
      setNewNationalId("");
      setNewPassportNumber("");
      setNewAnonymousId("");
      setNewFirstName("");
      setNewLastName("");
      setNewBirthDate("");
      setNewPhone("");
      setAddressHouseNo("");
      setFreeformAddress("");
      setNewEmployerName("");
      setNewEmployerPhone("");
      setForeignCountry("Australia");
      setAddressMode("thai_standard");
      setHasAllergy(false);
      setNewAllergies("");
      setNewEmergencyName("");
      setNewEmergencyPhone("");
      setNewIdType("thai_cid");

      refreshQueue();
    }
  };

  // Filter Today Visits
  const filteredQueue = todayVisits.filter((v) => {
    const matchInflow = queueInflowFilter === "all" ? true : v.inflowType === queueInflowFilter;
    const qLower = queueSearch.trim().toLowerCase();
    const matchSearch =
      !qLower ||
      v.patientName.toLowerCase().includes(qLower) ||
      v.hn.toLowerCase().includes(qLower) ||
      v.vn.toLowerCase().includes(qLower) ||
      v.queueNumber.toLowerCase().includes(qLower);
    return matchInflow && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Workstation Title */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5f7c44] flex items-center justify-center text-white shadow-md shadow-[#5f7c44]/20">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              เวชระเบียน: ค้นหาผู้ป่วย เปิด Visit & จัดการคิว OPD
            </h1>
            <p className="text-xs text-gray-500">
              โรงพยาบาลมหาราชนครราชสีมา • รองรับ Walk-in, ใบนัด และเคสส่งตัวข้ามโรงพยาบาล (ADR 0001 - 0005)
            </p>
          </div>
        </div>

        {/* Action: Smart Card Reader */}
        <button
          type="button"
          onClick={handleSimulateSmartCard}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-olive-50 text-[#4e6737] border border-olive-200 hover:bg-olive-100 font-bold text-xs sm:text-sm transition-all shadow-xs"
        >
          <CreditCard className="w-4 h-4 text-[#5f7c44]" />
          <span>จำลองเสียบบัตร Smart Card (Health ID)</span>
          <span className="text-[10px] bg-olive-200 text-[#36452a] px-1.5 py-0.5 rounded font-mono">
            simulated
          </span>
        </button>
      </div>

      {/* KPI Stats Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>ผู้ป่วยเปิด Visit วันนี้</span>
            <Users className="w-4 h-4 text-[#5f7c44]" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900 font-mono">{todayVisits.length}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>รอคัดกรองพยาบาล</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-extrabold text-blue-700 font-mono">
            {todayVisits.filter((v) => v.status === "registered").length}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>ใบนัดล่วงหน้ารอรับตัว</span>
            <CalendarCheck className="w-4 h-4 text-[#5f7c44]" />
          </div>
          <span className="text-2xl font-extrabold text-[#4e6737] font-mono">
            {appointmentsList.filter((a) => a.status === "scheduled").length}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>คนไข้ส่งตัว (Referrals)</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-extrabold text-purple-700 font-mono">
            {todayVisits.filter((v) => v.isReferral).length}
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="font-semibold">{notification.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SEARCH & OPEN VISIT FOR EXISTING PATIENT */}
      {/* ========================================================================= */}
      {activeTab === "search" && (
        <div className="space-y-6">
          {/* Quick Search Bar */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs">
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#5f7c44]" />
              <span>ค้นหาประวัติผู้ป่วยเดิม (Search by HN, เลขบัตร 13 หลัก, Passport, ชื่อ หรือเบอร์โทร)</span>
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์เลข HN เช่น HN-0000001, เลขบัตรประชาชน 13 หลัก, Passport หรือชื่อคนไข้..."
                  className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f7c44] outline-none"
                />
                {isSearching && (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-3" />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleSearch(searchQuery)}
                className="px-5 py-2.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white text-xs sm:text-sm font-bold transition-colors"
              >
                ค้นหา
              </button>
            </div>

            {/* Search Results Dropdown List */}
            {searchResults.length > 0 && (
              <div className="mt-4 border rounded-xl divide-y overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.hn}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className="w-full p-3.5 text-left hover:bg-olive-50/50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#4e6737] bg-olive-100 px-2 py-0.5 rounded">
                          {formatHnDisplay(p.hn)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {p.gender === "M" ? "ชาย" : "หญิง"} ({p.age} ปี)
                        </span>
                        {p.outstandingBalance > 0 && (
                          <span className="text-[11px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                            ค้างชำระ {p.outstandingBalance.toLocaleString()} บ.
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3 font-mono">
                        {p.nationalId && <span>CID: {p.nationalId}</span>}
                        {p.passportNumber && <span>Passport: {p.passportNumber}</span>}
                        <span>สิทธิ์: {p.insuranceScheme}</span>
                        <span>รพ.สังกัด: {p.affiliatedHospital || "-"}</span>
                        <span>เบอร์: {p.phone}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Patient Card & Open Visit Form */}
          {selectedPatient ? (
            <div className="bg-white rounded-3xl border-2 border-olive-200 p-6 shadow-sm space-y-6 animate-fadeIn">
              {/* Header with Patient Summary & Edit Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-[#5f7c44] text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      ผู้ป่วยที่เลือก
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-1.5">
                    <span className="font-mono font-bold text-[#4e6737]">
                      HN: {formatHnDisplay(selectedPatient.hn)}
                    </span>
                    {selectedPatient.nationalId && (
                      <span className="font-mono">CID: {selectedPatient.nationalId}</span>
                    )}
                    {selectedPatient.passportNumber && (
                      <span className="font-mono">Passport: {selectedPatient.passportNumber}</span>
                    )}
                    <span>เพศ: {selectedPatient.gender === "M" ? "ชาย" : "หญิง"}</span>
                    <span>อายุ: <strong>{selectedPatient.age} ปี</strong></span>
                    <span>หมู่เลือด: <strong>{selectedPatient.bloodGroup}</strong></span>
                    <span>สิทธิการรักษา: <strong className="text-[#5f7c44]">{selectedPatient.insuranceScheme}</strong></span>
                    <span>รพ.ต้นสังกัด: <strong>{selectedPatient.affiliatedHospital || "รพ.มหาราชนครราชสีมา"}</strong></span>
                    {selectedPatient.emergencyContactName && (
                      <span className="text-gray-700">
                        ติดต่อฉุกเฉิน: <strong>{selectedPatient.emergencyContactName} ({selectedPatient.emergencyContactRelationship || "ญาติ"}) โทร {selectedPatient.emergencyContactPhone || "-"}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                    <span>แก้ไขข้อมูล (ADR 0005)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setMatchedAppointment(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                    title="ยกเลิกเลือกผู้ป่วย"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drug Allergy Alert (Safety First) */}
              {selectedPatient.allergies && selectedPatient.allergies !== "ปฏิเสธประวัติแพ้ยา" ? (
                <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <span className="font-black text-xs uppercase tracking-wider bg-red-200 text-red-900 px-2 py-0.5 rounded">
                        ⚠️ คำเตือนความปลอดภัย: ผู้ป่วยมีประวัติแพ้ยา / แพ้อาหาร
                      </span>
                      <p className="text-xs font-bold text-red-950 mt-1">
                        สารที่แพ้: <span className="underline text-sm font-black">{selectedPatient.allergies}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-red-700 bg-white px-2.5 py-1 rounded-xl border border-red-200 shadow-xs shrink-0">
                    แจ้งพยาบาลคัดกรองทันที
                  </span>
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center justify-between">
                  <span className="font-semibold text-gray-700">ประวัติแพ้ยา/อาหาร:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ ปฏิเสธประวัติแพ้ยา
                  </span>
                </div>
              )}

              {/* Pre-Scheduled Appointment Check-in Banner (ADR 0001) */}
              {matchedAppointment && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
                  <CalendarCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                        พบใบนัดหมายล่วงหน้าวันนี้ (Appointment Found)
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-800">
                        {matchedAppointment.appointmentNumber}
                      </span>
                    </div>
                    <p className="text-xs mt-1">
                      นัดพบ: <strong>{matchedAppointment.doctorName}</strong> | แผนก: <strong>{matchedAppointment.clinicName}</strong> ({matchedAppointment.appointmentTimeSlot})
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      คำสั่งเตรียมตัว: <strong>{matchedAppointment.preparationInstructions}</strong>
                    </p>
                    {matchedAppointment.referringHospital && (
                      <span className="text-[11px] bg-purple-100 text-purple-900 font-semibold px-2 py-0.5 rounded mt-1 inline-block">
                        ส่งตัวมาจาก: {matchedAppointment.referringHospital} (เลขที่: {matchedAppointment.referralDocNo || "-"})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Outstanding Debt Alert (ADR 0009) */}
              {selectedPatient.outstandingBalance > 0 && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">
                      แจ้งเตือนหนี้ค้างชำระสะสม (Outstanding Balance Alert)
                    </h4>
                    <p className="text-xs mt-0.5">
                      ผู้ป่วยรายนี้มียอดค้างชำระจากการรับบริการเดิมจำนวน{" "}
                      <strong className="text-red-700 underline text-sm">
                        {selectedPatient.outstandingBalance.toLocaleString()} บาท
                      </strong>{" "}
                      กรุณาแจ้งผู้ป่วยเพื่อเคลียร์ค่าใช้จ่ายที่ห้องการเงิน
                    </p>
                  </div>
                </div>
              )}

              {/* Open Visit Form with Referral Options */}
              <form onSubmit={handleOpenVisitExisting} className="space-y-4 pt-2">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#5f7c44]" />
                  <span>เปิดการเข้ารับบริการวันนี้ (Open OPD Visit)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      แผนก / คลินิกที่ส่งตรวจ (Destination Clinic) *
                    </label>
                    <select
                      value={selectedClinic}
                      onChange={(e) => setSelectedClinic(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-[#5f7c44] bg-white"
                    >
                      {destinationClinics.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ระดับความเร่งด่วนเบื้องต้น (Triage Urgency)
                    </label>
                    <select
                      value={visitTriageLevel}
                      onChange={(e) => setVisitTriageLevel(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-[#5f7c44] bg-white"
                    >
                      <option value="routine">ผู้ป่วยทั่วไป / ไม่เร่งด่วน (Routine)</option>
                      <option value="urgent">เร่งด่วนปานกลาง (Urgent)</option>
                      <option value="emergency">ฉุกเฉินเร่งด่วน (Emergency)</option>
                    </select>
                  </div>
                </div>

                {/* Right Verification & Authen Code Card (สปสช. / สปส. / กรมบัญชีกลาง / พ.ร.บ.) */}
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-gray-900">
                        การตรวจสอบสิทธิการรักษา & รหัส Authen Claim Code (สปสช.)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const ver = verifyPatientRights(existingVisitScheme, selectedPatient.affiliatedHospital);
                        setExistingRightVerification(ver);
                        setExistingAuthenCode(ver.authenCode || "");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>ตรวจสอบสิทธิซ้ำ & ขอรหัส Authen</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        สิทธิการรักษาสำหรับ Visit วันนี้ *
                      </label>
                      <select
                        value={existingVisitScheme}
                        onChange={(e) => handleExistingSchemeChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-medium focus:ring-2 focus:ring-[#5f7c44]"
                      >
                        <option value="Universal Coverage">บัตรทอง (Universal Coverage 30 บาท)</option>
                        <option value="Social Security">ประกันสังคม (Social Security)</option>
                        <option value="Civil Servant">สวัสดิการข้าราชการจ่ายตรง (Civil Servant)</option>
                        <option value="Road Accident Protection Act">พ.ร.บ. ผู้ประสบภัยจากรถ (Road Accident Protection Act)</option>
                        <option value="Migrant Health Insurance">ประกันสุขภาพคนต่างด้าว สธ. (Migrant Health Insurance)</option>
                        <option value="Self-pay">ชำระเงินเอง (Self-pay)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        รหัส Authen Code (Claim Code สปสช. / อ้างอิงสิทธิ)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={existingAuthenCode || "-"}
                        className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-mono font-bold text-emerald-800"
                      />
                    </div>
                  </div>

                  {/* If ACT / Car Accident, Show Vehicle Plate and Insurance Company */}
                  {existingVisitScheme === "Road Accident Protection Act" && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                          เลขทะเบียนรถที่เกิดเหตุ *
                        </label>
                        <input
                          type="text"
                          required
                          value={existingActPlate}
                          onChange={(e) => setExistingActPlate(e.target.value)}
                          placeholder="เช่น 1กข 1234 นครราชสีมา"
                          className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                          บริษัทประกันภัย พ.ร.บ. *
                        </label>
                        <input
                          type="text"
                          required
                          value={existingActCompany}
                          onChange={(e) => setExistingActCompany(e.target.value)}
                          placeholder="เช่น บ.กลางคุ้มครองผู้ประสบภัยจากรถ, วิริยะประกันภัย"
                          className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Verification Status Banner */}
                  {existingRightVerification && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        existingRightVerification.status === "out_of_network"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-emerald-100/60 border-emerald-300 text-emerald-950"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          existingRightVerification.status === "out_of_network"
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}
                      />
                      <div>
                        <span className="font-bold block">
                          {existingRightVerification.message}
                        </span>
                        <span className="text-[11px] text-gray-600 block mt-0.5">
                          {existingRightVerification.details}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    อาการสำคัญเบื้องต้น / เหตุผลที่มารับบริการ (Chief Complaint) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={visitChiefComplaint}
                    onChange={(e) => setVisitChiefComplaint(e.target.value)}
                    placeholder="ระบุอาการสำคัญ เช่น มีไข้สูง หนาวสั่น 2 วัน, นัดกลืนแร่ I-131, มาตามนัดตรวจไต"
                    className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-[#5f7c44]"
                  />
                </div>

                {/* Referral Details Toggle & Fields (ADR 0001 & ADR 0002) */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isReferral}
                      onChange={(e) => setIsReferral(e.target.checked)}
                      className="w-4 h-4 rounded text-[#5f7c44] focus:ring-[#5f7c44]"
                    />
                    <span className="text-xs font-bold text-gray-800">
                      ผู้ป่วยส่งตัวมาจากโรงพยาบาลอื่น (Cross-Hospital Referral)
                    </span>
                  </label>

                  {isReferral && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t animate-fadeIn">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          ชื่อโรงพยาบาลต้นทางที่ส่งตัว *
                        </label>
                        <input
                          type="text"
                          required={isReferral}
                          value={referringHospital}
                          onChange={(e) => setReferringHospital(e.target.value)}
                          placeholder="เช่น รพช.ธัญบุรี, รพ.ชัยภูมิ"
                          className="w-full px-3 py-1.5 text-xs border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          เลขที่หนังสือส่งตัว (ถ้ามี)
                        </label>
                        <input
                          type="text"
                          value={referralDocNo}
                          onChange={(e) => setReferralDocNo(e.target.value)}
                          placeholder="เช่น REF-68/1092"
                          className="w-full px-3 py-1.5 text-xs border rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          สถานะเอกสารส่งตัว (ADR 0002)
                        </label>
                        <select
                          value={referralDocStatus}
                          onChange={(e) => setReferralDocStatus(e.target.value as any)}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white"
                        >
                          <option value="verified">เอกสารส่งตัวครบถ้วนแล้ว (Verified)</option>
                          <option value="pending_document">เปิดตรวจก่อน เอกสารส่งตามมาทีหลัง (Pending Document)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit & Print Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isOpeningVisit}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#5f7c44]/20 disabled:opacity-50"
                  >
                    {isOpeningVisit ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                    <span>เปิด Visit & พิมพ์ใบนำทางผู้ป่วย (OPD Slip)</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-700">ยังไม่ได้เลือกผู้ป่วย</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                พิมพ์ค้นหาผู้ป่วยในช่องด้านบน หรือกดปุ่ม <strong>"จำลองอ่านบัตร Smart Card"</strong> เพื่อดึงข้อมูลอัตโนมัติ
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NEW PATIENT REGISTRATION (ADR 0003: MULTI-TYPE IDENTIFICATION) */}
      {/* ========================================================================= */}
      {activeTab === "new_patient" && (
        <form
          onSubmit={handleSubmitNewPatient}
          className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6"
        >
          <div className="pb-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                ลงทะเบียนผู้ป่วยใหม่ (New Patient OPD Enrollment)
              </h2>
              <span className="text-xs text-gray-500">
                ออกเลขประจำตัวถาวร (HN-68-XXXXXXX) และเปิดรหัส Visit ประจำวัน (ADR 0003)
              </span>
            </div>

            {/* Identification Type Selector (ADR 0003) */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleIdTypeChange("thai_cid")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  newIdType === "thai_cid" ? "bg-white text-[#4e6737] shadow-xs" : "text-gray-600"
                }`}
              >
                บุคคลสัญชาติไทย (บัตรประชาชน 13 หลัก)
              </button>
              <button
                type="button"
                onClick={() => handleIdTypeChange("pink_card")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  newIdType === "pink_card" ? "bg-white text-[#4e6737] shadow-xs" : "text-gray-600"
                }`}
              >
                บุคคลไม่มีสัญชาติไทย (บัตรชมพู)
              </button>
              <button
                type="button"
                onClick={() => handleIdTypeChange("passport")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  newIdType === "passport" ? "bg-white text-[#4e6737] shadow-xs" : "text-gray-600"
                }`}
              >
                ชาวต่างชาติ (พาสปอร์ต)
              </button>
              <button
                type="button"
                onClick={() => handleIdTypeChange("anonymous_trauma")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  newIdType === "anonymous_trauma" ? "bg-white text-[#4e6737] shadow-xs" : "text-gray-600"
                }`}
              >
                ผู้ป่วยฉุกเฉิน (ไม่ทราบชื่อ)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newIdType === "thai_cid" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  เลขประจำตัวประชาชน 13 หลัก *
                </label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  value={newNationalId}
                  onChange={(e) => setNewNationalId(e.target.value)}
                  placeholder="1103700543210"
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl font-mono focus:ring-2 focus:ring-[#5f7c44]"
                />
              </div>
            )}

            {newIdType === "pink_card" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  เลขประจำตัวคนซึ่งไม่มีสัญชาติไทย (บัตรชมพู) *
                </label>
                <input
                  type="text"
                  required
                  value={newNationalId}
                  onChange={(e) => setNewNationalId(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  maxLength={13}
                  placeholder="เช่น 00xxxxxxxxxxx (13 หลัก)"
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl font-mono focus:ring-2 focus:ring-[#5f7c44]"
                />
              </div>
            )}

            {newIdType === "passport" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  เลขที่หนังสือเดินทาง (Passport Number) *
                </label>
                <input
                  type="text"
                  required
                  value={newPassportNumber}
                  onChange={(e) => setNewPassportNumber(e.target.value)}
                  placeholder="e.g. AA1234567"
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl font-mono focus:ring-2 focus:ring-[#5f7c44]"
                />
              </div>
            )}

            {newIdType === "anonymous_trauma" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  รหัสฉุกเฉินชั่วคราว (Auto-Generated)
                </label>
                <input
                  type="text"
                  readOnly
                  value={newAnonymousId || "ANON-0000001"}
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl font-mono bg-gray-100 text-[#4e6737] font-bold"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อ (First Name) *</label>
              <input
                type="text"
                required
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                readOnly={newIdType === "anonymous_trauma"}
                placeholder="ระบุชื่อจริง"
                className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-[#5f7c44] ${
                  newIdType === "anonymous_trauma" ? "bg-gray-100 text-gray-600 font-semibold cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">นามสกุล (Last Name) *</label>
              <input
                type="text"
                required
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                readOnly={newIdType === "anonymous_trauma"}
                placeholder="ระบุนามสกุล"
                className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-[#5f7c44] ${
                  newIdType === "anonymous_trauma" ? "bg-gray-100 text-[#4e6737] font-mono font-bold cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">เพศ (Gender) *</label>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white"
              >
                <option value="M">ชาย (Male)</option>
                <option value="F">หญิง (Female)</option>
                <option value="Other">อื่นๆ (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">วันเดือนปีเกิด (Birth Date) *</label>
              <input
                type="date"
                required
                value={newBirthDate}
                onChange={(e) => setNewBirthDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl focus:ring-2 focus:ring-[#5f7c44]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">หมู่โลหิต (Blood Group)</label>
              <select
                value={newBloodGroup}
                onChange={(e) => setNewBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white"
              >
                <option value="O">O</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์ (Phone)</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="081-234-5678"
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Allergy Alert Section (ประวัติการแพ้ยาและสารเคมีสำคัญ - Safety First) */}
          <div className="p-4 bg-red-50/40 rounded-2xl border-2 border-red-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-950">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>ประวัติการแพ้ยาและสารเคมี (Drug & Food Allergies - Patient Safety)</span>
              </div>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ความปลอดภัยผู้ป่วยด่านแรก
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="radio"
                    name="allergyStatus"
                    checked={!hasAllergy}
                    onChange={() => {
                      setHasAllergy(false);
                      setNewAllergies("");
                    }}
                    className="w-4 h-4 text-[#5f7c44] focus:ring-[#5f7c44]"
                  />
                  <span>✓ ปฏิเสธประวัติแพ้ยา (No Known Drug Allergies - NKDA)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-700">
                  <input
                    type="radio"
                    name="allergyStatus"
                    checked={hasAllergy}
                    onChange={() => setHasAllergy(true)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span>⚠️ มีประวัติแพ้ยา / แพ้อาหาร (Has Known Allergies)</span>
                </label>
              </div>

              {hasAllergy && (
                <div className="pt-2 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-red-900 mb-1">
                    ระบุชื่อยา หรือสารที่แพ้ พร้อมอาการที่เกิดขึ้น *
                  </label>
                  <input
                    type="text"
                    required={hasAllergy}
                    value={newAllergies}
                    onChange={(e) => setNewAllergies(e.target.value)}
                    placeholder="เช่น Penicillin (ผื่นคัน แน่นหน้าอก), Sulfa (ตาบวม), อาหารทะเลรุนแรง"
                    className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-red-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 font-bold text-red-950 placeholder:font-normal placeholder:text-gray-400"
                  />
                  <span className="text-[10px] text-red-600 font-semibold mt-1 block">
                    * ข้อมูลนี้จะพิมพ์ลงบนใบนำทาง OPD Slip และส่งต่อไปยังจุดคัดกรองพยาบาลทันที
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Verification & Authen Code Section (สปสช. / สปส. / กรมบัญชีกลาง / พ.ร.บ.) */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-emerald-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>สิทธิการรักษา & ตรวจสอบสิทธิ สปสช. (Authen Code)</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const ver = verifyPatientRights(newInsuranceScheme, newAffiliatedHospital);
                  setNewRightVerification(ver);
                  setNewAuthenCode(ver.authenCode || "");
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ตรวจสอบสิทธิทันที & ขอรหัส Authen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  สิทธิการรักษา (Insurance Scheme) *
                </label>
                <select
                  value={newInsuranceScheme}
                  onChange={(e) => handleNewSchemeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-medium focus:ring-2 focus:ring-[#5f7c44]"
                >
                  <option value="Universal Coverage">บัตรทอง (Universal Coverage 30 บาท)</option>
                  <option value="Social Security">ประกันสังคม (Social Security)</option>
                  <option value="Civil Servant">สวัสดิการข้าราชการจ่ายตรง (Civil Servant)</option>
                  <option value="Road Accident Protection Act">พ.ร.บ. ผู้ประสบภัยจากรถ (Road Accident Protection Act)</option>
                  <option value="Migrant Health Insurance">ประกันสุขภาพคนต่างด้าว สธ. (Migrant Health Insurance)</option>
                  <option value="Self-pay">ชำระเงินเอง (Self-pay)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  สถานพยาบาลตามสิทธิ (Affiliated Hospital)
                </label>
                <input
                  type="text"
                  value={newAffiliatedHospital}
                  onChange={(e) => setNewAffiliatedHospital(e.target.value)}
                  placeholder="เช่น รพ.มหาราชนครราชสีมา, รพช.ธัญบุรี"
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  รหัส Authen Code (Claim Code สปสช. / อ้างอิงสิทธิ)
                </label>
                <input
                  type="text"
                  readOnly
                  value={newAuthenCode || "-"}
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-mono font-bold text-emerald-800"
                />
              </div>
            </div>

            {/* If ACT / Car Accident, Show Vehicle Plate and Insurance Company */}
            {newInsuranceScheme === "Road Accident Protection Act" && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    เลขทะเบียนรถที่เกิดเหตุ *
                  </label>
                  <input
                    type="text"
                    required
                    value={newActPlate}
                    onChange={(e) => setNewActPlate(e.target.value)}
                    placeholder="เช่น 1กข 1234 นครราชสีมา"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    บริษัทประกันภัย พ.ร.บ. *
                  </label>
                  <input
                    type="text"
                    required
                    value={newActCompany}
                    onChange={(e) => setNewActCompany(e.target.value)}
                    placeholder="เช่น บ.กลางคุ้มครองผู้ประสบภัยจากรถ, วิริยะประกันภัย"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"
                  />
                </div>
              </div>
            )}

            {/* Verification Status Banner */}
            {newRightVerification && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  newRightVerification.status === "out_of_network"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-100/60 border-emerald-300 text-emerald-950"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    newRightVerification.status === "out_of_network"
                      ? "text-amber-600"
                      : "text-emerald-700"
                  }`}
                />
                <div>
                  <span className="font-bold block">
                    {newRightVerification.message}
                  </span>
                  <span className="text-[11px] text-gray-600 block mt-0.5">
                    {newRightVerification.details}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Smart Context-Aware Address Section (รองรับทั้งคนไทย, แรงงานต่างด้าว, นักท่องเที่ยว, ผู้ป่วยฉุกเฉิน, คนไร้บ้าน) */}
          <div className="p-4 bg-olive-50/50 rounded-2xl border border-olive-200/80 space-y-3">
            {/* Header with Mode Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-olive-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <MapPin className="w-4 h-4 text-[#5f7c44]" />
                <span>ที่อยู่ผู้ป่วย / ข้อมูลที่พักอาศัย</span>
                {newIdType === "pink_card" && (
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                    แรงงานต่างด้าว / บัตรชมพู
                  </span>
                )}
                {newIdType === "passport" && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                    ชาวต่างชาติ / Tourist
                  </span>
                )}
                {newIdType === "anonymous_trauma" && (
                  <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">
                    เคสฉุกเฉิน 1669
                  </span>
                )}
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-olive-200/80">
                <button
                  type="button"
                  onClick={() => setAddressMode("thai_standard")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    addressMode === "thai_standard"
                      ? "bg-[#5f7c44] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  เลือกที่อยู่ในไทย (จังหวัด/อำเภอ)
                </button>
                <button
                  type="button"
                  onClick={() => setAddressMode("freeform")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    addressMode === "freeform"
                      ? "bg-[#5f7c44] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  ระบุที่อยู่อิสระ / จุดเกิดเหตุ / โรงแรม
                </button>
              </div>
            </div>

            {/* Quick Preset Badges (ปุ่มลัดตามบริบทคนไข้) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-gray-500 font-semibold">ปุ่มลัดเลือกด่วน:</span>

              {newIdType === "thai_cid" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("thai_standard");
                      setAddressHouseNo("");
                    }}
                    className="text-[10px] bg-white hover:bg-olive-100 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 transition-colors"
                  >
                    🏠 บ้านพักตามทะเบียนบ้าน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("ไม่มีที่พักอาศัยเป็นหลักแหล่ง (คนไร้ที่พึ่ง/ประสานงานสังคมสงเคราะห์)");
                    }}
                    className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-200 font-semibold transition-colors"
                  >
                    🎪 คนไร้บ้าน / ไม่มีที่อยู่หลักแหล่ง
                  </button>
                </>
              )}

              {newIdType === "pink_card" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("thai_standard");
                      setAddressHouseNo("แคมป์คนงานก่อสร้าง");
                    }}
                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200 font-semibold transition-colors"
                  >
                    🏗️ แคมป์คนงานก่อสร้าง
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("thai_standard");
                      setAddressHouseNo("หอพักพนักงานโรงงาน");
                    }}
                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200 font-semibold transition-colors"
                  >
                    🏭 หอพักโรงงาน / สถานประกอบการ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("thai_standard");
                      setAddressHouseNo("บ้านพักคนงานในฟาร์ม");
                    }}
                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200 font-semibold transition-colors"
                  >
                    🌾 บ้านพักคนงานเกษตร / ไร่องุ่น
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("ที่พักคนงานชั่วคราว (รอตรวจสอบเอกสารนายจ้าง)");
                    }}
                    className="text-[10px] bg-white hover:bg-olive-100 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 transition-colors"
                  >
                    📝 ที่อยู่อิสระ (ไม่ทราบตำบลแน่ชัด)
                  </button>
                </>
              )}

              {newIdType === "passport" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("โรงแรมใน อ.เมือง จ.นครราชสีมา");
                    }}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 px-2 py-0.5 rounded-lg border border-blue-200 font-semibold transition-colors"
                  >
                    🏨 โรงแรม / รีสอร์ตในไทย
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("คอนโดมิเนียม / ห้องเช่าชั่วคราว โคราช");
                    }}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 px-2 py-0.5 rounded-lg border border-blue-200 font-semibold transition-colors"
                  >
                    🏢 คอนโดมิเนียม / อพาร์ตเมนต์
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("นักท่องเที่ยวเดินทางชั่วคราว (ไม่มีที่พักถาวรในไทย)");
                    }}
                    className="text-[10px] bg-white hover:bg-olive-100 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 transition-colors"
                  >
                    ✈️ นักท่องเที่ยว (Tourist / Transit)
                  </button>
                </>
              )}

              {newIdType === "anonymous_trauma" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("ไม่ทราบที่อยู่ (จุดเกิดเหตุ: อุบัติเหตุจราจร ถ.มิตรภาพ โคราช)");
                    }}
                    className="text-[10px] bg-red-50 hover:bg-red-100 text-red-900 px-2 py-0.5 rounded-lg border border-red-200 font-semibold transition-colors"
                  >
                    🚨 อุบัติเหตุจราจรถนนมิตรภาพ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("ไม่ทราบที่อยู่ (รับตัวโดยกู้ชีพ 1669 จากจุดเกิดเหตุ)");
                    }}
                    className="text-[10px] bg-red-50 hover:bg-red-100 text-red-900 px-2 py-0.5 rounded-lg border border-red-200 font-semibold transition-colors"
                  >
                    🚑 จุดรับตัวกู้ชีพ 1669
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode("freeform");
                      setFreeformAddress("ไม่ทราบที่อยู่ (หมดสติ/พบบริเวณที่สาธารณะในเมืองโคราช)");
                    }}
                    className="text-[10px] bg-white hover:bg-olive-100 text-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 transition-colors"
                  >
                    📍 พบบริเวณที่สาธารณะ
                  </button>
                </>
              )}
            </div>

            {/* Extra Fields for Migrant Workers (Pink Card) */}
            {newIdType === "pink_card" && (
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-2">
                <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-700" />
                  <span>ข้อมูลนายจ้าง / สถานประกอบการ (สำหรับแรงงานต่างด้าว บัตรชมพู)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      สัญชาติต้นทาง (Nationality)
                    </label>
                    <select
                      value={newNationality}
                      onChange={(e) => setNewNationality(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white font-medium"
                    >
                      <option value="เมียนมา">เมียนมา (Myanmar)</option>
                      <option value="กัมพูชา">กัมพูชา (Cambodia)</option>
                      <option value="ลาว">ลาว (Laos)</option>
                      <option value="เวียดนาม">เวียดนาม (Vietnam)</option>
                      <option value="อื่นๆ">อื่นๆ (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      ชื่อนายจ้าง / บริษัท / สถานประกอบการ *
                    </label>
                    <input
                      type="text"
                      value={newEmployerName}
                      onChange={(e) => setNewEmployerName(e.target.value)}
                      placeholder="เช่น บ.ไทยพัฒนา แคมป์จอหอ, สวนเกษตรโชคชัย"
                      className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      เบอร์โทรติดต่อฉุกเฉิน / นายจ้าง
                    </label>
                    <input
                      type="text"
                      value={newEmployerPhone}
                      onChange={(e) => setNewEmployerPhone(e.target.value)}
                      placeholder="เช่น 089-111-2233"
                      className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Extra Fields for Foreigners (Passport) */}
            {newIdType === "passport" && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2">
                <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-700" />
                  <span>ข้อมูลประเทศต้นทาง (Country of Origin)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                    ประเทศตามหนังสือเดินทาง (Passport Country)
                  </label>
                  <input
                    type="text"
                    value={foreignCountry}
                    onChange={(e) => setForeignCountry(e.target.value)}
                    placeholder="เช่น Australia, United Kingdom, USA, China, Japan, Germany"
                    className="w-full px-3 py-1.5 text-xs border rounded-xl bg-white"
                  />
                </div>
              </div>
            )}

            {/* Mode 1: Thai Cascading Address Selection */}
            {addressMode === "thai_standard" && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      จังหวัด (Province) *
                    </label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-medium focus:ring-2 focus:ring-[#5f7c44]"
                    >
                      {THAI_ADDRESS_DATA.map((prov) => (
                        <option key={prov.name} value={prov.name}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      อำเภอ / เขต (District) *
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-medium focus:ring-2 focus:ring-[#5f7c44]"
                    >
                      {currentProvinceData.districts.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      ตำบล / แขวง (Sub-district) *
                    </label>
                    <select
                      value={selectedSubDistrict}
                      onChange={(e) => handleSubDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-medium focus:ring-2 focus:ring-[#5f7c44]"
                    >
                      {currentDistrictData.subDistricts.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      รหัสไปรษณีย์ (Zipcode - อัตโนมัติ)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={selectedZipcode}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-gray-100 font-mono font-bold text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    {newIdType === "pink_card"
                      ? "ที่ตั้งแคมป์คนงาน / หอพัก / บ้านเลขที่ (Camp / Dorm / House No.)"
                      : "บ้านเลขที่ / หมู่ที่ / ซอย / ถนน (House No., Village, Road)"}
                  </label>
                  <input
                    type="text"
                    value={addressHouseNo}
                    onChange={(e) => setAddressHouseNo(e.target.value)}
                    placeholder={
                      newIdType === "pink_card"
                        ? "เช่น แคมป์คนงาน ม.5 หรือ หอพักแสงจันทร์ ห้อง 201"
                        : "เช่น 99/12 หมู่ 4 ซอยมิตรภาพ 12"
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white focus:ring-2 focus:ring-[#5f7c44]"
                  />
                </div>
              </div>
            )}

            {/* Mode 2: Freeform Address / Temporary Shelter / Incident Location */}
            {addressMode === "freeform" && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    รายละเอียดที่อยู่อิสระ / จุดเกิดเหตุ / โรงแรม / สถานที่พัก (ระบุข้อความได้อิสระ) *
                  </label>
                  <textarea
                    rows={2}
                    value={freeformAddress}
                    onChange={(e) => setFreeformAddress(e.target.value)}
                    placeholder="เช่น โรงแรมสีมาธานี ห้อง 402, จุดเกิดเหตุสี่แยกไฟแดงประโดก, ไม่มีที่พักอาศัยเป็นหลักแหล่ง..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white focus:ring-2 focus:ring-[#5f7c44]"
                  />
                </div>
              </div>
            )}

            {/* Realtime Composed Address Preview */}
            <div className="p-2.5 bg-white rounded-xl border border-olive-200/50 text-[11px] text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="truncate">
                <strong className="text-gray-800">ที่อยู่ฉบับสมบูรณ์:</strong>{" "}
                {computedAddress || "ยังไม่ได้ระบุที่อยู่"}
              </span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                ✓ พร้อมบันทึก
              </span>
            </div>
          </div>

          {/* Emergency Contact Information (ข้อมูลผู้ติดต่อฉุกเฉิน / ญาติ) */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <Users className="w-4 h-4 text-[#5f7c44]" />
              <span>ข้อมูลผู้ติดต่อฉุกเฉิน / ญาติ (Emergency Contact)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน
                </label>
                <input
                  type="text"
                  value={newEmergencyName}
                  onChange={(e) => setNewEmergencyName(e.target.value)}
                  placeholder="เช่น นาย สมพร รักสงบ"
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white focus:ring-2 focus:ring-[#5f7c44]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  ความสัมพันธ์ (Relationship)
                </label>
                <select
                  value={newEmergencyRelation}
                  onChange={(e) => setNewEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-medium"
                >
                  <option value="บิดา">บิดา (Father)</option>
                  <option value="มารดา">มารดา (Mother)</option>
                  <option value="คู่สมรส">คู่สมรส (Spouse)</option>
                  <option value="บุตร">บุตร (Child)</option>
                  <option value="ญาติ">ญาติ (Relative)</option>
                  <option value="นายจ้าง">นายจ้าง / เพื่อนร่วมงาน (Employer/Coworker)</option>
                  <option value="อื่นๆ">อื่นๆ (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  เบอร์โทรศัพท์ติดต่อฉุกเฉิน
                </label>
                <input
                  type="text"
                  value={newEmergencyPhone}
                  onChange={(e) => setNewEmergencyPhone(e.target.value)}
                  placeholder="089-123-4567"
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-xl bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmittingNew}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#5f7c44]/20 disabled:opacity-50"
            >
              {isSubmittingNew ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>บันทึกผู้ป่วยใหม่ & เปิด Visit (HN / VN)</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TODAY'S LIVE QUEUE MONITOR (LOCATION & INFLOW TRACKING) */}
      {/* ========================================================================= */}
      {activeTab === "today_queue" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#5f7c44]" />
                <span>คิวผู้ป่วยวันนี้ & ติดตามจุดบริการทางกายภาพ (Patient Location Tracker)</span>
              </h2>
              <span className="text-xs text-gray-500">
                ติดตามสถานะว่าคนไข้แต่ละคนกำลังอยู่ขั้นตอนใดของโรงพยาบาล (รีเซ็ตคิวนับ 1 ใหม่ทุกเที่ยงคืน)
              </span>
            </div>

            <button
              type="button"
              onClick={refreshQueue}
              disabled={isLoadingQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? "animate-spin" : ""}`} />
              <span>รีเฟรชคิว</span>
            </button>
          </div>

          {/* Controls: Search & Inflow Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="ค้นหาในคิวด้วยชื่อคนไข้, HN, VN หรือหมายเลขคิว..."
                className="w-full px-3 py-2 text-xs border rounded-xl pl-8"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={queueInflowFilter}
                onChange={(e) => setQueueInflowFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border rounded-xl bg-white font-semibold"
              >
                <option value="all">ทุกประเภทผู้ป่วย ({todayVisits.length})</option>
                <option value="walk_in">คนไข้ทั่วไป (Walk-in)</option>
                <option value="appointment">มีใบนัดหมาย (Appointment)</option>
                <option value="referral">ส่งตัวจาก รพ.อื่น (Referral)</option>
              </select>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto border rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase">
                <tr>
                  <th className="px-3.5 py-3">คิว</th>
                  <th className="px-3.5 py-3">VN (ประจำวัน) / HN</th>
                  <th className="px-3.5 py-3">ชื่อผู้ป่วย</th>
                  <th className="px-3.5 py-3">ประเภทขาเข้า</th>
                  <th className="px-3.5 py-3">คลินิกปลายทาง</th>
                  <th className="px-3.5 py-3">จุดบริการปัจจุบัน (Status)</th>
                  <th className="px-3.5 py-3 text-right">พิมพ์เอกสาร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-sans">
                {filteredQueue.length > 0 ? (
                  filteredQueue.map((item) => {
                    const cfg = statusBadgeConfig[item.status] || {
                      label: item.status,
                      color: "bg-gray-100 text-gray-800",
                    };
                    return (
                      <tr key={item.id} className="hover:bg-olive-50/40 transition-colors">
                        <td className="px-3.5 py-3 font-mono font-black text-[#4e6737] text-sm">
                          {item.queueNumber}
                        </td>
                        <td className="px-3.5 py-3 font-mono">
                          <span className="font-bold text-gray-900 block">
                            {formatVnDisplay(item.vn)}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {formatHnDisplay(item.hn)}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-gray-900">
                          {item.patientName}
                          <span className="text-gray-500 text-[11px] font-normal block">
                            {item.gender === "M" ? "ชาย" : "หญิง"} ({item.age} ปี)
                          </span>
                          {item.allergies && item.allergies !== "ปฏิเสธประวัติแพ้ยา" && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                              ⚠️ แพ้: {item.allergies}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          {item.inflowType === "appointment" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              มีนัด
                            </span>
                          ) : item.inflowType === "referral" ? (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 block mb-0.5">
                                ส่งตัว
                              </span>
                              <span className="text-[10px] text-gray-400 block truncate max-w-[120px]">
                                {item.referringHospital || "-"}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                              Walk-in
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-gray-700 font-medium">
                          {item.clinicName}
                          {item.roomNumber && (
                            <span className="text-[11px] text-gray-500 block">
                              ห้อง: {item.roomNumber} ({item.doctorName || "แพทย์เวร"})
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {item.referralDocStatus === "pending_document" && (
                            <span className="block mt-1 text-[10px] text-amber-700 font-bold">
                              * เอกสารส่งตัวรอส่งตาม
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setRoutingSlipData({
                                  hn: item.hn,
                                  vn: item.vn,
                                  queueNumber: item.queueNumber,
                                  patientName: item.patientName,
                                  gender: item.gender,
                                  age: item.age,
                                  clinic: item.clinicName,
                                  insuranceScheme: item.insuranceScheme || "Universal Coverage",
                                  authenCode: item.authenCode,
                                  actVehiclePlate: item.actVehiclePlate,
                                  actInsuranceCompany: item.actInsuranceCompany,
                                  allergies: item.allergies,
                                  emergencyContact: item.emergencyContact,
                                  chiefComplaint: item.chiefComplaint,
                                  registeredAt: item.registeredAt,
                                });
                                setIsSlipModalOpen(true);
                              }}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              title="พิมพ์ใบนำทาง / บัตรคิว"
                            >
                              <Printer className="w-3 h-3 text-gray-500" />
                              <span>ใบนำทาง</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setBarcodeLabelData({
                                  hn: item.hn,
                                  vn: item.vn,
                                  patientName: item.patientName,
                                  gender: item.gender,
                                  age: item.age,
                                  clinic: item.clinicName,
                                  visitDate: item.registeredAt,
                                });
                                setIsLabelModalOpen(true);
                              }}
                              className="px-2 py-1 bg-olive-50 hover:bg-olive-100 text-[#4e6737] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              title="พิมพ์สติกเกอร์บาร์โค้ดติดหลอดเลือด"
                            >
                              <Tag className="w-3 h-3 text-[#5f7c44]" />
                              <span>สติกเกอร์</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      ไม่พบข้อมูลผู้ป่วยในคิวตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: APPOINTMENTS & REFERRALS (THE 1 ONLINE BOOKING & REFERRAL WORKLIST) */}
      {/* ========================================================================= */}
      {activeTab === "appointments" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                <span>ใบนัดตรวจล่วงหน้า & เคสส่งตัวจาก รพ.อื่น (THE 1 Referral Worklist)</span>
              </h2>
              <span className="text-xs text-gray-500">
                รายชื่อผู้ป่วยที่ได้รับการจองคิวตรวจล่วงหน้า หรือส่งตัวมาจาก รพช./รพ.ในเขตสุขภาพที่ 9
              </span>
            </div>

            <button
              type="button"
              onClick={loadAppointments}
              className="px-3 py-1.5 border rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1 text-gray-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAppointments ? "animate-spin" : ""}`} />
              <span>รีเฟรชใบนัด</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointmentsList.map((apt) => (
              <div
                key={apt.id}
                className="p-5 rounded-2xl border border-gray-200 hover:border-[#5f7c44] transition-all bg-white shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-lg">
                      {apt.appointmentNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        apt.status === "scheduled"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {apt.status === "scheduled" ? "รอยืนยันรับตัว" : "รับตัวแล้ว (Checked-in)"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">
                    {apt.patientName}
                  </h3>
                  <span className="font-mono text-xs text-gray-500 font-bold block mb-2">
                    HN: {formatHnDisplay(apt.hn)}
                  </span>

                  <div className="text-xs space-y-1 text-gray-600 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-400">คลินิก:</span>
                      <span className="font-semibold text-gray-800">{apt.clinicName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">แพทย์ผู้ตรวจ:</span>
                      <span className="font-semibold text-gray-800">{apt.doctorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ช่วงเวลานัด:</span>
                      <span className="font-semibold text-blue-700">{apt.appointmentTimeSlot}</span>
                    </div>
                    {apt.referringHospital && (
                      <div className="flex justify-between text-purple-900">
                        <span className="text-purple-600">รพ.ต้นทาง:</span>
                        <span className="font-bold">{apt.referringHospital}</span>
                      </div>
                    )}
                    <div className="pt-1 text-[11px] text-gray-500 italic">
                      คำสั่งเตรียมตัว: {apt.preparationInstructions}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-end">
                  {apt.status === "scheduled" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const pat = await searchPatients(apt.hn);
                        if (pat.length > 0) {
                          handleSelectPatient(pat[0]);
                          setActiveTab("search");
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>รับตัว & เปิด Visit ทันที &rarr;</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>เปิด Visit เรียบร้อยแล้ว</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OPD Routing Slip Modal (ADR 0004) */}
      <OpdRoutingSlipModal
        isOpen={isSlipModalOpen}
        data={routingSlipData}
        onClose={() => setIsSlipModalOpen(false)}
      />

      {/* Barcode Labels Modal (ADR 0004) */}
      <BarcodeLabelsModal
        isOpen={isLabelModalOpen}
        data={barcodeLabelData}
        onClose={() => setIsLabelModalOpen(false)}
      />

      {/* Patient Demographic Edit Modal (ADR 0005) */}
      <PatientEditModal
        isOpen={isEditModalOpen}
        patient={selectedPatient}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={(updated) => {
          setSelectedPatient(updated);
          updatePatientDemographics(
            updated.id,
            updated,
            "แก้ไขข้อมูลจากหน้าจอเวชระเบียน"
          );
          setNotification({
            type: "success",
            text: `แก้ไขข้อมูลผู้ป่วย ${updated.firstName} ${updated.lastName} สำเร็จ พร้อมบันทึก Audit Trail`,
          });
        }}
      />
    </div>
  );
}

export default function RegistrarPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-400">
          กำลังโหลดระบบงานเวชระเบียน...
        </div>
      }
    >
      <RegistrarContent />
    </Suspense>
  );
}
