export type DepartmentType = 'งานตรวจจ่าย' | 'งานสอบทาน' | 'งานการเงิน' | 'งานงบประมาณ';

export interface DocumentItem {
  id: string; // unique internal id
  rowId: number; // Row index in Google Sheet DATA (2-based)
  ep: string; // งานธุรการ EP
  no: string; // N/O
  receiveNo: string; // เลขทะเบียนรับ
  sender: string; // ผู้ส่งเอกสาร
  phone: string; // โทรศัพท์
  email?: string; // อีเมล (คอลัมน์ F ใน Google Sheet)
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
  // งานสอบทาน (คอลัมน์ Y ถึง AD ใน Google Sheet)
  reviewReceiveDate?: string; // วันที่รับเอกสาร (งานสอบทาน)
  reviewProvider?: string; // ผู้ให้บริการ (งานสอบทาน)
  reviewActionDate?: string; // วันที่ดำเนินการ (งานสอบทาน)
  reviewStatus?: string; // สถานะ (งานสอบทาน)
  reviewEditType?: string; // ประเภทแก้ไข (งานสอบทาน)
  reviewEditDetail?: string; // รายละเอียดกรณีแก้ไข / หมายเหตุ (งานสอบทาน)
  // งานการเงิน (คอลัมน์ AE ถึง AQ ใน Google Sheet)
  financeReceiveDate?: string; // วันที่-รับเอกสาร (AE)
  financePaymentType?: string; // ประเภทการจ่าย (AF)
  financePreparer?: string; // ผู้จัดทำเช็ค/โอนเงิน (AG)
  financeUrgentCheck?: string; // กรณีเช็คด่วน (AH)
  financeActionDate?: string; // วันที่-ทำรายการ (AI)
  financeReviewDate?: string; // วันที่สอบทาน-เช็ค/โอนเงิน (AJ)
  disbursementDate?: string; // วันที่-จ่ายเงิน (AK)
  disbursementPayer?: string; // ผู้จ่ายเงิน (AL)
  disbursementNotifyDate?: string; // วันที่แจ้งหน่วยงานติดต่อรับเงิน (AM)
  disbursementActivityStartDate?: string; // วันที่เริ่มกิจกรรม (กรณีเงินยืมทดรอง) (AN)
  disbursementActivityEndDate?: string; // วันสิ้นสุดกิจกรรม (AO)
  financeIssueDate?: string; // วันที่ (กรณีไม่สามารถจ่ายเงิน/ทำเช็ค/โอนเงินได้) (AP)
  financeIssueDetail?: string; // รายละเอียดกรณีแก้ไข (AQ)
  // งานงบประมาณ (คอลัมน์ AR ถึง AY ใน Google Sheet)
  budgetActionDate?: string; // วันที่ดำเนินการ (AR)
  budgetFR?: string; // FR (AS)
  budgetFC?: string; // FC (AT)
  budgetPR?: string; // PR (AU)
  budgetStatus?: string; // สถานะ (AV)
  budgetReceiveDate?: string; // วันที่รับเอกสาร (AW)
  budgetCoverDate?: string; // วันที่ตามใบปะหน้า (AX)
  budgetDocSetDate?: string; // วันที่ตามชุดเอกสาร (AY)
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
