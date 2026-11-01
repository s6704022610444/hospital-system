import { NextResponse } from "next/server";

// Mock citizen data pool matching Maharat Nakhon Ratchasima Hospital demographics
const mockCitizens = [
  {
    nationalId: "1103700543210",
    firstName: "สมศักดิ์",
    lastName: "รักสงบ",
    gender: "M",
    birthDate: "1985-04-12",
    bloodGroup: "O",
    insuranceScheme: "Universal Coverage",
    phone: "081-234-5678",
    address: "99/12 หมู่ 4 ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000",
  },
  {
    nationalId: "3101400876541",
    firstName: "วิภาดา",
    lastName: "เจริญพร",
    gender: "F",
    birthDate: "1992-09-25",
    bloodGroup: "B",
    insuranceScheme: "Social Security",
    phone: "089-876-5432",
    address: "123 ถ.มิตรภาพ ต.ปากช่อง อ.ปากช่อง จ.นครราชสีมา 30130",
  },
  {
    nationalId: "1309900887766",
    firstName: "กานดา",
    lastName: "ชัยมงคล",
    gender: "F",
    birthDate: "1998-12-05",
    bloodGroup: "A",
    insuranceScheme: "Universal Coverage",
    phone: "082-999-1122",
    address: "55/1 ต.สีคิ้ว อ.สีคิ้ว จ.นครราชสีมา 30140",
  },
];

export async function GET() {
  const randomIndex = Math.floor(Math.random() * mockCitizens.length);
  const selected = mockCitizens[randomIndex];

  return NextResponse.json({
    status: "success",
    is_simulated: true,
    chip_read_timestamp: new Date().toISOString(),
    data: selected,
  });
}
