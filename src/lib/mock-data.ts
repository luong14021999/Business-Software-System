export type SampleStatus =
  | "Đã tiếp nhận"
  | "Đang phân tích"
  | "Chờ duyệt"
  | "Hoàn thành"
  | "Đã trả KQ";

export type Sample = {
  id: string;
  code: string;
  customer: string;
  type: string;
  receivedAt: string;
  dueAt: string;
  technician: string;
  status: SampleStatus;
  progress: number;
  criteria: string[];
};

export const samples: Sample[] = [
  {
    id: "1",
    code: "M-VNNTH-2026-00318",
    customer: "HTX Nông nghiệp Đông Sơn",
    type: "Đất canh tác lúa",
    receivedAt: "2026-05-18",
    dueAt: "2026-05-25",
    technician: "Trần Thị Mai",
    status: "Đang phân tích",
    progress: 62,
    criteria: ["pHKCl", "OM%", "N tổng", "P2O5 dt", "K2O dt", "CEC"],
  },
  {
    id: "2",
    code: "M-VNNTH-2026-00319",
    customer: "HTX Nông nghiệp Sông Mã",
    type: "Đất trồng mía",
    receivedAt: "2026-05-18",
    dueAt: "2026-05-24",
    technician: "Lê Văn Hùng",
    status: "Chờ duyệt",
    progress: 95,
    criteria: ["pHKCl", "OC", "N tổng", "P2O5", "K2O"],
  },
  {
    id: "3",
    code: "M-VNNTH-2026-00320",
    customer: "Trang trại Rau an toàn Yên Định",
    type: "Rau cải – Dư lượng BVTV",
    receivedAt: "2026-05-19",
    dueAt: "2026-05-26",
    technician: "Phạm Thu Hà",
    status: "Đang phân tích",
    progress: 35,
    criteria: [
      "Chlorpyrifos",
      "Cypermethrin",
      "Abamectin",
      "Carbendazim",
      "Imidacloprid",
    ],
  },
  {
    id: "4",
    code: "M-VNNTH-2026-00321",
    customer: "Phòng NN&PTNT huyện Thọ Xuân",
    type: "Nước tưới kênh nội đồng",
    receivedAt: "2026-05-19",
    dueAt: "2026-05-22",
    technician: "Nguyễn Quang Anh",
    status: "Đã tiếp nhận",
    progress: 0,
    criteria: ["pH", "EC", "TSS", "Coliform", "As", "Pb", "Cd"],
  },
  {
    id: "5",
    code: "M-VNNTH-2026-00315",
    customer: "Công ty CP Phân bón Tiến Nông",
    type: "Phân bón NPK 16-16-8",
    receivedAt: "2026-05-15",
    dueAt: "2026-05-20",
    technician: "Đỗ Minh Tuấn",
    status: "Hoàn thành",
    progress: 100,
    criteria: ["N tổng", "P2O5 hh", "K2O hh", "Độ ẩm", "Biuret"],
  },
  {
    id: "6",
    code: "M-VNNTH-2026-00310",
    customer: "HTX Cam Vân Du",
    type: "Quả cam – An toàn thực phẩm",
    receivedAt: "2026-05-12",
    dueAt: "2026-05-18",
    technician: "Trần Thị Mai",
    status: "Đã trả KQ",
    progress: 100,
    criteria: ["Dư lượng BVTV (GC-MS)", "Pb", "Cd", "Nitrat"],
  },
];

export type AnalysisTask = {
  id: string;
  sampleCode: string;
  criterion: string;
  method: string;
  technician: string;
  startedAt: string;
  status: "Chưa bắt đầu" | "Đang thực hiện" | "Hoàn thành" | "QA/QC";
  qaqc: "Đạt" | "Chưa duyệt" | "Cần làm lại";
};

export const analysisTasks: AnalysisTask[] = [
  {
    id: "a1",
    sampleCode: "M-VNNTH-2026-00318",
    criterion: "pHKCl",
    method: "TCVN 5979:2007",
    technician: "Trần Thị Mai",
    startedAt: "2026-05-19 08:30",
    status: "Đang thực hiện",
    qaqc: "Chưa duyệt",
  },
  {
    id: "a2",
    sampleCode: "M-VNNTH-2026-00318",
    criterion: "OM% (Walkley-Black)",
    method: "TCVN 8941:2011",
    technician: "Trần Thị Mai",
    startedAt: "2026-05-19 09:00",
    status: "Đang thực hiện",
    qaqc: "Chưa duyệt",
  },
  {
    id: "a3",
    sampleCode: "M-VNNTH-2026-00319",
    criterion: "N tổng (Kjeldahl)",
    method: "TCVN 6498:1999",
    technician: "Lê Văn Hùng",
    startedAt: "2026-05-18 14:15",
    status: "QA/QC",
    qaqc: "Đạt",
  },
  {
    id: "a4",
    sampleCode: "M-VNNTH-2026-00320",
    criterion: "Chlorpyrifos",
    method: "QuEChERS / GC-MS",
    technician: "Phạm Thu Hà",
    startedAt: "2026-05-19 10:20",
    status: "Đang thực hiện",
    qaqc: "Chưa duyệt",
  },
  {
    id: "a5",
    sampleCode: "M-VNNTH-2026-00315",
    criterion: "P2O5 hữu hiệu",
    method: "TCVN 8559:2010",
    technician: "Đỗ Minh Tuấn",
    startedAt: "2026-05-16 09:00",
    status: "Hoàn thành",
    qaqc: "Đạt",
  },
  {
    id: "a6",
    sampleCode: "M-VNNTH-2026-00321",
    criterion: "As (nước tưới)",
    method: "SMEWW 3114B",
    technician: "Nguyễn Quang Anh",
    startedAt: "—",
    status: "Chưa bắt đầu",
    qaqc: "Chưa duyệt",
  },
];

export type Equipment = {
  id: string;
  code: string;
  name: string;
  model: string;
  location: string;
  lastCalibration: string;
  nextCalibration: string;
  status: "Hoạt động" | "Hiệu chuẩn" | "Bảo trì" | "Ngừng";
  usageHours: number;
  serial?: string; // Số serial/model
  manufacturer?: string; // Nhà sản xuất
  commissionedAt?: string; // Ngày vận hành
  calibrationFreq?: string; // Tần suất hiệu chuẩn
  calibrationPlace?: string; // Nơi thực hiện hiệu chuẩn
  inspectionFreq?: string; // Tần suất kiểm tra/bảo kiểm
  inspectionPlace?: string; // Nơi thực hiện kiểm tra/bảo kiểm
  purpose?: string; // Dùng cho phép thử
  quantity?: string; // Số lượng (VD "1 hệ", "1 bộ/nguyên tố")
  equipmentType?: string; // Loại thiết bị (danh mục)
  isField?: boolean; // Thiết bị quan trắc mang ra hiện trường
  // Trường mã thiết bị theo XaLab (migration 0037).
  instrumentTypeId?: string;
  manufacturerId?: string;
  supplierId?: string;
  yearMade?: number | null;
  calibrationDays?: number | null;
  condition?: string; // Không rõ / Tốt / Bình thường / Kém / Hỏng
  qualityLevel?: string;
  managementSystem?: string;
  active?: boolean;
};

export const equipments: Equipment[] = [
  {
    id: "e1",
    code: "TB-AAS-01",
    name: "Máy quang phổ hấp thụ nguyên tử (AAS)",
    model: "Agilent 240FS",
    location: "P. Hóa lý 1",
    lastCalibration: "2026-02-10",
    nextCalibration: "2026-08-10",
    status: "Hoạt động",
    usageHours: 1240,
  },
  {
    id: "e2",
    code: "TB-ICP-01",
    name: "ICP-MS phân tích kim loại nặng đất – nông sản",
    model: "PerkinElmer NexION 2000",
    location: "P. Đất & Kim loại",
    lastCalibration: "2026-04-02",
    nextCalibration: "2026-06-02",
    status: "Hoạt động",
    usageHours: 860,
  },
  {
    id: "e3",
    code: "TB-HPLC-02",
    name: "HPLC đầu dò UV-VIS",
    model: "Shimadzu LC-2030",
    location: "P. Dư lượng BVTV",
    lastCalibration: "2025-12-20",
    nextCalibration: "2026-06-20",
    status: "Hoạt động",
    usageHours: 2310,
  },
  {
    id: "e4",
    code: "TB-GCMS-01",
    name: "GC-MS phân tích dư lượng thuốc BVTV",
    model: "Agilent 7890B/5977B",
    location: "P. Dư lượng BVTV",
    lastCalibration: "2025-11-15",
    nextCalibration: "2026-05-25",
    status: "Hiệu chuẩn",
    usageHours: 1750,
  },
  {
    id: "e5",
    code: "TB-pH-04",
    name: "Máy đo pH/EC để bàn",
    model: "Hanna HI-5222",
    location: "P. Hóa lý 2",
    lastCalibration: "2026-05-02",
    nextCalibration: "2026-08-02",
    status: "Hoạt động",
    usageHours: 540,
  },
  {
    id: "e6",
    code: "TB-AUTO-01",
    name: "Máy chuẩn độ tự động",
    model: "Metrohm 916 Ti-Touch",
    location: "P. Hóa lý 1",
    lastCalibration: "2026-01-08",
    nextCalibration: "2026-07-08",
    status: "Bảo trì",
    usageHours: 980,
  },
  {
    id: "e7",
    code: "TB-LO-02",
    name: "Tủ sấy đối lưu (sấy mẫu đất, nông sản)",
    model: "Memmert UF160",
    location: "P. Chuẩn bị mẫu",
    lastCalibration: "2026-03-12",
    nextCalibration: "2026-09-12",
    status: "Hoạt động",
    usageHours: 4200,
  },
  {
    id: "e8",
    code: "TB-KJ-01",
    name: "Hệ chưng cất – chuẩn độ Kjeldahl",
    model: "Buchi K-365 / B-324",
    location: "P. Đất & Phân bón",
    lastCalibration: "2026-02-20",
    nextCalibration: "2026-08-20",
    status: "Hoạt động",
    usageHours: 1620,
  },
];

export type ToolCategory =
  | "Dụng cụ thể tích"
  | "Dụng cụ thủy tinh"
  | "Dụng cụ cầm tay"
  | "Vật tư tiêu hao"
  | "Thiết bị nhỏ";

export type Tool = {
  id: string;
  code: string;
  name: string;
  category: ToolCategory;
  spec: string;
  qty: number;
  unit: string;
  minQty: number;
  location: string;
  calibrationRequired: boolean;
  lastCalibration?: string;
  nextCalibration?: string;
  status: "Sẵn sàng" | "Đang dùng" | "Hỏng" | "Chờ kiểm định";
};

export const tools: Tool[] = [
  {
    id: "dc1",
    code: "DC-PIP-001",
    name: "Pipet bán tự động 100–1000 µL",
    category: "Dụng cụ thể tích",
    spec: "Eppendorf Research Plus, độ chính xác ±1.5%",
    qty: 6,
    unit: "cái",
    minQty: 4,
    location: "P. Đất & Phân bón – Tủ DC1",
    calibrationRequired: true,
    lastCalibration: "2026-03-12",
    nextCalibration: "2026-09-12",
    status: "Sẵn sàng",
  },
  {
    id: "dc2",
    code: "DC-PIP-008",
    name: "Pipet 10–100 µL",
    category: "Dụng cụ thể tích",
    spec: "Eppendorf Reference 2, ±0.8%",
    qty: 4,
    unit: "cái",
    minQty: 4,
    location: "P. Dư lượng BVTV – Tủ DC2",
    calibrationRequired: true,
    lastCalibration: "2026-02-20",
    nextCalibration: "2026-08-20",
    status: "Đang dùng",
  },
  {
    id: "dc3",
    code: "DC-BĐM-100",
    name: "Bình định mức 100 mL loại A",
    category: "Dụng cụ thể tích",
    spec: "Schott Duran, hiệu chuẩn 20°C, ±0.10 mL",
    qty: 24,
    unit: "cái",
    minQty: 15,
    location: "Kho dụng cụ thủy tinh – Kệ B",
    calibrationRequired: true,
    lastCalibration: "2025-12-05",
    nextCalibration: "2027-12-05",
    status: "Sẵn sàng",
  },
  {
    id: "dc4",
    code: "DC-BUR-50",
    name: "Buret chuẩn độ 50 mL",
    category: "Dụng cụ thể tích",
    spec: "Schott Duran, loại A, ±0.05 mL",
    qty: 8,
    unit: "cái",
    minQty: 6,
    location: "P. Đất & Phân bón – Kệ chuẩn độ",
    calibrationRequired: true,
    lastCalibration: "2026-01-15",
    nextCalibration: "2028-01-15",
    status: "Chờ kiểm định",
  },
  {
    id: "dc5",
    code: "DC-ON-15",
    name: "Ống nghiệm thủy tinh 15 mL có nắp",
    category: "Dụng cụ thủy tinh",
    spec: "Pyrex, chịu nhiệt 250°C",
    qty: 320,
    unit: "cái",
    minQty: 200,
    location: "Kho dụng cụ thủy tinh – Kệ A",
    calibrationRequired: false,
    status: "Sẵn sàng",
  },
  {
    id: "dc6",
    code: "DC-CL-450",
    name: "Cốc thủy tinh chịu nhiệt 250 mL",
    category: "Dụng cụ thủy tinh",
    spec: "Pyrex, vạch chia",
    qty: 45,
    unit: "cái",
    minQty: 30,
    location: "Kho dụng cụ thủy tinh – Kệ A",
    calibrationRequired: false,
    status: "Sẵn sàng",
  },
  {
    id: "dc7",
    code: "DC-FT-22",
    name: "Phễu lọc Whatman GF/A 47mm",
    category: "Vật tư tiêu hao",
    spec: "Sợi thủy tinh, lỗ 1.6 µm",
    qty: 120,
    unit: "hộp",
    minQty: 50,
    location: "Kho vật tư – Tủ VT1",
    calibrationRequired: false,
    status: "Sẵn sàng",
  },
  {
    id: "dc8",
    code: "DC-VOR-01",
    name: "Máy lắc vortex",
    category: "Thiết bị nhỏ",
    spec: "Velp ZX3, 200–2500 rpm",
    qty: 3,
    unit: "cái",
    minQty: 2,
    location: "P. Dư lượng BVTV",
    calibrationRequired: false,
    status: "Sẵn sàng",
  },
  {
    id: "dc9",
    code: "DC-CC-12",
    name: "Cối – chày sứ ø 120mm",
    category: "Dụng cụ cầm tay",
    spec: "Sứ chịu lực, đồng bộ chày sứ",
    qty: 8,
    unit: "bộ",
    minQty: 5,
    location: "P. Chuẩn bị mẫu",
    calibrationRequired: false,
    status: "Sẵn sàng",
  },
  {
    id: "dc10",
    code: "DC-RAY-200",
    name: "Rây mắt 2.0 mm (chuẩn bị mẫu đất)",
    category: "Dụng cụ cầm tay",
    spec: "Inox 304, ø 200 mm",
    qty: 3,
    unit: "cái",
    minQty: 3,
    location: "P. Chuẩn bị mẫu",
    calibrationRequired: false,
    status: "Đang dùng",
  },
];

export type Chemical = {
  id: string;
  code: string;
  name: string;
  cas: string;
  unit: string;
  stock: number;
  minStock: number;
  expiry: string;
  hazard: "Thường" | "Độc hại" | "Dễ cháy" | "Ăn mòn";
  location: string;
  technicalSpec: string;
  manufacturer: string;
  manufactureDate: string;
  receivedAt: string;
  storageCondition: string;
  usedFor: string[];
  isReference?: boolean;
};

export const chemicals: Chemical[] = [
  {
    id: "c1",
    code: "HC-0123",
    name: "Acid nitric HNO3 65%",
    cas: "7697-37-2",
    unit: "lít",
    stock: 18,
    minStock: 10,
    expiry: "2027-04-30",
    hazard: "Ăn mòn",
    location: "Kho acid – Tủ A1",
    technicalSpec: "Tinh khiết phân tích AR, ≥ 65%",
    manufacturer: "Merck",
    manufactureDate: "2025-04-30",
    receivedAt: "2025-06-12",
    storageCondition: "Tủ chống ăn mòn, thông gió, ≤ 28°C",
    usedFor: ["Phá mẫu KLN", "ICP-MS / AAS"],
  },
  {
    id: "c2",
    code: "HC-0145",
    name: "Acid sulfuric H2SO4 98%",
    cas: "7664-93-9",
    unit: "lít",
    stock: 6,
    minStock: 8,
    expiry: "2027-10-30",
    hazard: "Ăn mòn",
    location: "Kho acid – Tủ A2",
    technicalSpec: "Tinh khiết phân tích AR, ≥ 98%",
    manufacturer: "Xilong",
    manufactureDate: "2025-10-30",
    receivedAt: "2025-12-05",
    storageCondition: "Tủ chống ăn mòn, tách riêng acid – base",
    usedFor: ["Kjeldahl – đạm tổng", "Phá mẫu phân bón"],
  },
  {
    id: "c3",
    code: "HC-0210",
    name: "Methanol HPLC",
    cas: "67-56-1",
    unit: "lít",
    stock: 22,
    minStock: 12,
    expiry: "2027-01-15",
    hazard: "Dễ cháy",
    location: "Kho dung môi – Tủ S1",
    technicalSpec: "HPLC grade, ≥ 99.9%",
    manufacturer: "Honeywell",
    manufactureDate: "2025-01-15",
    receivedAt: "2025-03-02",
    storageCondition: "Tủ chống cháy, tránh nguồn nhiệt, ≤ 25°C",
    usedFor: ["HPLC dư lượng BVTV", "QuEChERS"],
  },
  {
    id: "c4",
    code: "HC-0308",
    name: "Dung dịch chuẩn As 1000 ppm",
    cas: "—",
    unit: "ml",
    stock: 250,
    minStock: 200,
    expiry: "2026-09-01",
    hazard: "Độc hại",
    location: "Tủ chuẩn – Ngăn 3",
    technicalSpec: "Chuẩn quốc gia, độ không đảm bảo ±0.5%",
    manufacturer: "Merck CertiPUR",
    manufactureDate: "2024-09-01",
    receivedAt: "2024-10-15",
    storageCondition: "Tủ chuẩn 2 – 8°C, tránh ánh sáng",
    usedFor: ["AAS – As", "ICP-MS – KLN đất, nông sản"],
    isReference: true,
  },
  {
    id: "c8",
    code: "HC-0703",
    name: "Hỗn hợp chuẩn BVTV (Chlorpyrifos, Cypermethrin...)",
    cas: "—",
    unit: "ml",
    stock: 35,
    minStock: 50,
    expiry: "2026-07-30",
    hazard: "Độc hại",
    location: "Tủ chuẩn lạnh – Ngăn 1",
    technicalSpec: "Hỗn hợp 20 BVTV, 100 µg/mL, trong acetonitril",
    manufacturer: "Sigma Aldrich",
    manufactureDate: "2024-07-30",
    receivedAt: "2024-09-10",
    storageCondition: "Tủ lạnh ≤ -18°C, kín khí",
    usedFor: ["GC-MS dư lượng BVTV", "QuEChERS rau quả"],
    isReference: true,
  },
  {
    id: "c9",
    code: "HC-0801",
    name: "Dung dịch đệm KCl 1M",
    cas: "7447-40-7",
    unit: "lít",
    stock: 12,
    minStock: 5,
    expiry: "2027-02-28",
    hazard: "Thường",
    location: "Tủ chuẩn – Ngăn 4",
    technicalSpec: "Pha sẵn 1M, độ tinh khiết ≥ 99%",
    manufacturer: "Pha nội bộ – PTN VNNTH",
    manufactureDate: "2026-02-28",
    receivedAt: "2026-02-28",
    storageCondition: "Nhiệt độ phòng, đậy kín",
    usedFor: ["Đo pHKCl đất", "Chuẩn bị mẫu OM"],
  },
  {
    id: "c5",
    code: "HC-0412",
    name: "Kali dichromate K2Cr2O7",
    cas: "7778-50-9",
    unit: "kg",
    stock: 0.3,
    minStock: 0.5,
    expiry: "2026-08-30",
    hazard: "Độc hại",
    location: "Tủ rắn – Ngăn 2",
    technicalSpec: "AR, tinh khiết ≥ 99.5%",
    manufacturer: "Xilong",
    manufactureDate: "2024-08-30",
    receivedAt: "2024-11-05",
    storageCondition: "Tủ khô, tránh ánh sáng, riêng biệt chất oxy hóa",
    usedFor: ["OM% – Walkley-Black", "Phân tích chất hữu cơ đất"],
  },
  {
    id: "c6",
    code: "HC-0501",
    name: "Đệm pH 4.01",
    cas: "—",
    unit: "lít",
    stock: 4,
    minStock: 2,
    expiry: "2026-06-30",
    hazard: "Thường",
    location: "Tủ chuẩn – Ngăn 1",
    technicalSpec: "Dung dịch đệm chuẩn pH 4.01 ± 0.02 ở 25°C",
    manufacturer: "Hanna Instruments",
    manufactureDate: "2024-06-30",
    receivedAt: "2024-08-12",
    storageCondition: "Nhiệt độ phòng, đậy kín sau khi dùng",
    usedFor: ["Hiệu chuẩn máy đo pH"],
    isReference: true,
  },
  {
    id: "c7",
    code: "HC-0612",
    name: "Acetonitril HPLC",
    cas: "75-05-8",
    unit: "lít",
    stock: 9,
    minStock: 6,
    expiry: "2027-03-10",
    hazard: "Dễ cháy",
    location: "Kho dung môi – Tủ S2",
    technicalSpec: "HPLC grade, ≥ 99.9%, lọc 0.2 µm",
    manufacturer: "Honeywell",
    manufactureDate: "2025-03-10",
    receivedAt: "2025-05-01",
    storageCondition: "Tủ chống cháy, tránh nguồn nhiệt",
    usedFor: ["HPLC – BVTV", "QuEChERS – chiết rau quả"],
  },
];

export type ChemicalUsageLog = {
  id: string;
  chemicalCode: string;
  chemicalName: string;
  category?: string; // Chủng loại (hóa chất / chất chuẩn / dung môi...)
  qty: number;
  unit: string;
  sampleCode: string;
  method: string;
  technician: string; // Người sử dụng
  usedAt: string; // Ngày xuất
  remaining?: number; // Khối lượng dư
  purpose?: string; // Mục đích sử dụng
};

export const chemicalUsageLogs: ChemicalUsageLog[] = [
  {
    id: "uc1",
    chemicalCode: "HC-0123",
    chemicalName: "Acid nitric HNO3 65%",
    qty: 0.5,
    unit: "lít",
    sampleCode: "M-VNNTH-2026-00321",
    method: "Phá mẫu KLN – nước tưới",
    technician: "Nguyễn Quang Anh",
    usedAt: "2026-05-19 14:10",
  },
  {
    id: "uc2",
    chemicalCode: "HC-0703",
    chemicalName: "Hỗn hợp chuẩn BVTV",
    qty: 5,
    unit: "ml",
    sampleCode: "M-VNNTH-2026-00320",
    method: "QuEChERS – rau cải",
    technician: "Phạm Thu Hà",
    usedAt: "2026-05-19 10:40",
  },
  {
    id: "uc3",
    chemicalCode: "HC-0801",
    chemicalName: "Dung dịch đệm KCl 1M",
    qty: 0.25,
    unit: "lít",
    sampleCode: "M-VNNTH-2026-00318",
    method: "Đo pHKCl đất ruộng lúa",
    technician: "Trần Thị Mai",
    usedAt: "2026-05-19 08:30",
  },
  {
    id: "uc4",
    chemicalCode: "HC-0412",
    chemicalName: "Kali dichromate K2Cr2O7",
    qty: 0.05,
    unit: "kg",
    sampleCode: "M-VNNTH-2026-00318",
    method: "OM% – Walkley-Black",
    technician: "Trần Thị Mai",
    usedAt: "2026-05-19 09:15",
  },
  {
    id: "uc5",
    chemicalCode: "HC-0145",
    chemicalName: "Acid sulfuric H2SO4 98%",
    qty: 0.3,
    unit: "lít",
    sampleCode: "M-VNNTH-2026-00319",
    method: "Kjeldahl – đạm tổng",
    technician: "Lê Văn Hùng",
    usedAt: "2026-05-18 14:15",
  },
  {
    id: "uc6",
    chemicalCode: "HC-0308",
    chemicalName: "Dung dịch chuẩn As 1000 ppm",
    qty: 25,
    unit: "ml",
    sampleCode: "M-VNNTH-2026-00321",
    method: "AAS – chuẩn nội bộ",
    technician: "Nguyễn Quang Anh",
    usedAt: "2026-05-18 16:20",
  },
];

export type CustomerKind =
  | "Doanh nghiệp"
  | "HTX / Trang trại"
  | "Nông hộ"
  | "Cơ quan nhà nước"
  | "Viện / Trường";

export type Customer = {
  id: string;
  code: string;
  name: string;
  kind: CustomerKind;
  contact: string;
  phone: string;
  address: string;
  samplesYTD: number;
  lastSampleAt: string;
};

export const customers: Customer[] = [
  {
    id: "kh1",
    code: "KH-VNNTH-0124",
    name: "HTX Nông nghiệp Sông Mã",
    kind: "HTX / Trang trại",
    contact: "Ông Lê Văn Hợp",
    phone: "0912 345 678",
    address: "Xã Cẩm Thành, huyện Cẩm Thủy, Thanh Hóa",
    samplesYTD: 28,
    lastSampleAt: "2026-05-18",
  },
  {
    id: "kh2",
    code: "KH-VNNTH-0118",
    name: "Công ty CP Phân bón Tiến Nông",
    kind: "Doanh nghiệp",
    contact: "Bà Nguyễn Thị Lan",
    phone: "0918 226 145",
    address: "Khu CN Đình Hương – Tây Bắc Ga, TP Thanh Hóa",
    samplesYTD: 64,
    lastSampleAt: "2026-05-15",
  },
  {
    id: "kh3",
    code: "KH-VNNTH-0211",
    name: "HTX Cam Vân Du",
    kind: "HTX / Trang trại",
    contact: "Ông Trịnh Văn Sơn",
    phone: "0905 778 412",
    address: "Thị trấn Vân Du, huyện Thạch Thành, Thanh Hóa",
    samplesYTD: 17,
    lastSampleAt: "2026-05-12",
  },
  {
    id: "kh4",
    code: "KH-VNNTH-0156",
    name: "Phòng NN&PTNT huyện Thọ Xuân",
    kind: "Cơ quan nhà nước",
    contact: "Ông Hoàng Minh Đức",
    phone: "0237 3 833 220",
    address: "TT Thọ Xuân, huyện Thọ Xuân, Thanh Hóa",
    samplesYTD: 41,
    lastSampleAt: "2026-05-19",
  },
  {
    id: "kh5",
    code: "KH-VNNTH-0298",
    name: "Trang trại Rau an toàn Yên Định",
    kind: "HTX / Trang trại",
    contact: "Bà Phạm Thị Hằng",
    phone: "0987 654 321",
    address: "Xã Định Tường, huyện Yên Định, Thanh Hóa",
    samplesYTD: 22,
    lastSampleAt: "2026-05-19",
  },
  {
    id: "kh6",
    code: "KH-VNNTH-0312",
    name: "Hộ ông Lê Bá Khánh",
    kind: "Nông hộ",
    contact: "Ông Lê Bá Khánh",
    phone: "0944 112 233",
    address: "Xã Hà Long, huyện Hà Trung, Thanh Hóa",
    samplesYTD: 4,
    lastSampleAt: "2026-04-28",
  },
  {
    id: "kh7",
    code: "KH-VNNTH-0335",
    name: "Trường Đại học Hồng Đức",
    kind: "Viện / Trường",
    contact: "TS. Nguyễn Quốc Tuấn",
    phone: "0237 3 910 222",
    address: "565 Quang Trung, TP Thanh Hóa",
    samplesYTD: 9,
    lastSampleAt: "2026-04-15",
  },
];

export type Staff = {
  id: string;
  code: string;
  fullName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  joinedAt: string;
  competencies: string[];
  trainings: { name: string; year: number }[];
  status: "Đang làm việc" | "Nghỉ phép" | "Thử việc";
  // Theo form Nhân viên của XaLab (migration 0041).
  salutation?: string;
  phone2?: string;
  signFor?: string;
  collaborator?: boolean;
  departmentId?: string;
  /** Quyền bị chặn riêng cho nhân viên này (VD "view.customers"). */
  denied?: string[];
};

export const staff: Staff[] = [
  {
    id: "ns1",
    code: "NV-VNNTH-0012",
    fullName: "Nguyễn Đình Lương",
    position: "Trưởng phòng PTN",
    department: "Ban Giám đốc PTN",
    email: "luongnd@vnnth.gov.vn",
    phone: "0912 800 121",
    joinedAt: "2014-03-01",
    competencies: ["Quản lý ISO/IEC 17025", "Phân tích kim loại nặng", "Phê duyệt KQ"],
    trainings: [
      { name: "ISO/IEC 17025:2017 – ĐLVN", year: 2024 },
      { name: "Đánh giá nội bộ PTN", year: 2025 },
    ],
    status: "Đang làm việc",
  },
  {
    id: "ns2",
    code: "NV-VNNTH-0034",
    fullName: "Trần Thị Mai",
    position: "Phó phòng – Phụ trách QA/QC",
    department: "Nhóm Đảm bảo chất lượng",
    email: "maitt@vnnth.gov.vn",
    phone: "0987 211 504",
    joinedAt: "2016-09-15",
    competencies: ["QA/QC", "Hóa lý", "Đánh giá độ không đảm bảo đo"],
    trainings: [
      { name: "Ước lượng độ không đảm bảo đo", year: 2024 },
      { name: "Kiểm soát mẫu chuẩn nội bộ", year: 2025 },
    ],
    status: "Đang làm việc",
  },
  {
    id: "ns3",
    code: "NV-VNNTH-0067",
    fullName: "Lê Văn Hùng",
    position: "Kỹ thuật viên chính",
    department: "Nhóm Đất & Phân bón",
    email: "hunglv@vnnth.gov.vn",
    phone: "0973 442 119",
    joinedAt: "2018-04-10",
    competencies: ["Phân tích đất", "Phân tích phân bón", "Kjeldahl", "AAS"],
    trainings: [
      { name: "Phương pháp phân tích đất theo TCVN", year: 2023 },
      { name: "AAS – kim loại nặng trong đất", year: 2024 },
    ],
    status: "Đang làm việc",
  },
  {
    id: "ns4",
    code: "NV-VNNTH-0082",
    fullName: "Phạm Thu Hà",
    position: "Kỹ thuật viên",
    department: "Nhóm Dư lượng BVTV & ATTP",
    email: "haptt@vnnth.gov.vn",
    phone: "0908 776 540",
    joinedAt: "2020-06-22",
    competencies: ["GC-MS", "HPLC", "QuEChERS"],
    trainings: [
      { name: "QuEChERS – chiết tách dư lượng BVTV", year: 2024 },
      { name: "Vận hành GC-MS Agilent", year: 2025 },
    ],
    status: "Đang làm việc",
  },
  {
    id: "ns5",
    code: "NV-VNNTH-0094",
    fullName: "Nguyễn Quang Anh",
    position: "Kỹ thuật viên",
    department: "Nhóm Nước & Môi trường",
    email: "anhnq@vnnth.gov.vn",
    phone: "0916 330 887",
    joinedAt: "2021-11-08",
    competencies: ["ICP-MS", "Phân tích nước", "SMEWW"],
    trainings: [
      { name: "ICP-MS – kim loại trong nước tưới", year: 2024 },
    ],
    status: "Nghỉ phép",
  },
  {
    id: "ns6",
    code: "NV-VNNTH-0103",
    fullName: "Đỗ Minh Tuấn",
    position: "Kỹ thuật viên",
    department: "Nhóm Đất & Phân bón",
    email: "tuandm@vnnth.gov.vn",
    phone: "0939 218 661",
    joinedAt: "2022-02-14",
    competencies: ["Phân tích phân bón", "P2O5 hữu hiệu", "Chuẩn độ"],
    trainings: [{ name: "Phân tích phân bón TCVN 8559:2010", year: 2024 }],
    status: "Đang làm việc",
  },
  {
    id: "ns7",
    code: "NV-VNNTH-0118",
    fullName: "Hoàng Thị Linh",
    position: "Nhân viên tiếp nhận mẫu",
    department: "Văn phòng PTN",
    email: "linhht@vnnth.gov.vn",
    phone: "0934 552 109",
    joinedAt: "2025-09-01",
    competencies: ["Tiếp nhận mẫu", "Lập phiếu", "QR mã hóa"],
    trainings: [{ name: "Quản lý hồ sơ mẫu ISO/IEC 17025", year: 2025 }],
    status: "Thử việc",
  },
];

export type EquipmentUsageLog = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  technician: string;
  sampleCode: string;
  startedAt: string;
  durationMin: number;
};

export const equipmentUsageLogs: EquipmentUsageLog[] = [
  {
    id: "u1",
    equipmentCode: "TB-ICP-01",
    equipmentName: "ICP-MS",
    technician: "Nguyễn Quang Anh",
    sampleCode: "M-VNNTH-2026-00321",
    startedAt: "2026-05-19 14:20",
    durationMin: 95,
  },
  {
    id: "u2",
    equipmentCode: "TB-GCMS-01",
    equipmentName: "GC-MS dư lượng BVTV",
    technician: "Phạm Thu Hà",
    sampleCode: "M-VNNTH-2026-00320",
    startedAt: "2026-05-19 10:40",
    durationMin: 140,
  },
  {
    id: "u3",
    equipmentCode: "TB-KJ-01",
    equipmentName: "Hệ Kjeldahl",
    technician: "Lê Văn Hùng",
    sampleCode: "M-VNNTH-2026-00319",
    startedAt: "2026-05-19 08:55",
    durationMin: 75,
  },
  {
    id: "u4",
    equipmentCode: "TB-AAS-01",
    equipmentName: "AAS",
    technician: "Đỗ Minh Tuấn",
    sampleCode: "M-VNNTH-2026-00315",
    startedAt: "2026-05-18 15:10",
    durationMin: 60,
  },
  {
    id: "u5",
    equipmentCode: "TB-pH-04",
    equipmentName: "pH/EC để bàn",
    technician: "Trần Thị Mai",
    sampleCode: "M-VNNTH-2026-00318",
    startedAt: "2026-05-18 09:00",
    durationMin: 25,
  },
];

export type MaintenanceEntry = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  scheduledAt: string;
  kind: "Bảo trì định kỳ" | "Hiệu chuẩn" | "Sửa chữa";
  vendor: string;
};

export type EnvironmentReading = {
  id: string;
  room: string;
  monitoringDevice: string; // AEMD-BM-10.02: "Thiết bị sử dụng để kiểm soát"
  parameter: "Nhiệt độ" | "Độ ẩm";
  value: number;
  unit: string;
  limit: string;
  recordedAt: string;
  observer: string;
  pass: boolean;
  note?: string;
};

// Sinh 25 record cho phòng Đất & Phân bón × Nhiệt độ tháng 7/2026
// (mô phỏng phiếu theo dõi hàng ngày AEMD-BM-10.02)
const dailyReadingsSoilTemp: EnvironmentReading[] = [
  22.5, 23.1, 22.8, 24.0, 23.5, 22.9, 23.7, 24.2, 23.0, 22.7,
  23.4, 24.1, 25.3, 22.6, 23.9, 24.5, 23.2, 22.8, 24.7, 23.5,
  22.9, 23.6, 24.0, 23.8, 22.5,
].map((v, i) => ({
  id: `evd-soil-t-${i + 1}`,
  room: "P. Đất & Phân bón",
  monitoringDevice: "Nhiệt kế Hanna HI-91410",
  parameter: "Nhiệt độ" as const,
  value: v,
  unit: "°C",
  limit: "20 – 25 °C",
  recordedAt: `2026-07-${String(i + 1).padStart(2, "0")} 08:00`,
  observer: i % 3 === 0 ? "Lê Văn Hùng" : i % 3 === 1 ? "Đỗ Minh Tuấn" : "Trần Thị Mai",
  pass: v >= 20 && v <= 25,
  note: v > 25 ? "Bật thêm điều hòa" : undefined,
}));

export const environmentReadings: EnvironmentReading[] = [
  ...dailyReadingsSoilTemp,
  {
    id: "ev1",
    room: "P. Đất & Phân bón",
    monitoringDevice: "Ẩm kế Testo 174H",
    parameter: "Độ ẩm",
    value: 58,
    unit: "%RH",
    limit: "≤ 65 %RH",
    recordedAt: "2026-07-01 08:00",
    observer: "Lê Văn Hùng",
    pass: true,
  },
  {
    id: "ev2",
    room: "P. Đất & Phân bón",
    monitoringDevice: "Ẩm kế Testo 174H",
    parameter: "Độ ẩm",
    value: 62,
    unit: "%RH",
    limit: "≤ 65 %RH",
    recordedAt: "2026-07-05 08:00",
    observer: "Lê Văn Hùng",
    pass: true,
  },
  {
    id: "ev3",
    room: "P. Dư lượng BVTV",
    monitoringDevice: "Nhiệt kế Hanna HI-91410",
    parameter: "Nhiệt độ",
    value: 22.8,
    unit: "°C",
    limit: "20 – 24 °C",
    recordedAt: "2026-07-15 08:05",
    observer: "Phạm Thu Hà",
    pass: true,
  },
  {
    id: "ev4",
    room: "P. Dư lượng BVTV",
    monitoringDevice: "Ẩm kế Testo 174H",
    parameter: "Độ ẩm",
    value: 67,
    unit: "%RH",
    limit: "≤ 60 %RH",
    recordedAt: "2026-07-15 08:05",
    observer: "Phạm Thu Hà",
    pass: false,
    note: "Vượt 7% – bật hút ẩm; xin ý kiến Trưởng phòng",
  },
  {
    id: "ev5",
    room: "Kho hóa chất",
    monitoringDevice: "Nhiệt kế cầm tay Hanna",
    parameter: "Nhiệt độ",
    value: 26.0,
    unit: "°C",
    limit: "≤ 28 °C",
    recordedAt: "2026-07-20 08:10",
    observer: "Hoàng Thị Linh",
    pass: true,
  },
  {
    id: "ev6",
    room: "Tủ chuẩn lạnh",
    monitoringDevice: "Data logger Elitech RC-4",
    parameter: "Nhiệt độ",
    value: 3.4,
    unit: "°C",
    limit: "2 – 8 °C",
    recordedAt: "2026-05-20 08:12",
    observer: "Phạm Thu Hà",
    pass: true,
  },
];

export const maintenanceSchedule: MaintenanceEntry[] = [
  {
    id: "m1",
    equipmentCode: "TB-GCMS-01",
    equipmentName: "GC-MS dư lượng BVTV",
    scheduledAt: "2026-05-25",
    kind: "Hiệu chuẩn",
    vendor: "Agilent VN",
  },
  {
    id: "m2",
    equipmentCode: "TB-ICP-01",
    equipmentName: "ICP-MS",
    scheduledAt: "2026-06-02",
    kind: "Hiệu chuẩn",
    vendor: "PerkinElmer VN",
  },
  {
    id: "m3",
    equipmentCode: "TB-AUTO-01",
    equipmentName: "Máy chuẩn độ tự động",
    scheduledAt: "2026-06-10",
    kind: "Bảo trì định kỳ",
    vendor: "Metrohm – đại lý KV2",
  },
  {
    id: "m4",
    equipmentCode: "TB-HPLC-02",
    equipmentName: "HPLC UV-VIS",
    scheduledAt: "2026-06-20",
    kind: "Hiệu chuẩn",
    vendor: "Shimadzu VN",
  },
  {
    id: "m5",
    equipmentCode: "TB-KJ-01",
    equipmentName: "Hệ Kjeldahl",
    scheduledAt: "2026-08-20",
    kind: "Bảo trì định kỳ",
    vendor: "Buchi VN",
  },
];

export type ArchivedSample = {
  id: string;
  archiveCode: string;
  originalSampleCode: string;
  customer: string;
  type: string;
  archivedAt: string;
  expiryAt: string;
  location: string;
  storageCondition: string;
  amount: string;
  status: "Đang lưu" | "Đã phân tích QC" | "Đã hủy";
  qcAnalysisAt?: string;
  qcNote?: string;
  purpose: string;
};

export const archivedSamples: ArchivedSample[] = [
  {
    id: "ml1",
    archiveCode: "ML-VNNTH-2026-001",
    originalSampleCode: "M-VNNTH-2026-00310",
    customer: "HTX Cam Vân Du",
    type: "Quả cam – An toàn thực phẩm",
    archivedAt: "2026-05-18",
    expiryAt: "2026-08-18",
    location: "Tủ đông -20°C – Ngăn C2",
    storageCondition: "Đông sâu -20°C, kín khí, gói foil",
    amount: "≈ 200 g",
    status: "Đang lưu",
    purpose: "Phân tích đối chứng QC nội bộ 3 tháng",
  },
  {
    id: "ml2",
    archiveCode: "ML-VNNTH-2026-002",
    originalSampleCode: "M-VNNTH-2026-00315",
    customer: "Công ty CP Phân bón Tiến Nông",
    type: "Phân bón NPK 16-16-8",
    archivedAt: "2026-05-20",
    expiryAt: "2026-11-20",
    location: "Kho mẫu khô – Kệ M3",
    storageCondition: "Nhiệt độ phòng, hộp kín, hút ẩm",
    amount: "≈ 500 g",
    status: "Đang lưu",
    purpose: "Mẫu đối chứng phân bón – tái lặp 3 tháng",
  },
  {
    id: "ml3",
    archiveCode: "ML-VNNTH-2026-003",
    originalSampleCode: "M-VNNTH-2026-00319",
    customer: "HTX Nông nghiệp Sông Mã",
    type: "Đất trồng mía",
    archivedAt: "2026-05-19",
    expiryAt: "2027-05-19",
    location: "Kho mẫu khô – Kệ M1",
    storageCondition: "Nhiệt độ phòng, túi PE kín",
    amount: "≈ 800 g",
    status: "Đang lưu",
    purpose: "Lưu đối chiếu đất – tái lặp định kỳ",
  },
  {
    id: "ml4",
    archiveCode: "ML-VNNTH-2026-004",
    originalSampleCode: "M-VNNTH-2026-00320",
    customer: "Trang trại Rau an toàn Yên Định",
    type: "Rau cải – Dư lượng BVTV",
    archivedAt: "2026-05-22",
    expiryAt: "2026-06-22",
    location: "Tủ đông -20°C – Ngăn C1",
    storageCondition: "Đông sâu -20°C, kín khí",
    amount: "≈ 150 g",
    status: "Đang lưu",
    purpose: "Mẫu lưu rau quả – hạn ngắn (1 tháng)",
  },
  {
    id: "ml5",
    archiveCode: "ML-VNNTH-2026-005",
    originalSampleCode: "M-VNNTH-2026-00321",
    customer: "Phòng NN&PTNT huyện Thọ Xuân",
    type: "Nước tưới kênh nội đồng",
    archivedAt: "2026-05-21",
    expiryAt: "2026-06-21",
    location: "Tủ lạnh 4°C – Ngăn B3",
    storageCondition: "Bảo quản 2 – 8°C, axit hóa pH<2",
    amount: "≈ 500 ml",
    status: "Đang lưu",
    purpose: "Mẫu lưu nước – đối chứng KLN",
  },
  {
    id: "ml6",
    archiveCode: "ML-VNNTH-2026-006",
    originalSampleCode: "M-VNNTH-2026-00280",
    customer: "HTX Nông nghiệp Đông Sơn",
    type: "Đất canh tác lúa",
    archivedAt: "2026-02-15",
    expiryAt: "2027-02-15",
    location: "Kho mẫu khô – Kệ M1",
    storageCondition: "Nhiệt độ phòng, túi PE kín",
    amount: "≈ 800 g",
    status: "Đã phân tích QC",
    qcAnalysisAt: "2026-05-15",
    qcNote: "Tái lặp pHKCl & OM% – sai số < 5%, ĐẠT",
    purpose: "Tái lặp 3 tháng – mẫu đối chứng đất",
  },
  {
    id: "ml7",
    archiveCode: "ML-VNNTH-2025-098",
    originalSampleCode: "M-VNNTH-2025-00910",
    customer: "Công ty TNHH Mía đường Lam Sơn",
    type: "Đất trồng mía – đối chứng",
    archivedAt: "2025-11-02",
    expiryAt: "2026-05-02",
    location: "Kho mẫu khô – Kệ M2",
    storageCondition: "Nhiệt độ phòng",
    amount: "≈ 0 g",
    status: "Đã hủy",
    qcAnalysisAt: "2026-05-05",
    qcNote: "Đã hủy theo BB-HM-2026-003, hết hạn lưu",
    purpose: "Mẫu lưu định kỳ – đã hết hạn",
  },
];

export type QCPoint = {
  date: string;
  value: number;
  technician: string;
};

export type WestgardRule = "1-3s" | "2-2s" | "R-4s" | "4-1s" | "10x";

export type QCChart = {
  id: string;
  criterion: string;
  matrix: string;
  method: string;
  unit: string;
  mean: number;
  sd: number;
  referenceMaterial: string;
  points: QCPoint[];
};

export const qcCharts: QCChart[] = [
  {
    id: "qc1",
    criterion: "Pb tổng",
    matrix: "Đất",
    method: "AAS – TCVN 6649:2000",
    unit: "mg/kg",
    mean: 15.2,
    sd: 1.1,
    referenceMaterial: "CRM NIST 2710a – pha loãng x10",
    points: [
      { date: "2025-04-08", value: 14.8, technician: "Nguyễn Quang Anh" },
      { date: "2025-05-06", value: 15.4, technician: "Nguyễn Quang Anh" },
      { date: "2025-06-10", value: 15.1, technician: "Đỗ Minh Tuấn" },
      { date: "2025-07-08", value: 14.9, technician: "Nguyễn Quang Anh" },
      { date: "2025-08-05", value: 15.6, technician: "Lê Văn Hùng" },
      { date: "2025-09-09", value: 14.7, technician: "Nguyễn Quang Anh" },
      { date: "2025-10-07", value: 15.3, technician: "Đỗ Minh Tuấn" },
      { date: "2025-11-04", value: 15.0, technician: "Nguyễn Quang Anh" },
      { date: "2025-12-02", value: 17.5, technician: "Đỗ Minh Tuấn" },
      { date: "2026-01-06", value: 17.6, technician: "Nguyễn Quang Anh" },
      { date: "2026-02-03", value: 15.2, technician: "Lê Văn Hùng" },
      { date: "2026-03-10", value: 14.8, technician: "Đỗ Minh Tuấn" },
      { date: "2026-04-07", value: 15.5, technician: "Nguyễn Quang Anh" },
      { date: "2026-05-05", value: 14.9, technician: "Đỗ Minh Tuấn" },
      { date: "2026-06-02", value: 18.7, technician: "Nguyễn Quang Anh" },
    ],
  },
  {
    id: "qc2",
    criterion: "Cd tổng",
    matrix: "Nông sản (rau quả)",
    method: "ICP-MS – TCVN 7929:2008",
    unit: "mg/kg",
    mean: 0.08,
    sd: 0.012,
    referenceMaterial: "CRM ERM-CD281 (cải bó xôi)",
    points: [
      { date: "2025-05-12", value: 0.078, technician: "Phạm Thu Hà" },
      { date: "2025-06-09", value: 0.082, technician: "Nguyễn Quang Anh" },
      { date: "2025-07-14", value: 0.075, technician: "Phạm Thu Hà" },
      { date: "2025-08-11", value: 0.085, technician: "Phạm Thu Hà" },
      { date: "2025-09-08", value: 0.079, technician: "Nguyễn Quang Anh" },
      { date: "2025-10-13", value: 0.083, technician: "Phạm Thu Hà" },
      { date: "2025-11-10", value: 0.077, technician: "Phạm Thu Hà" },
      { date: "2025-12-08", value: 0.081, technician: "Nguyễn Quang Anh" },
      { date: "2026-01-12", value: 0.084, technician: "Phạm Thu Hà" },
      { date: "2026-02-09", value: 0.076, technician: "Phạm Thu Hà" },
      { date: "2026-03-09", value: 0.082, technician: "Nguyễn Quang Anh" },
      { date: "2026-04-13", value: 0.080, technician: "Phạm Thu Hà" },
      { date: "2026-05-11", value: 0.079, technician: "Phạm Thu Hà" },
      { date: "2026-06-08", value: 0.083, technician: "Nguyễn Quang Anh" },
    ],
  },
  {
    id: "qc3",
    criterion: "P₂O₅ hữu hiệu",
    matrix: "Phân bón NPK",
    method: "Quang phổ Mo-vanadat – TCVN 8559:2010",
    unit: "%",
    mean: 8.4,
    sd: 0.32,
    referenceMaterial: "Mẫu chuẩn nội bộ – pha lặp",
    points: [
      { date: "2025-06-03", value: 8.3, technician: "Đỗ Minh Tuấn" },
      { date: "2025-07-01", value: 8.5, technician: "Đỗ Minh Tuấn" },
      { date: "2025-08-05", value: 8.2, technician: "Lê Văn Hùng" },
      { date: "2025-09-02", value: 8.6, technician: "Đỗ Minh Tuấn" },
      { date: "2025-10-07", value: 8.4, technician: "Đỗ Minh Tuấn" },
      { date: "2025-11-04", value: 8.5, technician: "Lê Văn Hùng" },
      { date: "2025-12-02", value: 8.3, technician: "Đỗ Minh Tuấn" },
      { date: "2026-01-06", value: 8.7, technician: "Đỗ Minh Tuấn" },
      { date: "2026-02-03", value: 8.4, technician: "Lê Văn Hùng" },
      { date: "2026-03-03", value: 8.2, technician: "Đỗ Minh Tuấn" },
      { date: "2026-04-07", value: 9.5, technician: "Đỗ Minh Tuấn" },
      { date: "2026-05-05", value: 8.5, technician: "Lê Văn Hùng" },
      { date: "2026-06-02", value: 8.3, technician: "Đỗ Minh Tuấn" },
    ],
  },
  {
    id: "qc4",
    criterion: "pHKCl",
    matrix: "Đất canh tác",
    method: "Điện cực thủy tinh – TCVN 5979:2007",
    unit: "đơn vị pH",
    mean: 5.2,
    sd: 0.18,
    referenceMaterial: "Mẫu chuẩn nội bộ đất Hà Trung",
    points: [
      { date: "2025-06-10", value: 5.18, technician: "Lê Văn Hùng" },
      { date: "2025-07-08", value: 5.22, technician: "Trần Thị Mai" },
      { date: "2025-08-05", value: 5.15, technician: "Lê Văn Hùng" },
      { date: "2025-09-09", value: 5.24, technician: "Lê Văn Hùng" },
      { date: "2025-10-07", value: 5.19, technician: "Trần Thị Mai" },
      { date: "2025-11-04", value: 5.26, technician: "Lê Văn Hùng" },
      { date: "2025-12-02", value: 5.20, technician: "Lê Văn Hùng" },
      { date: "2026-01-06", value: 5.23, technician: "Trần Thị Mai" },
      { date: "2026-02-03", value: 5.17, technician: "Lê Văn Hùng" },
      { date: "2026-03-10", value: 5.25, technician: "Lê Văn Hùng" },
      { date: "2026-04-07", value: 5.21, technician: "Trần Thị Mai" },
      { date: "2026-05-05", value: 5.19, technician: "Lê Văn Hùng" },
      { date: "2026-06-02", value: 5.23, technician: "Lê Văn Hùng" },
    ],
  },
];

export type ExternalQCRound = {
  id: string;
  type: "Thử nghiệm thành thạo" | "So sánh liên phòng";
  provider: string;
  round: string;
  criterion: string;
  z: number;
  verdict: "Đạt" | "Cảnh báo" | "Không đạt";
  closedAt: string;
};

export const externalQCRounds: ExternalQCRound[] = [
  {
    id: "ext1",
    type: "Thử nghiệm thành thạo",
    provider: "VinaCert PT (Việt Nam)",
    round: "PT-EARTH-2026-01",
    criterion: "Pb, Cd, As trong đất",
    z: 0.7,
    verdict: "Đạt",
    closedAt: "2026-03-28",
  },
  {
    id: "ext2",
    type: "Thử nghiệm thành thạo",
    provider: "FAPAS (UK)",
    round: "FAPAS-PESTI-2025-04",
    criterion: "Dư lượng BVTV trong rau quả",
    z: 1.4,
    verdict: "Đạt",
    closedAt: "2025-11-12",
  },
  {
    id: "ext3",
    type: "So sánh liên phòng",
    provider: "Mạng PTN Bộ NN&PTNT",
    round: "ILC-FERT-2025-02",
    criterion: "P₂O₅ hữu hiệu trong phân bón",
    z: 2.3,
    verdict: "Cảnh báo",
    closedAt: "2025-08-30",
  },
  {
    id: "ext4",
    type: "Thử nghiệm thành thạo",
    provider: "VinaCert PT (Việt Nam)",
    round: "PT-WATER-2025-03",
    criterion: "Kim loại nặng trong nước",
    z: 0.4,
    verdict: "Đạt",
    closedAt: "2025-09-20",
  },
];

export type RiskCategory =
  | "Khách quan"
  | "Năng lực nhân sự"
  | "Thiết bị"
  | "Phương pháp"
  | "Cơ sở vật chất"
  | "Dữ liệu & An ninh"
  | "Cung ứng"
  | "Khách hàng & Bên ngoài"
  | "Quá trình";

export type RiskTreatment =
  | "Né tránh"
  | "Giảm thiểu"
  | "Chuyển giao"
  | "Chấp nhận";

export type RiskStatus =
  | "Mở"
  | "Đang xử lý"
  | "Đã giảm thiểu"
  | "Đã đóng";

export type Risk = {
  id: string;
  code: string;
  category: RiskCategory;
  title: string;
  cause: string;
  effect: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  controls: string;
  treatment: RiskTreatment;
  action: string;
  owner: string;
  reviewAt: string;
  residualLikelihood: 1 | 2 | 3 | 4 | 5;
  residualImpact: 1 | 2 | 3 | 4 | 5;
  status: RiskStatus;
  isoClause: string;
};

export const risks: Risk[] = [
  {
    id: "rr1",
    code: "RR-VNNTH-2026-001",
    category: "Khách quan",
    title: "KTV đồng thời nhận tư vấn cho khách hàng gửi mẫu",
    cause: "KTV có công việc tư vấn cá nhân ngoài giờ – có thể nhận tư vấn cho HTX/DN mà PTN đang phân tích mẫu",
    effect: "Mất tính khách quan, ảnh hưởng uy tín VILAS 1501, KH khiếu nại",
    likelihood: 2,
    impact: 4,
    controls: "Cam kết khách quan đầu năm; nội quy nội bộ",
    treatment: "Né tránh",
    action: "Bổ sung Phiếu khai báo xung đột lợi ích trước mỗi đợt phân tích lớn; Trưởng phòng rà soát hằng quý",
    owner: "Trưởng phòng PTN",
    reviewAt: "2026-09-30",
    residualLikelihood: 1,
    residualImpact: 4,
    status: "Đang xử lý",
    isoClause: "§4.1 Tính khách quan",
  },
  {
    id: "rr2",
    code: "RR-VNNTH-2026-002",
    category: "Năng lực nhân sự",
    title: "KTV mới chưa được ủy quyền vận hành GC-MS độc lập",
    cause: "Tuyển 2 KTV mới (Phạm Thu Hà thử việc) trong khi nhu cầu phân tích dư lượng BVTV tăng cao",
    effect: "Kết quả phân tích BVTV có thể không đảm bảo độ tin cậy; quá tải KTV chính",
    likelihood: 3,
    impact: 3,
    controls: "Quy định ủy quyền PP nội bộ; Đào tạo ban đầu 2 tuần",
    treatment: "Giảm thiểu",
    action: "Khóa đào tạo QuEChERS + GC-MS Q3/2026; kiểm tra năng lực qua mẫu mù; ủy quyền chính thức sau khi đạt",
    owner: "Phó phòng QA/QC",
    reviewAt: "2026-09-15",
    residualLikelihood: 2,
    residualImpact: 2,
    status: "Đang xử lý",
    isoClause: "§6.2 Nhân sự",
  },
  {
    id: "rr3",
    code: "RR-VNNTH-2026-003",
    category: "Cơ sở vật chất",
    title: "Mất điện đột ngột làm mất dữ liệu raw từ ICP-MS / GC-MS",
    cause: "Lưới điện địa phương không ổn định mùa mưa bão; máy chạy mẻ kéo dài 2-4 giờ",
    effect: "Mất dữ liệu raw không phục hồi được; phải lặp lại mẻ; chi phí chuẩn cao",
    likelihood: 3,
    impact: 5,
    controls: "UPS 10 kVA cho phòng dụng cụ; máy phát dự phòng",
    treatment: "Giảm thiểu",
    action: "Auto-save raw 5 phút/lần; backup cloud trong 24h; chuyển dữ liệu sau mỗi mẻ về NAS",
    owner: "Quản trị hệ thống",
    reviewAt: "2026-07-31",
    residualLikelihood: 2,
    residualImpact: 2,
    status: "Đã giảm thiểu",
    isoClause: "§6.3 + §7.5",
  },
  {
    id: "rr4",
    code: "RR-VNNTH-2026-004",
    category: "Phương pháp",
    title: "Phương pháp QuEChERS chưa thẩm định cho matrix cam (quả mọng)",
    cause: "Mở rộng dịch vụ phân tích cam Vân Du, lê, mít – matrix chứa nhiều đường gây nhiễu khi chiết",
    effect: "Kết quả BVTV trên quả mọng có thể bị thiên lệch; rủi ro pháp lý cho phiếu KQ",
    likelihood: 3,
    impact: 4,
    controls: "Đối chiếu PP gốc AOAC; chạy mẫu chuẩn thêm",
    treatment: "Giảm thiểu",
    action: "Thẩm định nội bộ matrix cam/lê/mít trước 2026-09: spike recovery 70–120%, RSD < 20%; báo cáo phê duyệt",
    owner: "Phó phòng QA/QC",
    reviewAt: "2026-09-30",
    residualLikelihood: 2,
    residualImpact: 3,
    status: "Mở",
    isoClause: "§7.2.2 Lựa chọn & thẩm định PP",
  },
  {
    id: "rr5",
    code: "RR-VNNTH-2026-005",
    category: "Thiết bị",
    title: "Tủ chuẩn lạnh dao động nhiệt 5–9°C",
    cause: "Cảm biến cũ (>5 năm); rò rỉ joint; dao động khi mở thường xuyên",
    effect: "Chuẩn BVTV nhạy có thể phân hủy; chuẩn không đảm bảo độ ổn định",
    likelihood: 4,
    impact: 3,
    controls: "Ghi nhiệt độ 3 lần/ngày (đã tự động ở /equipment)",
    treatment: "Giảm thiểu",
    action: "Thay cảm biến + joint Q3/2026; cảnh báo tự động khi ngoài 2–8°C; mua tủ dự phòng",
    owner: "Phụ trách thiết bị",
    reviewAt: "2026-08-31",
    residualLikelihood: 2,
    residualImpact: 3,
    status: "Đang xử lý",
    isoClause: "§6.4.4 Kiểm soát thiết bị",
  },
  {
    id: "rr6",
    code: "RR-VNNTH-2026-006",
    category: "Cung ứng",
    title: "NCC chuẩn BVTV (Sigma) tăng leadtime từ 2 → 8 tuần",
    cause: "Hạn chế nhập khẩu chất chuẩn; chỉ có 1 NCC chính",
    effect: "Có thể đứt nguồn chuẩn BVTV trong Q3/2026; gián đoạn QC",
    likelihood: 3,
    impact: 4,
    controls: "Theo dõi tồn kho HC-0703; đặt hàng định kỳ",
    treatment: "Chuyển giao",
    action: "Bổ sung 2 NCC backup (LGC Standards, AccuStandard); duy trì tồn ≥ 20% MOQ; lập hợp đồng khung",
    owner: "Phòng vật tư",
    reviewAt: "2026-08-15",
    residualLikelihood: 2,
    residualImpact: 3,
    status: "Mở",
    isoClause: "§6.6 Sản phẩm/Dịch vụ bên ngoài",
  },
  {
    id: "rr7",
    code: "RR-VNNTH-2026-007",
    category: "Quá trình",
    title: "Mẫu lưu hết hạn không kịp phân tích QC 3 tháng/lần",
    cause: "Khối lượng mẫu tăng, KTV bỏ sót lịch QC mẫu lưu",
    effect: "Không có dữ liệu kiểm soát chéo theo thời gian; vi phạm §7.7.1",
    likelihood: 2,
    impact: 3,
    controls: "Lịch tự sinh trong /archive; gán KTV phụ trách",
    treatment: "Giảm thiểu",
    action: "Cảnh báo 30 ngày + 7 ngày qua email; tự gán KTV theo nhóm chuyên môn (đã làm /archive)",
    owner: "Trưởng nhóm Đảm bảo chất lượng",
    reviewAt: "2026-09-30",
    residualLikelihood: 1,
    residualImpact: 2,
    status: "Đã giảm thiểu",
    isoClause: "§7.4.4 Mẫu lưu",
  },
  {
    id: "rr8",
    code: "RR-VNNTH-2026-008",
    category: "Khách hàng & Bên ngoài",
    title: "KH khiếu nại chậm trả KQ phân tích",
    cause: "Mùa cao điểm (quý 2, quý 4) khối lượng mẫu tăng 40%; thiếu KTV BVTV",
    effect: "Mất uy tín với HTX/DN; ảnh hưởng tự chủ tài chính",
    likelihood: 3,
    impact: 3,
    controls: "Cam kết SLA 5–7 ngày làm việc; nhắc nhở khi gần hạn",
    treatment: "Giảm thiểu",
    action: "Triển khai KPI SLA per chỉ tiêu; cảnh báo trước hạn 3 ngày; mua thêm máy GC-MS thứ 2 trong 2027",
    owner: "Trưởng phòng PTN",
    reviewAt: "2026-12-31",
    residualLikelihood: 2,
    residualImpact: 2,
    status: "Đang xử lý",
    isoClause: "§7.9 Khiếu nại",
  },
  {
    id: "rr9",
    code: "RR-VNNTH-2026-009",
    category: "Dữ liệu & An ninh",
    title: "Truy cập trái phép vào dữ liệu kết quả",
    cause: "Hệ thống LIMS chưa triển khai phân quyền RBAC; nhân viên dùng chung tài khoản",
    effect: "Rò rỉ thông tin KH; sửa kết quả trái phép; mất uy tín VILAS 1501",
    likelihood: 2,
    impact: 5,
    controls: "Mật khẩu BIOS máy chủ; phòng chứa máy chủ khóa",
    treatment: "Giảm thiểu",
    action: "Triển khai RBAC + 2FA cho Trưởng phòng/QA-QC + audit log toàn hệ thống (kế hoạch P2)",
    owner: "Quản trị hệ thống",
    reviewAt: "2026-12-31",
    residualLikelihood: 1,
    residualImpact: 4,
    status: "Mở",
    isoClause: "§7.11 Kiểm soát dữ liệu",
  },
  {
    id: "rr10",
    code: "RR-VNNTH-2026-010",
    category: "Quá trình",
    title: "Sai sót khi nhập tay kết quả từ ICP-MS / GC-MS",
    cause: "KTV phải gõ tay kết quả từ phần mềm máy vào hệ thống LIMS",
    effect: "Sai số nhập tay 0.5–2%; kết quả không khớp dữ liệu raw",
    likelihood: 4,
    impact: 3,
    controls: "QA/QC kiểm tra chéo; đối chiếu với raw file",
    treatment: "Giảm thiểu",
    action: "Tích hợp import CSV/XML trực tiếp từ phần mềm instrument vào LIMS (kế hoạch P4)",
    owner: "Quản trị hệ thống",
    reviewAt: "2027-03-31",
    residualLikelihood: 2,
    residualImpact: 2,
    status: "Mở",
    isoClause: "§7.5 Hồ sơ kỹ thuật",
  },
];

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  expectedBenefit: string;
  owner: string;
  status: "Đề xuất" | "Đang triển khai" | "Đã đạt";
};

export const opportunities: Opportunity[] = [
  {
    id: "op1",
    title: "Nâng cấp GC-MS/MS thay cho GC-MS đơn",
    description:
      "Đầu tư GC-MS/MS để hạ giới hạn phát hiện (LOQ) BVTV xuống mức MRL EU – mở rộng dịch vụ phân tích nông sản xuất khẩu",
    expectedBenefit:
      "Tiếp cận thị trường nông sản xuất khẩu EU/Nhật; tăng doanh thu ~30% nhóm BVTV",
    owner: "Ban Giám đốc PTN",
    status: "Đề xuất",
  },
  {
    id: "op2",
    title: "Mở rộng phạm vi VILAS 1501 thêm dư lượng kháng sinh trong sữa & mật ong",
    description:
      "Đăng ký mở rộng phạm vi công nhận thêm 4 nhóm kháng sinh; tận dụng HPLC sẵn có",
    expectedBenefit:
      "Thêm dịch vụ mới; phục vụ HTX nuôi ong + trang trại sữa Thanh Hóa",
    owner: "Phó phòng QA/QC",
    status: "Đang triển khai",
  },
  {
    id: "op3",
    title: "Tích hợp instrument – LIMS",
    description:
      "Tự động lấy dữ liệu raw từ ICP-MS, GC-MS, HPLC vào LIMS qua CSV/XML watcher",
    expectedBenefit:
      "Giảm sai sót nhập tay > 95%; rút ngắn 1 ngày/mẫu chu trình trả KQ",
    owner: "Quản trị hệ thống",
    status: "Đề xuất",
  },
];

export type DecisionRuleType =
  | "Simple acceptance (không guard band)"
  | "Guarded acceptance (w = U)"
  | "Guarded rejection (w = U)"
  | "Theo thỏa thuận khách hàng";

export type DecisionRule = {
  id: string;
  criterion: string;
  matrix: string;
  method: string;
  unit: string;
  limit: number;
  limitDirection: "max" | "min" | "range";
  limitMin?: number;
  limitSource: string;
  uncertainty: number;
  ruleType: DecisionRuleType;
  acceptanceUpper?: number;
  rejectionUpper?: number;
  acceptanceLower?: number;
  rejectionLower?: number;
  notes: string;
  approvedBy: string;
  approvedAt: string;
};

export const decisionRules: DecisionRule[] = [
  {
    id: "dr1",
    criterion: "Pb tổng",
    matrix: "Rau lá (cải, xà lách)",
    method: "ICP-MS – TCVN 7929:2008",
    unit: "mg/kg",
    limit: 0.3,
    limitDirection: "max",
    limitSource: "QCVN 8-2:2011/BYT – KLN trong thực phẩm",
    uncertainty: 0.04,
    ruleType: "Guarded acceptance (w = U)",
    acceptanceUpper: 0.26,
    rejectionUpper: 0.34,
    notes:
      "Chấp nhận khi kết quả ≤ 0.26 mg/kg (≤ MRL − U); Từ chối khi > 0.34. Vùng giữa lập biên bản, có thể yêu cầu phân tích lại.",
    approvedBy: "TS. Nguyễn Đình Lương",
    approvedAt: "2026-01-15",
  },
  {
    id: "dr2",
    criterion: "Cd tổng",
    matrix: "Quả tươi (cam, lê)",
    method: "ICP-MS – TCVN 7929:2008",
    unit: "mg/kg",
    limit: 0.05,
    limitDirection: "max",
    limitSource: "QCVN 8-2:2011/BYT",
    uncertainty: 0.007,
    ruleType: "Guarded acceptance (w = U)",
    acceptanceUpper: 0.043,
    rejectionUpper: 0.057,
    notes:
      "Áp dụng JCGM 106:2012, k=2. Mức bảo vệ KH ưu tiên (KH thực phẩm xuất khẩu).",
    approvedBy: "TS. Nguyễn Đình Lương",
    approvedAt: "2026-01-15",
  },
  {
    id: "dr3",
    criterion: "Chlorpyrifos (dư lượng BVTV)",
    matrix: "Rau lá",
    method: "GC-MS QuEChERS – AOAC 2007.01",
    unit: "mg/kg",
    limit: 0.05,
    limitDirection: "max",
    limitSource: "Codex MRL CXL 17-2018 (rau lá)",
    uncertainty: 0.008,
    ruleType: "Guarded acceptance (w = U)",
    acceptanceUpper: 0.042,
    rejectionUpper: 0.058,
    notes:
      "Codex MRL nghiêm ngặt hơn QCVN cho rau lá. Khi KH yêu cầu chuẩn EU, áp giá trị 0.01 mg/kg theo thỏa thuận riêng.",
    approvedBy: "ThS. Trần Thị Mai",
    approvedAt: "2026-02-10",
  },
  {
    id: "dr4",
    criterion: "As tổng",
    matrix: "Nước tưới nông nghiệp",
    method: "AAS – SMEWW 3114B",
    unit: "mg/L",
    limit: 0.05,
    limitDirection: "max",
    limitSource: "QCVN 39:2011/BTNMT – Nước tưới tiêu",
    uncertainty: 0.005,
    ruleType: "Guarded acceptance (w = U)",
    acceptanceUpper: 0.045,
    rejectionUpper: 0.055,
    notes:
      "Sử dụng hydride generation cho mẫu nước; chuyển ICP-MS khi LOQ không đạt.",
    approvedBy: "TS. Nguyễn Đình Lương",
    approvedAt: "2026-01-15",
  },
  {
    id: "dr5",
    criterion: "pHKCl",
    matrix: "Đất canh tác",
    method: "Điện cực thủy tinh – TCVN 5979:2007",
    unit: "đơn vị pH",
    limit: 7.5,
    limitDirection: "range",
    limitMin: 4.5,
    limitSource: "TCVN 7373:2004 – Đất canh tác",
    uncertainty: 0.05,
    ruleType: "Simple acceptance (không guard band)",
    notes:
      "Trả kết quả số có ±U; KH/đơn vị tư vấn dùng để khuyến cáo bón vôi/phân, không kết luận đạt/không đạt.",
    approvedBy: "TS. Nguyễn Đình Lương",
    approvedAt: "2026-01-15",
  },
  {
    id: "dr6",
    criterion: "P₂O₅ hữu hiệu",
    matrix: "Phân bón NPK 16-16-8",
    method: "Quang phổ Mo-vanadat – TCVN 8559:2010",
    unit: "%",
    limit: 16.5,
    limitDirection: "range",
    limitMin: 15.5,
    limitSource: "NĐ 84/2019/NĐ-CP – Quản lý phân bón (dung sai ±0.5%)",
    uncertainty: 0.32,
    ruleType: "Guarded acceptance (w = U)",
    acceptanceUpper: 16.18,
    acceptanceLower: 15.82,
    notes:
      "Quy tắc 2 phía. Phân bón ngoài khoảng (15.82 – 16.18) % bị đánh giá Không đạt theo Nghị định 84.",
    approvedBy: "TS. Nguyễn Đình Lương",
    approvedAt: "2026-03-12",
  },
  {
    id: "dr7",
    criterion: "Tổng Coliform",
    matrix: "Nước tưới",
    method: "Lọc màng – TCVN 6187-1:2009",
    unit: "CFU/100 mL",
    limit: 200,
    limitDirection: "max",
    limitSource: "QCVN 39:2011/BTNMT",
    uncertainty: 0,
    ruleType: "Theo thỏa thuận khách hàng",
    notes:
      "Chỉ tiêu vi sinh có phân bố Poisson – không áp dụng guard band thông thường. Quy tắc theo thỏa thuận: KH có thể chọn ngưỡng quyết định 100 CFU/100 mL hoặc giữ nguyên QCVN.",
    approvedBy: "ThS. Trần Thị Mai",
    approvedAt: "2026-02-20",
  },
  {
    id: "dr8",
    criterion: "Nitrat (NO₃⁻)",
    matrix: "Rau lá",
    method: "HPLC – TCVN 8742:2011",
    unit: "mg/kg",
    limit: 500,
    limitDirection: "max",
    limitSource: "EC 1881/2006 – áp dụng tham chiếu cho rau xuất khẩu",
    uncertainty: 20,
    ruleType: "Guarded acceptance (w = U)",
    acceptanceUpper: 480,
    rejectionUpper: 520,
    notes:
      "Áp dụng cho KH có hợp đồng xuất khẩu EU. KH nội địa có thể chọn Simple acceptance qua thỏa thuận.",
    approvedBy: "ThS. Trần Thị Mai",
    approvedAt: "2026-02-10",
  },
];

export type SamplingSessionStatus =
  | "Đang chuẩn bị"
  | "Đang triển khai"
  | "Đã hoàn tất"
  | "Đã đóng";

export type SamplingSession = {
  id: string;
  code: string;
  name: string;
  area: string;
  leader: string;
  team: string[];
  vehicle: string;
  startedAt: string;
  endedAt?: string;
  customer: string;
  matrix: string[];
  status: SamplingSessionStatus;
  plannedSamples: number;
  collectedSamples: number;
  syncedSamples: number;
};

export const samplingSessions: SamplingSession[] = [
  {
    id: "ss1",
    code: "LM-VNNTH-2026-018",
    name: "Quan trắc đất canh tác lúa Đông Sơn vụ Đông Xuân",
    area: "Xã Cẩm Thành & Cẩm Tâm – huyện Cẩm Thủy, Thanh Hóa",
    leader: "Lê Văn Hùng",
    team: ["Lê Văn Hùng", "Đỗ Minh Tuấn", "Hoàng Thị Linh"],
    vehicle: "Ô tô bán tải 36C-12345",
    startedAt: "2026-06-19 07:00",
    customer: "HTX Nông nghiệp Đông Sơn",
    matrix: ["Đất canh tác lúa", "Nước tưới ruộng"],
    status: "Đang triển khai",
    plannedSamples: 12,
    collectedSamples: 9,
    syncedSamples: 6,
  },
  {
    id: "ss2",
    code: "LM-VNNTH-2026-017",
    name: "Lấy mẫu rau cải dư lượng BVTV – Yên Định",
    area: "Xã Định Tường, huyện Yên Định, Thanh Hóa",
    leader: "Phạm Thu Hà",
    team: ["Phạm Thu Hà", "Hoàng Thị Linh"],
    vehicle: "Xe máy 36AB-78901 + 36AB-78902",
    startedAt: "2026-06-21 06:30",
    customer: "Trang trại Rau an toàn Yên Định",
    matrix: ["Rau cải lá", "Đất rau"],
    status: "Đang triển khai",
    plannedSamples: 8,
    collectedSamples: 3,
    syncedSamples: 0,
  },
  {
    id: "ss3",
    code: "LM-VNNTH-2026-015",
    name: "Quan trắc nước tưới kênh nội đồng Q2/2026",
    area: "Hệ thống kênh Bái Thượng – huyện Thọ Xuân, Thanh Hóa",
    leader: "Nguyễn Quang Anh",
    team: ["Nguyễn Quang Anh", "Trần Thị Mai"],
    vehicle: "Ô tô con 36A-22113",
    startedAt: "2026-06-10 06:00",
    endedAt: "2026-06-12 17:30",
    customer: "Phòng NN&PTNT huyện Thọ Xuân",
    matrix: ["Nước tưới mặt"],
    status: "Đã hoàn tất",
    plannedSamples: 25,
    collectedSamples: 25,
    syncedSamples: 25,
  },
];

export type FieldSampleStatus =
  | "Đang thu"
  | "Chờ đồng bộ"
  | "Đã đồng bộ"
  | "Đã chuyển vào PTN";

export type OnSiteReading = { name: string; value: string; unit: string };

export type FieldSample = {
  id: string;
  fieldCode: string;
  sessionCode: string;
  matrix: string;
  collectorName: string;
  collectedAt: string;
  location: { lat: number; lng: number; address: string };
  depth?: string;
  amount: string;
  container: string;
  preservation: string;
  onSiteReadings: OnSiteReading[];
  photos: number;
  hasSignature: boolean;
  status: FieldSampleStatus;
  linkedSampleCode?: string;
  notes?: string;
};

export const fieldSamples: FieldSample[] = [
  {
    id: "fs1",
    fieldCode: "FM-VNNTH-2026-00451",
    sessionCode: "LM-VNNTH-2026-018",
    matrix: "Đất ruộng lúa – tầng 0-20 cm",
    collectorName: "Lê Văn Hùng",
    collectedAt: "2026-06-22 08:45",
    location: {
      lat: 20.1736,
      lng: 105.4658,
      address: "Thửa số 27, cánh đồng Cẩm Thành, Cẩm Thủy",
    },
    depth: "0–20 cm",
    amount: "≈ 1.2 kg",
    container: "Túi PE kín, dán nhãn QR",
    preservation: "Nhiệt độ phòng, tránh ẩm",
    onSiteReadings: [
      { name: "Nhiệt độ đất", value: "27.3", unit: "°C" },
      { name: "Độ ẩm đất", value: "62", unit: "%" },
      { name: "pH cầm tay", value: "5.4", unit: "" },
    ],
    photos: 3,
    hasSignature: true,
    status: "Đã đồng bộ",
    linkedSampleCode: "M-VNNTH-2026-00451",
  },
  {
    id: "fs2",
    fieldCode: "FM-VNNTH-2026-00452",
    sessionCode: "LM-VNNTH-2026-018",
    matrix: "Nước tưới mương ruộng",
    collectorName: "Đỗ Minh Tuấn",
    collectedAt: "2026-06-22 09:20",
    location: {
      lat: 20.1742,
      lng: 105.4671,
      address: "Mương cấp 2 – cánh đồng Cẩm Thành",
    },
    amount: "1.0 L",
    container: "Chai PE, axit hóa pH<2 bằng HNO3",
    preservation: "Bảo quản lạnh 2-8°C",
    onSiteReadings: [
      { name: "pH", value: "7.1", unit: "" },
      { name: "EC", value: "0.92", unit: "mS/cm" },
      { name: "Nhiệt độ nước", value: "29.5", unit: "°C" },
      { name: "DO", value: "5.8", unit: "mg/L" },
    ],
    photos: 2,
    hasSignature: true,
    status: "Đã đồng bộ",
    linkedSampleCode: "M-VNNTH-2026-00452",
  },
  {
    id: "fs3",
    fieldCode: "FM-VNNTH-2026-00455",
    sessionCode: "LM-VNNTH-2026-018",
    matrix: "Đất ruộng lúa – tầng 20-40 cm",
    collectorName: "Hoàng Thị Linh",
    collectedAt: "2026-06-22 11:05",
    location: {
      lat: 20.1755,
      lng: 105.4682,
      address: "Thửa số 31, cánh đồng Cẩm Tâm, Cẩm Thủy",
    },
    depth: "20–40 cm",
    amount: "≈ 1.0 kg",
    container: "Túi PE kín, dán nhãn QR",
    preservation: "Nhiệt độ phòng",
    onSiteReadings: [
      { name: "Nhiệt độ đất", value: "26.8", unit: "°C" },
      { name: "pH cầm tay", value: "5.2", unit: "" },
    ],
    photos: 4,
    hasSignature: true,
    status: "Chờ đồng bộ",
    notes: "Ngoài vùng phủ sóng – chờ về Viện đồng bộ",
  },
  {
    id: "fs4",
    fieldCode: "FM-VNNTH-2026-00458",
    sessionCode: "LM-VNNTH-2026-017",
    matrix: "Rau cải lá – ruộng A1",
    collectorName: "Phạm Thu Hà",
    collectedAt: "2026-06-22 07:15",
    location: {
      lat: 19.9758,
      lng: 105.6611,
      address: "Vườn rau số 12, Định Tường, Yên Định",
    },
    amount: "≈ 500 g",
    container: "Túi giấy bạc, kín khí",
    preservation: "Bảo quản đông sâu -20°C ngay khi về xe",
    onSiteReadings: [
      { name: "Nhiệt độ không khí", value: "31.2", unit: "°C" },
      { name: "Độ ẩm", value: "78", unit: "%" },
    ],
    photos: 5,
    hasSignature: true,
    status: "Đang thu",
    notes: "Đang ghi nhận lịch sử phun BVTV của KH",
  },
  {
    id: "fs5",
    fieldCode: "FM-VNNTH-2026-00459",
    sessionCode: "LM-VNNTH-2026-017",
    matrix: "Đất trồng rau – ruộng A1",
    collectorName: "Hoàng Thị Linh",
    collectedAt: "2026-06-22 07:35",
    location: {
      lat: 19.9762,
      lng: 105.6619,
      address: "Vườn rau số 12, Định Tường, Yên Định",
    },
    depth: "0–15 cm",
    amount: "≈ 800 g",
    container: "Túi PE kín, dán nhãn QR",
    preservation: "Nhiệt độ phòng",
    onSiteReadings: [
      { name: "pH cầm tay", value: "6.1", unit: "" },
      { name: "Độ ẩm đất", value: "45", unit: "%" },
    ],
    photos: 2,
    hasSignature: false,
    status: "Đang thu",
  },
  {
    id: "fs6",
    fieldCode: "FM-VNNTH-2026-00432",
    sessionCode: "LM-VNNTH-2026-015",
    matrix: "Nước tưới kênh Bái Thượng – điểm K12",
    collectorName: "Nguyễn Quang Anh",
    collectedAt: "2026-06-12 09:40",
    location: {
      lat: 19.9421,
      lng: 105.5034,
      address: "Cầu K12 – kênh Bái Thượng, Thọ Xuân",
    },
    amount: "1.0 L + 0.5 L (lưu)",
    container: "Chai PE, axit hóa pH<2",
    preservation: "Bảo quản lạnh 2-8°C trong thùng đá",
    onSiteReadings: [
      { name: "pH", value: "7.4", unit: "" },
      { name: "EC", value: "0.78", unit: "mS/cm" },
      { name: "DO", value: "6.2", unit: "mg/L" },
      { name: "Độ đục", value: "12", unit: "NTU" },
    ],
    photos: 3,
    hasSignature: true,
    status: "Đã chuyển vào PTN",
    linkedSampleCode: "M-VNNTH-2026-00432",
  },
];

export type TestRequestStatus =
  | "Yêu cầu mới"
  | "Đã báo giá"
  | "KH chấp nhận"
  | "Đã ký HĐ"
  | "Đã nhận mẫu"
  | "Đã hủy";

export type TestRequestCriterion = {
  name: string;
  method: string;
  unitPrice: number;
};

export type TestRequest = {
  id: string;
  code: string;
  customer: string;
  customerCode: string;
  contact: string;
  phone: string;
  matrix: string;
  expectedSamples: number;
  criteria: TestRequestCriterion[];
  purpose: string;
  decisionRule: string;
  expectedDeliveryDays: number;
  vatRate: number;
  notes?: string;
  status: TestRequestStatus;
  createdAt: string;
  quotedAt?: string;
  acceptedAt?: string;
  contractCode?: string;
  linkedSampleCodes?: string[];
};

export const testRequests: TestRequest[] = [
  {
    id: "tr1",
    code: "YC-VNNTH-2026-00124",
    customer: "Trang trại Rau an toàn Yên Định",
    customerCode: "KH-VNNTH-0298",
    contact: "Bà Phạm Thị Hằng",
    phone: "0987 654 321",
    matrix: "Rau cải lá tươi",
    expectedSamples: 6,
    criteria: [
      { name: "Chlorpyrifos", method: "GC-MS QuEChERS", unitPrice: 350000 },
      { name: "Cypermethrin", method: "GC-MS QuEChERS", unitPrice: 350000 },
      { name: "Abamectin", method: "LC-MS/MS", unitPrice: 450000 },
      { name: "Carbendazim", method: "HPLC-UV", unitPrice: 280000 },
      { name: "Imidacloprid", method: "LC-MS/MS", unitPrice: 450000 },
      { name: "Pb tổng", method: "ICP-MS", unitPrice: 220000 },
      { name: "Cd tổng", method: "ICP-MS", unitPrice: 220000 },
      { name: "Nitrat", method: "HPLC", unitPrice: 200000 },
    ],
    purpose:
      "Phân tích định kỳ trước khi xuất bán cho hệ thống siêu thị – yêu cầu KQ trong 5 ngày làm việc",
    decisionRule: "Guarded acceptance theo MRL Codex",
    expectedDeliveryDays: 5,
    vatRate: 0,
    status: "Yêu cầu mới",
    createdAt: "2026-06-25 14:32",
  },
  {
    id: "tr2",
    code: "YC-VNNTH-2026-00125",
    customer: "Hộ ông Lê Bá Khánh",
    customerCode: "KH-VNNTH-0312",
    contact: "Ông Lê Bá Khánh",
    phone: "0944 112 233",
    matrix: "Đất vườn cây ăn quả",
    expectedSamples: 1,
    criteria: [
      { name: "pHKCl", method: "TCVN 5979:2007", unitPrice: 80000 },
      { name: "OM%", method: "Walkley-Black TCVN 8941:2011", unitPrice: 180000 },
      { name: "N tổng", method: "Kjeldahl TCVN 6498:1999", unitPrice: 250000 },
      { name: "P2O5 dễ tiêu", method: "Bray-II", unitPrice: 220000 },
      { name: "K2O dễ tiêu", method: "Quang kế ngọn lửa", unitPrice: 200000 },
    ],
    purpose: "Tư vấn cải tạo đất vườn cam đang vàng lá",
    decisionRule: "Simple acceptance (báo cáo giá trị + khuyến cáo bón)",
    expectedDeliveryDays: 7,
    vatRate: 0,
    notes: "Đề nghị Viện cử cán bộ tư vấn sau khi có KQ",
    status: "Yêu cầu mới",
    createdAt: "2026-06-25 09:10",
  },
  {
    id: "tr3",
    code: "YC-VNNTH-2026-00123",
    customer: "Phòng NN&PTNT huyện Thọ Xuân",
    customerCode: "KH-VNNTH-0156",
    contact: "Ông Hoàng Minh Đức",
    phone: "0237 3 833 220",
    matrix: "Nước tưới kênh nội đồng",
    expectedSamples: 30,
    criteria: [
      { name: "pH", method: "TCVN 6492:2011", unitPrice: 60000 },
      { name: "EC", method: "Đo điện cực", unitPrice: 60000 },
      { name: "Coliform", method: "TCVN 6187-1:2009", unitPrice: 250000 },
      { name: "As", method: "SMEWW 3114B", unitPrice: 320000 },
      { name: "Pb", method: "SMEWW 3111B", unitPrice: 280000 },
      { name: "Cd", method: "SMEWW 3111B", unitPrice: 280000 },
    ],
    purpose: "Quan trắc định kỳ Q2/2026 kênh Bái Thượng + nhánh",
    decisionRule: "Đối chiếu QCVN 39:2011/BTNMT (Guarded acceptance)",
    expectedDeliveryDays: 14,
    vatRate: 8,
    status: "Đã báo giá",
    createdAt: "2026-06-22 10:00",
    quotedAt: "2026-06-23 16:40",
  },
  {
    id: "tr4",
    code: "YC-VNNTH-2026-00122",
    customer: "Công ty CP Phân bón Tiến Nông",
    customerCode: "KH-VNNTH-0118",
    contact: "Bà Nguyễn Thị Lan",
    phone: "0918 226 145",
    matrix: "Phân bón NPK 16-16-8",
    expectedSamples: 4,
    criteria: [
      { name: "N tổng", method: "Kjeldahl", unitPrice: 250000 },
      { name: "P2O5 hữu hiệu", method: "TCVN 8559:2010", unitPrice: 280000 },
      { name: "K2O hữu hiệu", method: "Quang kế ngọn lửa", unitPrice: 220000 },
      { name: "Độ ẩm", method: "Sấy 105°C", unitPrice: 120000 },
      { name: "Biuret", method: "Quang phổ UV", unitPrice: 250000 },
    ],
    purpose: "Kiểm tra chất lượng lô hàng xuất xưởng Q2/2026",
    decisionRule: "Guarded acceptance theo NĐ 84/2019/NĐ-CP (dung sai ±0.5%)",
    expectedDeliveryDays: 7,
    vatRate: 8,
    status: "KH chấp nhận",
    createdAt: "2026-06-20 14:00",
    quotedAt: "2026-06-21 09:20",
    acceptedAt: "2026-06-23 11:05",
  },
  {
    id: "tr5",
    code: "YC-VNNTH-2026-00120",
    customer: "HTX Cam Vân Du",
    customerCode: "KH-VNNTH-0211",
    contact: "Ông Trịnh Văn Sơn",
    phone: "0905 778 412",
    matrix: "Quả cam tươi (đầu vụ)",
    expectedSamples: 8,
    criteria: [
      { name: "Dư lượng BVTV (GC-MS multi)", method: "QuEChERS GC-MS", unitPrice: 1200000 },
      { name: "Pb", method: "ICP-MS", unitPrice: 220000 },
      { name: "Cd", method: "ICP-MS", unitPrice: 220000 },
      { name: "Nitrat", method: "HPLC", unitPrice: 200000 },
    ],
    purpose: "Chuẩn bị hồ sơ xuất khẩu lô cam Vân Du sang siêu thị Hà Nội",
    decisionRule: "Guarded acceptance theo Codex MRL (yêu cầu KH xuất khẩu)",
    expectedDeliveryDays: 5,
    vatRate: 8,
    status: "Đã ký HĐ",
    createdAt: "2026-06-15 10:30",
    quotedAt: "2026-06-16 14:10",
    acceptedAt: "2026-06-17 09:00",
    contractCode: "HĐ-VNNTH-2026-0089",
  },
  {
    id: "tr6",
    code: "YC-VNNTH-2026-00121",
    customer: "HTX Nông nghiệp Đông Sơn",
    customerCode: "KH-VNNTH-0124",
    contact: "Ông Lê Văn Hợp",
    phone: "0912 345 678",
    matrix: "Đất canh tác lúa + Nước tưới ruộng",
    expectedSamples: 12,
    criteria: [
      { name: "pHKCl", method: "TCVN 5979:2007", unitPrice: 80000 },
      { name: "OM% Walkley-Black", method: "TCVN 8941:2011", unitPrice: 180000 },
      { name: "N tổng", method: "Kjeldahl", unitPrice: 250000 },
      { name: "P2O5 dễ tiêu", method: "Bray-II", unitPrice: 220000 },
      { name: "K2O dễ tiêu", method: "Quang kế ngọn lửa", unitPrice: 200000 },
      { name: "CEC", method: "Amoni axetat", unitPrice: 280000 },
      { name: "pH nước tưới", method: "TCVN 6492:2011", unitPrice: 60000 },
      { name: "EC nước tưới", method: "Đo điện cực", unitPrice: 60000 },
    ],
    purpose: "Theo dõi sức khỏe đất sau 3 vụ – chuẩn bị bón phân vụ Hè Thu",
    decisionRule: "Simple acceptance (báo cáo + khuyến cáo)",
    expectedDeliveryDays: 10,
    vatRate: 0,
    status: "Đã nhận mẫu",
    createdAt: "2026-06-12 08:00",
    quotedAt: "2026-06-13 10:15",
    acceptedAt: "2026-06-14 14:00",
    contractCode: "HĐ-VNNTH-2026-0085",
    linkedSampleCodes: ["M-VNNTH-2026-00318", "M-VNNTH-2026-00319"],
  },
  {
    id: "tr7",
    code: "YC-VNNTH-2026-00118",
    customer: "Công ty TNHH Mía đường Lam Sơn",
    customerCode: "KH-VNNTH-0341",
    contact: "Ông Nguyễn Văn Hùng",
    phone: "0935 552 100",
    matrix: "Đất trồng mía",
    expectedSamples: 8,
    criteria: [
      { name: "pHKCl", method: "TCVN 5979:2007", unitPrice: 80000 },
      { name: "OM%", method: "Walkley-Black", unitPrice: 180000 },
      { name: "N tổng", method: "Kjeldahl", unitPrice: 250000 },
      { name: "P2O5 dễ tiêu", method: "Bray-II", unitPrice: 220000 },
      { name: "K2O dễ tiêu", method: "Quang kế ngọn lửa", unitPrice: 200000 },
    ],
    purpose: "Khảo sát đất trước khi đầu tư trồng vùng nguyên liệu mới",
    decisionRule: "Simple acceptance",
    expectedDeliveryDays: 10,
    vatRate: 8,
    notes: "KH rút yêu cầu, chuyển sang quý 3",
    status: "Đã hủy",
    createdAt: "2026-06-05 15:00",
    quotedAt: "2026-06-06 11:20",
  },
];

export type CampaignStatus =
  | "Lập kế hoạch"
  | "Đang triển khai"
  | "Đang phân tích"
  | "Đã có báo cáo"
  | "Đã đóng";

export type CampaignPoint = {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  values: { criterion: string; value: number; limit: number; unit: string }[];
};

export type CampaignTrendPoint = {
  period: string;
  value: number;
};

export type Campaign = {
  id: string;
  code: string;
  name: string;
  scope: string;
  area: string;
  client: string;
  fundingSource: string;
  purpose: string;
  matrix: string[];
  criteria: string[];
  plannedPoints: number;
  collectedSamples: number;
  analyzedSamples: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  leader: string;
  reportCode?: string;
  reportPublishedAt?: string;
  exceedanceCount?: number;
  points?: CampaignPoint[];
  trend?: {
    criterion: string;
    unit: string;
    series: CampaignTrendPoint[];
  }[];
};

export const campaigns: Campaign[] = [
  {
    id: "cp1",
    code: "QT-VNNTH-2026-005",
    name: "Quan trắc đất canh tác lúa vụ Đông Xuân 2026 – Cẩm Thủy",
    scope: "50 điểm trên 5 xã – mật độ 1 điểm/10 ha",
    area: "Huyện Cẩm Thủy, Thanh Hóa",
    client: "Phòng NN&PTNT huyện Cẩm Thủy",
    fundingSource: "Ngân sách huyện 2026",
    purpose: "Đánh giá sức khỏe đất sau vụ Đông Xuân, làm cơ sở khuyến cáo bón phân Hè Thu",
    matrix: ["Đất ruộng lúa 0-20 cm", "Đất ruộng lúa 20-40 cm"],
    criteria: ["pHKCl", "OM%", "N tổng", "P2O5 dễ tiêu", "K2O dễ tiêu", "CEC"],
    plannedPoints: 50,
    collectedSamples: 50,
    analyzedSamples: 32,
    startDate: "2026-05-12",
    endDate: "2026-07-15",
    status: "Đang phân tích",
    leader: "Lê Văn Hùng",
  },
  {
    id: "cp2",
    code: "QT-VNNTH-2026-006",
    name: "Quan trắc nước tưới kênh Bái Thượng Q2/2026",
    scope: "25 điểm dọc kênh chính + nhánh – tần suất 1 lần/quý",
    area: "Hệ thống kênh Bái Thượng – huyện Thọ Xuân",
    client: "Phòng NN&PTNT huyện Thọ Xuân",
    fundingSource: "Ngân sách huyện Thọ Xuân 2026",
    purpose: "Giám sát chất lượng nước tưới phục vụ canh tác lúa và rau màu trên địa bàn",
    matrix: ["Nước mặt tưới"],
    criteria: ["pH", "EC", "Coliform", "As", "Pb", "Cd"],
    plannedPoints: 25,
    collectedSamples: 25,
    analyzedSamples: 25,
    startDate: "2026-04-10",
    endDate: "2026-06-20",
    status: "Đã có báo cáo",
    leader: "Nguyễn Quang Anh",
    reportCode: "BC-QT-VNNTH-2026-006",
    reportPublishedAt: "2026-06-24",
    exceedanceCount: 4,
    points: [
      {
        id: "pt1",
        code: "K01",
        name: "Cống cấp nước – Vĩnh Lộc",
        lat: 19.9421,
        lng: 105.5034,
        values: [
          { criterion: "pH", value: 7.2, limit: 8.5, unit: "" },
          { criterion: "EC", value: 0.78, limit: 1.5, unit: "mS/cm" },
          { criterion: "As", value: 0.012, limit: 0.05, unit: "mg/L" },
          { criterion: "Coliform", value: 80, limit: 200, unit: "CFU/100mL" },
        ],
      },
      {
        id: "pt2",
        code: "K05",
        name: "Cầu Bái Thượng",
        lat: 19.945,
        lng: 105.51,
        values: [
          { criterion: "pH", value: 7.4, limit: 8.5, unit: "" },
          { criterion: "EC", value: 0.92, limit: 1.5, unit: "mS/cm" },
          { criterion: "As", value: 0.018, limit: 0.05, unit: "mg/L" },
          { criterion: "Coliform", value: 120, limit: 200, unit: "CFU/100mL" },
        ],
      },
      {
        id: "pt3",
        code: "K12",
        name: "Trạm bơm Sao Vàng",
        lat: 19.9482,
        lng: 105.5172,
        values: [
          { criterion: "pH", value: 7.6, limit: 8.5, unit: "" },
          { criterion: "EC", value: 1.62, limit: 1.5, unit: "mS/cm" },
          { criterion: "As", value: 0.061, limit: 0.05, unit: "mg/L" },
          { criterion: "Coliform", value: 380, limit: 200, unit: "CFU/100mL" },
        ],
      },
      {
        id: "pt4",
        code: "K17",
        name: "Kênh nhánh xã Xuân Sơn",
        lat: 19.9511,
        lng: 105.524,
        values: [
          { criterion: "pH", value: 7.1, limit: 8.5, unit: "" },
          { criterion: "EC", value: 0.85, limit: 1.5, unit: "mS/cm" },
          { criterion: "As", value: 0.022, limit: 0.05, unit: "mg/L" },
          { criterion: "Coliform", value: 160, limit: 200, unit: "CFU/100mL" },
        ],
      },
      {
        id: "pt5",
        code: "K22",
        name: "Hợp lưu kênh Bái Thượng – sông Cầu Chày",
        lat: 19.9544,
        lng: 105.5318,
        values: [
          { criterion: "pH", value: 7.8, limit: 8.5, unit: "" },
          { criterion: "EC", value: 1.71, limit: 1.5, unit: "mS/cm" },
          { criterion: "As", value: 0.048, limit: 0.05, unit: "mg/L" },
          { criterion: "Coliform", value: 240, limit: 200, unit: "CFU/100mL" },
        ],
      },
    ],
    trend: [
      {
        criterion: "As trung bình",
        unit: "mg/L",
        series: [
          { period: "Q3/2025", value: 0.018 },
          { period: "Q4/2025", value: 0.021 },
          { period: "Q1/2026", value: 0.027 },
          { period: "Q2/2026", value: 0.032 },
        ],
      },
      {
        criterion: "Coliform trung bình",
        unit: "CFU/100mL",
        series: [
          { period: "Q3/2025", value: 95 },
          { period: "Q4/2025", value: 110 },
          { period: "Q1/2026", value: 145 },
          { period: "Q2/2026", value: 195 },
        ],
      },
    ],
  },
  {
    id: "cp3",
    code: "QT-VNNTH-2026-007",
    name: "Giám sát dư lượng BVTV nông sản rau quả tháng 6/2026",
    scope: "30 điểm trên 4 vùng trọng điểm – chọn ngẫu nhiên tại chợ và HTX",
    area: "Yên Định + Hậu Lộc + Hà Trung + TP Thanh Hóa",
    client: "Sở NN&PTNT Thanh Hóa",
    fundingSource: "Đề án ATTP nông sản 2026",
    purpose: "Cảnh báo sớm dư lượng BVTV vượt MRL trên rau quả tiêu thụ tại địa bàn",
    matrix: ["Rau cải", "Cà chua", "Đậu cô ve", "Nho"],
    criteria: [
      "Chlorpyrifos",
      "Cypermethrin",
      "Carbendazim",
      "Abamectin",
      "Imidacloprid",
      "Profenofos",
      "Metalaxyl",
      "Acetamiprid",
      "Permethrin",
      "Difenoconazole",
      "Lambda-cyhalothrin",
      "Fipronil",
    ],
    plannedPoints: 30,
    collectedSamples: 18,
    analyzedSamples: 6,
    startDate: "2026-06-05",
    endDate: "2026-07-10",
    status: "Đang triển khai",
    leader: "Phạm Thu Hà",
  },
  {
    id: "cp4",
    code: "QT-VNNTH-2026-008",
    name: "Đánh giá thoái hóa đất nông nghiệp Hà Trung 2026",
    scope: "40 điểm so sánh với cơ sở dữ liệu 2018 – đánh giá xu hướng 8 năm",
    area: "Huyện Hà Trung, Thanh Hóa",
    client: "UBND huyện Hà Trung",
    fundingSource: "Ngân sách tỉnh – đề án thoái hóa đất",
    purpose:
      "Lập bản đồ phân vùng đất thoái hóa, đề xuất chương trình cải tạo giai đoạn 2026–2030",
    matrix: ["Đất canh tác", "Đất vườn", "Đất đồi nông nghiệp"],
    criteria: [
      "pHKCl",
      "OM%",
      "N tổng",
      "CEC",
      "Mg trao đổi",
      "Ca trao đổi",
      "Độ chua trao đổi",
      "Pb",
      "Cd",
    ],
    plannedPoints: 40,
    collectedSamples: 0,
    analyzedSamples: 0,
    startDate: "2026-07-05",
    endDate: "2026-10-30",
    status: "Lập kế hoạch",
    leader: "Lê Văn Hùng",
  },
];

export type ResultWorkflowStep = "KTV nhập" | "QA/QC kiểm tra" | "Trưởng phòng duyệt";

export type ResultStatus =
  | "Đang nhập"
  | "Chờ QA/QC"
  | "Chờ Trưởng phòng"
  | "Đã duyệt"
  | "Trả lại sửa";

export type Conclusion = "Đạt" | "Không đạt" | "Vô định" | "Báo cáo giá trị";

export type Replicate = { id: number; value: number; note?: string };

export type RawFile = {
  name: string;
  kind: "Instrument log" | "CSV raw" | "Báo cáo PDF" | "Ảnh sắc đồ";
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  hash: string;
};

export type ApprovalRecord = {
  step: ResultWorkflowStep;
  actor: string;
  role: string;
  decision: "Đạt" | "Trả lại sửa" | "Chờ";
  comment?: string;
  signedAt?: string;
  /** SHA-256 nội dung kết quả tại thời điểm ký (chỉ bước phê duyệt). */
  signatureHash?: string;
};

export type AuditEvent = {
  at: string;
  actor: string;
  action: string;
  detail?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
};

export type AnalysisResult = {
  id: string;
  resultCode: string;
  sampleCode: string;
  customerName: string;
  matrix: string;
  criterion: string;
  unit: string;
  method: string;
  instrument: { code: string; name: string };
  referenceMaterial: string;
  technician: string;
  startedAt: string;
  finishedAt?: string;
  replicates: Replicate[];
  mean: number;
  sd: number;
  rsd: number;
  uncertainty: number;
  matrixSpikeRecovery: number;
  blankBlankValue: number;
  decisionRuleId: string;
  decisionRuleType: string;
  decisionLimit: number;
  acceptanceUpper: number;
  rejectionUpper: number;
  conclusion: Conclusion;
  conclusionExplanation: string;
  rawFiles: RawFile[];
  status: ResultStatus;
  approvals: ApprovalRecord[];
  auditTrail: AuditEvent[];
  qaComment?: string;
  managerComment?: string;
};

export const analysisResults: AnalysisResult[] = [
  {
    id: "ar1",
    resultCode: "KQ-VNNTH-2026-00782",
    sampleCode: "M-VNNTH-2026-00320",
    customerName: "Trang trại Rau an toàn Yên Định",
    matrix: "Rau cải lá (Brassica)",
    criterion: "Pb tổng",
    unit: "mg/kg",
    method: "ICP-MS – TCVN 7929:2008",
    instrument: {
      code: "TB-ICP-01",
      name: "ICP-MS PerkinElmer NexION 2000",
    },
    referenceMaterial: "CRM NIST 1573a Tomato Leaves (chứng nhận 1.59 mg/kg Pb)",
    technician: "Phạm Thu Hà",
    startedAt: "2026-06-22 09:15",
    finishedAt: "2026-06-22 14:35",
    replicates: [
      { id: 1, value: 0.232 },
      { id: 2, value: 0.241 },
      { id: 3, value: 0.238 },
      { id: 4, value: 0.235 },
      { id: 5, value: 0.239 },
    ],
    mean: 0.237,
    sd: 0.0036,
    rsd: 1.52,
    uncertainty: 0.018,
    matrixSpikeRecovery: 98.2,
    blankBlankValue: 0.002,
    decisionRuleId: "dr1",
    decisionRuleType: "Guarded acceptance (w = U)",
    decisionLimit: 0.3,
    acceptanceUpper: 0.26,
    rejectionUpper: 0.34,
    conclusion: "Đạt",
    conclusionExplanation:
      "Kết quả + U = 0.255 mg/kg ≤ ngưỡng chấp nhận 0.26 mg/kg. Kết luận ĐẠT QCVN 8-2:2011/BYT với mức tin cậy 95%.",
    rawFiles: [
      {
        name: "ICPMS_20260622_RUNS_320.csv",
        kind: "CSV raw",
        size: "1.8 MB",
        uploadedAt: "2026-06-22 14:32",
        uploadedBy: "Phạm Thu Hà",
        hash: "sha256:a7f9...c1e3",
      },
      {
        name: "Calibration_curve_Pb_20260622.pdf",
        kind: "Báo cáo PDF",
        size: "412 KB",
        uploadedAt: "2026-06-22 14:33",
        uploadedBy: "Phạm Thu Hà",
        hash: "sha256:b1d2...8af0",
      },
      {
        name: "Instrument_log_NexION_220626.txt",
        kind: "Instrument log",
        size: "72 KB",
        uploadedAt: "2026-06-22 14:34",
        uploadedBy: "Phạm Thu Hà",
        hash: "sha256:c8e4...5fa9",
      },
    ],
    status: "Đã duyệt",
    approvals: [
      {
        step: "KTV nhập",
        actor: "Phạm Thu Hà",
        role: "Kỹ thuật viên – Nhóm Dư lượng BVTV & ATTP",
        decision: "Đạt",
        comment: "Đã hoàn thành 5 phép lặp + CRM + mẫu trắng. RSD 1.52% < 5% (đạt).",
        signedAt: "2026-06-22 14:40",
      },
      {
        step: "QA/QC kiểm tra",
        actor: "Trần Thị Mai",
        role: "Phó phòng – Phụ trách QA/QC",
        decision: "Đạt",
        comment:
          "RSD 1.52% nằm trong giới hạn nội bộ < 5%. CRM recovery 98.2% (giới hạn 90–110%). Mẫu trắng 0.002 mg/kg < LOQ. Đối chiếu Levey-Jennings: trong kiểm soát, không vi phạm Westgard. → Đồng ý.",
        signedAt: "2026-06-22 15:18",
      },
      {
        step: "Trưởng phòng duyệt",
        actor: "Nguyễn Đình Lương",
        role: "Trưởng phòng PTN",
        decision: "Đạt",
        comment:
          "Kết quả phù hợp quy tắc quyết định DR-01 (Guarded acceptance, k=2). Đã ký số phát hành phiếu KQ.",
        signedAt: "2026-06-22 16:08",
      },
    ],
    qaComment:
      "Đã đối chiếu với biểu đồ Levey-Jennings chỉ tiêu Pb đất – nằm trong vùng kiểm soát, không vi phạm Westgard.",
    managerComment:
      "Kết quả đủ điều kiện phát hành phiếu KQ cho KH. Tự động đẩy sang /reports để ký số.",
    auditTrail: [
      {
        at: "2026-06-22 09:15",
        actor: "Phạm Thu Hà",
        action: "Khởi tạo phiếu phân tích",
        detail: "Gắn với chỉ tiêu Pb tổng của mẫu M-VNNTH-2026-00320",
      },
      {
        at: "2026-06-22 09:18",
        actor: "Phạm Thu Hà",
        action: "Chọn thiết bị & PP",
        detail: "TB-ICP-01 · ICP-MS – TCVN 7929:2008",
      },
      {
        at: "2026-06-22 09:25",
        actor: "Hệ thống",
        action: "Tự kiểm tra điều kiện vận hành",
        detail:
          "Thiết bị còn hạn hiệu chuẩn (đến 2026-06-02 → cảnh báo, cho phép tiếp tục có ghi chú)",
      },
      {
        at: "2026-06-22 14:18",
        actor: "Phạm Thu Hà",
        action: "Nhập 5 phép lặp",
        field: "Replicate values",
        newValue: "0.232; 0.241; 0.238; 0.235; 0.239",
      },
      {
        at: "2026-06-22 14:20",
        actor: "Hệ thống",
        action: "Tính thống kê",
        detail: "x̄ = 0.237 · SD = 0.0036 · RSD = 1.52% · U(k=2) = 0.018",
      },
      {
        at: "2026-06-22 14:21",
        actor: "Hệ thống",
        action: "Áp quy tắc quyết định DR-01",
        detail: "0.237 + 0.018 = 0.255 ≤ 0.26 → ĐẠT",
      },
      {
        at: "2026-06-22 14:32",
        actor: "Phạm Thu Hà",
        action: "Đính kèm 3 raw file",
        detail: "ICPMS_20260622_RUNS_320.csv · Calibration_curve_Pb.pdf · Instrument_log",
      },
      {
        at: "2026-06-22 14:38",
        actor: "Phạm Thu Hà",
        action: "Sửa ghi chú",
        field: "Conclusion explanation",
        oldValue: "(trống)",
        newValue:
          "Kết quả + U = 0.255 mg/kg ≤ ngưỡng chấp nhận 0.26 mg/kg.",
      },
      {
        at: "2026-06-22 14:40",
        actor: "Phạm Thu Hà",
        action: "Nộp cho QA/QC",
      },
      {
        at: "2026-06-22 15:10",
        actor: "Trần Thị Mai",
        action: "Mở duyệt QA/QC",
      },
      {
        at: "2026-06-22 15:18",
        actor: "Trần Thị Mai",
        action: "Duyệt QA/QC – Đạt",
        detail: "Đối chiếu Levey-Jennings: trong kiểm soát",
      },
      {
        at: "2026-06-22 16:00",
        actor: "Nguyễn Đình Lương",
        action: "Mở duyệt cuối",
      },
      {
        at: "2026-06-22 16:08",
        actor: "Nguyễn Đình Lương",
        action: "Duyệt – Đã ký số",
        detail: "Phát hành phiếu KQ tự động sang /reports",
      },
    ],
  },
  {
    id: "ar2",
    resultCode: "KQ-VNNTH-2026-00785",
    sampleCode: "M-VNNTH-2026-00318",
    customerName: "HTX Nông nghiệp Đông Sơn",
    matrix: "Đất canh tác lúa",
    criterion: "OM% (Walkley-Black)",
    unit: "%",
    method: "TCVN 8941:2011",
    instrument: { code: "TB-AUTO-01", name: "Máy chuẩn độ tự động Metrohm" },
    referenceMaterial: "Mẫu chuẩn nội bộ đất Hà Trung (2.85%)",
    technician: "Trần Thị Mai",
    startedAt: "2026-06-23 08:00",
    replicates: [
      { id: 1, value: 2.78 },
      { id: 2, value: 2.84 },
      { id: 3, value: 2.81 },
    ],
    mean: 2.81,
    sd: 0.03,
    rsd: 1.07,
    uncertainty: 0.14,
    matrixSpikeRecovery: 96.1,
    blankBlankValue: 0.05,
    decisionRuleId: "—",
    decisionRuleType: "Simple acceptance (báo cáo giá trị)",
    decisionLimit: 0,
    acceptanceUpper: 0,
    rejectionUpper: 0,
    conclusion: "Báo cáo giá trị",
    conclusionExplanation:
      "Chỉ tiêu OM% trả về giá trị + U cho KH dùng tham chiếu khuyến cáo bón vôi/phân, không áp ngưỡng đạt/không đạt.",
    rawFiles: [
      {
        name: "Titrando_log_20260623.txt",
        kind: "Instrument log",
        size: "48 KB",
        uploadedAt: "2026-06-23 11:42",
        uploadedBy: "Trần Thị Mai",
        hash: "sha256:d4e5...90bc",
      },
    ],
    status: "Chờ QA/QC",
    approvals: [
      {
        step: "KTV nhập",
        actor: "Trần Thị Mai",
        role: "Kỹ thuật viên – Nhóm Đất & Phân bón",
        decision: "Đạt",
        signedAt: "2026-06-23 11:50",
      },
      {
        step: "QA/QC kiểm tra",
        actor: "—",
        role: "—",
        decision: "Chờ",
      },
      {
        step: "Trưởng phòng duyệt",
        actor: "—",
        role: "—",
        decision: "Chờ",
      },
    ],
    auditTrail: [
      {
        at: "2026-06-23 08:00",
        actor: "Trần Thị Mai",
        action: "Khởi tạo phiếu phân tích",
      },
      {
        at: "2026-06-23 11:30",
        actor: "Trần Thị Mai",
        action: "Nhập 3 phép lặp",
        newValue: "2.78; 2.84; 2.81",
      },
      {
        at: "2026-06-23 11:42",
        actor: "Trần Thị Mai",
        action: "Đính kèm raw file",
      },
      {
        at: "2026-06-23 11:50",
        actor: "Trần Thị Mai",
        action: "Nộp cho QA/QC",
      },
    ],
  },
  {
    id: "ar3",
    resultCode: "KQ-VNNTH-2026-00779",
    sampleCode: "M-VNNTH-2026-00315",
    customerName: "Công ty CP Phân bón Tiến Nông",
    matrix: "Phân bón NPK 16-16-8",
    criterion: "P2O5 hữu hiệu",
    unit: "%",
    method: "TCVN 8559:2010",
    instrument: { code: "TB-UV-02", name: "Quang phổ UV-VIS Shimadzu" },
    referenceMaterial: "Mẫu chuẩn nội bộ NPK 16-16-8",
    technician: "Đỗ Minh Tuấn",
    startedAt: "2026-06-21 13:00",
    replicates: [
      { id: 1, value: 14.8 },
      { id: 2, value: 14.6 },
      { id: 3, value: 14.9 },
    ],
    mean: 14.77,
    sd: 0.15,
    rsd: 1.04,
    uncertainty: 0.42,
    matrixSpikeRecovery: 95.4,
    blankBlankValue: 0.1,
    decisionRuleId: "dr6",
    decisionRuleType: "Guarded acceptance (w = U) – 2 phía",
    decisionLimit: 16.5,
    acceptanceUpper: 16.18,
    rejectionUpper: 16.5,
    conclusion: "Không đạt",
    conclusionExplanation:
      "Kết quả 14.77% < ngưỡng chấp nhận thấp 15.82%. Kết luận KHÔNG ĐẠT theo NĐ 84/2019/NĐ-CP (dung sai ±0.5%).",
    rawFiles: [
      {
        name: "UV-VIS_P2O5_20260621.csv",
        kind: "CSV raw",
        size: "120 KB",
        uploadedAt: "2026-06-21 16:42",
        uploadedBy: "Đỗ Minh Tuấn",
        hash: "sha256:e2a7...7c8d",
      },
    ],
    status: "Trả lại sửa",
    approvals: [
      {
        step: "KTV nhập",
        actor: "Đỗ Minh Tuấn",
        role: "Kỹ thuật viên – Nhóm Đất & Phân bón",
        decision: "Đạt",
        signedAt: "2026-06-21 16:50",
      },
      {
        step: "QA/QC kiểm tra",
        actor: "Trần Thị Mai",
        role: "Phó phòng – QA/QC",
        decision: "Trả lại sửa",
        comment:
          "CRM recovery 95.4% còn trong giới hạn nhưng yêu cầu chạy thêm 2 phép lặp để giảm U. P2O5 nằm trong vùng quan trọng pháp lý – KH cần độ chắc chắn cao.",
        signedAt: "2026-06-21 17:30",
      },
      {
        step: "Trưởng phòng duyệt",
        actor: "—",
        role: "—",
        decision: "Chờ",
      },
    ],
    qaComment: "Yêu cầu chạy thêm 2 phép lặp + xem lại đường chuẩn",
    auditTrail: [
      {
        at: "2026-06-21 13:00",
        actor: "Đỗ Minh Tuấn",
        action: "Khởi tạo phiếu",
      },
      {
        at: "2026-06-21 16:30",
        actor: "Đỗ Minh Tuấn",
        action: "Nhập 3 phép lặp",
        newValue: "14.8; 14.6; 14.9",
      },
      {
        at: "2026-06-21 16:50",
        actor: "Đỗ Minh Tuấn",
        action: "Nộp cho QA/QC",
      },
      {
        at: "2026-06-21 17:30",
        actor: "Trần Thị Mai",
        action: "Trả lại sửa",
        detail: "Yêu cầu chạy thêm 2 phép lặp – chuyển trạng thái về KTV",
      },
    ],
  },
];

export type FeedbackRating =
  | "Nhiệt tình"
  | "Tốt"
  | "Khá"
  | "Bình thường"
  | "Trung bình"
  | "Kém"
  | "Cao"
  | "Hợp lý"
  | "Thấp"
  | "Nhanh"
  | "Đúng hạn"
  | "Chậm";

export type CustomerFeedback = {
  id: string;
  code: string;
  customerName?: string;
  customerKind?: string;
  submittedAt: string;
  serviceAttitude: "Nhiệt tình" | "Tốt" | "Bình thường" | "Kém";
  fee: "Cao" | "Hợp lý" | "Thấp";
  quality: "Tốt" | "Khá" | "Trung bình" | "Kém";
  infoAvailability: "Tốt" | "Khá" | "Trung bình" | "Kém";
  deliveryTime: "Nhanh" | "Đúng hạn" | "Bình thường" | "Chậm";
  comments?: string;
  isComplaint: boolean;
  complaintStatus?: "Mới" | "Đang xử lý" | "Đã trả lời" | "Đã đóng";
  responseDate?: string;
  responder?: string;
  responseNote?: string;
};

export const customerFeedbacks: CustomerFeedback[] = [
  {
    id: "fb1",
    code: "YK-VNNTH-2026-018",
    customerName: "HTX Cam Vân Du",
    customerKind: "HTX / Trang trại",
    submittedAt: "2026-06-24",
    serviceAttitude: "Nhiệt tình",
    fee: "Hợp lý",
    quality: "Tốt",
    infoAvailability: "Tốt",
    deliveryTime: "Đúng hạn",
    comments:
      "Cảm ơn Viện đã tư vấn rất kỹ về MRL EU cho lô cam xuất khẩu. Mong tiếp tục được hỗ trợ.",
    isComplaint: false,
  },
  {
    id: "fb2",
    code: "YK-VNNTH-2026-017",
    customerName: "HTX Nông nghiệp Đông Sơn",
    customerKind: "HTX / Trang trại",
    submittedAt: "2026-06-22",
    serviceAttitude: "Tốt",
    fee: "Hợp lý",
    quality: "Tốt",
    infoAvailability: "Khá",
    deliveryTime: "Đúng hạn",
    comments: "Đề nghị Viện cử cán bộ xuống tận ruộng để tư vấn bón phân.",
    isComplaint: false,
  },
  {
    id: "fb3",
    code: "YK-VNNTH-2026-016",
    customerName: "Trang trại Rau an toàn Yên Định",
    customerKind: "HTX / Trang trại",
    submittedAt: "2026-06-20",
    serviceAttitude: "Tốt",
    fee: "Hợp lý",
    quality: "Khá",
    infoAvailability: "Khá",
    deliveryTime: "Bình thường",
    comments:
      "Thời gian trả kết quả BVTV hơi chậm khi mùa cao điểm. Mong Viện rút ngắn xuống 4-5 ngày.",
    isComplaint: true,
    complaintStatus: "Đang xử lý",
    responder: "Trần Thị Mai",
    responseNote: "Đã ghi nhận, đang lập kế hoạch tăng năng lực GC-MS Q3/2026.",
  },
  {
    id: "fb4",
    code: "YK-VNNTH-2026-015",
    customerName: "Phòng NN&PTNT huyện Thọ Xuân",
    customerKind: "Cơ quan nhà nước",
    submittedAt: "2026-06-18",
    serviceAttitude: "Nhiệt tình",
    fee: "Hợp lý",
    quality: "Tốt",
    infoAvailability: "Tốt",
    deliveryTime: "Nhanh",
    comments: "Báo cáo đợt quan trắc kênh Bái Thượng rất chi tiết.",
    isComplaint: false,
  },
  {
    id: "fb5",
    code: "YK-VNNTH-2026-014",
    customerName: "Công ty CP Phân bón Tiến Nông",
    customerKind: "Doanh nghiệp",
    submittedAt: "2026-06-15",
    serviceAttitude: "Tốt",
    fee: "Cao",
    quality: "Tốt",
    infoAvailability: "Khá",
    deliveryTime: "Đúng hạn",
    comments:
      "Đề nghị Viện xem xét chính sách giảm giá cho KH gửi mẫu thường xuyên (> 50 mẫu/quý).",
    isComplaint: false,
  },
  {
    id: "fb6",
    code: "YK-VNNTH-2026-013",
    submittedAt: "2026-06-12",
    serviceAttitude: "Tốt",
    fee: "Hợp lý",
    quality: "Tốt",
    infoAvailability: "Khá",
    deliveryTime: "Đúng hạn",
    comments: "Không có ý kiến gì thêm. Mong Viện duy trì chất lượng.",
    isComplaint: false,
  },
  {
    id: "fb7",
    code: "YK-VNNTH-2026-012",
    customerName: "Công ty TNHH Mía đường Lam Sơn",
    customerKind: "Doanh nghiệp",
    submittedAt: "2026-06-08",
    serviceAttitude: "Bình thường",
    fee: "Cao",
    quality: "Khá",
    infoAvailability: "Trung bình",
    deliveryTime: "Chậm",
    comments:
      "Kết quả phân tích đợt khảo sát đất tháng 5 trễ 3 ngày so với cam kết. Phiếu KQ thiếu phần khuyến nghị bón phân.",
    isComplaint: true,
    complaintStatus: "Đã trả lời",
    responseDate: "2026-06-10",
    responder: "Nguyễn Đình Lương",
    responseNote:
      "Xin lỗi quý KH. Đã bổ sung phần khuyến nghị bón phân và miễn phí phân tích lại 1 mẫu trong đợt tới. Cam kết cải tiến quy trình kiểm soát hạn trả.",
  },
];

export type ServiceGroup =
  | "Phân tích đất"
  | "Phân tích nước"
  | "Phân tích phân bón"
  | "Phân tích BVTV"
  | "Tư vấn nông nghiệp";

export type ServiceItem = {
  id: string;
  code: string;
  name: string;
  group: ServiceGroup;
  description: string;
  unit: string;
  basePrice: number;
  turnaround: string;
  methods?: string[];
  vilas: boolean;
};

export const services: ServiceItem[] = [
  {
    id: "sv1",
    code: "DV-DAT-01",
    name: "Phân tích dinh dưỡng đất",
    group: "Phân tích đất",
    description:
      "Bộ chỉ tiêu dinh dưỡng cơ bản: pHKCl, OM%, N tổng, P2O5 dễ tiêu, K2O dễ tiêu, CEC",
    unit: "mẫu",
    basePrice: 1100000,
    turnaround: "7 ngày",
    methods: ["TCVN 5979:2007", "TCVN 8941:2011", "Bray-II"],
    vilas: true,
  },
  {
    id: "sv2",
    code: "DV-DAT-02",
    name: "Phân tích thoái hóa đất",
    group: "Phân tích đất",
    description:
      "Đánh giá thoái hóa: pH, OM%, Al/Mn trao đổi, độ chua, độ no bazơ, kết cấu đất",
    unit: "mẫu",
    basePrice: 1450000,
    turnaround: "10 ngày",
    vilas: true,
  },
  {
    id: "sv3",
    code: "DV-DAT-03",
    name: "Phân tích ô nhiễm đất (KLN)",
    group: "Phân tích đất",
    description: "As, Pb, Cd, Cu, Zn, Cr, Hg trong đất canh tác",
    unit: "mẫu",
    basePrice: 1850000,
    turnaround: "7 ngày",
    methods: ["TCVN 6649:2000", "TCVN 7929:2008"],
    vilas: true,
  },
  {
    id: "sv4",
    code: "DV-DAT-04",
    name: "Phân tích nông hóa đất",
    group: "Phân tích đất",
    description:
      "Bộ chỉ tiêu nông hóa: N, P, K, Ca, Mg, S dễ tiêu phục vụ khuyến cáo bón phân",
    unit: "mẫu",
    basePrice: 1280000,
    turnaround: "7 ngày",
    vilas: true,
  },
  {
    id: "sv5",
    code: "DV-DAT-05",
    name: "Phân tích thổ nhưỡng đất",
    group: "Phân tích đất",
    description:
      "Phân loại thổ nhưỡng, cơ giới đất, thành phần khoáng – phục vụ quy hoạch SX",
    unit: "mẫu",
    basePrice: 1650000,
    turnaround: "14 ngày",
    vilas: false,
  },
  {
    id: "sv6",
    code: "DV-NUOC-01",
    name: "Phân tích chất lượng nước tưới",
    group: "Phân tích nước",
    description: "pH, EC, DO, độ đục, TDS, NH4+, NO3-, PO4 3-, Coliform",
    unit: "mẫu",
    basePrice: 980000,
    turnaround: "5 ngày",
    methods: ["TCVN 6492:2011", "TCVN 6187-1:2009"],
    vilas: true,
  },
  {
    id: "sv7",
    code: "DV-NUOC-02",
    name: "Phân tích ô nhiễm nước",
    group: "Phân tích nước",
    description: "KLN trong nước (As, Pb, Cd, Hg, Cr), COD, BOD5, dầu mỡ",
    unit: "mẫu",
    basePrice: 1450000,
    turnaround: "7 ngày",
    methods: ["SMEWW 3114B", "SMEWW 5220C"],
    vilas: true,
  },
  {
    id: "sv8",
    code: "DV-PB-01",
    name: "Phân tích chất lượng phân bón hữu cơ",
    group: "Phân tích phân bón",
    description: "OM%, N, P2O5, K2O tổng & hữu hiệu, độ ẩm, axit humic",
    unit: "mẫu",
    basePrice: 1050000,
    turnaround: "7 ngày",
    vilas: true,
  },
  {
    id: "sv9",
    code: "DV-PB-02",
    name: "Phân tích chất lượng phân bón vô cơ",
    group: "Phân tích phân bón",
    description:
      "N tổng, P2O5 hữu hiệu, K2O hữu hiệu, độ ẩm, biuret, ẩm – phục vụ kiểm tra chất lượng theo NĐ 84/2019",
    unit: "mẫu",
    basePrice: 1180000,
    turnaround: "7 ngày",
    methods: ["TCVN 8559:2010"],
    vilas: true,
  },
  {
    id: "sv10",
    code: "DV-BVTV-01",
    name: "Phân tích BVTV nhóm lân hữu cơ trong đất",
    group: "Phân tích BVTV",
    description:
      "Định lượng các BVTV lân hữu cơ (Chlorpyrifos, Diazinon, Profenofos…) trong đất canh tác",
    unit: "mẫu",
    basePrice: 1750000,
    turnaround: "10 ngày",
    methods: ["GC-MS QuEChERS"],
    vilas: true,
  },
  {
    id: "sv11",
    code: "DV-BVTV-02",
    name: "Phân tích BVTV nhóm lân hữu cơ trong nước",
    group: "Phân tích BVTV",
    description:
      "Định lượng các BVTV lân hữu cơ trong nước mặt, nước tưới",
    unit: "mẫu",
    basePrice: 1850000,
    turnaround: "10 ngày",
    methods: ["GC-MS", "LC-MS/MS"],
    vilas: true,
  },
  {
    id: "sv12",
    code: "DV-BVTV-03",
    name: "Phân tích BVTV nhóm lân hữu cơ trong nông sản",
    group: "Phân tích BVTV",
    description:
      "Định lượng dư lượng BVTV trên rau quả tươi/khô, đối chiếu MRL Codex/EU",
    unit: "mẫu",
    basePrice: 1950000,
    turnaround: "10 ngày",
    methods: ["QuEChERS GC-MS"],
    vilas: true,
  },
  {
    id: "sv13",
    code: "TV-01",
    name: "Tư vấn dịch vụ phân tích",
    group: "Tư vấn nông nghiệp",
    description:
      "Tư vấn chọn chỉ tiêu, phương pháp, mẫu cần lấy phù hợp mục đích KH",
    unit: "buổi",
    basePrice: 0,
    turnaround: "Trong ngày",
    vilas: false,
  },
  {
    id: "sv14",
    code: "TV-02",
    name: "Tư vấn sử dụng kết quả phân tích",
    group: "Tư vấn nông nghiệp",
    description: "Diễn giải KQ, đối chiếu QCVN, khuyến nghị hành động cho KH",
    unit: "buổi",
    basePrice: 500000,
    turnaround: "3 ngày",
    vilas: false,
  },
  {
    id: "sv15",
    code: "TV-03",
    name: "Tư vấn sử dụng đất",
    group: "Tư vấn nông nghiệp",
    description:
      "Khuyến cáo cải tạo đất chua, đất nhiễm mặn, đất thoái hóa cho HTX và nông hộ",
    unit: "buổi",
    basePrice: 850000,
    turnaround: "5 ngày",
    vilas: false,
  },
  {
    id: "sv16",
    code: "TV-04",
    name: "Tư vấn sử dụng phân bón",
    group: "Tư vấn nông nghiệp",
    description: "Lập công thức bón phân theo loại đất × cây trồng × mùa vụ",
    unit: "buổi",
    basePrice: 850000,
    turnaround: "5 ngày",
    vilas: false,
  },
  {
    id: "sv17",
    code: "TV-05",
    name: "Tư vấn chế độ canh tác",
    group: "Tư vấn nông nghiệp",
    description:
      "Đề xuất luân canh, xen canh, mật độ trồng phù hợp cho từng loại cây",
    unit: "buổi",
    basePrice: 1200000,
    turnaround: "7 ngày",
    vilas: false,
  },
  {
    id: "sv18",
    code: "TV-06",
    name: "Tư vấn dinh dưỡng cây trồng",
    group: "Tư vấn nông nghiệp",
    description:
      "Phân tích triệu chứng thiếu/thừa dinh dưỡng, đề xuất giải pháp khắc phục",
    unit: "buổi",
    basePrice: 950000,
    turnaround: "5 ngày",
    vilas: false,
  },
];

export const dashboardKpis = {
  sampleTotal: samples.length,
  sampleInProgress: samples.filter((s) =>
    ["Đang phân tích", "Chờ duyệt"].includes(s.status),
  ).length,
  sampleOverdue: 1,
  equipmentCalibrationDue: equipments.filter(
    (e) => new Date(e.nextCalibration) <= new Date("2026-06-30"),
  ).length,
  chemicalLowStock: chemicals.filter((c) => c.stock < c.minStock).length,
  chemicalExpiringSoon: chemicals.filter(
    (c) => new Date(c.expiry) <= new Date("2026-08-31"),
  ).length,
};

// ===== Nhật ký hiệu chuẩn thiết bị =====
export type CalibrationLog = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  date: string; // Ngày hiệu chuẩn
  result: "Đạt" | "Không đạt";
  certificate: string; // Số giấy chứng nhận
  place: string; // Nơi thực hiện
  nextDate: string; // Hạn kế tiếp
  technician: string; // Người theo dõi
  note?: string;
  // Theo XaLab (migration 0037): hiệu chuẩn nội bộ + định kỳ trong cùng một lần cập nhật.
  equipmentId?: string;
  internalDate?: string;
  internalBy?: string;
  condition?: string;
};

export const calibrationLogs: CalibrationLog[] = [
  {
    id: "cal1",
    equipmentCode: "TB-ICP-01",
    equipmentName: "ICP-MS",
    date: "2026-04-02",
    result: "Đạt",
    certificate: "HC-2026-0412",
    place: "PerkinElmer VN",
    nextDate: "2026-10-02",
    technician: "Nguyễn Quang Anh",
  },
  {
    id: "cal2",
    equipmentCode: "TB-AAS-01",
    equipmentName: "AAS",
    date: "2026-02-10",
    result: "Đạt",
    certificate: "HC-2026-0210",
    place: "QUATEST 1",
    nextDate: "2026-08-10",
    technician: "Đỗ Minh Tuấn",
  },
];

// ===== Nhật ký bảo trì, bảo dưỡng thiết bị =====
export type MaintenanceLog = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  date: string;
  kind: "Bảo trì định kỳ" | "Bảo dưỡng" | "Sửa chữa";
  content: string; // Nội dung thực hiện
  vendor: string; // Đơn vị thực hiện
  technician: string; // Người theo dõi
  note?: string;
};

export const maintenanceLogs: MaintenanceLog[] = [
  {
    id: "mt1",
    equipmentCode: "TB-GCMS-01",
    equipmentName: "GC-MS dư lượng BVTV",
    date: "2026-05-05",
    kind: "Bảo dưỡng",
    content: "Vệ sinh nguồn ion, thay bơm chân không",
    vendor: "Agilent VN",
    technician: "Phạm Thu Hà",
  },
  {
    id: "mt2",
    equipmentCode: "TB-AUTO-01",
    equipmentName: "Máy chuẩn độ tự động",
    date: "2026-04-18",
    kind: "Bảo trì định kỳ",
    content: "Kiểm tra buret, thay điện cực",
    vendor: "Metrohm – đại lý KV2",
    technician: "Lê Văn Hùng",
  },
];

// ===== Biên bản kiểm tra/kiểm định thiết bị =====
export type InspectionRecord = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  date: string;
  type: "Kiểm tra" | "Kiểm định";
  result: "Đạt" | "Không đạt";
  conclusion: string; // Kết luận
  inspector: string; // Người/đơn vị kiểm định
  note?: string;
};

export const inspectionRecords: InspectionRecord[] = [
  {
    id: "ins1",
    equipmentCode: "TB-AAS-01",
    equipmentName: "AAS",
    date: "2026-02-11",
    type: "Kiểm định",
    result: "Đạt",
    conclusion: "Thiết bị đạt yêu cầu sử dụng",
    inspector: "QUATEST 1",
  },
  {
    id: "ins2",
    equipmentCode: "TB-KJ-01",
    equipmentName: "Hệ Kjeldahl",
    date: "2026-03-20",
    type: "Kiểm tra",
    result: "Đạt",
    conclusion: "Hoạt động ổn định sau vệ sinh",
    inspector: "Nội bộ – Tổ thiết bị",
  },
];

// ===== Hướng dẫn sử dụng thiết bị =====
export type EquipmentManual = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  title: string; // Tên tài liệu
  docCode: string; // Mã tài liệu
  version: string;
  fileUrl?: string; // Link tài liệu
  note?: string;
};

export const equipmentManuals: EquipmentManual[] = [
  {
    id: "man1",
    equipmentCode: "TB-ICP-01",
    equipmentName: "ICP-MS",
    title: "Hướng dẫn vận hành ICP-MS NexION 2000",
    docCode: "HDSD-ICP-01",
    version: "v2.0",
    fileUrl: "",
  },
  {
    id: "man2",
    equipmentCode: "TB-AAS-01",
    equipmentName: "AAS",
    title: "Hướng dẫn sử dụng máy AAS 240FS",
    docCode: "HDSD-AAS-01",
    version: "v1.3",
    fileUrl: "",
  },
];

// ===== Hồ sơ hóa chất, chất chuẩn (CoA / MSDS / chứng nhận) =====
export type ChemicalProfile = {
  id: string;
  chemicalCode: string;
  chemicalName: string;
  docType: "CoA" | "MSDS" | "Chứng nhận" | "Khác";
  docCode: string;
  issuedBy: string; // Đơn vị cấp
  issueDate: string;
  fileUrl?: string;
  note?: string;
};

export const chemicalProfiles: ChemicalProfile[] = [
  {
    id: "cp1",
    chemicalCode: "HC-STD-Pb1000",
    chemicalName: "Chuẩn Pb 1000 mg/L",
    docType: "CoA",
    docCode: "CoA-Pb-2026-01",
    issuedBy: "Merck",
    issueDate: "2026-01-15",
    fileUrl: "",
  },
  {
    id: "cp2",
    chemicalCode: "HC-ACN-01",
    chemicalName: "Acetonitrile (ACN) HPLC",
    docType: "MSDS",
    docCode: "MSDS-ACN-2025",
    issuedBy: "Fisher",
    issueDate: "2025-06-01",
    fileUrl: "",
  },
];

// ===== Vật tư tiêu hao (danh mục riêng, đi cùng Dụng cụ) =====
export type Supply = {
  id: string;
  code: string;
  name: string;
  unit: string;
  qty: number;
  minQty: number;
  location: string;
  note?: string;
};

export const supplies: Supply[] = [
  {
    id: "vt1",
    code: "VT-GLOVE-01",
    name: "Găng tay nitrile không bột",
    unit: "hộp",
    qty: 42,
    minQty: 10,
    location: "Kho vật tư",
  },
  {
    id: "vt2",
    code: "VT-FILTER-045",
    name: "Màng lọc PTFE 0.45 µm",
    unit: "gói",
    qty: 8,
    minQty: 5,
    location: "Kho vật tư",
  },
  {
    id: "vt3",
    code: "VT-VIAL-2ML",
    name: "Vial HPLC 2 mL nắp vặn",
    unit: "hộp",
    qty: 15,
    minQty: 6,
    location: "P. Sắc ký",
  },
];

// ===== Nhật ký theo dõi sử dụng dụng cụ, vật tư tiêu hao =====
export type ToolUsageLog = {
  id: string;
  itemName: string; // Tên dụng cụ / vật tư
  qty: number; // Số lượng
  unit?: string;
  importedAt: string; // Ngày nhập
  status: string; // Tình trạng sử dụng
  user?: string; // Người sử dụng
  note?: string;
};

export const toolUsageLogs: ToolUsageLog[] = [
  {
    id: "tu1",
    itemName: "Pipet tự động 1000 µL",
    qty: 1,
    unit: "cái",
    importedAt: "2026-03-01",
    status: "Đang dùng tốt",
    user: "Phạm Thu Hà",
  },
  {
    id: "tu2",
    itemName: "Màng lọc PTFE 0.45 µm",
    qty: 2,
    unit: "gói",
    importedAt: "2026-05-10",
    status: "Đã dùng hết",
    user: "Lê Văn Hùng",
  },
];
