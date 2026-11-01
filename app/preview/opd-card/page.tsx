"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Edit3,
  FileCheck,
  FileSearch,
  FileText,
  Filter,
  FlaskConical,
  HeartPulse,
  Layers,
  LineChart,
  LogOut,
  MapPin,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Tag,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";

interface AssessmentItem {
  id: string;
  category: string;
  name: string;
  value: string;
  unit: string;
  statusBadge?: string;
  isCustom?: boolean;
}

interface NurseCarePlan {
  id: string;
  problem: string;
  intervention: string[];
  evaluation: string;
  nurseName: string;
  time: string;
}

interface LabResultRow {
  id: string;
  testName: string;
  category: string;
  resultValue: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
  status: "Final" | "Preliminary" | "Pending";
  sampleType: string;
  time: string;
}

interface DoctorOrderItem {
  id: string;
  orderType: "one_day" | "continue";
  title: string;
  details: string;
  orderedBy: string;
  orderedAt: string;
  status: "pending" | "done";
}

export default function AllInOnePatientChartPrototype() {
  // Navigation Tab State (Inspired by Phra Nang Klao Hospital's DEV web framework)
  const [activeTab, setActiveTab] = useState<
    "demographics" | "opd_card" | "nurse_plan" | "vital_chart" | "lab_enquiry" | "doctor_orders" | "soap_notes"
  >("opd_card");

  // Expandable In-Banner Demographics Drawer
  const [isBannerDemographicsOpen, setIsBannerDemographicsOpen] = useState(false);

  // Core Vitals State (Inline Editable)
  const [bw, setBw] = useState<number>(54.0);
  const [ht, setHt] = useState<number>(160);
  const [sbp, setSbp] = useState<number>(120);
  const [dbp, setDbp] = useState<number>(80);
  const [pr, setPr] = useState<number>(80);
  const [temp, setTemp] = useState<number>(36.8);
  const [rr, setRr] = useState<number>(18);
  const [spo2, setSpo2] = useState<number>(98);
  const [painScore, setPainScore] = useState<number>(2);

  // Chief complaint and triage
  const [chiefComplaint, setChiefComplaint] = useState(
    "มาตามนัดตรวจติดตามอาการไทรอยด์เป็นพิษ เจาะเลือดดูระดับฮอร์โมน FT4/TSH และรับคำปรึกษาการกลืนแร่รังสี I-131"
  );
  const [triageUrgency, setTriageUrgency] = useState("4");
  const [assignedRoom, setAssignedRoom] = useState("101");
  const [allergyText, setAllergyText] = useState("Penicillin (ผื่นคัน แน่นหน้าอก, บวมแดง)");

  // Additional dynamic assessments
  const [additionalItems, setAdditionalItems] = useState<AssessmentItem[]>([
    {
      id: "dtx",
      category: "เมตาบอลิซึม & เบาหวาน",
      name: "🩸 น้ำตาลปลายนิ้ว (DTX)",
      value: "118",
      unit: "mg/dL",
      statusBadge: "งดอาหาร 8 ชม.",
    },
    {
      id: "preg",
      category: "รังสีวิทยา & สุขภาพสตรี",
      name: "🤰 คัดกรองตั้งครรภ์/ให้นม (รังสี)",
      value: "ปฏิเสธการตั้งครรภ์/ให้นม (LMP: 14 ต.ค. 68)",
      unit: "",
      statusBadge: "ผ่านการคัดกรอง",
    },
    {
      id: "gcs",
      category: "ระบบประสาทและความรู้สึกตัว",
      name: "🧠 ระดับความรู้สึกตัว (GCS)",
      value: "E4 V5 M6 (15 คะแนน)",
      unit: "",
      statusBadge: "Alert ปกติดี",
    },
  ]);

  // Tab 2: Nursing Care Plans (3 Columns matching S__17145864_0.jpg)
  const [carePlans, setCarePlans] = useState<NurseCarePlan[]>([
    {
      id: "plan-1",
      problem: "ไม่สุขสบายเนื่องจากปวดศีรษะและตึงกล้ามเนื้อต้นคอ (Pain Score 4 คะแนน, ผู้ป่วยแสดงสีหน้าคิ้วขมวด)",
      intervention: [
        "ประเมินระดับความปวดทุก 2-4 ชั่วโมง",
        "จัดท่าพักผ่อนในสิ่งแวดล้อมที่เงียบสงบ แสงสว่างพอเหมาะ",
        "ดูแลให้รับประทานยาแก้ปวด Paracetamol (500mg) ตามแผนการรักษา",
        "สอนเทคนิคผ่อนคลายกล้ามเนื้อและการหายใจช้าๆ",
      ],
      evaluation: "ผู้ป่วยแจ้งอาการปวดทุเลาลง Pain score ลดลงเหลือ 2 คะแนน นอนหลับพักผ่อนได้",
      nurseName: "พว. มาลี มีสุข (RN)",
      time: "09:30 น.",
    },
    {
      id: "plan-2",
      problem: "มีความวิตกกังวลเกี่ยวกับขั้นตอนการกลืนแร่รังสีไอโอดีน-131 และผลข้างเคียง",
      intervention: [
        "ประเมินระดับความวิตกกังวลและเปิดโอกาสให้ผู้ป่วยซักถามข้อสงสัย",
        "อธิบายขั้นตอนการกลืนแร่รังสี I-131 และการปฏิบัติตัวป้องกันรังสีต่อคนในครอบครัว",
        "มอบแผ่นพับสุขศึกษาเรื่องการเตรียมตัวก่อนกลืนแร่และการงดอาหารไอโอดีน",
      ],
      evaluation: "ผู้ป่วยเข้าใจขั้นตอนการรักษา คลายความวิตกกังวล สีหน้าผ่อนคลายและให้ความร่วมมือดี",
      nurseName: "พว. ปรียา รังสีบริรักษ์ (RN)",
      time: "10:15 น.",
    },
  ]);

  // Tab 4: Lab Results Enquiry (Matching S__17145873_0.jpg & S__17145874_0.jpg with Red Abnormal Flags)
  const [labSearchFilter, setLabSearchFilter] = useState("all");
  const [labResults] = useState<LabResultRow[]>([
    {
      id: "lab-01",
      testName: "Free T4 (FT4)",
      category: "Thyroid Profile",
      resultValue: "2.45",
      unit: "ng/dL",
      refRange: "0.89 - 1.76",
      isAbnormal: true, // Red Highlight
      status: "Final",
      sampleType: "Serum Blood",
      time: "08:45 น.",
    },
    {
      id: "lab-02",
      testName: "TSH (Thyroid Stimulating Hormone)",
      category: "Thyroid Profile",
      resultValue: "0.01",
      unit: "uIU/mL",
      refRange: "0.35 - 4.94",
      isAbnormal: true, // Red Highlight (Suppressed)
      status: "Final",
      sampleType: "Serum Blood",
      time: "08:45 น.",
    },
    {
      id: "lab-03",
      testName: "WBC Count",
      category: "CBC (Hematology)",
      resultValue: "6.8",
      unit: "10^3/uL",
      refRange: "4.5 - 10.0",
      isAbnormal: false,
      status: "Final",
      sampleType: "EDTA Blood",
      time: "08:40 น.",
    },
    {
      id: "lab-04",
      testName: "Hemoglobin (Hb)",
      category: "CBC (Hematology)",
      resultValue: "13.2",
      unit: "g/dL",
      refRange: "12.0 - 15.5",
      isAbnormal: false,
      status: "Final",
      sampleType: "EDTA Blood",
      time: "08:40 น.",
    },
    {
      id: "lab-05",
      testName: "eGFR (CKD-EPI)",
      category: "Kidney Function (BUN/Cr)",
      resultValue: "92.4",
      unit: "mL/min/1.73m2",
      refRange: "> 90.0",
      isAbnormal: false,
      status: "Final",
      sampleType: "Serum Blood",
      time: "08:45 น.",
    },
    {
      id: "lab-06",
      testName: "Serum Potassium (K+)",
      category: "Electrolyte",
      resultValue: "3.2",
      unit: "mmol/L",
      refRange: "3.5 - 5.1",
      isAbnormal: true, // Low Potassium Alert
      status: "Final",
      sampleType: "Serum Blood",
      time: "08:45 น.",
    },
    {
      id: "lab-07",
      testName: "Serum Sodium (Na+)",
      category: "Electrolyte",
      resultValue: "139",
      unit: "mmol/L",
      refRange: "136 - 146",
      isAbnormal: false,
      status: "Final",
      sampleType: "Serum Blood",
      time: "08:45 น.",
    },
  ]);

  // Tab 5: Doctor Orders (Matching S__17145863_0.jpg with Green One-Day and Purple Continue Orders)
  const [doctorOrders, setDoctorOrders] = useState<DoctorOrderItem[]>([
    {
      id: "ord-1",
      orderType: "one_day",
      title: "One Day (คำสั่งทำวันนี้)",
      details: "เจาะเลือดตรวจซ้ำ Thyroid Profile (FT4, TSH, Thyroglobulin) ก่อนฟังผลสแกน",
      orderedBy: "นพ. ทวี ยิ่งสง่า (ว.33174)",
      orderedAt: "09:00 น.",
      status: "done",
    },
    {
      id: "ord-2",
      orderType: "one_day",
      title: "One Day (คำสั่งทำวันนี้)",
      details: "ประเมิน Vital Signs ซ้ำทุก 30 นาที หากใจสั่น หรือ BP > 140/90 รายงานแพทย์",
      orderedBy: "นพ. ทวี ยิ่งสง่า (ว.33174)",
      orderedAt: "09:05 น.",
      status: "pending",
    },
    {
      id: "ord-3",
      orderType: "continue",
      title: "Continue (คำสั่งการรักษาต่อเนื่อง)",
      details: "Propranolol (10 mg) 1 เม็ด รับประทานวันละ 2 ครั้ง เช้า-เย็น (คุมอาการใจสั่น)",
      orderedBy: "นพ. ทวี ยิ่งสง่า (ว.33174)",
      orderedAt: "09:10 น.",
      status: "pending",
    },
    {
      id: "ord-4",
      orderType: "continue",
      title: "Continue (คำสั่งการรักษาต่อเนื่อง)",
      details: "นัดติดตามคลินิกไทรอยด์เพื่อตรวจ Thyroid Uptake & Scan ในอีก 2 สัปดาห์",
      orderedBy: "นพ. ทวี ยิ่งสง่า (ว.33174)",
      orderedAt: "09:15 น.",
      status: "pending",
    },
  ]);

  // Tab 6: SOAP Progress Note (Matching S__17145860_0.jpg & S__17145868_0.jpg)
  const [soapData, setSoapData] = useState({
    subjective: "คนไข้มีอาการใจสั่น เหนื่อยง่าย เหงื่อออกมาก มือสั่นเล็กน้อย เป็นมา 2 สัปดาห์ น้ำหนักลดลง 2 กก. ทั้งที่รับประทานอาหารปกติ ปฏิเสธไข้ ปฏิเสธเจ็บแน่นหน้าอก",
    objective: "V/S stable, BP 120/80 mmHg, PR 80/min regular, Temp 36.8 C, Thyroid gland diffuse enlargement, soft, no tender bruit, eye signs: mild exophthalmos negative",
    assessment: "# Hyperthyroidism with toxic diffuse goiter (Graves' disease - E05.0) in follow-up",
    plan: "- Check FT4, TSH, eGFR today\n- Adjust Propranolol 10mg bid\n- Plan for Radioactive Iodine (I-131) therapy after thyroid scan\n- Advise low iodine diet",
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // BMI Calculation
  const bmi = bw > 0 && ht > 0 ? (bw / Math.pow(ht / 100, 2)).toFixed(1) : "-";
  const bmiNumber = parseFloat(bmi);
  const bmiStatus =
    bmiNumber < 18.5
      ? { text: "น้ำหนักน้อย", color: "text-amber-600 bg-amber-50" }
      : bmiNumber <= 22.9
      ? { text: "สมส่วนปกติ", color: "text-emerald-700 bg-emerald-50" }
      : bmiNumber <= 24.9
      ? { text: "น้ำหนักเกิน", color: "text-amber-700 bg-amber-50" }
      : { text: "ภาวะอ้วน", color: "text-red-700 bg-red-50" };

  // BP Crisis alerts
  const isBpCrisis = sbp >= 180 || dbp >= 110;
  const isBpStage1 = sbp >= 140 || dbp >= 90;

  // Add Dynamic Parameter
  const handleAddParam = (type: string) => {
    if (!type) return;
    const newId = `item-${Date.now()}`;
    if (type === "waist") {
      setAdditionalItems((prev) => [
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
    } else if (type === "o2_device") {
      setAdditionalItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "ระบบทางเดินหายใจ",
          name: "💨 อุปกรณ์ออกซิเจน (O2 Support)",
          value: "Nasal Cannula 3 LPM",
          unit: "",
          statusBadge: "ใช้ออกซิเจน",
        },
      ]);
    } else if (type === "head_circ") {
      setAdditionalItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "กุมารเวชกรรม (เด็ก)",
          name: "👶 เส้นรอบศีรษะเด็ก (Head Circ.)",
          value: "42.5",
          unit: "cm",
          statusBadge: "ตามเกณฑ์",
        },
      ]);
    } else if (type === "custom") {
      const customTitle = window.prompt("ระบุชื่อค่าตรวจวัดใหม่ (เช่น ปริมาณปัสสาวะ, SpO2 หลังพ่นยา):");
      if (!customTitle?.trim()) return;
      setAdditionalItems((prev) => [
        ...prev,
        {
          id: newId,
          category: "รายการตรวจพิเศษเพิ่มเติม",
          name: `📌 ${customTitle.trim()}`,
          value: "ปกติ",
          unit: "",
          isCustom: true,
        },
      ]);
    }
  };

  const toggleOrderStatus = (id: string) => {
    setDoctorOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: o.status === "done" ? "pending" : "done" } : o))
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f4ec] font-sans text-slate-800 pb-12 select-none">
      {/* Top Navigation Bar: Hospital Branding & Prototype Context */}
      <header className="bg-[#5f7c44] text-white px-5 py-3 shadow-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
            <img src="/logo.png" alt="Hospital Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight text-white block">
                โรงพยาบาลมหาราชนครราชสีมา • Single Patient View (All-in-One EMR)
              </span>
              <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full">
                แนวทางอ้างอิง: รพ.พระนั่งเกล้า DEV Framework
              </span>
            </div>
            <span className="text-[10px] text-olive-100 block">
              ระบบศูนย์รวมข้อมูลผู้ป่วยครบวงจรในจอเดียว ไม่ต้องเปิดสลับหน้า
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/registrar"
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>กลับสู่หน้าเวชระเบียน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-3">
        {/* ========================================================================= */}
        {/* PERSISTENT PATIENT SUMMARY BANNER (เหมือน รพ.พระนั่งเกล้า S__17145860)       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border-2 border-slate-300 p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left: Avatar + Identity + Safety Badges */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-500 font-bold shrink-0 shadow-xs relative overflow-hidden">
                <User className="w-8 h-8 text-slate-400" />
                <span className="absolute bottom-0 inset-x-0 bg-[#5f7c44] text-[8px] text-white text-center font-bold py-0.5">
                  OPD
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">
                    น.ส. วิภาดา เจริญพร
                  </h1>
                  <span className="text-xs font-mono font-bold bg-[#5f7c44]/10 text-[#465d31] px-2 py-0.5 rounded-md border border-[#5f7c44]/20">
                    HN: 68-0000002
                  </span>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                    VN: 01112568-0000002 (คิว A-02)
                  </span>
                  <span className="text-xs text-slate-500">
                    หญิง • อายุ <strong>32 ปี 2 เดือน</strong> (วันเกิด: 25 ก.ย. 2536)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>คลินิก: <strong>เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์ / ห้อง 101)</strong></span>
                  <span>• สิทธิ์: <strong className="text-[#5f7c44]">ประกันสังคม (รพช.ธัญบุรี)</strong></span>
                  <span>• สัญชาติ: <strong>ไทย</strong></span>
                </div>

                {/* Safety Badges Strip (Allergy Red Badge, Pre-caution, Chronic) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-black bg-red-600 text-white px-2.5 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Allergy: {allergyText}</span>
                  </span>
                  <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-md shadow-2xs">
                    Pre Caution: เฝ้าระวังใจสั่น / งดอาหารไอโอดีน
                  </span>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                    Chronic: ไทรอยด์เป็นพิษ (E05.0)
                  </span>

                  {/* Toggle Button for Quick Demographics / Address Peek */}
                  <button
                    type="button"
                    onClick={() => setIsBannerDemographicsOpen(!isBannerDemographicsOpen)}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 border border-slate-300 transition-all ml-1"
                    title="คลิกเพื่อเปิดดูที่อยู่ เบอร์โทร ญาติฉุกเฉิน และข้อมูลที่ซักไว้จากเวชระเบียน"
                  >
                    <MapPin className="w-3 h-3 text-[#5f7c44]" />
                    <span>{isBannerDemographicsOpen ? "ย่อที่อยู่/เวชระเบียน ▲" : "ดูที่อยู่ & ข้อมูลเวชระเบียน ▾"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Quick Vitals Snapshot + Initial Diagnosis */}
            <div className="w-full lg:w-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 text-right space-y-1 shrink-0">
              <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between lg:justify-end gap-3">
                <span className="text-left font-bold text-red-700">
                  การวินิจฉัยแรกรับ: Hyperthyroidism with toxic goiter (E05.0)
                </span>
                <span className="font-mono text-slate-500">สัญญาณชีพ ณ จุดคัดกรอง:</span>
              </div>
              <div className="font-mono text-xs font-bold text-slate-800 flex flex-wrap items-center justify-between lg:justify-end gap-x-3 gap-y-0.5">
                <span>BW: <strong className="text-slate-900">{bw} kg</strong></span>
                <span>H: <strong className="text-slate-900">{ht} cm</strong></span>
                <span>BMI: <strong className="text-[#5f7c44]">{bmi}</strong></span>
                <span>BP: <strong className={isBpCrisis ? "text-red-600 font-black" : "text-slate-900"}>{sbp}/{dbp} mmHg</strong></span>
                <span>PR: <strong className="text-slate-900">{pr} /min</strong></span>
                <span>T: <strong className="text-slate-900">{temp} °C</strong></span>
                <span>O2Sat: <strong className="text-emerald-700">{spo2}%</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Expandable Demographics & Intake Details (ข้อมูลที่ซักตอนเวชระเบียน) */}
          {isBannerDemographicsOpen && (
            <div className="p-4 bg-olive-50/60 rounded-2xl border-2 border-olive-200 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-olive-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5f7c44]" />
                  <span className="text-xs font-black text-slate-900">
                    ข้อมูลทะเบียนประวัติ & ข้อมูลที่ซักไว้จากเวชระเบียน (Demographic Intake Record)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  บันทึกเมื่อ: 1 พ.ย. 2568 08:30 น. (โต๊ะเวชระเบียน 01)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Address */}
                <div className="p-3 bg-white rounded-xl border border-olive-200/80 lg:col-span-2 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#5f7c44]" />
                    <span>ที่อยู่ตามทะเบียนบ้าน / ที่พักอาศัยปัจจุบัน:</span>
                  </span>
                  <p className="font-bold text-slate-900 text-sm leading-relaxed">
                    123 ถ.มิตรภาพ ต.ปากช่อง อ.ปากช่อง จ.นครราชสีมา 30130
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    ✓ ที่อยู่ปกติในเขตจังหวัดนครราชสีมา
                  </span>
                </div>

                {/* National ID & Phone */}
                <div className="p-3 bg-white rounded-xl border border-olive-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 block">เลขประจำตัวประชาชน (CID):</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">3101400876541</p>
                  <div className="pt-1 text-[11px] text-slate-600">
                    เบอร์โทรศัพท์: <strong className="font-mono text-slate-900">089-876-5432</strong>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3 bg-white rounded-xl border border-olive-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#5f7c44]" />
                    <span>ผู้ติดต่อฉุกเฉิน / ญาติ:</span>
                  </span>
                  <p className="font-bold text-slate-900">นาย สมพร เจริญพร</p>
                  <div className="text-[11px] text-slate-600">
                    ความสัมพันธ์: <strong>บิดา</strong> • โทร: <strong className="font-mono text-slate-900">089-111-3344</strong>
                  </div>
                </div>

                {/* Insurance & Authen Code */}
                <div className="p-3 bg-white rounded-xl border border-olive-200/80 space-y-1 lg:col-span-2">
                  <span className="text-[11px] font-bold text-slate-500 block">สิทธิการรักษา & การส่งต่อ (Referral):</span>
                  <p className="font-bold text-slate-900">
                    ประกันสังคม (Social Security) • รพ.ต้นสังกัด: <strong>รพช.ธัญบุรี</strong>
                  </p>
                  <div className="text-[11px] text-purple-900 font-semibold">
                    มีหนังสือส่งตัวเลขที่: <span className="font-mono font-bold">TH-REF-68/1092</span> (ส่งตรวจแผนกเวชศาสตร์นิวเคลียร์)
                  </div>
                </div>

                {/* Financial Debt Status */}
                <div className="p-3 bg-white rounded-xl border border-olive-200/80 space-y-1 lg:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">สถานะการเงิน & ยอดค้างชำระเดิม:</span>
                    <span className="text-sm font-black text-red-600 font-mono">
                      มียอดค้างชำระเดิม: 850.00 บาท
                    </span>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-lg">
                    แจ้งห้องการเงินแล้ว
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* QUICK MODULE TABS (แถบสลับดูข้อมูลคนไข้ทุกมิติในหน้าเดียว)                      */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-1.5 border-t border-slate-200 pt-3 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("demographics")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "demographics"
                  ? "bg-[#5f7c44] text-white shadow-md scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <User className="w-4 h-4" />
              <span>0. ข้อมูลทะเบียน & ที่อยู่</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("opd_card")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "opd_card"
                  ? "bg-[#5f7c44] text-white shadow-md scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>1. แผ่น OPD Card & สัญญาณชีพ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("nurse_plan")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "nurse_plan"
                  ? "bg-[#5f7c44] text-white shadow-md scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>2. แผนการพยาบาล (Nurse Assessment)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vital_chart")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "vital_chart"
                  ? "bg-[#5f7c44] text-white shadow-md scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>3. กราฟสัญญาณชีพ (Vital Sign Chart)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("lab_enquiry")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "lab_enquiry"
                  ? "bg-[#5f7c44] text-white shadow-md scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>4. ผลตรวจแล็บ (Lab Enquiry)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("doctor_orders")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "doctor_orders"
                  ? "bg-[#5f7c44] text-white shadow-md scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>5. คำสั่งการรักษา (Doctor Order)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("soap_notes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "soap_notes"
                  ? "bg-[#5f7c44] text-white shadow-md scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>6. บันทึกความก้าวหน้า (SOAP Notes)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 0: PATIENT DEMOGRAPHICS & INTAKE RECORD (ข้อมูลทะเบียนและที่อยู่เวชระเบียน) */}
        {/* ========================================================================= */}
        {activeTab === "demographics" && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#5f7c44]" />
                  <span>ข้อมูลทะเบียนประวัติผู้ป่วย & ที่อยู่ฉบับเต็ม (Patient Demographics & Registration Record)</span>
                </h3>
                <span className="text-xs text-gray-500">
                  ข้อมูลที่เจ้าหน้าที่เวชระเบียนซักประวัติและตรวจสอบไว้ ณ จุดเปิด Visit ครั้งแรก
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#4e6737] bg-olive-50 px-2.5 py-1 rounded-xl border border-olive-200">
                สถานะ: ยืนยันตัวตนเรียบร้อย
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Card 1: Identity & Legal Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-gray-900 text-xs block text-[#5f7c44] border-b pb-1">
                  1. ข้อมูลประจำตัวและเอกสารทางราชการ
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ประเภทเอกสาร:</span>
                    <span className="font-bold text-gray-900">บุคคลสัญชาติไทย (บัตรประชาชน 13 หลัก)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">เลขประจำตัวประชาชน (CID):</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">3-1014-00876-54-1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ชื่อ-นามสกุล:</span>
                    <span className="font-bold text-gray-900">น.ส. วิภาดา เจริญพร</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">เพศ / วันเกิด:</span>
                    <span className="font-semibold text-gray-800">หญิง • 25 ก.ย. 2536 (อายุ 32 ปี)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">สัญชาติ / ศาสนา / หมู่เลือด:</span>
                    <span className="font-semibold text-gray-800">ไทย • พุทธ • หมู่เลือด B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">เบอร์โทรศัพท์ผู้ป่วย:</span>
                    <span className="font-mono font-bold text-[#5f7c44] text-sm">089-876-5432</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Address & Residence */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-gray-900 text-xs block text-[#5f7c44] border-b pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>2. ที่อยู่ตามทะเบียนบ้าน & ที่พักอาศัยปัจจุบัน</span>
                </span>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500 block mb-0.5">ที่อยู่ฉบับสมบูรณ์ (ที่ซักไว้ตอนเวชระเบียน):</span>
                    <p className="font-bold text-gray-900 text-sm bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                      123 ถ.มิตรภาพ ต.ปากช่อง อ.ปากช่อง จ.นครราชสีมา 30130
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-gray-400 block text-[10px]">จังหวัด</span>
                      <strong className="text-gray-800">นครราชสีมา</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-gray-400 block text-[10px]">อำเภอ</span>
                      <strong className="text-gray-800">ปากช่อง</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-gray-400 block text-[10px]">ตำบล</span>
                      <strong className="text-gray-800">ปากช่อง</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-gray-400 block text-[10px]">รหัสไปรษณีย์</span>
                      <strong className="text-[#5f7c44] font-bold">30130</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Emergency Contact & Relative */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-gray-900 text-xs block text-[#5f7c44] border-b pb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>3. ข้อมูลผู้ติดต่อฉุกเฉิน / ญาติสายตรง</span>
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ชื่อ-นามสกุล ญาติ:</span>
                    <span className="font-bold text-gray-900 text-sm">นาย สมพร เจริญพร</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ความสัมพันธ์:</span>
                    <span className="font-bold text-gray-800 bg-white px-2 py-0.5 rounded border">บิดา (Father)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">เบอร์โทรศัพท์ติดต่อฉุกเฉิน:</span>
                    <span className="font-mono font-bold text-red-700 text-sm">089-111-3344</span>
                  </div>
                  <div className="pt-2 text-[11px] text-gray-500 italic">
                    * โรงพยาบาลสามารถโทรติดต่อเบอร์นี้ได้ทันทีในกรณีฉุกเฉินหรือผ่าตัดเร่งด่วน
                  </div>
                </div>
              </div>

              {/* Card 4: Insurance, Referral & Financial */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-gray-900 text-xs block text-[#5f7c44] border-b pb-1">
                  4. สิทธิการรักษาและการส่งต่อ (Referral & Claim)
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">สิทธิการรักษา:</span>
                    <span className="font-bold text-gray-900">ประกันสังคม (Social Security)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">สถานพยาบาลตามสิทธิ:</span>
                    <span className="font-bold text-gray-900">รพช.ธัญบุรี</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">หนังสือส่งตัว (Referral Doc):</span>
                    <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      TH-REF-68/1092
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ส่งตรวจคลินิก:</span>
                    <span className="font-bold text-[#5f7c44]">เวชศาสตร์นิวเคลียร์ (คลินิกไทรอยด์)</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-gray-500">ยอดค้างชำระเดิม:</span>
                    <span className="font-mono font-black text-red-600 text-sm">850.00 บาท (แจ้งการเงินแล้ว)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setActiveTab("opd_card")}
                className="px-5 py-2.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
              >
                <span>ไปที่แผ่น OPD Card & บันทึกสัญญาณชีพ ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ELECTRONIC OPD CARD (แผ่นกระดาษดิจิทัลผืนเดียว คลิกพิมพ์แก้ไขได้ตรงๆ)    */}
        {/* ========================================================================= */}
        {activeTab === "opd_card" && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            {/* Core Vitals Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 border-2 border-blue-600 px-2 py-0.5 rounded-lg -rotate-1">
                    VITAL SIGNS • จุดคัดกรอง
                  </span>
                  <span className="text-xs font-bold text-gray-800">
                    สัญญาณชีพหลัก (คลิกพิมพ์ตัวเลขในช่องเพื่อแก้ไขได้โดยตรง)
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  ระบบคำนวณ BMI และเตือนค่าวิกฤตอัตโนมัติ
                </span>
              </div>

              {/* Core Vitals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">น้ำหนัก (BW)</span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      step="0.1"
                      value={bw}
                      onChange={(e) => setBw(parseFloat(e.target.value) || 0)}
                      className="w-16 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">kg</span>
                  </div>
                  <span className="text-[10px] text-gray-400">ชั่งล่าสุด</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">ส่วนสูง (HT)</span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      value={ht}
                      onChange={(e) => setHt(parseFloat(e.target.value) || 0)}
                      className="w-16 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">cm</span>
                  </div>
                  <span className="text-[10px] text-gray-400">วัดล่าสุด</span>
                </div>

                <div className="p-3 rounded-2xl bg-olive-50/60 border border-olive-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-[#4e6737]">ดัชนี BMI</span>
                  <div className="my-1">
                    <span className="font-mono font-black text-xl text-[#36452a]">{bmi}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bmiStatus.color}`}>
                    {bmiStatus.text}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl border flex flex-col justify-between col-span-2 sm:col-span-1 transition-all ${
                    isBpCrisis
                      ? "bg-red-100 border-2 border-red-500 animate-pulse"
                      : isBpStage1
                      ? "bg-amber-50 border-amber-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[11px] font-bold text-gray-500">ความดัน (BP)</span>
                  <div className="flex items-baseline justify-center gap-0.5 my-1 font-mono font-black text-lg">
                    <input
                      type="number"
                      value={sbp}
                      onChange={(e) => setSbp(parseInt(e.target.value) || 0)}
                      className="w-11 text-center bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      type="number"
                      value={dbp}
                      onChange={(e) => setDbp(parseInt(e.target.value) || 0)}
                      className="w-11 text-center bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isBpCrisis ? "text-red-700 font-black" : isBpStage1 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {isBpCrisis ? "⚠️ วิกฤต (Crisis)" : isBpStage1 ? "ความดันสูง" : "ปกติ (mmHg)"}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">ชีพจร (PR)</span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      value={pr}
                      onChange={(e) => setPr(parseInt(e.target.value) || 0)}
                      className="w-14 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">/min</span>
                  </div>
                  <span className="text-[10px] text-gray-400">สม่ำเสมอ</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">อุณหภูมิ (T)</span>
                  <div className="flex items-baseline justify-center gap-0.5 my-1">
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(parseFloat(e.target.value) || 0)}
                      className="w-14 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">°C</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      temp >= 38.5 ? "text-red-600 font-black" : temp >= 37.5 ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    {temp >= 38.5 ? "⚠️ ไข้สูง" : temp >= 37.5 ? "มีไข้ต่ำ" : "ไม่มีไข้"}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-gray-500">ออกซิเจน (SpO2)</span>
                  <div className="flex items-baseline justify-center gap-0.5 my-1">
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(parseInt(e.target.value) || 0)}
                      className="w-12 text-center font-mono font-black text-lg bg-transparent border-b-2 border-dashed border-[#5f7c44]/40 focus:border-[#5f7c44] outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold">%</span>
                  </div>
                  <span className={`text-[10px] font-bold ${spo2 < 95 ? "text-red-600" : "text-emerald-600"}`}>
                    {spo2 < 95 ? "⚠️ ออกซิเจนต่ำ" : "ปกติ"}
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
                      : "😭 ปวดรุนแรง (Severe)"}
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

            {/* Dynamic Items (Specialized Measurements - Add / Delete / Edit) */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-xs font-bold text-gray-800">
                  ค่าตรวจวัดเฉพาะทางเพิ่มเติม (เพิ่ม ลบ แก้ไข ได้ทันที)
                </span>
                <select
                  onChange={(e) => {
                    handleAddParam(e.target.value);
                    e.target.value = "";
                  }}
                  className="text-xs border rounded-xl px-3 py-1 bg-slate-50 text-gray-800 font-bold focus:outline-none cursor-pointer hover:bg-gray-100"
                >
                  <option value="">+ เพิ่มค่าตรวจวัดลงแผ่น...</option>
                  <option value="waist">📏 เส้นรอบเอว (Waist)</option>
                  <option value="o2_device">💨 การให้ออกซิเจน (O2 Support)</option>
                  <option value="head_circ">👶 เส้นรอบศีรษะเด็ก (Head Circ.)</option>
                  <option value="custom">✏️ กำหนดค่าตรวจวัดเอง (Custom Item)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {additionalItems.map((item) => (
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
                            setAdditionalItems((prev) =>
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
                      onClick={() => setAdditionalItems((prev) => prev.filter((i) => i.id !== item.id))}
                      className="text-gray-400 hover:text-red-500 text-xs p-1 rounded-lg hover:bg-red-50"
                      title="ลบรายการนี้"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment & Handover */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  อาการสำคัญ (Chief Complaint - CC):
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
                    ระดับความเร่งด่วนทางคลินิก (Triage Urgency):
                  </label>
                  <select
                    value={triageUrgency}
                    onChange={(e) => setTriageUrgency(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-semibold text-gray-800"
                  >
                    <option value="5">ระดับ 5: ผู้ป่วยทั่วไป ไม่เร่งด่วน (Non-urgent - สีขาว/เขียว)</option>
                    <option value="4">ระดับ 4: กึ่งเร่งด่วน รอได้ (Semi-urgent - สีเขียว)</option>
                    <option value="3">ระดับ 3: เร่งด่วนปานกลาง (Urgent - สีเหลือง)</option>
                    <option value="2">ระดับ 2: ฉุกเฉินวิกฤต (Emergency - สีส้ม)</option>
                    <option value="1">ระดับ 1: ภาวะคุกคามชีวิตทันที (Resuscitation - สีแดง)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    ส่งเข้าห้องตรวจแพทย์ (Exam Room Destination):
                  </label>
                  <select
                    value={assignedRoom}
                    onChange={(e) => setAssignedRoom(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold text-[#5f7c44]"
                  >
                    <option value="101">ห้องตรวจ 101: นพ. ทวี ยิ่งสง่า (เวชศาสตร์นิวเคลียร์ / คลินิกไทรอยด์)</option>
                    <option value="102">ห้องตรวจ 102: พญ. นันทา บริรักษ์ (อายุรกรรมทั่วไป)</option>
                    <option value="103">ห้องตรวจ 103: แพทย์เวรประจำวัน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t-2 border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-600 gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5f7c44]" />
                <span>
                  ผู้บันทึกสัญญาณชีพ: <strong>พว. มาลี มีสุข (RN)</strong> • STF-68-0245 (ว. พย.11029845)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setToastMessage("ส่งต่อข้อมูล OPD Card เข้าสู่ห้องตรวจแพทย์ 101 สำเร็จ!");
                  setTimeout(() => setToastMessage(null), 3500);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white font-bold text-xs shadow-md shadow-[#5f7c44]/20 transition-all flex items-center gap-2"
              >
                <span>บันทึก & ส่งคิวเข้าห้องตรวจ {assignedRoom} ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NURSE ASSESSMENT TABLE (ตรงตามภาพ รพ.พระนั่งเกล้า S__17145864_0)       */}
        {/* ========================================================================= */}
        {activeTab === "nurse_plan" && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#5f7c44]" />
                  <span>แผนการพยาบาลและการประเมินผล (Nursing Assessment & Care Plan)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  โครงสร้าง 3 คอลัมน์มาตรฐาน: ปัญหาทางการพยาบาล ➔ กิจกรรมการพยาบาล ➔ การประเมินผล
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const prob = window.prompt("ระบุปัญหาทางการพยาบาล:");
                  if (!prob) return;
                  setCarePlans((prev) => [
                    ...prev,
                    {
                      id: `plan-${Date.now()}`,
                      problem: prob,
                      intervention: ["ประเมินสัญญาณชีพและติดตามอาการ", "ให้คำแนะนำและดูแลตามแผนการรักษา"],
                      evaluation: "ติดตามผลการรักษาต่อไป",
                      nurseName: "พว. มาลี มีสุข (RN)",
                      time: "10:30 น.",
                    },
                  ]);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#5f7c44] text-white text-xs font-bold hover:bg-[#4d6736] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มแผนการพยาบาล</span>
              </button>
            </div>

            {/* 3-Column Table like Phra Nang Klao Hospital */}
            <div className="overflow-x-auto border-2 border-slate-200 rounded-2xl">
              <table className="min-w-full divide-y-2 divide-slate-200 text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-1/3 border-r">1. การประเมินปัญหา (Assessment)</th>
                    <th className="px-4 py-3 w-1/3 border-r">2. กิจกรรมการพยาบาล (Intervention)</th>
                    <th className="px-4 py-3 w-1/3">3. การประเมินผล (Evaluation)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {carePlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      {/* Column 1: Assessment */}
                      <td className="px-4 py-3.5 border-r space-y-2 bg-emerald-50/20">
                        <div className="font-bold text-slate-900 leading-relaxed">
                          • {plan.problem}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          บันทึกโดย: {plan.nurseName} ({plan.time})
                        </div>
                      </td>

                      {/* Column 2: Intervention */}
                      <td className="px-4 py-3.5 border-r space-y-1.5">
                        <ul className="space-y-1 list-disc list-inside text-slate-700">
                          {plan.intervention.map((act, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {act}
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* Column 3: Evaluation */}
                      <td className="px-4 py-3.5 space-y-2 bg-amber-50/10">
                        <div className="font-bold text-emerald-800 leading-relaxed">
                          ✓ {plan.evaluation}
                        </div>
                        <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          บรรลุเป้าหมาย
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VITAL SIGN CHART (กราฟเส้นสัญญาณชีพย้อนหลังเหมือนรูป S__17145867_0)       */}
        {/* ========================================================================= */}
        {activeTab === "vital_chart" && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-blue-600" />
                  <span>กราฟแนวโน้มสัญญาณชีพ (Vital Sign Trend Chart)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  กราฟแสดงอุณหภูมิร่างกาย (เส้นแดง) ชีพจร (เส้นน้ำเงิน) และความดันโลหิตตามช่วงเวลา
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-red-600">
                  <span className="w-3 h-0.5 bg-red-600" />
                  <span>อุณหภูมิ (Temp °C)</span>
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-3 h-0.5 bg-blue-600" />
                  <span>ชีพจร (Pulse /min)</span>
                </span>
              </div>
            </div>

            {/* Visual SVG Chart Representation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto">
              <svg viewBox="0 0 700 220" className="w-full h-56 select-none font-mono">
                {/* Horizontal Grid lines */}
                <line x1="50" y1="30" x2="680" y2="30" stroke="#e2e8f0" strokeDasharray="3" />
                <line x1="50" y1="70" x2="680" y2="70" stroke="#e2e8f0" strokeDasharray="3" />
                <line x1="50" y1="110" x2="680" y2="110" stroke="#e2e8f0" strokeDasharray="3" />
                <line x1="50" y1="150" x2="680" y2="150" stroke="#e2e8f0" strokeDasharray="3" />
                <line x1="50" y1="190" x2="680" y2="190" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Y-Axis Labels */}
                <text x="40" y="35" textAnchor="end" fontSize="10" fill="#94a3b8">120 / 40°</text>
                <text x="40" y="75" textAnchor="end" fontSize="10" fill="#94a3b8">100 / 39°</text>
                <text x="40" y="115" textAnchor="end" fontSize="10" fill="#94a3b8">80 / 38°</text>
                <text x="40" y="155" textAnchor="end" fontSize="10" fill="#94a3b8">60 / 37°</text>
                <text x="40" y="195" textAnchor="end" fontSize="10" fill="#94a3b8">40 / 36°</text>

                {/* Pulse Blue Curve */}
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  points="100,110 200,105 300,85 400,90 500,115 600,110"
                />
                {/* Pulse Points */}
                <circle cx="100" cy="110" r="4" fill="#2563eb" />
                <circle cx="200" cy="105" r="4" fill="#2563eb" />
                <circle cx="300" cy="85" r="4" fill="#2563eb" />
                <circle cx="400" cy="90" r="4" fill="#2563eb" />
                <circle cx="500" cy="115" r="4" fill="#2563eb" />
                <circle cx="600" cy="110" r="4" fill="#2563eb" />

                {/* Temp Red Curve */}
                <polyline
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  points="100,158 200,155 300,140 400,148 500,160 600,158"
                />
                {/* Temp Points */}
                <circle cx="100" cy="158" r="4" fill="#dc2626" />
                <circle cx="200" cy="155" r="4" fill="#dc2626" />
                <circle cx="300" cy="140" r="4" fill="#dc2626" />
                <circle cx="400" cy="148" r="4" fill="#dc2626" />
                <circle cx="500" cy="160" r="4" fill="#dc2626" />
                <circle cx="600" cy="158" r="4" fill="#dc2626" />

                {/* X-Axis Time Points */}
                <text x="100" y="210" textAnchor="middle" fontSize="10" fill="#64748b">08:00 น.</text>
                <text x="200" y="210" textAnchor="middle" fontSize="10" fill="#64748b">08:30 น.</text>
                <text x="300" y="210" textAnchor="middle" fontSize="10" fill="#64748b">09:00 น.</text>
                <text x="400" y="210" textAnchor="middle" fontSize="10" fill="#64748b">09:30 น.</text>
                <text x="500" y="210" textAnchor="middle" fontSize="10" fill="#64748b">10:00 น.</text>
                <text x="600" y="210" textAnchor="middle" fontSize="10" fill="#64748b">ปัจจุบัน</text>
              </svg>
            </div>

            {/* Summary Data Table Under Chart (Matching Phra Nang Klao) */}
            <div className="overflow-x-auto border rounded-xl">
              <table className="min-w-full divide-y text-xs text-center font-mono">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">ช่วงเวลา</th>
                    <th className="px-3 py-2">08:00 น.</th>
                    <th className="px-3 py-2">08:30 น.</th>
                    <th className="px-3 py-2">09:00 น.</th>
                    <th className="px-3 py-2">09:30 น.</th>
                    <th className="px-3 py-2">10:00 น.</th>
                    <th className="px-3 py-2 font-bold text-[#5f7c44]">ปัจจุบัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800">
                  <tr>
                    <td className="px-3 py-2 text-left font-bold text-slate-600">ความดัน (BP mmHg)</td>
                    <td>135/85</td>
                    <td>130/82</td>
                    <td>145/92</td>
                    <td>138/88</td>
                    <td>125/80</td>
                    <td className="font-bold text-[#5f7c44]">{sbp}/{dbp}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-left font-bold text-blue-600">ชีพจร (Pulse /min)</td>
                    <td>82</td>
                    <td>84</td>
                    <td className="text-red-600 font-bold">102 (ใจสั่น)</td>
                    <td>94</td>
                    <td>82</td>
                    <td className="font-bold text-blue-600">{pr}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-left font-bold text-red-600">อุณหภูมิ (Temp °C)</td>
                    <td>36.7</td>
                    <td>36.8</td>
                    <td className="text-amber-600 font-bold">37.4</td>
                    <td>37.1</td>
                    <td>36.8</td>
                    <td className="font-bold text-red-600">{temp}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ALL LAB RESULTS ENQUIRY (ตรงตามภาพ รพ.พระนั่งเกล้า S__17145873)       */}
        {/* ========================================================================= */}
        {activeTab === "lab_enquiry" && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <span>ผลตรวจทางห้องปฏิบัติการ (All Lab Results Enquiry)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  ถอดแบบจากระบบ รพ.พระนั่งเกล้า: แสดงรายการแล็บ ค่าอ้างอิง และไฮไลต์สีแดงเมื่อผลตรวจผิดปกติ
                </span>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500">กรองแผนก:</span>
                <select
                  value={labSearchFilter}
                  onChange={(e) => setLabSearchFilter(e.target.value)}
                  className="border rounded-xl px-3 py-1.5 bg-slate-50 font-bold text-slate-800"
                >
                  <option value="all">ทุกรายการตรวจ ({labResults.length})</option>
                  <option value="Thyroid Profile">Thyroid Profile (ไทรอยด์)</option>
                  <option value="CBC (Hematology)">CBC (โลหิตวิทยา)</option>
                  <option value="Electrolyte">Electrolyte (เกลือแร่)</option>
                  <option value="Kidney Function (BUN/Cr)">Kidney (การทำงานของไต)</option>
                </select>
              </div>
            </div>

            {/* Lab Results Table with Red Highlights on Abnormal Values */}
            <div className="overflow-x-auto border-2 border-slate-200 rounded-2xl">
              <table className="min-w-full divide-y-2 divide-slate-200 text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="px-3.5 py-3">รายการตรวจ (Lab Test Name)</th>
                    <th className="px-3.5 py-3">หมวดหมู่</th>
                    <th className="px-3.5 py-3 text-right">ผลตรวจ (Result)</th>
                    <th className="px-3.5 py-3">หน่วย</th>
                    <th className="px-3.5 py-3">ค่าปกติอ้างอิง (Normal Range)</th>
                    <th className="px-3.5 py-3">สิ่งส่งตรวจ</th>
                    <th className="px-3.5 py-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-mono">
                  {labResults
                    .filter((row) => labSearchFilter === "all" || row.category === labSearchFilter)
                    .map((row) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          row.isAbnormal
                            ? "bg-red-50 hover:bg-red-100/70 font-black text-red-950"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <td className="px-3.5 py-2.5 font-sans font-bold flex items-center gap-1.5">
                          {row.isAbnormal && (
                            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="ค่าผิดปกติ (Abnormal)" />
                          )}
                          <span>{row.testName}</span>
                        </td>
                        <td className="px-3.5 py-2.5 font-sans text-slate-500">{row.category}</td>
                        <td className="px-3.5 py-2.5 text-right font-black text-sm">
                          <span
                            className={
                              row.isAbnormal
                                ? "bg-red-600 text-white px-2 py-0.5 rounded shadow-2xs"
                                : "text-slate-900"
                            }
                          >
                            {row.resultValue}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500">{row.unit}</td>
                        <td className="px-3.5 py-2.5 text-slate-600">{row.refRange}</td>
                        <td className="px-3.5 py-2.5 font-sans text-slate-500">{row.sampleType}</td>
                        <td className="px-3.5 py-2.5 text-center font-sans">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
              <span>* รายการที่มีแถบสีแดง หมายถึง ค่าตรวจเกินหรือต่ำกว่าเกณฑ์มาตรฐานที่แพทย์ต้องประเมิน</span>
              <span className="font-mono">อนุมัติผลโดย: ทนพ. กิตติ ชันสูตร (08:50 น.)</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DOCTOR ORDERS (ตรงตามภาพ รพ.พระนั่งเกล้า S__17145863 แยกเขียว/ม่วง)      */}
        {/* ========================================================================= */}
        {activeTab === "doctor_orders" && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-[#5f7c44]" />
                  <span>คำสั่งการรักษาของแพทย์ (Doctor Orders / Medication & Nursing Tasks)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  ถอดแบบ รพ.พระนั่งเกล้า: แยกกล่องคำสั่งวันเดียว (สีเขียว One Day) และคำสั่งต่อเนื่อง (สีม่วง Continue)
                </span>
              </div>

              <span className="text-xs font-mono text-slate-400">
                แพทย์ผู้สั่ง: นพ. ทวี ยิ่งสง่า (ว.33174)
              </span>
            </div>

            {/* Doctor Orders Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: One Day Orders (Green Box) */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <span className="text-xs font-black text-emerald-950 bg-emerald-200 px-2.5 py-0.5 rounded-md uppercase">
                    🟢 One Day (คำสั่งทำวันเดียว / หัตถการด่วน)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">พยาบาลติ๊กเมื่อทำเสร็จ</span>
                </div>

                <div className="space-y-2.5">
                  {doctorOrders
                    .filter((o) => o.orderType === "one_day")
                    .map((order) => (
                      <div
                        key={order.id}
                        onClick={() => toggleOrderStatus(order.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          order.status === "done"
                            ? "bg-white/80 border-emerald-300 opacity-60 line-through"
                            : "bg-white border-emerald-400 shadow-xs hover:border-emerald-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={order.status === "done"}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#5f7c44] accent-[#5f7c44] mt-0.5 pointer-events-none"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-slate-900">{order.details}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                            <span>สั่งโดย: {order.orderedBy}</span>
                            <span>{order.orderedAt}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Column: Continue Orders (Purple Box) */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border-2 border-purple-300 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                  <span className="text-xs font-black text-purple-950 bg-purple-200 px-2.5 py-0.5 rounded-md uppercase">
                    🟣 Continue (คำสั่งการรักษาต่อเนื่อง / ยาประจำ)
                  </span>
                  <span className="text-[11px] font-bold text-purple-800">ส่งข้อมูลเข้าห้องยา</span>
                </div>

                <div className="space-y-2.5">
                  {doctorOrders
                    .filter((o) => o.orderType === "continue")
                    .map((order) => (
                      <div
                        key={order.id}
                        className="p-3 bg-white rounded-xl border border-purple-200 shadow-xs flex items-start gap-2.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-slate-900">{order.details}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                            <span>สั่งโดย: {order.orderedBy}</span>
                            <span>{order.orderedAt}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SOAP PROGRESS NOTES (ตรงตามภาพ รพ.พระนั่งเกล้า S__17145860 & S__17145868) */}
        {/* ========================================================================= */}
        {activeTab === "soap_notes" && (
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5f7c44]" />
                  <span>บันทึกความก้าวหน้าทางการแพทย์ (Doctor Progress Notes - SOAP Model)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  โครงสร้าง SOAP มาตรฐานสากล: Subjective ➔ Objective ➔ Assessment ➔ Plan
                </span>
              </div>

              <span className="text-xs font-mono text-slate-400">
                แพทย์ผู้บันทึก: นพ. ทวี ยิ่งสง่า (1 พ.ย. 2568 09:20 น.)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 text-xs block text-blue-700">
                  [S] Subjective (ประวัติที่ผู้ป่วยเล่า):
                </span>
                <textarea
                  rows={4}
                  value={soapData.subjective}
                  onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
                  className="w-full bg-white p-2.5 rounded-xl border border-dashed border-slate-300 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 text-xs block text-emerald-700">
                  [O] Objective (ผลการตรวจร่างกายและแล็บ):
                </span>
                <textarea
                  rows={4}
                  value={soapData.objective}
                  onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
                  className="w-full bg-white p-2.5 rounded-xl border border-dashed border-slate-300 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 text-xs block text-purple-700">
                  [A] Assessment (การประเมินและการวินิจฉัยโรค ICD-10):
                </span>
                <textarea
                  rows={4}
                  value={soapData.assessment}
                  onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
                  className="w-full bg-white p-2.5 rounded-xl border border-dashed border-slate-300 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 text-xs block text-amber-700">
                  [P] Plan (แผนการรักษา คำสั่งยา และการนัดหมาย):
                </span>
                <textarea
                  rows={4}
                  value={soapData.plan}
                  onChange={(e) => setSoapData({ ...soapData, plan: e.target.value })}
                  className="w-full bg-white p-2.5 rounded-xl border border-dashed border-slate-300 font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setToastMessage("บันทึก Progress Note (SOAP) สำเร็จ!");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-5 py-2 rounded-xl bg-[#5f7c44] hover:bg-[#4d6736] text-white font-bold text-xs shadow-md transition-colors"
              >
                บันทึก Progress Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">{toastMessage}</p>
              <p className="text-[10px] text-slate-400">
                ข้อมูลทั้งหมดเชื่อมโยงกับฐานข้อมูลเวชระเบียนแบบเรียลไทม์
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
