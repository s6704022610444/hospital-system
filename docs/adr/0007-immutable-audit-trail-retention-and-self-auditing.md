# ADR 0007: Immutable Audit Trail, 10-Year Retention, and Recursive Export Self-Auditing

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Governance, Legal Compliance & Audit Architecture)

## Context & Problem Statement
ระบบบันทึกประวัติการเข้าถึง (Read Audit) และประวัติการเปลี่ยนแปลงข้อมูล (Write Audit) ในโรงพยาบาลเป็นข้อมูลที่มีผลผูกพันทางกฎหมายเวชระเบียน กฎหมายความรับผิดชอบทางการแพทย์ และพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) มีความเสี่ยงหาก Audit Trail ถูกแก้ไข ดัดแปลง หรือถูกลบเพื่อทำลายหลักฐาน นอกจากนี้ การอนุญาตให้ดาวน์โหลดหรือ Export ข้อมูล Log อาจก่อให้เกิดความเสี่ยงเรื่องข้อมูลรั่วไหล (Data Leakage) หากไม่มีกลไกควบคุมและตรวจสอบตนเอง (Self-Auditing)

## Decision Drivers
1. **Legal & Regulatory Compliance:** ต้องเก็บรักษาหลักฐานการเข้าถึงและการรักษาพยาบาลไม่น้อยกว่า 10 ปี ตามเกณฑ์มาตรฐานเวชระเบียนโรงพยาบาล
2. **Immutability (Tamper-Proof):** ตาราง Audit Log ต้องไม่สามารถถูกแก้ไข (`UPDATE`) หรือลบ (`DELETE`) ได้ แม้กระทั่งโดยผู้ดูแลระบบ (Admin)
3. **Forensic Transparency:** ผู้บริหารสูงสุด (`director`) และผู้ดูแลระบบ (`admin`) ต้องมองเห็นภาพรวมความปลอดภัยและสามารถตรวจสอบย้อนหลังได้ทุกมิติ
4. **Leakage Prevention & Recursive Auditing:** ป้องกันการแอบดึงข้อมูล Audit ออกนอกระบบโดยไม่ทิ้งร่องรอย

## Decision Outcome
เลือกสถาปัตยกรรม **Append-Only Immutable Audit Tables** พร้อม **10-Year Retention Policy**, **Director Metrics Dashboard**, และ **Recursive Self-Auditing Export Workflow**:

### 1. Immutability & Retention Architecture
- **Append-Only Table Constraint:**
  - สร้างตาราง `audit_logs` (Write Audit) และ `access_logs` (Read Audit)
  - กำหนดสิทธิ์ระดับ PostgreSQL Database:
    - อนุญาตเฉพาะคำสั่ง `INSERT` และ `SELECT` สำหรับ Service/Authorized Role
    - **REVOKE UPDATE, DELETE** จากทุกบทบาท (รวมถึง `postgres` role ผ่าน Trigger บล็อกเด็ดขาด)
  - ติดตั้ง Database Rule/Trigger ดักจับ:
    ```sql
    CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
    CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
    ```
- **10-Year Retention Policy:**
  - กำหนดให้ระบบเก็บข้อมูลไว้ใน Primary DB อย่างน้อย 10 ปี โดยไม่มีกระบวนการ Auto-purge หรือ Cron Job ลบข้อมูลก่อนกำหนด

### 2. Role-Based Visibility & Director Dashboard
- **Raw Log Access:** ทั้งบทบาท `admin` และ `director` ได้รับสิทธิ์เข้าถึงตาราง Audit Log ทั้งหมด เพื่อการสืบค้นทางนิติวิทยาศาสตร์ (Forensic Audit)
- **Director Audit & Security Dashboard:**
  - พัฒนาแดชบอร์ดเฉพาะสำหรับ `director` สรุป Aggregated Metrics:
    - อัตราความเร็วในการเข้าถึงข้อมูลสุขภาพผู้ป่วย (PHI Access Velocity) แยกตามช่วงเวลา
    - สถิติการเข้าถึงและแก้ไขข้อมูลจำแนกตามแผนก/บทบาท (Departmental Activity)
    - ความถี่และพฤติกรรมในการสลับ Active Role เพื่อตรวจจับความผิดปกติ (Anomaly Detection)

### 3. CSV Export Policy & Recursive Self-Auditing
- **Authorized Export:** อนุญาตให้ `admin` และ `director` ส่งออกข้อมูล Audit Log เป็นไฟล์ CSV ได้ โดยระบบจำกัดการ Export ด้วย Date Range และ Pagination
- **Recursive Self-Auditing Log:**
  - ทุกครั้งที่มีคำขอ Export ไฟล์ CSV ระบบจะทำการบันทึก Log ซ้ำอีกชั้นหนึ่งทันทีในตาราง `audit_logs`:
    - `action`: `'log_export_generated'`
    - `user_id`: ID ของผู้สั่ง Export
    - `active_role`: บทบาทขณะสั่ง (`admin` หรือ `director`)
    - `details`: บันทึกเงื่อนไข Filter ที่ใช้ (เช่น Start Date, End Date, Department, Keyword) และจำนวนแถวทั้งหมดที่ถูกดาวน์โหลดออกไป
  - การกระทำนี้ช่วยป้องกันการขโมยข้อมูล Log ภายใน (Internal Audit Leakage) ได้ 100%

## Consequences
- **Positive:** ปฏิบัติตามมาตรฐานกฎหมายครบถ้วน, Audit Log มีความน่าเชื่อถือระดับพยานหลักฐานในชั้นศาล, ผู้บริหารเห็นสถิติความปลอดภัยเชิงรุก
- **Negative / Trade-offs:** ปริมาณข้อมูล Audit Log จะเติบโตอย่างต่อเนื่อง ต้องทำ Table Indexing บน Timestamp และ User ID อย่างมีประสิทธิภาพเพื่อรองรับ Query
