# Hospital System - Domain Glossary

| Term | Category | Description |
|---|---|---|
| **HN (Hospital Number)** | Patient Registry | รหัสประจำตัวผู้ป่วยถาวร 1 คนมี 1 เลขตลอดชีพ ใช้เป็น Anchor สำหรับ Single Patient View |
| **VN (Visit Number)** | Clinical / OPD | รหัสประจำการเข้ารับบริการผู้ป่วยนอกในแต่ละครั้ง ผูกกับ 1 HN และมีวงรอบชีวิตตาม `visits.status` |
| **Macro State (`visits.status`)** | State Machine | สถานะระดับการเดินทางของผู้ป่วย สะท้อนจุดประจำการทางกายภาพ (Physical Location Queue) ของคนไข้ในโรงพยาบาล |
| **Micro State (`orders.status`)** | State Machine | สถานะวงรอบชีวิตของคำสั่งตรวจแต่ละรายการ (Lab, X-ray, Nuclear Imaging, I-131 therapy) |
| **Doctor Review (`doctor_review`)** | Macro State | สถานะที่คนไข้ทำหัตถการ/ตรวจทางห้องปฏิบัติการครบทุกรายการแล้ว และถูกส่งกลับมาเข้าคิวพบแพทย์ซ้ำเพื่อฟังผลและวางแผนการรักษา |
| **Pre-paid** | Financial Policy | นโยบายการชำระเงินที่ผู้ป่วยต้องชำระค่าตรวจ/หัตถการที่การเงินก่อน แผนกตรวจจึงจะรับตัวไปทำหัตถการได้ |
| **Post-paid** | Financial Policy | นโยบายการชำระเงินที่อนุญาตให้เข้ารับการตรวจก่อน แล้วจึงสรุปยอดชำระร่วมกับค่ายาในตอนท้าย (เคสด่วน/นิวเคลียร์) |
| **Single Patient View** | Architecture | การรวมศูนย์ข้อมูลประวัติการรักษา ผลตรวจ ยา และค่าใช้จ่ายของผู้ป่วยไว้ในจุดเดียว ผ่านการควบคุมความปลอดภัยและ Audit Log |
| **Read Audit Log** | Security / Audit | การบันทึกหลักฐานทุกครั้งที่มีการเปิดดูประวัติผู้ป่วย (HN/VN) ผ่านฟังก์ชัน Supabase RPC `log_access` |
| **Write Audit Log** | Security / Audit | การบันทึกประวัติการสร้าง แก้ไข หรือลบข้อมูล (INSERT/UPDATE/DELETE) โดยอัตโนมัติผ่าน Database Triggers |
| **Active Role** | Authentication | บทบาทการทำงานปัจจุบันที่ผู้ใช้เลือกสวมสิทธิ์ใน Session นั้นๆ เพื่อความชัดเจนในการบันทึก Audit และจำกัดขอบเขต RLS |
| **Custom Access Token Hook** | Architecture / Security | PostgreSQL Function ใน Supabase Auth ที่ทำหน้าที่ Inject claims (เช่น roles, active_role) เข้าสู่ JWT ตอนออก Token |
| **Prescription** | Pharmacy | ใบสั่งยาและรายการยาที่แพทย์สั่ง แยกโครงสร้างออกจาก orders เพื่อรองรับการตรวจสอบการแพ้ยา (Drug Allergy) และการจัดจ่ายยา |
| **Void / Refund** | Finance | กระบวนการยกเลิกใบเสร็จและคืนเงินที่ต้องกระทำโดยเจ้าหน้าที่การเงินเท่านั้น เพื่อรักษาความถูกต้องของยอดบัญชีเงินสด |
| **Radioactive Decay** | Nuclear Medicine | การสลายตัวตามเวลาของสารเภสัชรังสี ซึ่งต้องคำนวณแบบ Real-time และบันทึก Snapshot ปริมาณรังสีจริง (Administered Dose) ลงฐานข้อมูล |
| **Safety Checklist (Hard Stop)** | Clinical Safety | กฎความปลอดภัยทางรังสีขั้นเด็ดขาด (เช่น ผลตรวจการตั้งครรภ์เป็นลบ) ซึ่งหากไม่ผ่าน ระบบจะบล็อกการทำหัตถการในระดับ Database ทันที 100% |
| **Clinical Override** | Clinical Governance | การที่แพทย์เฉพาะทางกดยืนยันข้ามคำเตือนความปลอดภัย (Soft Warning) โดยระบบบังคับให้กรอกเหตุผลทางคลินิกและบันทึกลง Audit Trail |
| **Simulated External Integration** | Architecture | โมดูลจำลองการเชื่อมต่อภายนอก (QR Payment, Health ID, Telemedicine) ผ่าน Next.js Route Handlers (`/api/mock/*`) โดยไม่พึ่งพาระบบจริงภายนอก |
| **High-Density Seed Data** | Testing / QA | ชุดข้อมูลคนไข้จำลอง 150–200 คนที่กระจายตัวตามสถานะคิวจริงและเคสทางคลินิกต่างๆ เพื่อทดสอบ Performance, Realtime และ Pagination |
| **Append-Only Audit Log** | Security / Compliance | ตารางบันทึก Audit ที่รับข้อมูลเพิ่มได้เท่านั้น ห้ามแก้ไขหรือลบรายการ และกำหนดเก็บรักษาอย่างน้อย 10 ปี |
| **Self-Auditing Export** | Security / Compliance | การบันทึก Audit Event `log_export_generated` ทุกครั้งที่ Export Log โดยระบุผู้ใช้ ช่วงเวลา และ Filter ที่ใช้ |
| **Two-Phase Stock Deduction** | Inventory | กลไกการตัดสต็อกยา 2 จังหวะ: ทำการจอง (Reserve) ทันทีที่แพทย์สั่ง และตัดยอดจริง (Deduct) เมื่อยืนยันการชำระเงินเรียบร้อย |
| **Single Unified Stock** | Inventory | สถาปัตยกรรมคลังสินค้าระดับรวมศูนย์จุดเดียว ที่ทุกแผนกตัดยอดจาก Master Stock ร่วมกันโดยไม่มี Sub-inventory ใน V1 |
| **Negative Stock Hard Block** | Inventory / Safety | กฎเกณฑ์ระดับ Database ห้ามสต็อกติดลบเด็ดขาด หากยาไม่พอจะบล็อกการสั่งยาจนกว่าฝ่ายคลังจะบันทึกรับของเข้าสู่ระบบ |
| **Consolidated Single Invoice** | Finance | ใบแจ้งหนี้และใบเสร็จรับเงินรวมศูนย์ฉบับเดียว ที่ดึงค่าใช้จ่ายค้างชำระของ Post-paid orders, ค่ายา, และค่าบริการทางการแพทย์มารวมกัน |
| **Unpaid Debt (Walkout)** | Revenue / Finance | สถานะของ Visit และการเงินเมื่อคนไข้ตรวจรักษาเสร็จแล้วหนีกลับโดยไม่ชำระเงิน ระบบจะบันทึกยอดหนี้ค้างชำระติดตัว HN |
| **Outstanding Balance Alert** | Risk Management | ป้ายเตือนสีแดงอัตโนมัติบนหน้าจอเวชระเบียนและพยาบาลคัดกรอง เมื่อคนไข้ที่มียอดหนี้ค้างชำระกลับมาเข้ารับบริการในครั้งถัดไป |
| **Modular Widget Dashboard** | UI / Architecture | สถาปัตยกรรมหน้าจอ Single Patient View รวมศูนย์ (`/patient/[hn]`) ประกอบด้วยการ์ดแยกหน้าที่และปรับ Layout ตาม Active Role ของผู้ใช้ |
| **Optimistic Concurrency Control (OCC)** | Data Integrity | กลไกควบคุมความถูกต้องของข้อมูลผ่านคอลัมน์ `version` และ `updated_at` ป้องกันการเขียนทับข้อมูลโดยไม่รู้ตัว (Dirty Overwrite) บังคับใช้กับทุกตารางยกเว้น Audit |
| **Medical Technologist (`med_tech`)** | Roles & Permissions | บทบาทนักเทคนิคการแพทย์ ทำหน้าที่รับคำสั่งตรวจแล็บ บันทึกผลแล็บ และรายงานผล โดยถูกจำกัดสิทธิ์ไม่ให้เข้าถึงข้อมูลคลินิกส่วนอื่น |
| **Drug Allergy Alert** | Clinical Safety | การตรวจสอบประวัติแพ้ยาอัตโนมัติก่อนสั่งยา หากเป็นกลุ่มแพ้รุนแรงจะบังคับให้แพทย์ระบุ Clinical Justification เพื่อ Override |
| **Duplicate HN Prevention** | Patient Registry | การป้องกันสร้างเวชระเบียนซ้ำด้วย Unique National ID (CID) 13 หลัก หากพบข้อมูลเดิมจะเปิด Visit ใหม่ทันทีโดยไม่สร้าง HN ซ้ำ |
| **Phantom Stock Auto-Release** | Inventory | กลไกปลดล็อกจำนวนยาที่ถูกจอง (Reserved Stock) คืนสู่คลังอัตโนมัติเมื่อใบสั่งยาค้างชำระเกิน 24 ชั่วโมง |
| **SWR Polling Fallback** | Architecture / Resilience | ระบบสำรองข้อมูลคิวอัตโนมัติเมื่อ WebSocket Realtime หลุด โดยสลับไป Polling ผ่าน HTTP ทุก 15 วินาทีจนกว่าจะ Reconnect สำเร็จ |
