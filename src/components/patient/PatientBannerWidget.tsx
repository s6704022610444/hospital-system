"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Droplet, HeartPulse, ShieldCheck, UserRound } from "lucide-react";
import { fetchPatientSingleView, PatientSingleViewPayload } from "@/src/lib/api/patient";

interface PatientBannerWidgetProps {
  hn: string;
  vn?: string | null;
}

export function PatientBannerWidget({ hn, vn }: PatientBannerWidgetProps) {
  const [patient, setPatient] = useState<PatientSingleViewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchPatientSingleView(hn, vn)
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return;
        setPatient(data);
        setError(fetchError);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hn, vn]);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-5 animate-pulse">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-64 rounded bg-gray-100" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "ไม่พบข้อมูลผู้ป่วย"}
      </div>
    );
  }

  const hasAllergy = Boolean(patient.allergies?.length);
  const hasOutstandingBalance = Boolean(patient.outstandingBalance && patient.outstandingBalance > 0);

  return (
    <section aria-label="ข้อมูลผู้ป่วย" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <UserRound className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{patient.fullName || "ผู้ป่วย"}</h1>
              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm text-gray-700">HN {patient.hn}</span>
              {patient.vn && <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-sm text-blue-700">VN {patient.vn}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
              {patient.age !== undefined && <span>{patient.age} ปี</span>}
              {patient.gender && <span>{patient.gender}</span>}
              {patient.bloodGroup && <span className="inline-flex items-center gap-1"><Droplet className="h-4 w-4 text-red-500" />{patient.bloodGroup}</span>}
              {patient.insuranceScheme && <span>{patient.insuranceScheme}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasAllergy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> แพ้ยา
            </span>
          )}
          {hasOutstandingBalance && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
              <HeartPulse className="h-4 w-4" aria-hidden="true" /> ค้างชำระ {patient.outstandingBalance?.toLocaleString("th-TH")} บาท
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> บันทึกการเข้าถึงแล้ว
          </span>
        </div>
      </div>
    </section>
  );
}
