import { describe, expect, it } from "vitest";
import {
  searchPatients,
  getAppointments,
  openVisit,
  registerNewPatient,
  verifyPatientRights,
  updatePatientDemographics,
} from "./registrar-service";

describe("Registrar Service Suite (ADR 0001 - ADR 0005)", () => {
  it("searches patients across HN, National ID, Passport, and Name", async () => {
    // Search by HN
    const byHn = await searchPatients("HN-68-0000001");
    expect(byHn.length).toBeGreaterThan(0);
    expect(byHn[0].firstName).toBe("สมศักดิ์");

    // Search by Passport (ADR 0003)
    const byPassport = await searchPatients("AA9876543");
    expect(byPassport.length).toBeGreaterThan(0);
    expect(byPassport[0].firstName).toBe("David");

    // Search by Name
    const byName = await searchPatients("วิภาดา");
    expect(byName.length).toBeGreaterThan(0);
    expect(byName[0].outstandingBalance).toBe(850);
  });

  it("fetches pre-scheduled referral appointments (ADR 0001)", async () => {
    const appointments = await getAppointments();
    expect(appointments.length).toBeGreaterThan(0);
    const nucApt = appointments.find((a) => a.referringHospital === "รพช.ธัญบุรี");
    expect(nucApt).toBeDefined();
    expect(nucApt?.doctorName).toBe("นพ. ทวี ยิ่งสง่า");
  });

  it("opens visit and produces correct stored VN format and display queue", async () => {
    const res = await openVisit({
      patientId: "pat-68-0001",
      hn: "HN-68-0000001",
      clinicName: "คลินิกอายุรกรรมทั่วไป",
      chiefComplaint: "ปวดท้องแน่นจุก",
      inflowType: "walk_in",
    });

    expect(res.success).toBe(true);
    // Stored format: VN-DDMMYYYY-XXXXXXX (ADR 0003)
    expect(res.vn).toMatch(/^VN-\d{8}-\d{7}$/);
    expect(res.queueNumber).toMatch(/^A-\d{2}$/);
  });

  it("prevents duplicate registration with existing National ID (ADR 0003, ADR 0005)", async () => {
    const res = await registerNewPatient({
      idType: "thai_cid",
      nationalId: "1103700543210", // Existing CID for สมศักดิ์
      firstName: "สมศักดิ์",
      lastName: "รักสงบ",
      gender: "M",
      birthDate: "1985-04-12",
      bloodGroup: "O",
      insuranceScheme: "Universal Coverage",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("พบประวัติผู้ป่วยเดิมในระบบแล้ว");
  });

  it("enforces mandatory amendment justification when legal identity is altered (ADR 0005)", async () => {
    // Attempting to change last name without justification
    const resWithoutReason = await updatePatientDemographics(
      "pat-68-0001",
      { lastName: "รักสันติ" },
      "" // Empty reason
    );
    expect(resWithoutReason.success).toBe(false);
    expect(resWithoutReason.error).toContain("Mandatory justification reason required");

    // Providing justification succeeds
    const resWithReason = await updatePatientDemographics(
      "pat-68-0001",
      { lastName: "รักสันติ" },
      "มีใบสำคัญเปลี่ยนชื่อ-สกุลจากอำเภอ ลว. 21 ต.ค. 2568"
    );
    expect(resWithReason.success).toBe(true);
  });

  it("registers emergency anonymous patient with ANON ID (ADR 0003)", async () => {
    const res = await registerNewPatient({
      idType: "anonymous_trauma",
      anonymousId: "ANON-0000099",
      firstName: "ผู้ป่วยฉุกเฉินไม่ทราบชื่อ",
      lastName: "ANON-0000099",
      gender: "Other",
      birthDate: "1990-01-01",
      bloodGroup: "O",
      insuranceScheme: "Universal Coverage",
    });

    expect(res.success).toBe(true);
    expect(res.hn).toBeDefined();
  });

  it("registers migrant worker (pink card) with employer info and nationality", async () => {
    const res = await registerNewPatient({
      idType: "pink_card",
      nationalId: "0012345678901",
      firstName: "มิน",
      lastName: "อู",
      gender: "M",
      birthDate: "1995-05-20",
      bloodGroup: "B",
      insuranceScheme: "Social Security",
      affiliatedHospital: "รพ.มหาราชนครราชสีมา",
      phone: "089-999-8877",
      address: "แคมป์คนงานก่อสร้าง ต.จอหอ อ.เมือง จ.นครราชสีมา 30310 [นายจ้าง/แคมป์: บ.ไทยพัฒนา แคมป์จอหอ โทร 089-111-2233]",
      employerName: "บ.ไทยพัฒนา แคมป์จอหอ",
      nationality: "เมียนมา",
    });

    expect(res.success).toBe(true);
    expect(res.hn).toBeDefined();

    // Verify searchable by nationalId
    const search = await searchPatients("0012345678901");
    expect(search.length).toBeGreaterThan(0);
    expect(search[0].firstName).toBe("มิน");
  });

  it("verifies health rights and generates NHSO Authen Claim Code", () => {
    // 1. In-network Maharat Universal Coverage
    const inNetwork = verifyPatientRights("Universal Coverage", "รพ.มหาราชนครราชสีมา");
    expect(inNetwork.status).toBe("verified");
    expect(inNetwork.authenCode).toMatch(/^U[A-Z0-9]{5}$/);

    // 2. Out-of-network Universal Coverage
    const outOfNetwork = verifyPatientRights("Universal Coverage", "รพช.ธัญบุรี");
    expect(outOfNetwork.status).toBe("out_of_network");
    expect(outOfNetwork.message).toContain("รพช.ธัญบุรี");

    // 3. Road Accident Protection Act (พ.ร.บ.) - No NHSO Authen Code
    const act = verifyPatientRights("Road Accident Protection Act");
    expect(act.status).toBe("act_registered");
    expect(act.authenCode).toBeUndefined();

    // 4. Self-pay - No NHSO Authen Code
    const selfPay = verifyPatientRights("Self-pay");
    expect(selfPay.status).toBe("self_pay");
    expect(selfPay.authenCode).toBeUndefined();
  });

  it("stores and passes allergy alerts and emergency contacts through openVisit", async () => {
    const regRes = await registerNewPatient({
      idType: "thai_cid",
      nationalId: "1234567890123",
      firstName: "กล้าหาญ",
      lastName: "ชาญชัย",
      gender: "M",
      birthDate: "1998-07-15",
      bloodGroup: "AB",
      insuranceScheme: "Universal Coverage",
      allergies: "แพ้ยา Aspirin (หายใจไม่ออก)",
      emergencyContactName: "นาง สมหวัง ชาญชัย",
      emergencyContactRelationship: "มารดา",
      emergencyContactPhone: "081-444-5566",
    });

    expect(regRes.success).toBe(true);

    const visitRes = await openVisit({
      patientId: regRes.patientId!,
      hn: regRes.hn!,
      clinicName: "คลินิกอายุรกรรมทั่วไป",
      chiefComplaint: "ปวดศีรษะ ไมเกรน",
      allergies: "แพ้ยา Aspirin (หายใจไม่ออก)",
      emergencyContact: "นาง สมหวัง ชาญชัย (มารดา) โทร 081-444-5566",
    });

    expect(visitRes.success).toBe(true);
    expect(visitRes.vn).toBeDefined();
  });
});
