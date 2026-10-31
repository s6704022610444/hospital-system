# ADR 0005: Nuclear Medicine Architecture, Radioactive Decay Tracking, and Safety Guardrails

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Nuclear Medicine Module: I-131 Therapy & Diagnostic Imaging)

## Context & Problem Statement
โมดูลเวชศาสตร์นิวเคลียร์ (Nuclear Medicine) มีความอ่อนไหวสูงมาก เนื่องจากเกี่ยวข้องกับสารเภสัชรังสี (Radiopharmaceuticals เช่น I-131, Tc-99m) ซึ่งมีคุณสมบัติการสลายตัวทางกายภาพตามเวลา (Radioactive Decay: $A_t = A_0 \cdot e^{-\lambda t}$) และมีความเสี่ยงต่อทารกในครรภ์อย่างรุนแรง (Teratogenicity) ระบบจึงต้องการกลไกช่วยคำนวณและบันทึกปริมาณรังสีที่ถูกต้องตามกฎหมาย และระบบป้องกันความผิดพลาดทางคลินิก (Clinical Safety Guardrails) ก่อนเข้าทำหัตถการ

## Decision Drivers
1. **Clinical Safety & Legal Compliance:** ป้องกันการให้สารรังสีในผู้ป่วยตั้งครรภ์โดยเด็ดขาด 100% และมีหลักฐานบันทึกการคำนวณปริมาณรังสีจริงที่ได้รับ (Administered Dose) ตามมาตรฐานเวชระเบียน
2. **Operational Usability:** เจ้าหน้าที่ห้องนิวเคลียร์ต้องสามารถเตรียมสารรังสีและดูค่าการสลายตัวแบบ Real-time ได้สะดวก ณ จุดสอบเทียบเครื่องวัดรังสี (Dose Calibrator)
3. **Auditability of Overrides:** ในกรณีที่มีข้อบ่งชี้ทางคลินิกที่ต้องยกเว้น ต้องมีหลักฐานการ Override พร้อมเหตุผลและตัวตนแพทย์ผู้รับผิดชอบอย่างชัดเจน

## Decision Outcome
เลือกสถาปัตยกรรม **Hybrid Decay Calculation** ร่วมกับ **Tiered Safety Checklist Enforcement (Hard Stop vs Soft Warning with Override)**:

### 1. Hybrid Decay Calculation Engine
- **Client-Side Realtime Calculator (TypeScript UI):**
  - มีโมดูลทางคณิตศาสตร์คำนวณ Decay Curve แบบ Dynamic บนหน้าจอ โดยอิงตามค่าคงที่การสลายตัวของ Isotope (เช่น I-131 Half-life = 8.02 วัน, Tc-99m Half-life = 6.01 ชั่วโมง)
  - แสดงผลปริมาณกัมมันตภาพรังสีปัจจุบัน ($mCi$ หรือ $MBq$) แบบวินาทีต่อวินาที ช่วยให้เจ้าหน้าที่สอบเทียบปริมาณยาก่อนฉีดได้แม่นยำ
- **Immutable Legal Snapshot (PostgreSQL `orders.details` JSONB):**
  - เมื่อเจ้าหน้าที่กดบันทึกการให้ยาจริง ระบบจะ Freeze ค่าและบันทึกเป็น Snapshot ทางกฎหมายลงในฟิลด์ `details`:
    ```json
    {
      "radionuclide": "I-131",
      "calibrated_dose_mci": 150.0,
      "calibration_datetime": "2026-10-31T09:00:00Z",
      "administered_dose_mci": 142.3,
      "administered_datetime": "2026-10-31T11:45:00Z",
      "decay_factor": 0.9486,
      "administered_by": "uuid-user-nuclear-med",
      "lot_number": "I131-202610-001"
    }
    ```

### 2. Tiered Safety Checklist Enforcement
ก่อนที่สถานะคำสั่งตรวจจะเปลี่ยนเป็น `in_procedure` ระบบจะตรวจสอบ Safety Checklist:
- **Level 1: Pregnancy Test (Absolute Hard Stop 100%):**
  - สำหรับผู้ป่วยหญิงวัยเจริญพันธุ์ (อายุ 12-55 ปี) คำสั่งตรวจ I-131 / Nuclear Scan ต้องมีผล UPT (Urine Pregnancy Test) หรือ Serum hCG เป็น `negative` เท่านั้น
  - **หากผลเป็น Positive หรือยังไม่มีผลแล็บยืนยัน: ระบบบล็อกการเปลี่ยนสถานะเป็น `in_procedure` ในระดับ Database Trigger/Constraint ทันที ไม่สามารถข้ามได้ในทุกกรณี**
- **Level 2: Preparatory Factors (Soft Warning with Doctor Override):**
  - ได้แก่ การงดอาหาร/ยาที่มีสารไอโอดีน (Low Iodine Diet), การงดให้นมบุตร (Discontinue Breastfeeding), การตรวจประวัติการกลืน
  - หากยังไม่ได้ยืนยัน หรือมีข้อขัดแย้ง: ระบบแสดงกล่องเตือนสีแดง (Warning Dialog)
  - อนุญาตให้ **แพทย์เฉพาะทางเวชศาสตร์นิวเคลียร์หรือแพทย์เจ้าของไข้** เท่านั้น ที่สามารถกดปุ่ม "Confirm Override" ได้ โดย **บังคับกรอกข้อความ 'Clinical Justification' (เหตุผลทางคลินิก)** ซึ่งจะถูกบันทึกลงใน Audit Trail และเอกสารหัตถการทันที

## Consequences
- **Positive:** ขจัดความเสี่ยงต่อการเกิดความผิดพลาดระดับรุนแรง (Sentinel Event) กับสตรีมีครรภ์, มีหลักฐานทางกฎหมายครบถ้วน, เจ้าหน้าที่ทำงานสะดวกรวดเร็ว
- **Negative / Trade-offs:** ต้องเขียน validation logic ตรวจสอบ JSONB details ในฝั่ง Database Trigger ก่อนยอมให้อัปเดตสถานะเป็น `in_procedure`
