import { NextResponse } from "next/server";

// Mock data pools for realistic Smart Card simulation
const mockThaiCitizens = [
  {
    nationalId: "1103700543219",
    firstName: "สมศักดิ์",
    lastName: "รักสงบ",
    gender: "M",
    birthDate: "1985-04-12",
    bloodGroup: "O",
    insuranceScheme: "Universal Coverage",
    phone: "081-234-5678",
    address: "99/12 หมู่ 4 ต.บางเขน อ.เมือง จ.นนทบุรี 11000",
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
    address: "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110",
  },
  {
    nationalId: "5100200112233",
    firstName: "ประสิทธิ์",
    lastName: "วงศ์สว่าง",
    gender: "M",
    birthDate: "1960-11-03",
    bloodGroup: "A",
    insuranceScheme: "Civil Servant",
    phone: "084-555-9988",
    address: "45/2 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
  },
];

export async function GET() {
  // Randomly select one citizen to simulate realistic card insertion
  const randomIndex = Math.floor(Math.random() * mockThaiCitizens.length);
  const selected = mockThaiCitizens[randomIndex];

  return NextResponse.json({
    status: "success",
    is_simulated: true,
    chip_read_timestamp: new Date().toISOString(),
    data: selected,
  });
}
