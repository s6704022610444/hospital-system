# ADR 0003: Multi-Role Authorization with Active Role Switching and Custom Access Token Hook

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** Project Hospital System (Authentication & RBAC)

## Context & Problem Statement
ระบบโรงพยาบาลรองรับผู้ใช้ 9 บทบาท (`registrar`, `nurse`, `doctor`, `cashier`, `pharmacist`, `warehouse`, `admin`, `director`, `nuclear_med`) บุคลากรหนึ่งคนอาจมีหลายหน้าที่ การให้สิทธิ์รวมกันตลอดเวลา (Union of Permissions) เสี่ยงต่อการปฏิบัติงานผิดบทบาทและทำให้ Audit Log ไม่ชัดเจน ขณะที่การตรวจบทบาทจากตารางฐานข้อมูลทุกครั้งอาจเพิ่มภาระให้ RLS และการเก็บ Role ใน JWT อย่างเดียวทำให้การบริหารบทบาทไม่ยืดหยุ่น

## Decision Drivers
1. ทุกการกระทำต้องระบุบทบาทที่ใช้งาน (`active_role`) ณ ขณะนั้น
2. RLS ควรประเมินสิทธิ์จาก JWT Claim โดยไม่ต้อง query ตาราง `user_roles` ซ้ำทุกครั้ง
3. ผู้ใช้หนึ่งคนถือได้หลายบทบาท แต่เลือกใช้งานทีละ Active Role

## Considered Options
- **A — JWT App Metadata:** เก็บ role ใน JWT โดยตรง
- **B — Normalized DB Table:** เก็บบทบาทใน `user_roles` และ query ตารางขณะประเมิน RLS
- **C — Hybrid via Supabase Auth Hook:** เก็บบทบาทในฐานข้อมูลเป็น Source of Truth และเติม claims ใน JWT ผ่าน Custom Access Token Hook

## Decision Outcome
เลือก **ผู้ใช้หนึ่งคนหลาย Role พร้อม Switch Active Role และ Option C (Hybrid via Supabase Auth Hook)**

### Data Model
- `public.user_roles` เป็นแหล่งข้อมูลจริงของบทบาทที่มอบให้ผู้ใช้ รองรับหลายแถวต่อ `user_id` และกำหนด Primary Key เป็น `(user_id, role)`
- ค่า Active Role ต้องถูกตรวจสอบว่าอยู่ในบทบาทที่ได้รับมอบหมาย ห้ามเชื่อค่าที่ส่งมาจาก Client โดยไม่ตรวจสอบ

### Token Hook and Role Switching
- Supabase Custom Access Token Hook เพิ่ม claims สำหรับบทบาทที่ได้รับมอบหมายและ Active Role ลงใน Access Token
- ผู้ใช้สลับ Active Role ผ่าน RPC ที่ตรวจสอบสิทธิ์กับ `user_roles` ก่อนเปลี่ยนค่า
- หลังสลับบทบาท Client ขอ refresh session เพื่อรับ Token ใหม่; ทุกคำขอหลังจากนั้นใช้ Active Role ใน Token
- กรณีผู้ใช้ไม่มี Active Role ที่ถูกต้อง ต้องปฏิเสธการใช้งานที่ต้องอาศัยบทบาท และให้เลือกบทบาทที่ได้รับมอบหมายใหม่

### RLS and Audit
- RLS ใช้ Active Role จาก JWT Claim เพื่อบังคับการอ่าน/เขียนตามบทบาทที่เลือก
- Audit Log บันทึกทั้ง `auth.uid()` และ Active Role ที่ผ่านการตรวจสอบแล้ว
- การเปลี่ยนบทบาทและการมอบ/เพิกถอนบทบาทควรถูกบันทึกใน Audit Trail

## Consequences
- **Positive:** รองรับการทำงานหลายหน้าที่โดยไม่รวมสิทธิ์ทุกบทบาทพร้อมกัน, RLS อ่าน claim ได้โดยตรง, และสามารถบันทึกบริบทบทบาทของผู้กระทำ
- **Trade-offs:** การเปลี่ยนบทบาทต้อง refresh token; การเพิกถอนสิทธิ์อาจยังไม่สะท้อนใน Access Token ที่ออกไปแล้วจนกว่าจะ refresh หรือหมดอายุ จึงต้องกำหนดอายุ Token และมาตรการบังคับ refresh/revoke ให้เหมาะสม
