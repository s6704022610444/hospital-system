# 06: Diagnostic Orders (Lab & X-ray) and Medical Technologist (`med_tech`) Loop-back

**What to build:** สร้างตาราง `orders` สำหรับคำสั่งตรวจ Lab/X-ray พร้อม `details` แบบ JSONB, `payment_type` และ Micro State, รวมถึงตาราง `lab_results`; ให้แพทย์สั่งตรวจจากหน้าตรวจรักษาได้ และให้ `med_tech` เห็นคิวเฉพาะ Lab พร้อมสิทธิ์บันทึกผลและอัปเดตสถานะเฉพาะ `order_type = 'lab'`; เมื่อผลตรวจทุก Order ใน Visit ครบ ระบบส่ง Visit กลับสู่คิวแพทย์ในสถานะ `doctor_review` โดยอัตโนมัติ

**Blocked by:** 05 (Doctor Queue, Consultation Encounter & ICD-10 Diagnoses)

**Status:** ready-for-agent

- [ ] ตาราง `orders` และ `lab_results` ถูกสร้างพร้อม RLS แยกตาม `order_type` และ OCC (`version`, `updated_at`)
- [ ] แพทย์สามารถสร้าง Lab และ X-ray Orders ที่ผูกกับ Visit และมีสถานะเริ่มต้น `ordered`
- [ ] `med_tech` อ่านและอัปเดตได้เฉพาะ Lab Orders และบันทึกผลใน `lab_results`; การเข้าถึง X-ray/Nuclear Orders ถูกปฏิเสธ
- [ ] การเปลี่ยน Micro State ของ Order ทำตามลำดับที่อนุญาต และการยกเลิกถูกยอมรับเฉพาะใน `ordered` หรือ `scheduled`
- [ ] เมื่อผลคำสั่งตรวจที่ยัง active ครบถ้วน ระบบตั้ง Visit เป็น `doctor_review` และคิวแพทย์แสดงผู้ป่วยในกลุ่มกลับมาฟังผล
- [ ] มี Integration Tests ครอบคลุม RLS ของ `med_tech`, การบันทึกผล และ loop-back เมื่อมีหลาย Orders รวมกรณี Order ถูกยกเลิก
