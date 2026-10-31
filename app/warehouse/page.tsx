"use client";

import React, { useState } from "react";
import { Boxes, PackagePlus, CheckCircle2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

export default function WarehouseInventoryPage() {
  const [medCode, setMedCode] = useState("MED-PARA-500");
  const [medName, setMedName] = useState("Paracetamol 500mg");
  const [genericName, setGenericName] = useState("Paracetamol");
  const [drugClass, setDrugClass] = useState("Analgesic / Antipyretic");
  const [addQuantity, setAddQuantity] = useState("500");
  const [unitPrice, setUnitPrice] = useState("1.50");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("medications")
        .select("id, total_stock")
        .eq("code", medCode)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("medications")
          .update({ total_stock: existing.total_stock + Number(addQuantity) })
          .eq("id", existing.id);

        if (error) throw error;
        setMessage(`รับยาเข้าคลังสำเร็จ: เพิ่ม ${addQuantity} เม็ด ยอดคงเหลือใหม่คือ ${existing.total_stock + Number(addQuantity)}`);
      } else {
        const { error } = await supabase.from("medications").insert({
          code: medCode,
          name: medName,
          generic_name: genericName,
          drug_class: drugClass,
          unit_price: Number(unitPrice),
          total_stock: Number(addQuantity),
          reserved_stock: 0,
        });

        if (error) throw error;
        setMessage(`เพิ่มรายการยาใหม่และรับเข้าคลัง ${addQuantity} หน่วยสำเร็จ`);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการรับยาเข้าคลัง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Boxes className="w-6 h-6 text-slate-700" />
          คลังสินค้าโรงพยาบาล (Hospital Master Inventory)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ระบบคลังตัดยอดรวมจุดเดียว (Single Unified Stock), ตรวจสอบสต็อกคงเหลือ และบันทึกรับยาเข้าคลัง
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleStockIn} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 pb-2 border-b flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-slate-700" />
          บันทึกรับยาเข้าคลัง (Stock In Entry)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">รหัสยา (Code)</label>
            <input
              type="text"
              required
              value={medCode}
              onChange={(e) => setMedCode(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อการค้า (Brand Name)</label>
            <input
              type="text"
              required
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อสามัญทางยา (Generic Name)</label>
            <input
              type="text"
              required
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">กลุ่มยา (Drug Class)</label>
            <input
              type="text"
              required
              value={drugClass}
              onChange={(e) => setDrugClass(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">จำนวนที่รับเข้า (Quantity to Add)</label>
            <input
              type="number"
              required
              min="1"
              value={addQuantity}
              onChange={(e) => setAddQuantity(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg font-mono font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ราคาต่อหน่วย (บาท)</label>
            <input
              type="number"
              step="0.01"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm transition-colors shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันรับเข้าสต็อก (Stock In)"}
          </button>
        </div>
      </form>
    </div>
  );
}
