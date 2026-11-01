export interface SubDistrict {
  name: string;
  zipcode: string;
}

export interface District {
  name: string;
  subDistricts: SubDistrict[];
}

export interface Province {
  name: string;
  districts: District[];
}

export const THAI_ADDRESS_DATA: Province[] = [
  {
    name: "นครราชสีมา",
    districts: [
      {
        name: "เมืองนครราชสีมา",
        subDistricts: [
          { name: "ในเมือง", zipcode: "30000" },
          { name: "จอหอ", zipcode: "30310" },
          { name: "โพธิ์กลาง", zipcode: "30000" },
          { name: "หัวทะเล", zipcode: "30000" },
          { name: "หนองจะบก", zipcode: "30000" },
          { name: "หนองบัวศาลา", zipcode: "30000" },
          { name: "สุรนารี", zipcode: "30000" },
          { name: "บ้านเกาะ", zipcode: "30000" },
          { name: "หนองไผ่ล้อม", zipcode: "30000" },
          { name: "โคกสูง", zipcode: "30310" },
        ],
      },
      {
        name: "ปากช่อง",
        subDistricts: [
          { name: "ปากช่อง", zipcode: "30130" },
          { name: "หมูสี", zipcode: "30130" },
          { name: "ขนงพระ", zipcode: "30130" },
          { name: "หนองน้ำแดง", zipcode: "30130" },
          { name: "กลางดง", zipcode: "30320" },
          { name: "พญาเย็น", zipcode: "30320" },
        ],
      },
      {
        name: "สีคิ้ว",
        subDistricts: [
          { name: "สีคิ้ว", zipcode: "30140" },
          { name: "มิตรภาพ", zipcode: "30140" },
          { name: "ลาดบัวขาว", zipcode: "30340" },
          { name: "คลองไผ่", zipcode: "30340" },
        ],
      },
      {
        name: "ปักธงชัย",
        subDistricts: [
          { name: "เมืองปัก", zipcode: "30150" },
          { name: "ธงชัยเหนือ", zipcode: "30150" },
          { name: "ตะขบ", zipcode: "30150" },
          { name: "ดอน", zipcode: "30150" },
        ],
      },
      {
        name: "พิมาย",
        subDistricts: [
          { name: "ในเมือง", zipcode: "30110" },
          { name: "รังกาใหญ่", zipcode: "30110" },
          { name: "กระเบื้องใหญ่", zipcode: "30110" },
          { name: "สัมฤทธิ์", zipcode: "30110" },
        ],
      },
      {
        name: "ด่านขุนทด",
        subDistricts: [
          { name: "ด่านขุนทด", zipcode: "30210" },
          { name: "หนองบัวละคร", zipcode: "30210" },
          { name: "บ้านแปรง", zipcode: "30210" },
        ],
      },
      {
        name: "โชคชัย",
        subDistricts: [
          { name: "โชคชัย", zipcode: "30190" },
          { name: "กระโทก", zipcode: "30190" },
          { name: "พลับพลา", zipcode: "30190" },
          { name: "ท่าเยี่ยม", zipcode: "30190" },
        ],
      },
      {
        name: "สูงเนิน",
        subDistricts: [
          { name: "สูงเนิน", zipcode: "30170" },
          { name: "โคราช", zipcode: "30170" },
          { name: "กุดจิก", zipcode: "30170" },
        ],
      },
      {
        name: "โนนไทย",
        subDistricts: [
          { name: "โนนไทย", zipcode: "30220" },
          { name: "ด่านจาก", zipcode: "30220" },
        ],
      },
      {
        name: "บัวใหญ่",
        subDistricts: [
          { name: "บัวใหญ่", zipcode: "30120" },
          { name: "ด่านช้าง", zipcode: "30120" },
        ],
      },
      {
        name: "ชุมพวง",
        subDistricts: [
          { name: "ชุมพวง", zipcode: "30270" },
          { name: "ประสุข", zipcode: "30270" },
        ],
      },
      {
        name: "ครบุรี",
        subDistricts: [
          { name: "แชะ", zipcode: "30250" },
          { name: "ครบุรี", zipcode: "30250" },
        ],
      },
    ],
  },
  {
    name: "ชัยภูมิ",
    districts: [
      {
        name: "เมืองชัยภูมิ",
        subDistricts: [
          { name: "ในเมือง", zipcode: "36000" },
          { name: "บ้านค่าย", zipcode: "36240" },
          { name: "ชีลอง", zipcode: "36000" },
          { name: "หนองบัวระเหว", zipcode: "36250" },
        ],
      },
      {
        name: "ภูเขียว",
        subDistricts: [
          { name: "ผักปัง", zipcode: "36110" },
          { name: "กวางโจน", zipcode: "36110" },
        ],
      },
      {
        name: "แก้งคร้อ",
        subDistricts: [
          { name: "ช่องสามหมอ", zipcode: "36150" },
          { name: "หนองขาม", zipcode: "36150" },
        ],
      },
    ],
  },
  {
    name: "บุรีรัมย์",
    districts: [
      {
        name: "เมืองบุรีรัมย์",
        subDistricts: [
          { name: "ในเมือง", zipcode: "31000" },
          { name: "อิสาณ", zipcode: "31000" },
          { name: "เสม็ด", zipcode: "31000" },
        ],
      },
      {
        name: "นางรอง",
        subDistricts: [
          { name: "นางรอง", zipcode: "31110" },
          { name: "สะเดา", zipcode: "31110" },
        ],
      },
      {
        name: "ประโคนชัย",
        subDistricts: [
          { name: "ประโคนชัย", zipcode: "31140" },
          { name: "แสลงโทน", zipcode: "31140" },
        ],
      },
    ],
  },
  {
    name: "สุรินทร์",
    districts: [
      {
        name: "เมืองสุรินทร์",
        subDistricts: [
          { name: "ในเมือง", zipcode: "32000" },
          { name: "นอกเมือง", zipcode: "32000" },
        ],
      },
      {
        name: "ปราสาท",
        subDistricts: [
          { name: "กังแอน", zipcode: "32140" },
        ],
      },
    ],
  },
  {
    name: "ขอนแก่น",
    districts: [
      {
        name: "เมืองขอนแก่น",
        subDistricts: [
          { name: "ในเมือง", zipcode: "40000" },
          { name: "ศิลา", zipcode: "40000" },
        ],
      },
    ],
  },
  {
    name: "กรุงเทพมหานคร",
    districts: [
      {
        name: "คลองเตย",
        subDistricts: [
          { name: "คลองเตย", zipcode: "10110" },
          { name: "คลองตัน", zipcode: "10110" },
          { name: "พระโขนง", zipcode: "10110" },
        ],
      },
      {
        name: "จตุจักร",
        subDistricts: [
          { name: "จตุจักร", zipcode: "10900" },
          { name: "ลาดยาว", zipcode: "10900" },
          { name: "จอมพล", zipcode: "10900" },
        ],
      },
      {
        name: "บางซื่อ",
        subDistricts: [
          { name: "บางซื่อ", zipcode: "10800" },
          { name: "วงศ์สว่าง", zipcode: "10800" },
        ],
      },
      {
        name: "พญาไท",
        subDistricts: [
          { name: "สามเสนใน", zipcode: "10400" },
          { name: "พญาไท", zipcode: "10400" },
        ],
      },
    ],
  },
  {
    name: "นนทบุรี",
    districts: [
      {
        name: "เมืองนนทบุรี",
        subDistricts: [
          { name: "บางเขน", zipcode: "11000" },
          { name: "สวนใหญ่", zipcode: "11000" },
          { name: "ตลาดขวัญ", zipcode: "11000" },
        ],
      },
      {
        name: "ปากเกร็ด",
        subDistricts: [
          { name: "ปากเกร็ด", zipcode: "11120" },
          { name: "บางพูด", zipcode: "11120" },
          { name: "คลองเกลือ", zipcode: "11120" },
        ],
      },
    ],
  },
  {
    name: "ปทุมธานี",
    districts: [
      {
        name: "คลองหลวง",
        subDistricts: [
          { name: "คลองหนึ่ง", zipcode: "12120" },
          { name: "คลองสอง", zipcode: "12120" },
          { name: "คลองสาม", zipcode: "12120" },
        ],
      },
      {
        name: "ธัญบุรี",
        subDistricts: [
          { name: "รังสิต", zipcode: "12110" },
          { name: "ประชาธิปัตย์", zipcode: "12130" },
        ],
      },
    ],
  },
];
