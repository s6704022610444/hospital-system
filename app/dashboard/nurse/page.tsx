"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import {
  calculateBMI,
  getBmiStatusLabel,
  evaluateFastTrackRules,
  filterQueueByClinic,
  sortQueueByPriority,
  buildTriagedVisit,
} from "@/src/lib/triage/nurse-service";
import {
  getTodayVisits,
  VisitQueueItem,
  PatientRecord,
} from "@/src/lib/patient/registrar-service";
import {
  CoreVitalSigns,
  SpecializedAssessmentItem,
  NurseQueueItem,
  DispatchTarget,
} from "@/src/types/nurse";
import { formatHnDisplay, formatVnDisplay } from "@/src/lib/utils/formatters";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit3,
  FileText,
  Filter,
  HeartPulse,
  LineChart,
  MapPin,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const destinationClinics = [
  "คลินิกอายุรกรรมทั่วไป (General Medicine)",
  "คลินิกเวชศาสตร์ครอบครัว (Family Medicine)",
  "คลินิกโรคเรื้อรัง NCDs (Chronic Disease)",
  "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / กลืนแร่)",
  "เวชศาสตร์นิวเคลียร์ (Bone Scan / PET-CT)",
  "คลินิกกุมารเวชกรรม (Pediatrics)",
  "แผนกอุบัติเหตุและฉุกเฉิน (Emergency ER)",
];

const clinicExamRooms: Record<string, Array<{ room: string; doctor: string }>> = {
  "คลินิกอายุรกรรมทั่วไป (General Medicine)": [
    { room: "101", doctor: "พญ. นันทา บริรักษ์" },
    { room: "102", doctor: "นพ. ชัยยุทธ เวชมา" },
    { room: "103", doctor: "แพทย์เวรประจำวัน" },
  ],
  "เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / กลืนแร่)": [
    { room: "101", doctor: "นพ. ทวี ยิ่งสง่า (ว.33174)" },
    { room: "102", doctor: "พญ. ปาริชาติ รังสีเวช" },
  ],
  "เวชศาสตร์นิวเคลียร์ (Bone Scan / PET-CT)": [
    { room: "ห้องสแกน 1", doctor: "นพ. ทวี ยิ่งสง่า" },
    { room: "ห้องสแกน 2", doctor: "นักรังสีการแพทย์ อนุชา" },
  ],
  "คลินิกกุมารเวชกรรม (Pediatrics)": [
    { room: "201", doctor: "พญ. พรรณพร กุมารแพทย์" },
    { room: "202", doctor: "นพ. วรวัฒน์ เด็กดี" },
  ],
  "คลินิกโรคเรื้อรัง NCDs (Chronic Disease)": [
    { room: "301", doctor: "นพ. สมเกียรติ เบาหวาน" },
  ],
};

function NurseWorkstationContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Clinic Workstation Selector (ADR 0006)
  const [selectedClinic, setSelectedClinic] = useState(
    destinationClinics[0]
  );

  // Active View Tab inside Nurse Workstation driven by URL query parameter (ADR 0006)
  const tabParam = searchParams.get("tab") as "queue" | "chart" | "triaged_history" | null;
  const activeView: "queue" | "chart" | "triaged_history" =
    tabParam && ["queue", "chart", "triaged_history"].includes(tabParam)
      ? tabParam
      : "queue";

  const setActiveView = (tab: "queue" | "chart" | "triaged_history") => {
    router.push(`/dashboard/nurse?tab=${tab}`);
  };

  // Queue State
  const [allVisits, setAllVisits] = useState<NurseQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [queueFilterType, setQueueFilterType] = useState<string>("all");
  const [queueSearch, setQueueSearch] = useState("");

  // Currently Selected Patient for Charting
  const [selectedVisit, setSelectedVisit] = useState<NurseQueueItem | null>(null);

  // Chart Banner Details Drawer
  const [isDemographicsDrawerOpen, setIsDemographicsDrawerOpen] = useState(false);

  // Core Vitals State (ADR 0007)
  const [bw, setBw] = useState<number | "">("");
  const [ht, setHt] = useState<number | "">("");
  const [sbp, setSbp] = useState<number | "">("");
  const [dbp, setDbp] = useState<number | "">("");
  const [pr, setPr] = useState<number | "">("");
  const [temp, setTemp] = useState<number | "">("");
  const [rr, setRr] = useState<number | "">("");
  const [spo2, setSpo2] = useState<number | "">("");
  const [painScore, setPainScore] = useState<number>(0);

  // Dynamic Specialized Assessments (ADR 0007)
  const [specializedItems, setSpecializedItems] = useState<SpecializedAssessmentItem[]>([]);

  // Nursing Notes & Handover (ADR 0008)
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [triageUrgency, setTriageUrgency] = useState<"routine" | "urgent" | "emergency">("routine");
  const [dispatchType, setDispatchType] = useState<"pooled_clinic" | "specific_room">("pooled_clinic");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>("");

  // Fast-Track Alert State (ADR 0008)
  const [fastTrackAlert, setFastTrackAlert] = useState<{ triggered: boolean; reason?: string } | null>(null);

  // Triaged History Today
  const [triagedHistory, setTriagedHistory] = useState<
    Array<NurseQueueItem & { triagedVitals?: CoreVitalSigns; triagedAt?: string; targetRoom?: string }>
  >([]);

  // Toast Notification
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Initial Visits
  const loadVisits = async () => {
    setIsLoadingQueue(true);
    try {
      const visits = await getTodayVisits();
      setAllVisits((visits as NurseQueueItem[]) || []);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  // Calculate BMI reactively
  const numericBw = typeof bw === "number" ? bw : 0;
  const numericHt = typeof ht === "number" ? ht : 0;
  const calculatedBmi = calculateBMI(numericBw, numericHt);
  const bmiLabel = calculatedBmi ? getBmiStatusLabel(calculatedBmi) : "";

  // Evaluate Fast-Track Rules reactively when vitals change (ADR 0008)
  useEffect(() => {
    const vitalsObj: CoreVitalSigns = {
      sbp: typeof sbp === "number" ? sbp : undefined,
      dbp: typeof dbp === "number" ? dbp : undefined,
      temp: typeof temp === "number" ? temp : undefined,
      pr: typeof pr === "number" ? pr : undefined,
      spo2: typeof spo2 === "number" ? spo2 : undefined,
      painScore,
    };

    const ftResult = evaluateFastTrackRules(vitalsObj);
    if (ftResult.triggered) {
      setFastTrackAlert({ triggered: true, reason: ftResult.reason });
      setTriageUrgency(ftResult.suggestedUrgency);
    } else {
      setFastTrackAlert(null);
    }
  }, [sbp, dbp, temp, pr, spo2, painScore]);

  // Handle Calling a Patient to Start Intake
  const handleCallPatient = (visit: NurseQueueItem) => {
    setSelectedVisit(visit);
    setChiefComplaint(visit.chiefComplaint || "");
    setIsDemographicsDrawerOpen(false);

    // Default Vitals Baseline
    setBw(54.0);
    setHt(160);
    setSbp(120);
    setDbp(80);
    setPr(80);
    setTemp(36.8);
    setRr(18);
    setSpo2(98);
    setPainScore(0);

    // Dynamic specialized presets
    const initialItems: SpecializedAssessmentItem[] = [];

    // Nuclear medicine -> auto-inject pregnancy screening (Safety Guard - ADR 0005)
    if (visit.clinicName.includes("เวชศาสตร์นิวเคลียร์") && visit.gender === "F") {
      initialItems.push({
        id: "preg-guard",
        category: "รังสีวิทยา & สุขภาพสตรี",
        name: "🤰 คัดกรองการตั้งครรภ์/ให้นมบุตร",
        value: "ปฏิเสธการตั้งครรภ์ / ให้นมบุตร",
        unit: "",
        statusBadge: "ความปลอดภัยรังสี",
      });
    }

    setSpecializedItems(initialItems);

    // Default room dispatch setup
    const rooms = clinicExamRooms[visit.clinicName] || [];
    if (rooms.length > 0) {
      setSelectedRoomNumber(rooms[0].room);
    }

    setActiveView("chart");
  };

  // Add Dynamic Assessment Parameter (ADR 0007)
  const handleAddParam = (type: string) => {
    if (!type) return;
    const newId = `param-${Date.now()}`;

    if (type === "dtx") {
      setSpecializedItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "เมตาบอลิซึม & NCDs",
          name: "🩸 น้ำตาลปลายนิ้ว (DTX)",
          value: "110",
          unit: "mg/dL",
          statusBadge: "งดอาหาร",
        },
      ]);
    } else if (type === "waist") {
      setSpecializedItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "เมตาบอลิซึม & NCDs",
          name: "📏 เส้นรอบเอว (Waist)",
          value: "82",
          unit: "cm",
          statusBadge: "ปกติ",
        },
      ]);
    } else if (type === "pregnancy") {
      setSpecializedItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "สูติ-นรีเวช & รังสี",
          name: "🤰 คัดกรองตั้งครรภ์/ให้นม",
          value: "ไม่ตั้งครรภ์",
          unit: "",
        },
      ]);
    } else if (type === "gcs") {
      setSpecializedItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "ระบบประสาทและความรู้สึกตัว",
          name: "🧠 ระดับความรู้สึกตัว (GCS)",
          value: "E4 V5 M6 (15)",
          unit: "",
          statusBadge: "Alert",
        },
      ]);
    } else if (type === "o2_device") {
      setSpecializedItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "ทางเดินหายใจ",
          name: "💨 อุปกรณ์ออกซิเจน (O2 Support)",
          value: "Nasal Cannula 3 LPM",
          unit: "",
        },
      ]);
    } else if (type === "head_circ") {
      setSpecializedItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "กุมารเวชกรรม (เด็ก)",
          name: "👶 เส้นรอบศีรษะเด็ก (Head Circ.)",
          value: "42.5",
          unit: "cm",
        },
      ]);
    } else if (type === "custom") {
      const customTitle = window.prompt("ระบุชื่อการตรวจวัดใหม่ (เช่น ปริมาณปัสสาวะ, ระดับความดันตา):");
      if (!customTitle?.trim()) return;
      setSpecializedItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "รายการตรวจพิเศษ",
          name: `📌 ${customTitle.trim()}`,
          value: "ปกติ",
          unit: "",
          isCustom: true,
        },
      ]);
    }
  };

  const handleRemoveParam = (id: string) => {
    setSpecializedItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Complete Triage and Handover to Doctor (ADR 0008)
  const handleHandoverToDoctor = () => {
    if (!selectedVisit) return;

    const availableRooms = clinicExamRooms[selectedVisit.clinicName] || [];
    const matchedRoom = availableRooms.find((r) => r.room === selectedRoomNumber);

    const dispatchTarget: DispatchTarget = {
      type: dispatchType,
      clinicName: selectedVisit.clinicName,
      roomNumber: dispatchType === "specific_room" ? selectedRoomNumber : undefined,
      doctorName: dispatchType === "specific_room" ? matchedRoom?.doctor : undefined,
    };

    const vitalsObj: CoreVitalSigns = {
      bw: typeof bw === "number" ? bw : undefined,
      ht: typeof ht === "number" ? ht : undefined,
      sbp: typeof sbp === "number" ? sbp : undefined,
      dbp: typeof dbp === "number" ? dbp : undefined,
      pr: typeof pr === "number" ? pr : undefined,
      temp: typeof temp === "number" ? temp : undefined,
      rr: typeof rr === "number" ? rr : undefined,
      spo2: typeof spo2 === "number" ? spo2 : undefined,
      painScore,
    };

    const triagedRecord = buildTriagedVisit({
      visitId: selectedVisit.id,
      hn: selectedVisit.hn,
      vn: selectedVisit.vn,
      patientName: selectedVisit.patientName,
      clinicName: selectedVisit.clinicName,
      coreVitals: vitalsObj,
      specializedItems,
      chiefComplaint,
      triageUrgency,
      dispatchTarget,
      allergies: selectedVisit.allergies,
      nurseName: user?.fullName || "พว. มาลี มีสุข",
      nurseLicenseNo: user?.licenseNumber || "พย.11029845",
      nurseStaffId: user?.staffId || "STF-68-0245",
    });

    // Update state: Remove from waiting queue, add to triaged history
    setAllVisits((prev) => prev.filter((v) => v.id !== selectedVisit.id));
    setTriagedHistory((prev) => [
      {
        ...selectedVisit,
        status: "triaged",
        triagedVitals: vitalsObj,
        triagedAt: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        targetRoom: dispatchType === "specific_room" ? `ห้อง ${selectedRoomNumber} (${matchedRoom?.doctor || ""})` : "คิวกลางคลินิก",
      },
      ...prev,
    ]);

    setNotification({
      type: "success",
      text: `คัดกรองสัญญาณชีพสำเร็จ! ส่งต่อ ${selectedVisit.patientName} (${formatHnDisplay(selectedVisit.hn)}) เข้า${
        dispatchType === "specific_room" ? `ห้องตรวจ ${selectedRoomNumber}` : "คิวกลางคลินิก"
      } เรียบร้อยแล้ว`,
    });

    setSelectedVisit(null);
    setActiveView("queue");
  };

  // Filter Queue by Clinic and Search
  const filteredClinicQueue = allVisits.filter((v) => {
    // Only visits with status 'registered' are waiting for nurse triage
    const isWaiting = v.status === "registered";
    const matchesClinic = v.clinicName === selectedClinic;
    const matchesInflow =
      queueFilterType === "all" ? true : v.inflowType === queueFilterType;
    const query = queueSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      v.patientName.toLowerCase().includes(query) ||
      v.hn.toLowerCase().includes(query) ||
      v.vn.toLowerCase().includes(query) ||
      v.queueNumber.toLowerCase().includes(query);

    return isWaiting && matchesClinic && matchesInflow && matchesSearch;
  });

  // Sort queue placing Fast-Track emergency patients on top (ADR 0008)
  const sortedQueue = sortQueueByPriority(filteredClinicQueue);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER STRIP: NURSE WORKSTATION CONTEXT (ADR 0006)                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#5f7c44] flex items-center justify-center text-white shadow-md shadow-[#5f7c44]/20 shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5f7c44] uppercase tracking-wider">
                โรงพยาบาลมหาราชนครราชสีมา • แผนกผู้ป่วยนอก
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="ระบบออนไลน์" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              ระบบงานการพยาบาลผู้ป่วยนอก (OPD Nursing Workstation)
            </h1>
          </div>
        </div>

        {/* Clinic Duty Selector Dropdown (ADR 0006) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-olive-50/80 px-3.5 py-1.5 rounded-2xl border border-olive-200">
            <MapPin className="w-4 h-4 text-[#5f7c44] shrink-0" />
            <div className="text-left">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">
                จุดบริการ / คลินิกประจำการ (Duty Station):
              </span>
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                className="bg-transparent text-xs font-black text-gray-900 focus:outline-none cursor-pointer pr-4"
              >
                {destinationClinics.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={loadVisits}
            disabled={isLoadingQueue}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs"
            title="รีเฟรชคิวผู้ป่วย"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold"
              : "bg-red-50 border-red-200 text-red-900 font-semibold"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-VIEW TABS: QUEUE vs. CHART vs. TRIAGED HISTORY                    */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveView("queue")}
          className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeView === "queue"
              ? "bg-[#5f7c44] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>คิวรอคัดกรอง ({filteredClinicQueue.length} คน)</span>
        </button>

        {selectedVisit && (
          <button
            type="button"
            onClick={() => setActiveView("chart")}
            className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeView === "chart"
                ? "bg-[#5f7c44] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>แผ่นชาร์ตคนไข้: {selectedVisit.patientName}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveView("triaged_history")}
          className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeView === "triaged_history"
              ? "bg-[#5f7c44] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>คัดกรองเสร็จแล้ววันนี้ ({triagedHistory.length} คน)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: WAITING QUEUE LIST (ตารางคิวรอคัดกรองเฉพาะคลินิก - ADR 0006)         */}
      {/* ========================================================================= */}
      {activeView === "queue" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4 animate-fadeIn">
          {/* Controls: Search and Inflow Type */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="ค้นหาในคิวด้วยชื่อผู้ป่วย, HN, หรือเลขคิว..."
                className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={queueFilterType}
                onChange={(e) => setQueueFilterType(e.target.value)}
                className="text-xs border rounded-xl px-3 py-2 bg-white font-semibold text-gray-700"
              >
                <option value="all">ทุกประเภทผู้ป่วย ({filteredClinicQueue.length})</option>
                <option value="walk_in">ทั่วไป (Walk-in)</option>
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
                  <th className="px-4 py-3">คิว</th>
                  <th className="px-4 py-3">HN / VN</th>
                  <th className="px-4 py-3">ชื่อ-นามสกุล ผู้ป่วย</th>
                  <th className="px-4 py-3">ประเภทขาเข้า</th>
                  <th className="px-4 py-3">อาการสำคัญ (Chief Complaint)</th>
                  <th className="px-4 py-3">เวลารับบัตร</th>
                  <th className="px-4 py-3 text-right">เรียกคัดกรอง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedQueue.length > 0 ? (
                  sortedQueue.map((item) => {
                    const isFastTrack = item.fastTrackFlag || item.triageLevel === "emergency";

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isFastTrack
                            ? "bg-red-50/60 hover:bg-red-100/70"
                            : "hover:bg-olive-50/40"
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono font-black text-sm text-[#4e6737]">
                          <div className="flex items-center gap-1.5">
                            {isFastTrack && (
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                            )}
                            <span>{item.queueNumber}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono">
                          <span className="font-bold text-gray-900 block">{formatHnDisplay(item.hn)}</span>
                          <span className="text-[11px] text-gray-400">{formatVnDisplay(item.vn)}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900">{item.patientName}</div>
                          <div className="text-[11px] text-gray-500">
                            {item.gender === "M" ? "ชาย" : "หญิง"} ({item.age} ปี)
                          </div>
                          {item.allergies && item.allergies !== "ปฏิเสธประวัติแพ้ยา" && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                              ⚠️ แพ้ยา: {item.allergies}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {item.inflowType === "appointment" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              📅 มีนัดตรวจ
                            </span>
                          ) : item.inflowType === "referral" ? (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 block mb-0.5">
                                🔁 ส่งตัว รพ.อื่น
                              </span>
                              <span className="text-[10px] text-gray-400 block truncate max-w-[130px]">
                                {item.referringHospital || "หนังสือส่งตัว"}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                              Walk-in
                            </span>
                          )}

                          {isFastTrack && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white animate-pulse">
                              🚨 FAST-TRACK
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-gray-700 font-medium max-w-xs truncate">
                          {item.chiefComplaint || "-"}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-gray-500">
                          {new Date(item.registeredAt).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          น.
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleCallPatient(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>เรียกคัดกรอง ➔</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      ไม่พบผู้ป่วยรอคัดกรองใน {selectedClinic}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: SINGLE-SHEET ELECTRONIC OPD CARD (ADR 0007 & ADR 0008)            */}
      {/* ========================================================================= */}
      {activeView === "chart" && !selectedVisit && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-4 animate-fadeIn shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-olive-50 text-[#5f7c44] flex items-center justify-center mx-auto border border-olive-200">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900">ยังไม่ได้เลือกผู้ป่วยเพื่อเปิดแผ่นชาร์ต</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              กรุณากดปุ่ม "เรียกคัดกรอง" จากตารางคิวรอคัดกรอง เพื่อเปิดแผ่นชาร์ตสัญญาณชีพของผู้ป่วยรายนั้น
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView("queue")}
            className="px-5 py-2.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>ไปที่ตารางคิวรอคัดกรอง</span>
          </button>
        </div>
      )}

      {activeView === "chart" && selectedVisit && (
        <div className="space-y-4 animate-fadeIn">
          {/* PERSISTENT PATIENT SUMMARY BANNER (เหมือน รพ.พระนั่งเกล้า) */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 shadow-lg space-y-3">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-500 font-bold shrink-0 shadow-xs relative overflow-hidden">
                  <User className="w-8 h-8 text-slate-400" />
                  <span className="absolute bottom-0 inset-x-0 bg-[#5f7c44] text-[8px] text-white text-center font-bold py-0.5">
                    OPD
                  </span>
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {selectedVisit.patientName}
                    </h2>
                    <span className="text-xs font-mono font-bold bg-[#5f7c44]/10 text-[#465d31] px-2 py-0.5 rounded-md border border-[#5f7c44]/20">
                      HN: {formatHnDisplay(selectedVisit.hn)}
                    </span>
                    <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                      {formatVnDisplay(selectedVisit.vn)} (คิว {selectedVisit.queueNumber})
                    </span>
                    <span className="text-xs text-slate-500">
                      {selectedVisit.gender === "M" ? "ชาย" : "หญิง"} • อายุ <strong>{selectedVisit.age} ปี</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span>คลินิก: <strong>{selectedVisit.clinicName}</strong></span>
                    <span>• สิทธิ์: <strong className="text-[#5f7c44]">{selectedVisit.insuranceScheme || "Universal Coverage"}</strong></span>
                  </div>

                  {/* Safety & Allergy Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs font-black bg-red-600 text-white px-2.5 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Allergy: {selectedVisit.allergies || "ปฏิเสธประวัติแพ้ยา"}</span>
                    </span>

                    {/* Quick Peek Drawer Button */}
                    <button
                      type="button"
                      onClick={() => setIsDemographicsDrawerOpen(!isDemographicsDrawerOpen)}
                      className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 border border-slate-300 transition-all ml-1"
                    >
                      <MapPin className="w-3 h-3 text-[#5f7c44]" />
                      <span>{isDemographicsDrawerOpen ? "ย่อที่อยู่/เวชระเบียน ▲" : "ดูที่อยู่ & ข้อมูลเวชระเบียน ▾"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Realtime Vital Snapshot */}
              <div className="w-full lg:w-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 text-right space-y-1 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono block">สรุปสัญญาณชีพล่าสุด:</span>
                <div className="font-mono text-xs font-bold text-slate-800 flex flex-wrap items-center justify-between lg:justify-end gap-x-3 gap-y-0.5">
                  <span>BW: <strong className="text-slate-900">{bw || "-"} kg</strong></span>
                  <span>H: <strong className="text-slate-900">{ht || "-"} cm</strong></span>
                  <span>BMI: <strong className="text-[#5f7c44]">{calculatedBmi || "-"}</strong></span>
                  <span>BP: <strong className={fastTrackAlert?.triggered ? "text-red-600 font-black" : "text-slate-900"}>{sbp || "-"}/{dbp || "-"}</strong></span>
                  <span>PR: <strong className="text-slate-900">{pr || "-"} /min</strong></span>
                  <span>T: <strong className="text-slate-900">{temp || "-"} °C</strong></span>
                  <span>SpO2: <strong className="text-emerald-700">{spo2 || "-"}%</strong></span>
                </div>
              </div>
            </div>

            {/* Expandable Demographics Drawer (ข้อมูลเวชระเบียนที่ซักไว้) */}
            {isDemographicsDrawerOpen && (
              <div className="p-4 bg-olive-50/60 rounded-2xl border-2 border-olive-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-olive-200/80">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#5f7c44]" />
                    <span>ข้อมูลทะเบียนประวัติ & ที่อยู่ผู้ป่วย (ซักจากเวชระเบียน)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">เวชระเบียนตรวจสอบแล้ว</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-olive-200 space-y-1 sm:col-span-2">
                    <span className="text-gray-500 text-[11px] font-bold block">ที่อยู่ตามทะเบียนบ้าน/ที่พักอาศัย:</span>
                    <p className="font-bold text-gray-900">{selectedVisit.patientName ? "123 ถ.มิตรภาพ ต.ปากช่อง อ.ปากช่อง จ.นครราชสีมา 30130" : "-"}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-olive-200 space-y-1">
                    <span className="text-gray-500 text-[11px] font-bold block">ผู้ติดต่อฉุกเฉิน / ญาติ:</span>
                    <p className="font-bold text-gray-900">{selectedVisit.emergencyContact || "ญาติสายตรง (โทร 089-xxx-xxxx)"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fast-Track Emergency Pulsing Banner if triggered (ADR 0008) */}
          {fastTrackAlert?.triggered && (
            <div className="p-4 rounded-2xl bg-red-100 border-2 border-red-500 text-red-950 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                    🚨 FAST-TRACK PRIORITY ESCALATION
                  </span>
                  <p className="text-xs font-bold mt-1">
                    ตรวจพบสัญญาณชีพวิกฤต: <span className="underline font-black text-sm">{fastTrackAlert.reason}</span>
                  </p>
                </div>
              </div>
              <span className="text-xs font-black bg-white text-red-700 px-3 py-1.5 rounded-xl border border-red-300 shadow-xs shrink-0">
                ยกระดับเป็นคิวฉุกเฉินอัตโนมัติ
              </span>
            </div>
          )}

          {/* CORE VITALS SINGLE-SHEET CARD (ADR 0007) */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 shadow-xl space-y-6">
            {/* Vitals Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 border-2 border-blue-600 px-2 py-0.5 rounded-lg -rotate-1">
                    VITAL SIGNS • จุดคัดกรอง
                  </span>
                  <span className="text-xs font-bold text-gray-800">
                    สัญญาณชีพหลัก (คลิกพิมพ์ตัวเลขในช่องได้โดยตรง)
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  คำนวณ BMI และประเมินค่าวิกฤตอัตโนมัติ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                {/* BW */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">น้ำหนัก (BW)</span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      step="0.1"
                      value={bw}
                      onChange={(e) => setBw(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      placeholder="54.0"
                      className="w-16 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">kg</span>
                  </div>
                  <span className="text-[10px] text-gray-400">ชั่งล่าสุด</span>
                </div>

                {/* HT */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">ส่วนสูง (HT)</span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      value={ht}
                      onChange={(e) => setHt(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      placeholder="160"
                      className="w-16 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">cm</span>
                  </div>
                  <span className="text-[10px] text-gray-400">วัดล่าสุด</span>
                </div>

                {/* Auto BMI */}
                <div className="p-3 rounded-2xl bg-olive-50/60 border border-olive-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-[#4e6737]">ดัชนี BMI</span>
                  <div className="my-1">
                    <span className="font-mono font-black text-xl text-[#36452a]">
                      {calculatedBmi || "-"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {bmiLabel || "รอคำนวณ"}
                  </span>
                </div>

                {/* BP */}
                <div
                  className={`p-3 rounded-2xl border flex flex-col justify-between col-span-2 sm:col-span-1 transition-all ${
                    typeof sbp === "number" && sbp >= 180
                      ? "bg-red-100 border-2 border-red-500"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[11px] font-bold text-gray-500">ความดัน (BP)</span>
                  <div className="flex items-baseline justify-center gap-0.5 my-1 font-mono font-black text-lg">
                    <input
                      type="number"
                      value={sbp}
                      onChange={(e) => setSbp(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="120"
                      className="w-11 text-center bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      type="number"
                      value={dbp}
                      onChange={(e) => setDbp(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="80"
                      className="w-11 text-center bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      typeof sbp === "number" && sbp >= 180 ? "text-red-700 font-black" : "text-emerald-700"
                    }`}
                  >
                    {typeof sbp === "number" && sbp >= 180 ? "⚠️ วิกฤต" : "ปกติ (mmHg)"}
                  </span>
                </div>

                {/* PR */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">ชีพจร (PR)</span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      value={pr}
                      onChange={(e) => setPr(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="80"
                      className="w-14 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">/min</span>
                  </div>
                  <span className="text-[10px] text-gray-400">สม่ำเสมอ</span>
                </div>

                {/* Temp */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">อุณหภูมิ (T)</span>
                  <div className="flex items-baseline justify-center gap-0.5 my-1">
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      placeholder="36.8"
                      className="w-14 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">°C</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {typeof temp === "number" && temp >= 37.5 ? "⚠️ มีไข้" : "ไม่มีไข้"}
                  </span>
                </div>

                {/* SpO2 */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">ออกซิเจน (SpO2)</span>
                  <div className="flex items-baseline justify-center gap-0.5 my-1">
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value === "" ? "" : parseInt(e.target.value))}
                      placeholder="98"
                      className="w-12 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {typeof spo2 === "number" && spo2 < 95 ? "⚠️ ต่ำ" : "ปกติ"}
                  </span>
                </div>
              </div>

              {/* Pain Score Bar */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-950">
                    📊 Pain Score (ระดับความปวด 0-10):
                  </span>
                  <span className="text-sm font-black font-mono bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-md">
                    {painScore} / 10
                  </span>
                  <span className="text-xs font-semibold text-amber-800">
                    {painScore === 0
                      ? "😀 ไม่ปวดเลย"
                      : painScore <= 3
                      ? "🙂 ปวดเล็กน้อย (Mild)"
                      : painScore <= 6
                      ? "😐 ปวดปานกลาง (Moderate)"
                      : "😭 ปวดรุนแรงมาก (Severe)"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setPainScore(score)}
                      className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                        painScore === score
                          ? "bg-amber-600 text-white scale-110 shadow-xs"
                          : "bg-white hover:bg-amber-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Specialized Measurements: Dynamic Add/Remove (ADR 0007) */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-xs font-bold text-gray-800">
                  ค่าตรวจวัดเฉพาะทางเพิ่มเติม (เพิ่ม ลบ แก้ไข ได้อิสระตามคลินิก)
                </span>
                <select
                  onChange={(e) => {
                    handleAddParam(e.target.value);
                    e.target.value = "";
                  }}
                  className="text-xs border rounded-xl px-3 py-1 bg-slate-50 text-gray-800 font-bold focus:outline-none cursor-pointer hover:bg-gray-100"
                >
                  <option value="">+ เพิ่มค่าตรวจวัดลงแผ่น...</option>
                  <option value="dtx">🩸 น้ำตาลปลายนิ้ว (DTX)</option>
                  <option value="waist">📏 เส้นรอบเอว (Waist)</option>
                  <option value="pregnancy">🤰 คัดกรองตั้งครรภ์/ให้นมบุตร</option>
                  <option value="gcs">🧠 ระดับความรู้สึกตัว (GCS)</option>
                  <option value="o2_device">💨 อุปกรณ์ออกซิเจน (O2 Support)</option>
                  <option value="head_circ">👶 เส้นรอบศีรษะเด็ก (Head Circ.)</option>
                  <option value="custom">✏️ กำหนดค่าตรวจวัดเอง (Custom)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {specializedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-start justify-between group hover:border-[#5f7c44] transition-all"
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <span className="text-[10px] text-gray-400 font-semibold block">{item.category}</span>
                      <span className="text-xs font-bold text-gray-800 block">{item.name}</span>
                      <div className="flex items-baseline gap-1 pt-0.5">
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) =>
                            setSpecializedItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, value: e.target.value } : i))
                            )
                          }
                          className="bg-transparent border-b border-dashed border-gray-400 text-xs font-bold text-gray-900 focus:outline-none focus:bg-white px-1 w-full"
                        />
                        {item.unit && <span className="text-[10px] text-gray-400 font-bold">{item.unit}</span>}
                      </div>
                      {item.statusBadge && (
                        <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                          {item.statusBadge}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveParam(item.id)}
                      className="text-gray-400 hover:text-red-500 text-xs p-1 rounded-lg hover:bg-red-50"
                      title="ลบรายการนี้ออกจากแผ่น"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nursing Notes & Handover Destination (ADR 0008) */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  อาการสำคัญ & ประวัติเจ็บป่วยปัจจุบัน (Chief Complaint & Present Illness):
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-gray-900 p-2.5 rounded-xl border border-dashed border-gray-300 focus:border-[#5f7c44] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    ระดับความเร่งด่วนทางคลินิก (Triage Category):
                  </label>
                  <select
                    value={triageUrgency}
                    onChange={(e) => setTriageUrgency(e.target.value as any)}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-semibold text-gray-800"
                  >
                    <option value="routine">ระดับ 4-5: ผู้ป่วยทั่วไป ไม่เร่งด่วน (Routine - เขียว)</option>
                    <option value="urgent">ระดับ 3: เร่งด่วนปานกลาง (Urgent - สีเหลือง)</option>
                    <option value="emergency">ระดับ 1-2: ฉุกเฉินวิกฤต (Emergency / Fast-Track - สีส้ม/แดง)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    รูปแบบการส่งต่อคิวเข้าห้องตรวจ (Hybrid Dispatch - ADR 0008):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDispatchType("pooled_clinic")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        dispatchType === "pooled_clinic"
                          ? "bg-[#5f7c44] text-white border-[#5f7c44] shadow-xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      🏥 คิวกลางคลินิก
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispatchType("specific_room")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        dispatchType === "specific_room"
                          ? "bg-[#5f7c44] text-white border-[#5f7c44] shadow-xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      🚪 ระบุห้องตรวจ
                    </button>
                  </div>
                </div>
              </div>

              {dispatchType === "specific_room" && (
                <div className="p-3 bg-olive-50 rounded-xl border border-olive-200 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-[#465d31] mb-1">
                    เลือกห้องตรวจแพทย์ใน {selectedVisit.clinicName}:
                  </label>
                  <select
                    value={selectedRoomNumber}
                    onChange={(e) => setSelectedRoomNumber(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2 bg-white font-bold text-gray-900"
                  >
                    {(clinicExamRooms[selectedVisit.clinicName] || [
                      { room: "101", doctor: "แพทย์เวรประจำวัน" },
                    ]).map((r) => (
                      <option key={r.room} value={r.room}>
                        ห้องตรวจ {r.room}: {r.doctor}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Handover Button */}
            <div className="pt-4 border-t-2 border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-600 gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5f7c44]" />
                <span>
                  ผู้บันทึกสัญญาณชีพ: <strong>{user?.fullName || "พว. มาลี มีสุข (RN)"}</strong> • รหัส {user?.staffId || "STF-68-0245"} ({user?.licenseNumber || "พย.11029845"})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView("queue")}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
                >
                  ย้อนกลับ
                </button>

                <button
                  type="button"
                  onClick={handleHandoverToDoctor}
                  className="px-6 py-2.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white font-bold text-xs shadow-md shadow-[#5f7c44]/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกสัญญาณชีพ & ส่งตรวจแพทย์ ➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW C: TRIAGED HISTORY TODAY (คนไข้ที่คัดกรองเสร็จแล้ววันนี้)             */}
      {/* ========================================================================= */}
      {activeView === "triaged_history" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                ประวัติการคัดกรองสัญญาณชีพวันนี้ (Triaged Patients History)
              </h2>
              <span className="text-xs text-gray-400">
                รายชื่อผู้ป่วยที่ผ่านการวัดสัญญาณชีพและส่งต่อไปยังห้องตรวจแพทย์แล้ว
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">เวลาคัดกรอง</th>
                  <th className="px-4 py-3">คิว</th>
                  <th className="px-4 py-3">HN / VN</th>
                  <th className="px-4 py-3">ชื่อ-สกุล</th>
                  <th className="px-4 py-3">สัญญาณชีพสรุป</th>
                  <th className="px-4 py-3">ห้องตรวจปลายทาง</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {triagedHistory.length > 0 ? (
                  triagedHistory.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-500">{h.triagedAt || "วันนี้"}</td>
                      <td className="px-4 py-3 font-mono font-black text-[#5f7c44]">{h.queueNumber}</td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-gray-900 block">{formatHnDisplay(h.hn)}</span>
                        <span className="text-[10px] text-gray-400">{formatVnDisplay(h.vn)}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{h.patientName}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                        BP: {h.triagedVitals?.sbp}/{h.triagedVitals?.dbp} • PR: {h.triagedVitals?.pr} • T: {h.triagedVitals?.temp}°C
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-800">{h.targetRoom || "คิวกลาง"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          คัดกรองแล้ว
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      ยังไม่มีประวัติการคัดกรองในรอบเวรนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NurseDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-400">กำลังโหลดระบบงานพยาบาล...</div>}>
      <NurseWorkstationContent />
    </Suspense>
  );
}
