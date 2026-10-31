# ADR 0008: Warehouse Inventory Architecture, Two-Phase Stock Deduction, and Zero-Tolerance Negative Stock

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Warehouse & Pharmacy Module)

## Context & Problem Statement
ระบบโรงพยาบาลมีผู้ใช้งานบทบาท `warehouse` (คลังสินค้า) และ `pharmacist` (เภสัชกร) ในการจ่ายยาผู้ป่วยนอก หากระบบไม่มีการจองสต็อกยา (Reservation) อาจเกิดเหตุการณ์สั่งยาเกินจำนวนที่มีอยู่จริง (Over-dispensing Race Condition) ทำให้ผู้ป่วยที่ชำระเงินแล้วไม่มียาจริงสำหรับจ่ายที่ห้องยา ในขณะเดียวกัน ข้อกำหนดระบุชัดเจนว่าการตีมูลค่าสต็อกทางบัญชี (Stock Valuation เช่น FIFO/LIFO/Moving Average) เป็น Out-of-Scope สำหรับ V1

## Decision Drivers
1. **Dispensing Reliability:** รับประกันว่าผู้ป่วยที่ชำระค่ายาแล้วจะต้องได้รับยาครบถ้วน 100% ไม่เกิดปัญหายาขาดหน้างาน
2. **Simplified V1 Scope:** ลดความซับซ้อนของระบบคลัง โดยหลีกเลี่ยงกระบวนการโอนย้ายสินค้าระหว่างคลังย่อย (Sub-inventory Transfers) ในเวอร์ชันแรก
3. **Data Integrity:** ข้อมูลปริมาณสต็อกในระบบต้องสะท้อนความเป็นจริง ห้ามมีสต็อกติดลบ (No Negative Stock)

## Decision Outcome
เลือกสถาปัตยกรรม **Two-Phase Stock Deduction (Reserve on Order, Deduct on Paid)** ร่วมกับ **Single Unified Hospital Master Stock** และ **Strict Hard Block for Negative Stock**:

### 1. Single Unified Stock Model (V1 Architecture)
- ตาราง `medications`:
  - `id`: UUID (Primary Key)
  - `code`: รหัสยาโรงพยาบาล (เช่น `MED-PARA-500`)
  - `name`: ชื่อการค้าและชื่อสามัญทางยา (Generic Name)
  - `total_stock`: จำนวนยาจริงที่มีอยู่ในโรงพยาบาลทั้งหมด
  - `reserved_stock`: จำนวนยาที่อยู่ระหว่างถูกจองโดยใบสั่งยาที่รอชำระเงิน
  - `available_stock`: Virtual/Generated Column คำนวณจาก `total_stock - reserved_stock`
- ทุกจุดบริการ (ห้องตรวจแพทย์, ห้องยา, คลัง) มองเห็นและตัดยอดจาก Master Stock ชุดเดียวกันโดยตรง โดยยังไม่มีโมดูล Transfer ระหว่างคลังใหญ่กับห้องยาใน V1

### 2. Two-Phase Stock Deduction Workflow
- **Phase 1: Reserve on Order (ขั้นตอนแพทย์สั่งยา):**
  - เมื่อแพทย์กดบันทึกใบสั่งยา (`prescriptions`):
    - ระบบตรวจสอบ `available_stock >= requested_quantity`
    - หากเพียงพอ: ระบบบวกค่า `reserved_stock = reserved_stock + requested_quantity`
    - ล็อกจำนวนยานั้นไว้ทันที คนไข้คนอื่นจะไม่สามารถสั่งตัดหน้าได้
- **Phase 2: Deduct on Paid (ขั้นตอนชำระเงินสำเร็จ):**
  - เมื่อการเงินยืนยันการชำระเงิน (`payments.status = 'paid'` หรือกรณี Post-paid ได้รับการอนุมัติ):
    - Database Trigger จะสั่งตัดยอดจริง:
      - `total_stock = total_stock - requested_quantity`
      - `reserved_stock = reserved_stock - requested_quantity`
    - บันทึกลงตาราง `inventory_transactions` (Audit Transaction)
- **Rollback: Release Reservation (กรณียกเลิกใบสั่งยา):**
  - หากแพทย์หรือการเงินกดยกเลิกใบสั่งยาก่อนชำระเงิน:
    - ระบบจะคืนค่า `reserved_stock = reserved_stock - requested_quantity` กลับสู่ `available_stock` ทันที

### 3. Strict Hard Block on Insufficient Stock
- ระบบไม่อนุญาตให้สต็อกติดลบเด็ดขาด (No Negative Stock Allowed)
- มี Database Check Constraint:
  ```sql
  ALTER TABLE medications ADD CONSTRAINT chk_stock_non_negative CHECK (total_stock >= 0);
  ALTER TABLE medications ADD CONSTRAINT chk_available_non_negative CHECK (total_stock >= reserved_stock);
  ```
- หากยาชนิดใดมี `available_stock < requested_quantity` ระบบจะ **Hard Block (ไม่อนุญาตให้ส่งใบสั่งยานั้น)** และแสดงข้อความแจ้งเตือนสีแดงให้แพทย์ทราบว่า "ยาหมดสต็อก กรุณาประสานงานฝ่ายคลังสินค้า (warehouse) เพื่อรับของเข้าสู่ระบบ"

## Consequences
- **Positive:** ป้องกันปัญหายาไม่พอจ่ายได้ 100%, ระบบสต็อกไม่เคยติดลบ, สถาปัตยกรรมกระชับตรงไปตรงมาเหมาะกับ V1 Scope
- **Negative / Trade-offs:** หากคนไข้ทิ้งใบสั่งยาไว้แล้วไม่ไปชำระเงิน ยาจะถูกจองค้างไว้ (แก้ไขได้ด้วยการตั้งเวลา Auto-expire สำหรับใบสั่งยาค้างจ่ายข้ามวัน)
