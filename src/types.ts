export type DepartmentType = 'งานตรวจจ่าย' | 'งานสอบทาน' | 'งานการเงิน' | 'งานงบประมาณ';

export interface DocumentItem {
  id: string; // unique internal id
  rowId: number; // Row index in Google Sheet DATA (2-based)
  ep: string; // งานธุรการ EP
  no: string; // N/O
  receiveNo: string; // เลขทะเบียนรับ
  sender: string; // ผู้ส่งเอกสาร
  phone: string; // โทรศัพท์
  docRef: string; // เลขที่ อว/ ชื่อ
  agency: string; // ชื่อหน่วยงาน
  docNo: string; // เลขที่เอกสาร (กลุ่มตามเลขที่นี้)
  docType: string; // ประเภทเอกสาร
  dateReceive: string; // วันที่รับ
  dateDesk: string; // วันที่ลงโต๊ะ
  dateReturn: string; // วันที่ส่งคืน
  returnStatus: string; // สถานะการส่งคืน
  providerAuto: string; // ผู้ให้บริการ (อัตโนมัติ)
  providerChange: string; // เปลี่ยนผู้ให้บริการ
  providerFinal: string; // ผู้ให้บริการ (Final)
  note: string; // เหตุผล/หมายเหตุ
  subType: string; // งานตรวจจ่าย ประเภทเอกสารย่อย
  qa: string; // QA.
  actionDate: string; // วันที่ดำเนินการ
  action: string; // การดำเนินการ
  status: string; // สถานะ
  editGroup: string; // Group-กรณีแก้ไข
  editDetail: string; // รายละเอียดกรณีแก้ไข
  department: DepartmentType; // ฝ่ายผู้รับผิดชอบ
  round: number; // รอบที่ (ครั้งที่ 1, 2, ...)
}

export interface GroupedDocument {
  docNo: string;
  agency: string;
  docType: string;
  docRef: string;
  sender: string;
  phone: string;
  department: DepartmentType;
  totalRounds: number;
  latestRound: DocumentItem;
  rounds: DocumentItem[]; // Sorted from latest (round N) to first (round 1)
}

export interface FilterOptions {
  searchQuery: string;
  selectedDepartment: DepartmentType | 'ALL';
  returnStatus: string;
  hasMultipleRoundsOnly: boolean;
}
