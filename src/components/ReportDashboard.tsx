import React, { useState, useMemo } from 'react';
import { DocumentItem, GroupedDocument, DepartmentType } from '../types';
import { isReviewProviderFinal } from './ReviewRecordModal';
import { HistoryModal } from './HistoryModal';
import {
  BarChart3,
  Calendar,
  CalendarDays,
  Layers,
  Sun,
  Moon,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  Inbox,
  Filter,
  Users,
  FileSpreadsheet,
  Building2,
  ChevronDown,
  X,
  Search,
  FileText,
  Eye,
  Info,
  Printer,
} from 'lucide-react';

interface ReportDashboardProps {
  documents: DocumentItem[];
  groupedDocuments: GroupedDocument[];
  currentDept: DepartmentType | 'ALL';
  onSelectDept: (dept: DepartmentType | 'ALL') => void;
  onBackToCards: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: (t: 'light' | 'dark') => void;
}

type ViewSection = 'LOOKER_MOCKUP' | 'ALL_SECTIONS' | 'DAILY' | 'MONTHLY' | 'TOTAL';

// 10 โต๊ะ/ผู้ให้บริการ สำหรับงานตรวจจ่าย (โต๊ะ 1 ถึง 10)
export const INSPECTION_STAFF_MEMBERS = [
  'อภิญญา',
  'พรนัชชา',
  'ดารารัตน์',
  'สาโรจน์',
  'ละอองดาว',
  'ธนัฏพร',
  'ภาคินี',
  'ทรงวุฒิ',
  'ดุษฎา',
  'ทิพาธร',
] as const;

// 6 ประเภทเอกสาร สำหรับงานตรวจจ่ายเท่านั้น (ที่เหลือจะไม่ใช่งานตรวจจ่าย)
export const INSPECTION_DOC_TYPES = [
  'ยืมเงินทดรองจ่าย',
  'คืนเงินยืมทดรอง',
  'เบิกจ่ายตรวจรับพัสดุ',
  'สวัสดิการ',
  'เบิกสำรองจ่าย',
  'เบิกจ่ายทั่วไป',
] as const;

// Helper: Normalize inspection staff name (รองรับชื่อที่มีเลขโต๊ะนำหน้า หรือสะกดต่างเล็กน้อย)
const normalizeInspectionStaff = (raw?: string): string | null => {
  if (!raw) return null;
  const name = raw.trim();
  for (const staff of INSPECTION_STAFF_MEMBERS) {
    if (name.includes(staff)) return staff;
  }
  if (name.includes('ทิพาพร')) return 'ทิพาธร';
  if (name.includes('ธนัชพร')) return 'ธนัฏพร';
  return null;
};

// Helper: Check if document type belongs to งานตรวจจ่าย
const isInspectionDocType = (rawDocType?: string): boolean => {
  if (!rawDocType) return false;
  const t = rawDocType.trim();
  return INSPECTION_DOC_TYPES.some((dt) => t === dt || t.includes(dt) || dt.includes(t));
};

// Helper: Normalize document type to official inspection type
const normalizeInspectionDocType = (rawDocType?: string): string | null => {
  if (!rawDocType) return null;
  const t = rawDocType.trim();
  for (const dt of INSPECTION_DOC_TYPES) {
    if (t === dt || t.includes(dt) || dt.includes(t)) {
      return dt;
    }
  }
  return null;
};

// Helper to parse Thai/ISO date strings
const parseDateParts = (dateStr?: string) => {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // Formats: DD/MM/YYYY or DD/MM/BE or YYYY-MM-DD
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      let d = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (y > 2500) y -= 543; // convert BE to CE
      return { day: d, month: m, year: y };
    }
  } else if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        let y = parseInt(parts[0], 10);
        if (y > 2500) y -= 543;
        return { day: parseInt(parts[2], 10), month: parseInt(parts[1], 10), year: y };
      } else {
        let d = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);
        if (y > 2500) y -= 543;
        return { day: d, month: m, year: y };
      }
    }
  }
  return null;
};

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  documents,
  groupedDocuments,
  currentDept,
  onSelectDept,
  onBackToCards,
  onRefresh,
  isLoading,
  theme,
  onToggleTheme,
}) => {
  const [activeSection, setActiveSection] = useState<ViewSection>('DAILY');
  const [rightSectionTab, setRightSectionTab] = useState<'MONTHLY' | 'TOTAL'>('MONTHLY');
  const [middleDocTab, setMiddleDocTab] = useState<'MONTHLY' | 'DAILY' | 'TOTAL' | 'COMPARISON'>('MONTHLY');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Drilldown Modal State for double clicking to view job details
  const [drilldownData, setDrilldownData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    items: DocumentItem[];
  } | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState('');
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState<GroupedDocument | null>(null);

  const isDark = theme === 'dark';

  // Helper to open document history / detail modal
  const openDocDetail = (doc: DocumentItem) => {
    const grp = groupedDocuments.find((g) => g.docNo === doc.docNo) || {
      docNo: doc.docNo,
      agency: doc.agency,
      department: doc.department,
      totalRounds: 1,
      rounds: [doc],
      latestRound: doc,
    };
    setSelectedHistoryDoc(grp);
  };

  // Helper to open drilldown list modal
  const openDrilldown = (
    title: string,
    subtitle: string,
    filterFn: (doc: DocumentItem) => boolean,
    period: 'DAILY' | 'MONTHLY' | 'TOTAL' = 'DAILY'
  ) => {
    const baseItems = period === 'DAILY' ? dailyData.items : period === 'MONTHLY' ? monthlyData.items : totalData.items;
    const filtered = (baseItems || []).filter(filterFn);
    setDrilldownSearch('');
    setDrilldownData({
      isOpen: true,
      title,
      subtitle: `${subtitle}`,
      items: filtered,
    });
  };

  // Helper to check if a document is in review
  const isDocInReview = (doc: DocumentItem): boolean => {
    if (doc.department === 'งานสอบทาน') return true;
    if (isReviewProviderFinal(doc.providerFinal)) return true;
    if (doc.status && doc.status.includes('ส่งสอบทาน')) return true;
    if (doc.returnStatus && doc.returnStatus.includes('ส่งสอบทาน')) return true;
    if (
      Boolean(
        (doc.reviewReceiveDate && doc.reviewReceiveDate.trim() !== '') ||
        (doc.reviewProvider && doc.reviewProvider.trim() !== '') ||
        (doc.reviewActionDate && doc.reviewActionDate.trim() !== '') ||
        (doc.reviewStatus && doc.reviewStatus.trim() !== '') ||
        (doc.reviewEditType && doc.reviewEditType.trim() !== '') ||
        (doc.reviewEditDetail && doc.reviewEditDetail.trim() !== '')
      )
    ) {
      return true;
    }
    return false;
  };

  // Helper ตรวจสอบเอกสารที่เข้าสู่ "งานการเงิน"
  const isDocInFinance = (doc: DocumentItem): boolean => {
    if (
      doc.department === 'งานการเงิน' ||
      (doc.department as string) === 'งานเบิกจ่ายเงิน' ||
      doc.providerFinal === 'งานเบิกจ่ายเงิน' ||
      doc.providerChange === 'งานเบิกจ่ายเงิน' ||
      doc.providerAuto === 'งานเบิกจ่ายเงิน' ||
      (doc.providerFinal && doc.providerFinal.includes('งานเบิกจ่ายเงิน')) ||
      (doc.providerChange && doc.providerChange.includes('งานเบิกจ่ายเงิน')) ||
      (doc.providerAuto && doc.providerAuto.includes('งานเบิกจ่ายเงิน'))
    ) {
      return true;
    }
    if (
      doc.reviewStatus === 'ถูกต้อง/ส่งต่องานจ่ายเงิน' ||
      (doc.reviewStatus && (doc.reviewStatus.includes('ถูกต้อง/ส่งต่องานจ่ายเงิน') || doc.reviewStatus.includes('ส่งต่องานจ่ายเงิน') || doc.reviewStatus.includes('ส่งต่อจ่าย')))
    ) {
      return true;
    }
    if (
      Boolean(
        (doc.financeReceiveDate && doc.financeReceiveDate.trim() !== '') ||
        (doc.financePaymentType && doc.financePaymentType.trim() !== '') ||
        (doc.financePreparer && doc.financePreparer.trim() !== '') ||
        (doc.financeActionDate && doc.financeActionDate.trim() !== '') ||
        (doc.financeReviewDate && doc.financeReviewDate.trim() !== '') ||
        (doc.disbursementDate && doc.disbursementDate.trim() !== '') ||
        (doc.disbursementPayer && doc.disbursementPayer.trim() !== '') ||
        (doc.disbursementNotifyDate && doc.disbursementNotifyDate.trim() !== '') ||
        (doc.financeIssueDate && doc.financeIssueDate.trim() !== '') ||
        (doc.financeIssueDetail && doc.financeIssueDetail.trim() !== '')
      )
    ) {
      return true;
    }
    return false;
  };

  // Filter documents by department (อิงจาก groupedDocuments และใช้รอบล่าสุดของแต่ละทะเบียนรับ)
  const deptFilteredDocuments = useMemo(() => {
    const latestDocs = groupedDocuments.map((g) => g.latestRound).filter(Boolean);

    const filtered = latestDocs.filter((item) => {
      if (currentDept === 'ALL') return true;
      if (currentDept === 'งานสอบทาน') {
        return isDocInReview(item);
      }
      if (currentDept === 'งานการเงิน') {
        return isDocInFinance(item);
      }
      if (currentDept === 'งานงบประมาณ') {
        return true;
      }
      if (currentDept === 'งานตรวจจ่าย') {
        if (isReviewProviderFinal(item.providerFinal)) return false;
        if (item.department !== 'งานตรวจจ่าย') return false;
        return true;
      }
      return item.department === currentDept;
    });

    // Deduplicate by receiveNo ให้ตรงกับการ์ดในหน้าหลัก 100%
    const recvMap = new Map<string, DocumentItem>();
    const deduplicatedResult: DocumentItem[] = [];

    for (const doc of filtered) {
      const recv = (doc.receiveNo || '').trim();
      if (recv) {
        if (!recvMap.has(recv)) {
          recvMap.set(recv, doc);
          deduplicatedResult.push(doc);
        } else {
          const existing = recvMap.get(recv)!;
          const existingRound = existing.round || 0;
          const curRound = doc.round || 0;
          const existingRow = Number(existing.rowId) || 0;
          const curRow = Number(doc.rowId) || 0;

          if (curRound > existingRound || (curRound === existingRound && curRow > existingRow)) {
            const idx = deduplicatedResult.indexOf(existing);
            if (idx !== -1) {
              deduplicatedResult[idx] = doc;
            }
            recvMap.set(recv, doc);
          }
        }
      } else {
        deduplicatedResult.push(doc);
      }
    }

    return deduplicatedResult;
  }, [groupedDocuments, currentDept]);

  // Helper ดึงวันที่ของเอกสารตามแต่ละฝ่าย
  const getDocDate = (doc: DocumentItem) => {
    if (currentDept === 'งานสอบทาน') {
      return doc.reviewReceiveDate || doc.dateReceive || doc.reviewActionDate || doc.dateDesk;
    }
    if (currentDept === 'งานการเงิน') {
      return doc.financeReceiveDate || doc.disbursementDate || doc.dateReceive || doc.dateDesk;
    }
    if (currentDept === 'งานงบประมาณ') {
      return doc.budgetReceiveDate || doc.budgetActionDate || doc.dateReceive || doc.dateDesk;
    }
    return doc.dateDesk || doc.dateReceive || doc.actionDate;
  };

  // Determine Reference Dates (Today & Current Month)
  const dateMetadata = useMemo(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;
    const todayYear = now.getFullYear();
    const thaiBuddhistYear = 2570; // ปีงบประมาณ 2570

    // Check if there are any dates in the dataset to handle sample dates
    let latestDocDate: { day: number; month: number; year: number } | null = null;
    deptFilteredDocuments.forEach((doc) => {
      const dStr = getDocDate(doc);
      const parsed = parseDateParts(dStr);
      if (parsed) {
        if (
          !latestDocDate ||
          parsed.year > latestDocDate.year ||
          (parsed.year === latestDocDate.year && parsed.month > latestDocDate.month) ||
          (parsed.year === latestDocDate.year &&
            parsed.month === latestDocDate.month &&
            parsed.day > latestDocDate.day)
        ) {
          latestDocDate = parsed;
        }
      }
    });

    return {
      todayDay,
      todayMonth,
      todayYear,
      thaiBuddhistYear,
      latestDocDate,
    };
  }, [deptFilteredDocuments, currentDept]);

  // Check if item is Completed vs Pending
  const isItemCompleted = (item: DocumentItem) => {
    if (currentDept === 'งานสอบทาน' || item.department === 'งานสอบทาน' || isReviewProviderFinal(item.providerFinal)) {
      return Boolean(item.reviewStatus && item.reviewStatus.trim() !== '');
    }
    if (currentDept === 'งานการเงิน' || item.department === 'งานการเงิน') {
      return Boolean(item.disbursementDate && item.disbursementDate.trim() !== '');
    }
    if (currentDept === 'งานงบประมาณ' || item.department === 'งานงบประมาณ') {
      return Boolean(
        (item.budgetActionDate && item.budgetActionDate.trim() !== '') ||
        (item.budgetStatus && item.budgetStatus.trim() !== '')
      );
    }
    return Boolean(
      (item.subType && item.subType.trim() !== '') ||
      (item.qa && item.qa.trim() !== '') ||
      (item.actionDate && item.actionDate.trim() !== '') ||
      (item.action && item.action.trim() !== '') ||
      (item.status && item.status.trim() !== '') ||
      (item.editGroup && item.editGroup.trim() !== '') ||
      (item.editDetail && item.editDetail.trim() !== '')
    );
  };

  // Get Provider Name for item
  const getItemProvider = (item: DocumentItem) => {
    if (currentDept === 'งานสอบทาน' && item.reviewProvider?.trim()) {
      return item.reviewProvider.trim();
    }
    if (currentDept === 'งานการเงิน') {
      return item.financePreparer?.trim() || item.disbursementPayer?.trim() || item.providerFinal?.trim() || 'ไม่ระบุ';
    }
    const raw =
      item.providerFinal?.trim() ||
      item.providerChange?.trim() ||
      item.providerAuto?.trim() ||
      'ไม่ระบุ';
    if (currentDept === 'งานตรวจจ่าย' || item.department === 'งานตรวจจ่าย') {
      const normalized = normalizeInspectionStaff(raw);
      if (normalized) return normalized;
    }
    return raw;
  };

  // List of all providers / staff in this department for filtering ("สำหรับคน")
  const availableStaff = useMemo(() => {
    if (currentDept === 'งานตรวจจ่าย') {
      return [...INSPECTION_STAFF_MEMBERS];
    }
    const set = new Set<string>();
    deptFilteredDocuments.forEach((doc) => {
      const p = getItemProvider(doc);
      if (p && p !== 'ไม่ระบุ' && p !== '-' && p !== 'ไม่เลือก') {
        set.add(p);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [deptFilteredDocuments, currentDept]);

  // Filtered documents after applying staff filter (ถ้าเลือกดูเฉพาะคน)
  const displayDocuments = useMemo(() => {
    if (selectedStaffFilter === 'ALL') return deptFilteredDocuments;
    return deptFilteredDocuments.filter((doc) => getItemProvider(doc) === selectedStaffFilter);
  }, [deptFilteredDocuments, selectedStaffFilter]);

  // 1.1 DAILY DATA
  const dailyData = useMemo(() => {
    const { todayDay, todayMonth, todayYear, latestDocDate } = dateMetadata;

    // Filter items for today (or latest dataset date if today has 0)
    let items = displayDocuments.filter((doc) => {
      const dStr = getDocDate(doc);
      const p = parseDateParts(dStr);
      if (!p) return false;
      return p.day === todayDay && p.month === todayMonth && p.year === todayYear;
    });

    if (items.length === 0 && latestDocDate) {
      items = displayDocuments.filter((doc) => {
        const dStr = getDocDate(doc);
        const p = parseDateParts(dStr);
        if (!p) return false;
        return (
          p.day === latestDocDate.day &&
          p.month === latestDocDate.month &&
          p.year === latestDocDate.year
        );
      });
    }

    // Calculate metrics
    let totalReceived = items.length;
    let completed = 0;
    let pending = 0;

    const providerMap = new Map<string, { received: number; completed: number; pending: number }>();
    const docTypeMap = new Map<string, { received: number; completed: number; pending: number }>();

    if (currentDept === 'งานตรวจจ่าย') {
      INSPECTION_STAFF_MEMBERS.forEach((staff) => {
        providerMap.set(staff, { received: 0, completed: 0, pending: 0 });
      });
      INSPECTION_DOC_TYPES.forEach((dt) => {
        docTypeMap.set(dt, { received: 0, completed: 0, pending: 0 });
      });
    }

    items.forEach((item) => {
      const isDone = isItemCompleted(item);
      if (isDone) completed++;
      else pending++;

      const prov = getItemProvider(item);
      if (!providerMap.has(prov)) {
        providerMap.set(prov, { received: 0, completed: 0, pending: 0 });
      }
      const pStats = providerMap.get(prov)!;
      pStats.received++;
      if (isDone) pStats.completed++;
      else pStats.pending++;

      const rawDocType = item.docType?.trim() || 'เอกสารทั่วไป';
      const docType = currentDept === 'งานตรวจจ่าย'
        ? (normalizeInspectionDocType(rawDocType) || rawDocType)
        : rawDocType;
      if (!docTypeMap.has(docType)) {
        docTypeMap.set(docType, { received: 0, completed: 0, pending: 0 });
      }
      const tStats = docTypeMap.get(docType)!;
      tStats.received++;
      if (isDone) tStats.completed++;
      else tStats.pending++;
    });

    let providerList: { name: string; received: number; completed: number; pending: number; percent?: number }[];
    if (currentDept === 'งานตรวจจ่าย') {
      providerList = INSPECTION_STAFF_MEMBERS.map((staff) => {
        const stats = providerMap.get(staff) || { received: 0, completed: 0, pending: 0 };
        return {
          name: staff,
          ...stats,
          percent: stats.received > 0 ? Math.round((stats.completed / stats.received) * 100) : 0,
        };
      });
    } else {
      providerList = Array.from(providerMap.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        percent: stats.received > 0 ? Math.round((stats.completed / stats.received) * 100) : 0,
      })).sort((a, b) => b.received - a.received);
    }

    let docTypeList: { type: string; received: number; completed: number; pending: number }[];
    if (currentDept === 'งานตรวจจ่าย') {
      docTypeList = INSPECTION_DOC_TYPES.map((dt) => {
        const stats = docTypeMap.get(dt) || { received: 0, completed: 0, pending: 0 };
        return {
          type: dt,
          ...stats,
        };
      });
    } else {
      docTypeList = Array.from(docTypeMap.entries()).map(([type, stats]) => ({
        type,
        ...stats,
      })).sort((a, b) => b.received - a.received);
    }

    return {
      totalReceived,
      completed,
      pending,
      providerList,
      docTypeList,
      itemCount: items.length,
      items,
    };
  }, [displayDocuments, dateMetadata, currentDept]);

  // 1.2 MONTHLY DATA
  const monthlyData = useMemo(() => {
    const { todayMonth, todayYear, latestDocDate } = dateMetadata;

    let items = displayDocuments.filter((doc) => {
      const dStr = getDocDate(doc);
      const p = parseDateParts(dStr);
      if (!p) return false;
      return p.month === todayMonth && p.year === todayYear;
    });

    if (items.length === 0 && latestDocDate) {
      items = displayDocuments.filter((doc) => {
        const dStr = getDocDate(doc);
        const p = parseDateParts(dStr);
        if (!p) return false;
        return p.month === latestDocDate.month && p.year === latestDocDate.year;
      });
    }

    let totalReceived = items.length;
    let completed = 0;
    let pending = 0;

    const providerMap = new Map<string, { received: number; completed: number; pending: number }>();
    const docTypeMap = new Map<string, { received: number; completed: number; pending: number }>();

    if (currentDept === 'งานตรวจจ่าย') {
      INSPECTION_STAFF_MEMBERS.forEach((staff) => {
        providerMap.set(staff, { received: 0, completed: 0, pending: 0 });
      });
      INSPECTION_DOC_TYPES.forEach((dt) => {
        docTypeMap.set(dt, { received: 0, completed: 0, pending: 0 });
      });
    }

    items.forEach((item) => {
      const isDone = isItemCompleted(item);
      if (isDone) completed++;
      else pending++;

      const prov = getItemProvider(item);
      if (!providerMap.has(prov)) {
        providerMap.set(prov, { received: 0, completed: 0, pending: 0 });
      }
      const pStats = providerMap.get(prov)!;
      pStats.received++;
      if (isDone) pStats.completed++;
      else pStats.pending++;

      const rawDocType = item.docType?.trim() || 'เอกสารทั่วไป';
      const docType = currentDept === 'งานตรวจจ่าย'
        ? (normalizeInspectionDocType(rawDocType) || rawDocType)
        : rawDocType;
      if (!docTypeMap.has(docType)) {
        docTypeMap.set(docType, { received: 0, completed: 0, pending: 0 });
      }
      const tStats = docTypeMap.get(docType)!;
      tStats.received++;
      if (isDone) tStats.completed++;
      else tStats.pending++;
    });

    let providerList: { name: string; received: number; completed: number; pending: number; percent?: number }[];
    if (currentDept === 'งานตรวจจ่าย') {
      providerList = INSPECTION_STAFF_MEMBERS.map((staff) => {
        const stats = providerMap.get(staff) || { received: 0, completed: 0, pending: 0 };
        return {
          name: staff,
          ...stats,
          percent: stats.received > 0 ? Math.round((stats.completed / stats.received) * 100) : 0,
        };
      });
    } else {
      providerList = Array.from(providerMap.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        percent: stats.received > 0 ? Math.round((stats.completed / stats.received) * 100) : 0,
      })).sort((a, b) => b.received - a.received);
    }

    let docTypeList: { type: string; received: number; completed: number; pending: number }[];
    if (currentDept === 'งานตรวจจ่าย') {
      docTypeList = INSPECTION_DOC_TYPES.map((dt) => {
        const stats = docTypeMap.get(dt) || { received: 0, completed: 0, pending: 0 };
        return {
          type: dt,
          ...stats,
        };
      });
    } else {
      docTypeList = Array.from(docTypeMap.entries()).map(([type, stats]) => ({
        type,
        ...stats,
      })).sort((a, b) => b.received - a.received);
    }

    return {
      totalReceived,
      completed,
      pending,
      providerList,
      docTypeList,
      itemCount: items.length,
      items,
    };
  }, [displayDocuments, dateMetadata, currentDept]);

  // 1.3 TOTAL / ALL-TIME DATA
  const totalData = useMemo(() => {
    const items = displayDocuments;

    let totalReceived = items.length;
    let completed = 0;
    let pending = 0;

    const providerMap = new Map<string, { received: number; completed: number; pending: number }>();
    const docTypeMap = new Map<string, { received: number; completed: number; pending: number }>();

    if (currentDept === 'งานตรวจจ่าย') {
      INSPECTION_STAFF_MEMBERS.forEach((staff) => {
        providerMap.set(staff, { received: 0, completed: 0, pending: 0 });
      });
      INSPECTION_DOC_TYPES.forEach((dt) => {
        docTypeMap.set(dt, { received: 0, completed: 0, pending: 0 });
      });
    }

    items.forEach((item) => {
      const isDone = isItemCompleted(item);
      if (isDone) completed++;
      else pending++;

      const prov = getItemProvider(item);
      if (!providerMap.has(prov)) {
        providerMap.set(prov, { received: 0, completed: 0, pending: 0 });
      }
      const pStats = providerMap.get(prov)!;
      pStats.received++;
      if (isDone) pStats.completed++;
      else pStats.pending++;

      const rawDocType = item.docType?.trim() || 'เอกสารทั่วไป';
      const docType = currentDept === 'งานตรวจจ่าย'
        ? (normalizeInspectionDocType(rawDocType) || rawDocType)
        : rawDocType;
      if (!docTypeMap.has(docType)) {
        docTypeMap.set(docType, { received: 0, completed: 0, pending: 0 });
      }
      const tStats = docTypeMap.get(docType)!;
      tStats.received++;
      if (isDone) tStats.completed++;
      else tStats.pending++;
    });

    let providerList: { name: string; received: number; completed: number; pending: number; percent?: number }[];
    if (currentDept === 'งานตรวจจ่าย') {
      providerList = INSPECTION_STAFF_MEMBERS.map((staff) => {
        const stats = providerMap.get(staff) || { received: 0, completed: 0, pending: 0 };
        return {
          name: staff,
          ...stats,
          percent: stats.received > 0 ? Math.round((stats.completed / stats.received) * 100) : 0,
        };
      });
    } else {
      providerList = Array.from(providerMap.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        percent: stats.received > 0 ? Math.round((stats.completed / stats.received) * 100) : 0,
      })).sort((a, b) => b.received - a.received);
    }

    let docTypeList: { type: string; received: number; completed: number; pending: number }[];
    if (currentDept === 'งานตรวจจ่าย') {
      docTypeList = INSPECTION_DOC_TYPES.map((dt) => {
        const stats = docTypeMap.get(dt) || { received: 0, completed: 0, pending: 0 };
        return {
          type: dt,
          ...stats,
        };
      });
    } else {
      docTypeList = Array.from(docTypeMap.entries()).map(([type, stats]) => ({
        type,
        ...stats,
      })).sort((a, b) => b.received - a.received);
    }

    return {
      totalReceived,
      completed,
      pending,
      providerList,
      docTypeList,
      itemCount: items.length,
      items,
    };
  }, [displayDocuments, currentDept]);

  // Theme Styling Classes
  const bgClass = isDark
    ? 'bg-gradient-to-b from-[#0a1128] via-[#0d1b3e] to-[#080d21] text-slate-100'
    : 'bg-gradient-to-b from-sky-50 via-slate-50 to-blue-50/50 text-slate-900';

  const headerBannerClass = isDark
    ? 'bg-gradient-to-r from-[#0b1945] via-[#102a6b] to-[#0b1945] border-b border-sky-500/30'
    : 'bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 border-b border-blue-200';

  const cardBgClass = isDark
    ? 'bg-[#111e42]/90 border border-sky-500/20 shadow-xl backdrop-blur-md'
    : 'bg-white border border-sky-100 shadow-md';

  const tableHeaderClass = isDark
    ? 'bg-[#162758] text-sky-200 border-b border-sky-500/30'
    : 'bg-sky-50 text-slate-800 border-b border-sky-200';

  const tableRowClass = isDark
    ? 'border-b border-sky-950/60 hover:bg-[#192b63]/50 text-slate-200'
    : 'border-b border-slate-100 hover:bg-sky-50/60 text-slate-700';

  // Sub-component to render a Report Section (Daily, Monthly, or Total)
  const renderSectionBlock = (
    title: string,
    badgeText: string,
    data: {
      totalReceived: number;
      completed: number;
      pending: number;
      providerList: { name: string; received: number; completed: number; pending: number; percent?: number }[];
      docTypeList: { type: string; received: number; completed: number; pending: number }[];
    },
    headerBg: string,
    badgeBg: string
  ) => {
    return (
      <div className={`rounded-2xl overflow-hidden ${cardBgClass} transition-all duration-200 flex flex-col`}>
        {/* Section Header Title */}
        <div className={`px-5 py-4 flex items-center justify-between ${headerBg} text-white`}>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-amber-300" />
            <h3 className="text-base sm:text-lg font-bold font-['Prompt','Sarabun',sans-serif] tracking-wide">
              {title}
            </h3>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold ${badgeBg} font-['Prompt','Sarabun',sans-serif]`}>
            {badgeText}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-5 flex-1">
          {/* 3 Big KPI Summary Boxes */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. รับเอกสาร (Yellow/Gold Outline) */}
            <div
              className={`p-3 rounded-xl text-center border-2 ${
                isDark
                  ? 'bg-[#1a2b5e]/70 border-amber-400/80 text-amber-300'
                  : 'bg-amber-50/70 border-amber-400 text-amber-900'
              } shadow-xs`}
            >
              <span className="text-[11px] sm:text-xs font-semibold block truncate opacity-90">
                รับเอกสาร
              </span>
              <div className="text-xl sm:text-3xl font-black font-mono tracking-tight mt-1">
                {data.totalReceived.toLocaleString()}
              </div>
            </div>

            {/* 2. แล้วเสร็จ (Green Outline) */}
            <div
              className={`p-3 rounded-xl text-center border-2 ${
                isDark
                  ? 'bg-[#0f382a]/70 border-emerald-400 text-emerald-300'
                  : 'bg-emerald-50/80 border-emerald-500 text-emerald-900'
              } shadow-xs`}
            >
              <span className="text-[11px] sm:text-xs font-semibold block truncate opacity-90">
                แล้วเสร็จ
              </span>
              <div className="text-xl sm:text-3xl font-black font-mono tracking-tight mt-1 text-emerald-400">
                {data.completed.toLocaleString()}
              </div>
            </div>

            {/* 3. ระหว่างดำเนินการ (Red/Orange Outline) */}
            <div
              className={`p-3 rounded-xl text-center border-2 ${
                isDark
                  ? 'bg-[#3b151e]/70 border-rose-500/90 text-rose-300'
                  : 'bg-rose-50/80 border-rose-500 text-rose-900'
              } shadow-xs`}
            >
              <span className="text-[11px] sm:text-xs font-semibold block truncate opacity-90">
                ระหว่างดำเนินการ
              </span>
              <div className="text-xl sm:text-3xl font-black font-mono tracking-tight mt-1 text-rose-400">
                {data.pending.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Legend indicator bar */}
          <div className="flex items-center justify-center gap-4 text-xs font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0"></span>
              <span className={isDark ? 'text-emerald-300' : 'text-emerald-800'}>ดำเนินการแล้ว</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0"></span>
              <span className={isDark ? 'text-rose-300' : 'text-rose-800'}>อยู่ระหว่างดำเนินการ</span>
            </div>
          </div>

          {/* Horizontal Stacked Progress Bars for Providers (สำหรับคน) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>สำหรับคน: สัดส่วนผลงานรายบุคคล</span>
              </span>
              <span>สถานะ (เสร็จ / ค้าง)</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {data.providerList.length > 0 ? (
                data.providerList.map((p, idx) => {
                  const total = p.received || 1;
                  const donePct = p.percent !== undefined ? p.percent : Math.round((p.completed / total) * 100);
                  const pendPct = 100 - donePct;

                  return (
                    <div key={`${p.name}-${idx}`} className="space-y-0.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold truncate max-w-[130px] sm:max-w-[160px] ${isDark ? 'text-sky-200' : 'text-slate-800'}`}>
                          {p.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          รับ {p.received} (เสร็จ {p.completed} / ค้าง {p.pending})
                        </span>
                      </div>
                      {/* Stacked Bar */}
                      <div className="h-4 w-full bg-slate-200/40 rounded-md overflow-hidden flex shadow-inner">
                        {p.completed > 0 && (
                          <div
                            style={{ width: `${donePct}%` }}
                            className="bg-emerald-500 text-[10px] text-white font-bold flex items-center justify-center transition-all duration-300"
                            title={`ดำเนินการแล้ว: ${p.completed} ฉบับ (${donePct}%)`}
                          >
                            {p.completed}
                          </div>
                        )}
                        {p.pending > 0 && (
                          <div
                            style={{ width: `${pendPct}%` }}
                            className="bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center transition-all duration-300"
                            title={`อยู่ระหว่างดำเนินการ: ${p.pending} ฉบับ (${pendPct}%)`}
                          >
                            {p.pending}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  ไม่มีข้อมูลผู้ให้บริการในช่วงนี้
                </div>
              )}
            </div>

            {/* Percentage Scale */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1 border-t border-slate-200/30 pt-1">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Breakdown Table: Staff / Provider Table (สำหรับคน) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-bold font-['Prompt','Sarabun',sans-serif] ${isDark ? 'text-sky-300' : 'text-blue-900'} flex items-center gap-1.5`}>
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>สำหรับคน: ผลการปฏิบัติงานรายบุคคล</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {data.providerList.length} ราย
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200/40 max-h-48 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className={tableHeaderClass}>
                  <tr>
                    <th className="py-2 px-2.5 font-semibold">ผู้ให้บริการ</th>
                    <th className="py-2 px-1.5 font-semibold text-center w-10">รับ</th>
                    <th className="py-2 px-1.5 font-semibold text-center w-12 text-emerald-500">แล้วเสร็จ</th>
                    <th className="py-2 px-1.5 font-semibold text-center w-12 text-rose-500">ระหว่างทำ</th>
                    <th className="py-2 px-1.5 font-semibold text-center w-12 text-blue-500">% เสร็จ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.providerList.length > 0 ? (
                    data.providerList.map((p, idx) => {
                      const pct = p.percent !== undefined ? p.percent : (p.received > 0 ? Math.round((p.completed / p.received) * 100) : 0);
                      return (
                        <tr key={`staff-${p.name}-${idx}`} className={tableRowClass}>
                          <td className="py-1.5 px-2.5 truncate max-w-[120px] font-medium" title={p.name}>
                            {p.name}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-mono font-semibold">{p.received}</td>
                          <td className="py-1.5 px-1.5 text-center font-mono font-bold text-emerald-500">
                            {p.completed}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-mono font-bold text-rose-500">
                            {p.pending}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-mono font-bold">
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                              pct === 100
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : pct > 0
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                        ไม่มีข้อมูลผู้ให้บริการ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown Table: Document Types */}
          <div className="space-y-2 pt-2">
            <h4 className={`text-xs font-bold font-['Prompt','Sarabun',sans-serif] ${isDark ? 'text-sky-300' : 'text-blue-900'}`}>
              📊 แยกตามประเภทเอกสาร
            </h4>
            <div className="rounded-xl overflow-hidden border border-slate-200/40 max-h-48 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className={tableHeaderClass}>
                  <tr>
                    <th className="py-2 px-2.5 font-semibold">ประเภทเอกสาร</th>
                    <th className="py-2 px-2 font-semibold text-center w-12">รับ</th>
                    <th className="py-2 px-2 font-semibold text-center w-16 text-emerald-500">แล้วเสร็จ</th>
                    <th className="py-2 px-2 font-semibold text-center w-16 text-rose-500">ระหว่างทำ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.docTypeList.length > 0 ? (
                    data.docTypeList.map((t, idx) => (
                      <tr key={`${t.type}-${idx}`} className={tableRowClass}>
                        <td className="py-1.5 px-2.5 truncate max-w-[130px] font-medium" title={t.type}>
                          {t.type}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-semibold">{t.received}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-500">
                          {t.completed}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-rose-500">
                          {t.pending}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">
                        ไม่มีข้อมูลประเภทเอกสาร
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 1:1 Looker Studio Helper: 3 Big KPI Summary Boxes
  const renderLookerKpis = (
    data: { totalReceived: number; completed: number; pending: number },
    period: 'DAILY' | 'MONTHLY' | 'TOTAL' = 'DAILY',
    periodLabel: string = 'วันนี้'
  ) => {
    return (
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        {/* 1. รับเอกสาร */}
        <div
          onDoubleClick={() =>
            openDrilldown(
              'รายการรับเอกสารทั้งหมด',
              `ช่วงเวลา: ${periodLabel} • ฝ่าย: ${currentDept !== 'ALL' ? currentDept : 'ทุกฝ่าย'}`,
              () => true,
              period
            )
          }
          className={`rounded-2xl p-4 sm:p-6 text-center border-2 sm:border-3 shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none group ${
            isDark
              ? 'bg-gradient-to-b from-[#131d3d] via-[#0b1228] to-[#060a17] border-[#f59e0b] shadow-amber-950/30 hover:border-amber-400'
              : 'bg-gradient-to-b from-amber-50 to-amber-100/80 border-amber-500 shadow-amber-500/15 hover:border-amber-600'
          }`}
          title="ดับเบิ้ลคลิกเพื่อดูรายละเอียดรายการเอกสารรับทั้งหมด"
        >
          <div className={`text-base sm:text-2xl font-black font-['Prompt','Sarabun',sans-serif] tracking-wide flex items-center justify-center gap-2 ${
            isDark ? 'text-amber-200' : 'text-amber-900'
          }`}>
            <span>📥</span>
            <span>รับเอกสาร</span>
          </div>
          <div className={`text-4xl sm:text-6xl md:text-7xl font-black font-mono mt-1.5 sm:mt-2 tracking-tight ${
            isDark ? 'text-amber-300 drop-shadow-[0_2px_12px_rgba(245,158,11,0.35)]' : 'text-amber-700'
          }`}>
            {data.totalReceived.toLocaleString()}
          </div>
          <div className={`text-xs sm:text-sm font-bold mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-800/80'} flex items-center justify-center gap-1`}>
            <span>ฉบับทั้งหมด</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(ดับเบิ้ลคลิกเพื่อดู)</span>
          </div>
        </div>

        {/* 2. แล้วเสร็จ */}
        <div
          onDoubleClick={() =>
            openDrilldown(
              'รายการที่ดำเนินการแล้วเสร็จ',
              `ช่วงเวลา: ${periodLabel} • ฝ่าย: ${currentDept !== 'ALL' ? currentDept : 'ทุกฝ่าย'}`,
              (d) => isItemCompleted(d),
              period
            )
          }
          className={`rounded-2xl p-4 sm:p-6 text-center border-2 sm:border-3 shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none group ${
            isDark
              ? 'bg-gradient-to-b from-[#0c2e1b] via-[#081e13] to-[#04120b] border-[#22c55e] shadow-emerald-950/30 hover:border-emerald-400'
              : 'bg-gradient-to-b from-emerald-50 to-emerald-100/80 border-emerald-500 shadow-emerald-500/15 hover:border-emerald-600'
          }`}
          title="ดับเบิ้ลคลิกเพื่อดูรายละเอียดรายการที่แล้วเสร็จ"
        >
          <div className={`text-base sm:text-2xl font-black font-['Prompt','Sarabun',sans-serif] tracking-wide flex items-center justify-center gap-2 ${
            isDark ? 'text-emerald-200' : 'text-emerald-900'
          }`}>
            <span>✅</span>
            <span>แล้วเสร็จ</span>
          </div>
          <div className="text-4xl sm:text-6xl md:text-7xl font-black text-[#22c55e] font-mono mt-1.5 sm:mt-2 tracking-tight drop-shadow-[0_2px_12px_rgba(34,197,94,0.35)]">
            {data.completed.toLocaleString()}
          </div>
          <div className={`text-xs sm:text-sm font-bold mt-1 ${isDark ? 'text-emerald-400/80' : 'text-emerald-800/80'} flex items-center justify-center gap-1`}>
            <span>{data.totalReceived > 0 ? `${Math.round((data.completed / data.totalReceived) * 100)}% ของงานรับ` : '0%'}</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(ดับเบิ้ลคลิกเพื่อดู)</span>
          </div>
        </div>

        {/* 3. ระหว่างดำเนินการ */}
        <div
          onDoubleClick={() =>
            openDrilldown(
              'รายการที่อยู่ระหว่างดำเนินการ',
              `ช่วงเวลา: ${periodLabel} • ฝ่าย: ${currentDept !== 'ALL' ? currentDept : 'ทุกฝ่าย'}`,
              (d) => !isItemCompleted(d),
              period
            )
          }
          className={`rounded-2xl p-4 sm:p-6 text-center border-2 sm:border-3 shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none group ${
            isDark
              ? 'bg-gradient-to-b from-[#330f16] via-[#200a0e] to-[#120508] border-[#dc2626] shadow-rose-950/30 hover:border-rose-400'
              : 'bg-gradient-to-b from-rose-50 to-rose-100/80 border-rose-500 shadow-rose-500/15 hover:border-rose-600'
          }`}
          title="ดับเบิ้ลคลิกเพื่อดูรายละเอียดรายการที่อยู่ระหว่างดำเนินการ"
        >
          <div className={`text-base sm:text-2xl font-black font-['Prompt','Sarabun',sans-serif] tracking-wide flex items-center justify-center gap-2 ${
            isDark ? 'text-rose-200' : 'text-rose-900'
          }`}>
            <span>⏳</span>
            <span>ระหว่างดำเนินการ</span>
          </div>
          <div className={`text-4xl sm:text-6xl md:text-7xl font-black font-mono mt-1.5 sm:mt-2 tracking-tight ${
            isDark ? 'text-[#f87171] drop-shadow-[0_2px_12px_rgba(248,113,113,0.35)]' : 'text-rose-600'
          }`}>
            {data.pending.toLocaleString()}
          </div>
          <div className={`text-xs sm:text-sm font-bold mt-1 ${isDark ? 'text-rose-400/80' : 'text-rose-800/80'} flex items-center justify-center gap-1`}>
            <span>{data.totalReceived > 0 ? `${100 - Math.round((data.completed / data.totalReceived) * 100)}% คงค้าง` : '0%'}</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">(ดับเบิ้ลคลิกเพื่อดู)</span>
          </div>
        </div>
      </div>
    );
  };

  // 1:1 Looker Studio Helper: Small Legend Bar
  const renderLookerLegend = (doneText: string, pendingText: string) => {
    return (
      <div className="flex items-center justify-center gap-6 sm:gap-10 py-2.5 flex-wrap">
        <div className="flex items-center gap-2.5 bg-black/25 px-4 py-2 rounded-xl border border-slate-700/50 shadow-sm">
          <span className="w-5 h-4 bg-[#22c55e] rounded-xs shrink-0 inline-block shadow-sm"></span>
          <span className={`text-sm sm:text-lg font-black font-['Prompt','Sarabun',sans-serif] ${
            isDark ? 'text-emerald-300' : 'text-emerald-800'
          }`}>{doneText}</span>
        </div>
        <div className="flex items-center gap-2.5 bg-black/25 px-4 py-2 rounded-xl border border-slate-700/50 shadow-sm">
          <span className="w-5 h-4 bg-[#ef4444] rounded-xs shrink-0 inline-block shadow-sm"></span>
          <span className={`text-sm sm:text-lg font-black font-['Prompt','Sarabun',sans-serif] ${
            isDark ? 'text-rose-300' : 'text-rose-800'
          }`}>{pendingText}</span>
        </div>
      </div>
    );
  };

  // 1:1 Looker Studio Helper: Horizontal Stacked Bar Chart for Staff
  const renderStaffChart = (
    providerList: { name: string; received: number; completed: number; pending: number; percent?: number }[],
    period: 'DAILY' | 'MONTHLY' | 'TOTAL' = 'DAILY',
    periodLabel: string = 'วันนี้'
  ) => {
    return (
      <div className="space-y-1.5 bg-[#0b1226] p-2.5 rounded-xl border border-slate-800/80">
        <div className="space-y-1 max-h-72 xl:max-h-none overflow-y-auto pr-1">
          {providerList.length > 0 ? (
            providerList.map((p, idx) => {
              const total = p.received || 1;
              const donePct = Math.round((p.completed / total) * 100);
              const pendPct = 100 - donePct;

              return (
                <div
                  key={`chart-${p.name}-${idx}`}
                  onDoubleClick={() =>
                    openDrilldown(
                      `ผลงาน: ${p.name}`,
                      `ช่วงเวลา: ${periodLabel} • ผู้ให้บริการ: ${p.name}`,
                      (d) => getItemProvider(d) === p.name,
                      period
                    )
                  }
                  className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-slate-800/50 p-1 rounded-lg transition-colors select-none group"
                  title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดงานของ ${p.name}`}
                >
                  <span
                    className="w-16 text-right truncate text-slate-200 font-medium shrink-0 group-hover:text-amber-300"
                    title={p.name}
                  >
                    {p.name}
                  </span>
                  <div className="flex-1 h-3.5 bg-slate-900 rounded-xs overflow-hidden flex items-center shadow-inner">
                    {p.completed > 0 && (
                      <div
                        style={{ width: `${donePct}%` }}
                        className="h-full bg-[#22c55e] text-[9px] text-white font-bold flex items-center justify-center transition-all duration-300"
                        title={`แล้วเสร็จ: ${p.completed} (${donePct}%)`}
                      >
                        {p.completed}
                      </div>
                    )}
                    {p.pending > 0 && (
                      <div
                        style={{ width: `${pendPct}%` }}
                        className="h-full bg-[#ef4444] text-[9px] text-white font-bold flex items-center justify-center transition-all duration-300"
                        title={`ระหว่างดำเนินการ: ${p.pending} (${pendPct}%)`}
                      >
                        {p.pending}
                      </div>
                    )}
                  </div>
                  {p.pending === 0 && (
                    <span className="text-[10px] text-slate-500 font-mono w-3 text-left">0</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-slate-500">
              ไม่มีข้อมูลผู้ให้บริการ
            </div>
          )}
        </div>
        {/* 0% 20% 40% 60% 80% 100% scale */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono pl-18 pr-2 pt-0.5 border-t border-slate-800">
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
      </div>
    );
  };

  // 1:1 Looker Studio Helper: Staff Table (ผู้ให้บริการ | รับเอกสาร | แล้วเสร็จ | ระหว่างทำ)
  const renderStaffTable = (
    providerList: { name: string; received: number; completed: number; pending: number; percent?: number }[],
    period: 'DAILY' | 'MONTHLY' | 'TOTAL' = 'DAILY',
    periodLabel: string = 'วันนี้'
  ) => {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-[#0b1226] max-h-64 xl:max-h-none overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#121c3b] border-b border-slate-700/60 sticky top-0 font-['Prompt','Sarabun',sans-serif]">
            <tr>
              <th className="py-1.5 px-2 font-bold text-[#f87171]">ผู้ให้บริการ</th>
              <th className="py-1.5 px-1.5 font-bold text-white text-center w-14">รับเอกสาร</th>
              <th className="py-1.5 px-1.5 font-bold text-[#4ade80] text-center w-16">แล้วเสร็จ</th>
              <th className="py-1.5 px-1.5 font-bold text-[#f87171] text-center w-16">ระหว่างทำ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-['Sarabun',sans-serif]">
            {providerList.length > 0 ? (
              providerList.map((p, idx) => (
                <tr
                  key={`staff-tbl-${p.name}-${idx}`}
                  onDoubleClick={() =>
                    openDrilldown(
                      `ผลงาน: ${p.name}`,
                      `ช่วงเวลา: ${periodLabel} • ผู้ให้บริการ: ${p.name}`,
                      (d) => getItemProvider(d) === p.name,
                      period
                    )
                  }
                  className="hover:bg-slate-800/60 text-slate-200 cursor-pointer select-none transition-colors"
                  title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดงานของ ${p.name}`}
                >
                  <td className="py-1 px-2 truncate max-w-[120px] font-medium text-white" title={p.name}>
                    {p.name}
                  </td>
                  <td className="py-1 px-1.5 text-center font-mono font-semibold text-white">
                    {p.received}
                  </td>
                  <td className="py-1 px-1.5 text-center font-mono font-bold text-[#4ade80]">
                    {p.completed}
                  </td>
                  <td className="py-1 px-1.5 text-center font-mono font-bold text-[#f87171]">
                    {p.pending}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-3 text-center text-slate-500 text-xs">
                  ไม่มีข้อมูลผู้ให้บริการ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Balanced Looker Helper: Horizontal Stacked Bar Chart for 6 Document Types
  const renderDocTypeChart = (
    docTypeList: { type: string; received: number; completed: number; pending: number }[],
    period: 'DAILY' | 'MONTHLY' | 'TOTAL' = 'MONTHLY',
    periodLabel: string = 'เดือนนี้'
  ) => {
    return (
      <div className="space-y-1.5 bg-[#0b1226] p-2.5 rounded-xl border border-slate-800/80">
        <div className="space-y-1">
          {docTypeList.map((t, idx) => {
            const total = t.received || (t.completed + t.pending) || 1;
            const donePct = t.received > 0 ? Math.round((t.completed / total) * 100) : 0;
            const pendPct = t.received > 0 ? 100 - donePct : 0;

            return (
              <div
                key={`dt-chart-${t.type}-${idx}`}
                onDoubleClick={() =>
                  openDrilldown(
                    `ประเภทเอกสาร: ${t.type}`,
                    `ช่วงเวลา: ${periodLabel} • ประเภท: ${t.type}`,
                    (d) =>
                      currentDept === 'งานตรวจจ่าย'
                        ? normalizeInspectionDocType(d.docType) === t.type || d.docType === t.type
                        : (d.docType || 'เอกสารทั่วไป') === t.type,
                    period
                  )
                }
                className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-slate-800/50 p-1 rounded-lg transition-colors select-none group"
                title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดเอกสารประเภท: ${t.type}`}
              >
                <span
                  className="w-32 text-right truncate text-slate-200 font-medium shrink-0 group-hover:text-amber-300"
                  title={t.type}
                >
                  {t.type}
                </span>
                <div className="flex-1 h-3.5 bg-slate-900 rounded-xs overflow-hidden flex items-center shadow-inner">
                  {t.completed > 0 && (
                    <div
                      style={{ width: `${donePct}%` }}
                      className="h-full bg-[#22c55e] text-[9px] text-white font-bold flex items-center justify-center transition-all duration-300"
                      title={`แล้วเสร็จ: ${t.completed} (${donePct}%)`}
                    >
                      {t.completed}
                    </div>
                  )}
                  {t.pending > 0 && (
                    <div
                      style={{ width: `${pendPct}%` }}
                      className="h-full bg-[#ef4444] text-[9px] text-white font-bold flex items-center justify-center transition-all duration-300"
                      title={`ระหว่างดำเนินการ: ${t.pending} (${pendPct}%)`}
                    >
                      {t.pending}
                    </div>
                  )}
                  {t.received === 0 && (
                    <div className="w-full text-center text-[9px] text-slate-600 font-mono">-</div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono w-6 text-right">
                  {t.received}
                </span>
              </div>
            );
          })}
        </div>
        {/* 0% 20% 40% 60% 80% 100% scale */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono pl-34 pr-8 pt-0.5 border-t border-slate-800">
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
      </div>
    );
  };

  // Balanced Looker Helper: Document Types Table with % Badge
  const renderDocTypeTable = (
    docTypeList: { type: string; received: number; completed: number; pending: number }[],
    pendingColTitle: string = 'ระหว่างทำ',
    period: 'DAILY' | 'MONTHLY' | 'TOTAL' = 'MONTHLY',
    periodLabel: string = 'เดือนนี้'
  ) => {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-[#0b1226]">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#121c3b] border-b border-slate-700/60 sticky top-0 font-['Prompt','Sarabun',sans-serif]">
            <tr>
              <th className="py-2 px-2.5 font-bold text-sky-200">ประเภทเอกสาร</th>
              <th className="py-2 px-1.5 font-bold text-white text-center w-14">รับเอกสาร</th>
              <th className="py-2 px-1.5 font-bold text-[#4ade80] text-center w-16">แล้วเสร็จ</th>
              <th className="py-2 px-1.5 font-bold text-[#f87171] text-center w-16">{pendingColTitle}</th>
              <th className="py-2 px-1.5 font-bold text-amber-300 text-center w-14">สำเร็จ %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-['Sarabun',sans-serif]">
            {docTypeList.length > 0 ? (
              docTypeList.map((t, idx) => {
                const total = t.received || 1;
                const pct = t.received > 0 ? Math.round((t.completed / total) * 100) : 0;
                return (
                  <tr
                    key={`doctype-row-${t.type}-${idx}`}
                    onDoubleClick={() =>
                      openDrilldown(
                        `ประเภทเอกสาร: ${t.type}`,
                        `ช่วงเวลา: ${periodLabel} • ประเภท: ${t.type}`,
                        (d) =>
                          currentDept === 'งานตรวจจ่าย'
                            ? normalizeInspectionDocType(d.docType) === t.type || d.docType === t.type
                            : (d.docType || 'เอกสารทั่วไป') === t.type,
                        period
                      )
                    }
                    className="hover:bg-slate-800/60 text-slate-200 cursor-pointer select-none transition-colors"
                    title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดเอกสารประเภท: ${t.type}`}
                  >
                    <td className="py-1.5 px-2.5 text-xs truncate max-w-[130px] font-medium text-white" title={t.type}>
                      {t.type}
                    </td>
                    <td className="py-1.5 px-1.5 text-center font-mono font-semibold text-white">
                      {t.received}
                    </td>
                    <td className="py-1.5 px-1.5 text-center font-mono font-bold text-[#4ade80]">
                      {t.completed}
                    </td>
                    <td className="py-1.5 px-1.5 text-center font-mono font-bold text-[#f87171]">
                      {t.pending}
                    </td>
                    <td className="py-1.5 px-1.5 text-center font-mono font-bold">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                          pct >= 80
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : pct >= 50
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : pct > 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {t.received > 0 ? `${pct}%` : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-3 text-center text-slate-500 text-xs">
                  ไม่มีข้อมูลประเภทเอกสาร
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Balanced Looker Helper: Master Multi-Period Comparison Table (วันนี้ / เดือนนี้ / ทั้งหมด)
  const renderDocTypeComparisonTable = () => {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-[#0b1226]">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#121c3b] border-b border-slate-700/60 font-['Prompt','Sarabun',sans-serif]">
            <tr>
              <th className="py-2 px-2 font-bold text-sky-200">ประเภทเอกสาร</th>
              <th className="py-2 px-1 text-center text-amber-300 font-bold border-l border-slate-800" colSpan={2}>
                วันนี้
              </th>
              <th className="py-2 px-1 text-center text-sky-300 font-bold border-l border-slate-800" colSpan={2}>
                เดือนนี้
              </th>
              <th className="py-2 px-1 text-center text-white font-bold border-l border-slate-800" colSpan={2}>
                สะสมทั้งหมด
              </th>
            </tr>
            <tr className="text-[10px] text-slate-400 border-t border-slate-800 bg-[#0e1630]">
              <th className="py-1 px-2 font-normal text-slate-400">6 ประเภท</th>
              <th className="py-1 px-1 text-center text-[#4ade80] border-l border-slate-800 font-semibold">เสร็จ</th>
              <th className="py-1 px-1 text-center text-[#f87171] font-semibold">ค้าง</th>
              <th className="py-1 px-1 text-center text-[#4ade80] border-l border-slate-800 font-semibold">เสร็จ</th>
              <th className="py-1 px-1 text-center text-[#f87171] font-semibold">ค้าง</th>
              <th className="py-1 px-1 text-center text-white border-l border-slate-800 font-semibold">รับ</th>
              <th className="py-1 px-1 text-center text-amber-300 font-semibold">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-['Sarabun',sans-serif]">
            {INSPECTION_DOC_TYPES.map((type, idx) => {
              const d = dailyData.docTypeList.find((x) => x.type === type) || { received: 0, completed: 0, pending: 0 };
              const m = monthlyData.docTypeList.find((x) => x.type === type) || { received: 0, completed: 0, pending: 0 };
              const tot = totalData.docTypeList.find((x) => x.type === type) || { received: 0, completed: 0, pending: 0 };
              const totPct = tot.received > 0 ? Math.round((tot.completed / tot.received) * 100) : 0;

              return (
                <tr
                  key={`comp-${type}-${idx}`}
                  onDoubleClick={() =>
                    openDrilldown(
                      `ประเภทเอกสาร: ${type}`,
                      `ช่วงเวลา: สะสมทั้งหมด • ประเภท: ${type}`,
                      (doc) =>
                        currentDept === 'งานตรวจจ่าย'
                          ? normalizeInspectionDocType(doc.docType) === type || doc.docType === type
                          : (doc.docType || 'เอกสารทั่วไป') === type,
                      'TOTAL'
                    )
                  }
                  className="hover:bg-slate-800/60 text-slate-200 cursor-pointer select-none transition-colors"
                  title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดเอกสารประเภท: ${type}`}
                >
                  <td className="py-1.5 px-2 text-[11px] truncate max-w-[110px] font-medium text-white" title={type}>
                    {type}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono font-bold text-[#4ade80] border-l border-slate-800">
                    {d.completed}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono font-bold text-[#f87171]">
                    {d.pending}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono font-bold text-[#4ade80] border-l border-slate-800">
                    {m.completed}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono font-bold text-[#f87171]">
                    {m.pending}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono font-semibold text-white border-l border-slate-800">
                    {tot.received}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono font-bold text-amber-300">
                    {tot.received > 0 ? `${totPct}%` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render full balanced layout for 1. รายวัน, 2. รายเดือน, 3. สะสมรวม
  const renderComprehensiveLayout = (period: 'DAILY' | 'MONTHLY' | 'TOTAL') => {
    const thaiMonthNames = [
      '',
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];

    const data = period === 'DAILY' ? dailyData : period === 'MONTHLY' ? monthlyData : totalData;
    const title =
      period === 'DAILY'
        ? 'ข้อมูล-รายวัน'
        : period === 'MONTHLY'
        ? 'ข้อมูลสะสม-รายเดือน'
        : 'ข้อมูลสะสม-รวมทั้งหมด';

    const subtitle =
      period === 'DAILY'
        ? `ประจำวันที่ ${dateMetadata.todayDay} ${thaiMonthNames[dateMetadata.todayMonth] || ''} พ.ศ. ${dateMetadata.thaiBuddhistYear}`
        : period === 'MONTHLY'
        ? `ประจำเดือน ${thaiMonthNames[dateMetadata.todayMonth] || ''} พ.ศ. ${dateMetadata.thaiBuddhistYear}`
        : `ข้อมูลสะสมรวมทุกช่วงเวลาทั้งหมด (${data.totalReceived.toLocaleString()} ฉบับ)`;

    const periodKey = period === 'DAILY' ? 'วันนี้' : period === 'MONTHLY' ? 'เดือนนี้' : 'ทั้งหมด';

    const headerThemeClass = isDark
      ? period === 'DAILY'
        ? 'bg-gradient-to-r from-[#630c17] via-[#851421] to-[#500810] border-rose-900/60 text-white'
        : period === 'MONTHLY'
        ? 'bg-gradient-to-r from-[#0d224d] via-[#163673] to-[#0a1a3b] border-blue-900/60 text-white'
        : 'bg-gradient-to-r from-[#22164a] via-[#33206c] to-[#180f36] border-purple-900/60 text-white'
      : period === 'DAILY'
      ? 'bg-gradient-to-r from-[#80121d] via-[#a31a28] to-[#80121d] border-red-200 text-white shadow-md'
      : period === 'MONTHLY'
      ? 'bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#1e40af] border-blue-200 text-white shadow-md'
      : 'bg-gradient-to-r from-[#4338ca] via-[#6366f1] to-[#4338ca] border-indigo-200 text-white shadow-md';

    const containerCardClass = isDark
      ? 'bg-[#0d1630]/95 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5 text-white'
      : 'bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-md space-y-5 text-slate-800';

    const innerCardClass = isDark
      ? 'bg-[#080e22] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-inner'
      : 'bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs';

    const innerHeaderClass = `text-lg sm:text-2xl md:text-3xl font-black font-['Prompt','Sarabun',sans-serif] ${
      isDark ? 'text-white' : 'text-slate-900'
    }`;

    return (
      <div className={containerCardClass}>
        {/* 1. HEADER (เข้ากับธีมทั้งสว่างและมืด - ขยายขนาด 3 เท่า ชัดเจน คมชัด) */}
        <div
          className={`${headerThemeClass} rounded-2xl px-5 sm:px-8 py-5 sm:py-6 border shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0 border border-white/20">
              {period === 'DAILY' ? '📅' : period === 'MONTHLY' ? '🗓️' : '📈'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-['Prompt','Sarabun',sans-serif] tracking-wide text-white">
                  {title}
                </h2>
                <span className="px-3.5 py-1 rounded-full text-sm sm:text-base font-black bg-amber-400 text-black shadow-md">
                  {currentDept}
                </span>
              </div>
              <p className="text-sm sm:text-lg md:text-xl text-amber-100 font-bold mt-1 font-['Prompt','Sarabun',sans-serif]">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 bg-black/40 backdrop-blur-md px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-white/20 text-sm sm:text-lg text-slate-200 font-mono self-stretch lg:self-auto justify-around shadow-inner">
            <div>
              รับรวม:{' '}
              <strong className="text-amber-300 font-black text-xl sm:text-3xl">
                {data.totalReceived.toLocaleString()}
              </strong>{' '}
              ฉบับ
            </div>
            <span className="text-slate-500 font-bold">•</span>
            <div>
              แล้วเสร็จ:{' '}
              <strong className="text-emerald-400 font-black text-xl sm:text-3xl">
                {data.completed.toLocaleString()}
              </strong>
            </div>
            <span className="text-slate-500 font-bold">•</span>
            <div>
              ระหว่างทำ:{' '}
              <strong className="text-rose-400 font-black text-xl sm:text-3xl">
                {data.pending.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* 2. บล็อคแสดงปริมาณ งานรับ ทำเสร็จ ระหว่างทำ (ตัวเลขและตัวอักษรใหญ่ คมชัด สวยงาม) */}
        <div className="space-y-3">
          {renderLookerKpis(data, period, periodKey)}
          {renderLookerLegend(
            `ดำเนินการแล้ว-${periodKey}`,
            `อยู่ระหว่างดำเนินการ-${periodKey}`
          )}
        </div>

        {/* จัดบาลานซ์ข้อ 3, 4, 5 ให้แน่น ไม่ผอม สวยงาม */}
        {/* Row of Charts: 3. กราฟแท่งตามประเภทเอกสาร & 4. กราฟแท่งตามผู้ให้บริการ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* 3. แสดงเป็น กราฟแท่ง แสดงตามประเภทเอกสาร (แสดง รับ, ระหว่างทำ, แล้วเสร็จ - ตัวอักษรใหญ่ คมชัด ไม่มีเคอร์เซอร์บัง) */}
          <div className={`xl:col-span-6 ${innerCardClass} flex flex-col justify-between space-y-4`}>
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 text-xl sm:text-2xl">📑</span>
                  <h3 className={innerHeaderClass}>
                    3. กราฟแท่งแสดงตามประเภทเอกสาร ({data.docTypeList.length} ประเภท)
                  </h3>
                </div>
                <span className="text-sm sm:text-base text-sky-400 font-mono font-black bg-sky-950/60 px-3 py-1 rounded-lg border border-sky-800/40">
                  {periodKey}
                </span>
              </div>

              <div className="space-y-3">
                {data.docTypeList.map((t, idx) => {
                  const total = t.received || (t.completed + t.pending) || 1;
                  const donePct = t.received > 0 ? Math.round((t.completed / total) * 100) : 0;
                  const pendPct = t.received > 0 ? 100 - donePct : 0;

                  return (
                    <div
                      key={`chart-doc-${period}-${t.type}-${idx}`}
                      onDoubleClick={() =>
                        openDrilldown(
                          `ประเภทเอกสาร: ${t.type}`,
                          `ช่วงเวลา: ${periodKey} • ประเภท: ${t.type}`,
                          (d) =>
                            currentDept === 'งานตรวจจ่าย'
                              ? normalizeInspectionDocType(d.docType) === t.type || d.docType === t.type
                              : (d.docType || 'เอกสารทั่วไป') === t.type,
                          period
                        )
                      }
                      className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
                        isDark
                          ? 'bg-black/30 border-slate-800 hover:bg-black/45 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                      }`}
                      title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดเอกสารประเภท: ${t.type}`}
                    >
                      {/* Name & Exact Metrics for รับ, ระหว่างทำ, แล้วเสร็จ - ขนาดใหญ่ขึ้น 3 เท่า */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base mb-2">
                        <span
                          className={`font-black text-base sm:text-xl leading-tight group-hover:text-amber-300 ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}
                          title={t.type}
                        >
                          {idx + 1}. {t.type}
                        </span>
                        <div className="flex items-center gap-2 text-xs sm:text-base font-mono flex-wrap">
                          <span
                            className={`font-black px-2.5 sm:px-3 py-1 rounded-lg border ${
                              isDark
                                ? 'bg-amber-950/70 text-amber-300 border-amber-700/50'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            รับ {t.received}
                          </span>
                          <span
                            className={`font-black px-2.5 sm:px-3 py-1 rounded-lg border ${
                              isDark
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            เสร็จ {t.completed}
                          </span>
                          <span
                            className={`font-black px-2.5 sm:px-3 py-1 rounded-lg border ${
                              isDark
                                ? 'bg-rose-950/70 text-rose-300 border-rose-700/50'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            ระหว่างทำ {t.pending}
                          </span>
                          <span className="font-black text-sky-400 min-w-[50px] text-right text-base sm:text-xl">
                            {t.received > 0 ? `${donePct}%` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Stacked Progress Bar (หนาขึ้น ใหญ่ขึ้น แสดงตัวเลขชัดเจน) */}
                      <div className="w-full h-8 sm:h-9 bg-slate-950 rounded-xl overflow-hidden flex items-center shadow-inner border border-slate-800/80">
                        {t.completed > 0 && (
                          <div
                            style={{ width: `${donePct}%` }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-[#22c55e] text-xs sm:text-sm text-white font-black flex items-center justify-center transition-all duration-300 shadow-md px-1"
                            title={`แล้วเสร็จ: ${t.completed} (${donePct}%)`}
                          >
                            {donePct >= 10 ? `${t.completed} (${donePct}%)` : t.completed}
                          </div>
                        )}
                        {t.pending > 0 && (
                          <div
                            style={{ width: `${pendPct}%` }}
                            className="h-full bg-gradient-to-r from-rose-600 to-[#ef4444] text-xs sm:text-sm text-white font-black flex items-center justify-center transition-all duration-300 shadow-md px-1"
                            title={`ระหว่างทำ: ${t.pending} (${pendPct}%)`}
                          >
                            {pendPct >= 10 ? `${t.pending} (${pendPct}%)` : t.pending}
                          </div>
                        )}
                        {t.received === 0 && (
                          <div className="w-full text-center text-xs sm:text-sm text-slate-500 font-mono font-bold">
                            ไม่มีรายการเอกสาร
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 0% to 100% scale */}
            <div className="flex justify-between text-xs sm:text-base text-slate-400 font-mono font-black px-3 pt-2 border-t border-slate-700/50">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 4. แสดงเป็น กราฟแท่ง แสดงตามผู้ให้บริการ (10 โต๊ะ) - แสดงเต็ม ไม่ต้องมีเคอร์เซอร์เลื่อนขึ้นเลื่อนลง */}
          <div className={`xl:col-span-6 ${innerCardClass} flex flex-col justify-between space-y-4`}>
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xl sm:text-2xl">👤</span>
                  <h3 className={innerHeaderClass}>
                    4. กราฟแท่งแสดงตามผู้ให้บริการ (10 โต๊ะ)
                  </h3>
                </div>
                <span className="text-sm sm:text-base text-emerald-400 font-mono font-black bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/40">
                  {periodKey}
                </span>
              </div>

              {/* แสดงครบ 10 โต๊ะเต็มที่โดยตรง ไม่ต้องมีเคอร์เซอร์/แถบเลื่อนขึ้นเลื่อนลง */}
              <div className="space-y-3">
                {data.providerList.map((p, idx) => {
                  const total = p.received || 1;
                  const donePct = p.received > 0 ? Math.round((p.completed / total) * 100) : 0;
                  const pendPct = p.received > 0 ? 100 - donePct : 0;

                  return (
                    <div
                      key={`chart-staff-${period}-${p.name}-${idx}`}
                      onDoubleClick={() =>
                        openDrilldown(
                          `ผลงาน: ${p.name}`,
                          `ช่วงเวลา: ${periodKey} • ผู้ให้บริการ: ${p.name}`,
                          (d) => getItemProvider(d) === p.name,
                          period
                        )
                      }
                      className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
                        isDark
                          ? 'bg-black/30 border-slate-800 hover:bg-black/45 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                      }`}
                      title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดงานของ ${p.name}`}
                    >
                      {/* Name & Exact Metrics for รับ, ระหว่างทำ, แล้วเสร็จ - ตัวอักษรใหญ่ 3 เท่า */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base mb-2">
                        <span
                          className={`font-black text-base sm:text-xl leading-tight group-hover:text-amber-300 ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}
                          title={p.name}
                        >
                          <span className="text-sky-400 mr-2 font-mono font-bold text-sm sm:text-lg">โต๊ะ {idx + 1}:</span>
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs sm:text-base font-mono flex-wrap">
                          <span
                            className={`font-black px-2.5 sm:px-3 py-1 rounded-lg border ${
                              isDark
                                ? 'bg-amber-950/70 text-amber-300 border-amber-700/50'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            รับ {p.received}
                          </span>
                          <span
                            className={`font-black px-2.5 sm:px-3 py-1 rounded-lg border ${
                              isDark
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            เสร็จ {p.completed}
                          </span>
                          <span
                            className={`font-black px-2.5 sm:px-3 py-1 rounded-lg border ${
                              isDark
                                ? 'bg-rose-950/70 text-rose-300 border-rose-700/50'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            ระหว่างทำ {p.pending}
                          </span>
                          <span className="font-black text-sky-400 min-w-[50px] text-right text-base sm:text-xl">
                            {p.received > 0 ? `${donePct}%` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="w-full h-8 sm:h-9 bg-slate-950 rounded-xl overflow-hidden flex items-center shadow-inner border border-slate-800/80">
                        {p.completed > 0 && (
                          <div
                            style={{ width: `${donePct}%` }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-[#22c55e] text-xs sm:text-sm text-white font-black flex items-center justify-center transition-all duration-300 shadow-md px-1"
                            title={`แล้วเสร็จ: ${p.completed} (${donePct}%)`}
                          >
                            {donePct >= 10 ? `${p.completed} (${donePct}%)` : p.completed}
                          </div>
                        )}
                        {p.pending > 0 && (
                          <div
                            style={{ width: `${pendPct}%` }}
                            className="h-full bg-gradient-to-r from-rose-600 to-[#ef4444] text-xs sm:text-sm text-white font-black flex items-center justify-center transition-all duration-300 shadow-md px-1"
                            title={`ระหว่างทำ: ${p.pending} (${pendPct}%)`}
                          >
                            {pendPct >= 10 ? `${p.pending} (${pendPct}%)` : p.pending}
                          </div>
                        )}
                        {p.received === 0 && (
                          <div className="w-full text-center text-xs sm:text-sm text-slate-500 font-mono font-bold">
                            ไม่มีรายการรับ
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 0% to 100% scale */}
            <div className="flex justify-between text-xs sm:text-base text-slate-400 font-mono font-black px-3 pt-2 border-t border-slate-700/50">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 5. แสดงเป็น ตาราง แสดงตามผู้ให้บริการ (รับ, ระหว่างทำ, แล้วเสร็จ) - ตัวอักษรใหญ่ คมชัด สวยงาม */}
          <div className={`xl:col-span-12 ${innerCardClass} space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 text-xl sm:text-2xl">📋</span>
                <h3 className={innerHeaderClass}>
                  5. ตารางแสดงตามผู้ให้บริการ ({periodKey})
                </h3>
              </div>
              <span className="text-sm sm:text-lg text-indigo-300 font-mono font-black bg-indigo-950/60 px-3.5 py-1 rounded-lg border border-indigo-800/40">
                รวมทั้งหมด {data.totalReceived} ฉบับ
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/70 shadow-lg">
              <table className="w-full text-sm sm:text-base text-left">
                <thead
                  className={`border-b font-['Prompt','Sarabun',sans-serif] ${
                    isDark
                      ? 'bg-[#121c3b] text-slate-100 border-slate-700'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  <tr>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 text-center w-16 font-black text-sky-400 text-base sm:text-lg">ลำดับ</th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 font-black text-base sm:text-lg">ผู้ให้บริการ / โต๊ะ</th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 font-black text-center w-28 text-base sm:text-lg">รับเอกสาร</th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 font-black text-[#4ade80] text-center w-28 text-base sm:text-lg">แล้วเสร็จ</th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 font-black text-[#f87171] text-center w-28 text-base sm:text-lg">ระหว่างทำ</th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 font-black text-center w-48 text-base sm:text-lg">สัดส่วนความคืบหน้า</th>
                    <th className="py-3.5 sm:py-4 px-3 sm:px-4 font-black text-amber-400 text-center w-36 text-base sm:text-lg">ร้อยละความสำเร็จ</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y font-['Sarabun',sans-serif] ${
                    isDark ? 'divide-slate-800/80 text-slate-200' : 'divide-slate-200 text-slate-700'
                  }`}
                >
                  {data.providerList.map((p, idx) => {
                    const total = p.received || 1;
                    const donePct = p.received > 0 ? Math.round((p.completed / total) * 100) : 0;
                    const pendPct = p.received > 0 ? 100 - donePct : 0;

                    return (
                      <tr
                        key={`tbl-detail-${period}-${p.name}-${idx}`}
                        onDoubleClick={() =>
                          openDrilldown(
                            `ผลงาน: ${p.name}`,
                            `ช่วงเวลา: ${periodKey} • ผู้ให้บริการ: ${p.name}`,
                            (d) => getItemProvider(d) === p.name,
                            period
                          )
                        }
                        className={`transition-colors cursor-pointer select-none ${
                          isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-100/80'
                        }`}
                        title={`ดับเบิ้ลคลิกเพื่อดูรายละเอียดงานของ ${p.name}`}
                      >
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-mono font-black text-slate-400 text-sm sm:text-lg">
                          {idx + 1}
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 font-bold text-sm sm:text-lg">
                          <span className="text-sky-400 mr-2 font-mono text-xs sm:text-base font-black">โต๊ะ {idx + 1}</span>
                          <span className={isDark ? 'text-white' : 'text-slate-900'}>{p.name}</span>
                        </td>
                        <td
                          className={`py-3 sm:py-3.5 px-3 sm:px-4 text-center font-mono font-black text-base sm:text-2xl ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {p.received}
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-mono font-black text-[#4ade80] text-base sm:text-2xl">
                          {p.completed}
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-mono font-black text-[#f87171] text-base sm:text-2xl">
                          {p.pending}
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center">
                          <div className="w-full h-5 sm:h-6 bg-slate-900 rounded-lg overflow-hidden flex items-center shadow-inner border border-slate-800/80">
                            {p.completed > 0 && (
                              <div
                                style={{ width: `${donePct}%` }}
                                className="h-full bg-gradient-to-r from-emerald-600 to-[#22c55e] text-[10px] sm:text-xs text-white font-black flex items-center justify-center"
                              >
                                {donePct >= 15 ? `${donePct}%` : ''}
                              </div>
                            )}
                            {p.pending > 0 && (
                              <div
                                style={{ width: `${pendPct}%` }}
                                className="h-full bg-gradient-to-r from-rose-600 to-[#ef4444] text-[10px] sm:text-xs text-white font-black flex items-center justify-center"
                              >
                                {pendPct >= 15 ? `${pendPct}%` : ''}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-mono font-black">
                          <span
                            className={`inline-block px-3.5 py-1 rounded-xl text-sm sm:text-base ${
                              p.received === 0
                                ? 'bg-slate-800/40 text-slate-500'
                                : donePct >= 80
                                ? isDark
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-xs'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-400 shadow-xs'
                                : donePct >= 50
                                ? isDark
                                  ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-xs'
                                  : 'bg-amber-100 text-amber-900 border border-amber-400 shadow-xs'
                                : isDark
                                ? 'bg-rose-950 text-rose-300 border border-rose-600 shadow-xs'
                                : 'bg-rose-100 text-rose-900 border border-rose-400 shadow-xs'
                            }`}
                          >
                            {p.received > 0 ? `${donePct}%` : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Summary Total Row - ขนาดใหญ่ คมชัด โดดเด่น */}
                <tfoot
                  className={`border-t-2 font-['Prompt','Sarabun',sans-serif] ${
                    isDark ? 'bg-[#101a36] text-white border-slate-600' : 'bg-slate-200 text-slate-900 border-slate-400'
                  }`}
                >
                  <tr>
                    <td colSpan={2} className="py-4 sm:py-5 px-3 sm:px-4 font-black text-right text-sky-400 text-base sm:text-xl">
                      รวมทั้งหมด ({data.providerList.length} โต๊ะ):
                    </td>
                    <td className="py-4 sm:py-5 px-3 sm:px-4 text-center font-mono font-black text-amber-400 text-lg sm:text-3xl">
                      {data.totalReceived}
                    </td>
                    <td className="py-4 sm:py-5 px-3 sm:px-4 text-center font-mono font-black text-[#4ade80] text-lg sm:text-3xl">
                      {data.completed}
                    </td>
                    <td className="py-4 sm:py-5 px-3 sm:px-4 text-center font-mono font-black text-[#f87171] text-lg sm:text-3xl">
                      {data.pending}
                    </td>
                    <td className="py-4 sm:py-5 px-3 sm:px-4 text-center">
                      <div className="w-full h-6 sm:h-7 bg-slate-900 rounded-lg overflow-hidden flex items-center shadow-inner border border-slate-800/80">
                        {data.completed > 0 && (
                          <div
                            style={{
                              width: `${data.totalReceived > 0 ? Math.round((data.completed / data.totalReceived) * 100) : 0}%`,
                            }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-[#22c55e] text-xs font-black text-white flex items-center justify-center"
                          >
                            {data.totalReceived > 0 ? `${Math.round((data.completed / data.totalReceived) * 100)}%` : ''}
                          </div>
                        )}
                        {data.pending > 0 && (
                          <div
                            style={{
                              width: `${data.totalReceived > 0 ? 100 - Math.round((data.completed / data.totalReceived) * 100) : 0}%`,
                            }}
                            className="h-full bg-gradient-to-r from-rose-600 to-[#ef4444] text-xs font-black text-white flex items-center justify-center"
                          >
                            {data.totalReceived > 0 ? `${100 - Math.round((data.completed / data.totalReceived) * 100)}%` : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 sm:py-5 px-3 sm:px-4 text-center font-mono font-black text-amber-400 text-base sm:text-2xl">
                      {data.totalReceived > 0
                        ? `${Math.round((data.completed / data.totalReceived) * 100)}%`
                        : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgClass} font-['Sarabun',sans-serif] transition-colors duration-300`}>
      {/* Top Banner & Control Header matching user's Looker Studio mockup */}
      <header className={headerBannerClass}>
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left Brand: MFU Emblem & Department Title */}
            <div className="flex items-center gap-3.5 text-center lg:text-left">
              <div className="h-16 w-12 flex items-center justify-center shrink-0">
                <img
                  src="/MFU_logo.png"
                  alt="มหาวิทยาลัยแม่ฟ้าหลวง"
                  className="h-16 w-auto object-contain drop-shadow-md brightness-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight font-['Prompt','Sarabun',sans-serif] tracking-wide drop-shadow-sm">
                  {currentDept !== 'ALL' ? currentDept : 'ทุกฝ่ายงาน'} ส่วนการเงินและบัญชี
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-sky-200 font-['Prompt','Sarabun',sans-serif] mt-0.5">
                  มหาวิทยาลัยแม่ฟ้าหลวง
                </p>
              </div>
            </div>

            {/* Center Graphic Title: MONITOR */}
            <div className="text-center px-4">
              <div className="text-2xl sm:text-4xl font-black tracking-widest text-white font-['Prompt','Sarabun',sans-serif] drop-shadow-lg">
                MONITOR
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-sky-200 tracking-wider uppercase mt-0.5">
                DIVISION OF FINANCE AND ACCOUNTING
              </div>
            </div>

            {/* Right Side: Fiscal Year 2569 & Utility Actions */}
            <div className="flex items-center gap-3">
              {/* Year Badge */}
              <div className="text-center bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-inner">
                <div className="text-xs text-sky-200 font-bold">ปีงบประมาณ</div>
                <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                  {dateMetadata.thaiBuddhistYear}
                </div>
              </div>

              {/* Print A4 Report Button */}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-700/25 transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] no-print shrink-0"
                title="พิมพ์รายงานลงกระดาษ A4 (โหมดกระดาษขาว คมชัดเต็มหน้า)"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์รายงาน A4</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={() => onToggleTheme(isDark ? 'light' : 'dark')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer no-print ${
                  isDark
                    ? 'bg-sky-950 text-cyan-300 border-sky-500/40 hover:bg-sky-900 shadow-md'
                    : 'bg-white text-blue-900 border-white/40 hover:bg-blue-50 shadow-md'
                }`}
                title={isDark ? 'เปลี่ยนเป็นธีมสว่าง (ขาว-น้ำเงิน)' : 'เปลี่ยนเป็นธีมมืด (น้ำเงินกรม-ฟ้าสว่าง)'}
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-800" />}
              </button>

              {/* Refresh Live Data */}
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all disabled:opacity-50 cursor-pointer no-print"
                title="รีเฟรชดึงข้อมูลสดจาก Google Sheet"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-sky-300' : ''}`} />
              </button>

              {/* Back to Document Cards View */}
              <button
                onClick={onBackToCards}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] no-print"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับหน้ารายการ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Control & Navigation Bar */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 space-y-3 no-print">
        {/* Department Switcher & Staff Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Department Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1">เลือกฝ่าย:</span>
            {(['งานตรวจจ่าย', 'งานสอบทาน', 'งานการเงิน', 'งานงบประมาณ', 'ALL'] as const).map((dept) => {
              const isActive = currentDept === dept;
              const label = dept === 'ALL' ? 'ทุกฝ่าย' : dept;
              return (
                <button
                  key={dept}
                  onClick={() => onSelectDept(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                    isActive
                      ? isDark
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 ring-2 ring-sky-300'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                      : isDark
                      ? 'bg-[#15234d] text-slate-300 hover:bg-[#1f326d] border border-sky-500/20'
                      : 'bg-white text-slate-700 hover:bg-sky-50 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Controls: สำหรับคน (Staff Filter) & Single Page Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* กรองสำหรับคน */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isDark ? 'bg-[#15234d] border-sky-500/30 text-white' : 'bg-white border-slate-200 text-slate-700'
            } shadow-2xs`}>
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-xs font-bold font-['Prompt','Sarabun',sans-serif] shrink-0">
                สำหรับคน:
              </span>
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className={`text-xs rounded-lg px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-400 font-['Prompt','Sarabun',sans-serif] ${
                  isDark
                    ? 'bg-[#1f326d] text-sky-100 border border-sky-500/40'
                    : 'bg-slate-50 text-slate-800 border border-slate-300'
                }`}
              >
                <option value="ALL">ทุกคนทั้งหมด ({availableStaff.length} คน)</option>
                {availableStaff.map((staff, idx) => (
                  <option key={`opt-staff-${staff}-${idx}`} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
              {selectedStaffFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedStaffFilter('ALL')}
                  className="text-[11px] text-rose-500 hover:text-rose-700 underline font-semibold cursor-pointer shrink-0"
                >
                  ล้าง
                </button>
              )}
            </div>

            {/* Section View Tabs (แสดง 3 เลย์เอาท์: รายวัน, รายเดือน, สะสมรวม) */}
            <div className="flex items-center bg-slate-900/10 p-1 rounded-xl border border-slate-200/20 gap-1 flex-wrap">
              <button
                onClick={() => setActiveSection('DAILY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                  activeSection === 'DAILY'
                    ? isDark
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-blue-800'
                }`}
              >
                📅 1. รายวัน
              </button>
              <button
                onClick={() => setActiveSection('MONTHLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                  activeSection === 'MONTHLY'
                    ? isDark
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-blue-800'
                }`}
              >
                🗓️ 2. รายเดือน
              </button>
              <button
                onClick={() => setActiveSection('TOTAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                  activeSection === 'TOTAL'
                    ? isDark
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-blue-800'
                }`}
              >
                📈 3. สะสมรวม
              </button>
              <button
                onClick={() => setActiveSection('ALL_SECTIONS')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                  activeSection === 'ALL_SECTIONS'
                    ? isDark
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-blue-800'
                }`}
              >
                📑 รวมทั้ง 3 เลย์เอาท์
              </button>
            </div>
          </div>
        </div>

        {/* Highlight notification bar when specific person is filtered */}
        {selectedStaffFilter !== 'ALL' && (
          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-medium ${
            isDark ? 'bg-sky-950/80 border-sky-500/40 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              <span>
                กำลังแสดงรายงานผลการปฏิบัติงานสำหรับ: <strong className="font-bold text-sm text-amber-500 font-['Prompt','Sarabun',sans-serif]">{selectedStaffFilter}</strong> (สรุปผลพร้อมกันครบ 3 ด้าน: 1.1 รายวัน / 1.2 รายเดือน / 1.3 ทั้งหมด)
              </span>
            </div>
            <button
              onClick={() => setSelectedStaffFilter('ALL')}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              แสดงทุกคนทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Main Dashboard Grid Area */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {activeSection === 'LOOKER_MOCKUP' ? (
          /* Looker Studio 3-Column Layout exactly matching the user's screenshot */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-stretch">
            {/* Column 1 (Left 4 cols): ข้อมูล-รายวัน */}
            <div className="xl:col-span-4 space-y-3 bg-[#0d1630]/90 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col justify-between">
              <div>
                {/* Red Header Bar */}
                <div className="bg-[#80121d] text-white text-center py-2 px-3 rounded-lg font-bold text-base sm:text-lg font-['Prompt','Sarabun',sans-serif] tracking-wide shadow-md mb-3">
                  ข้อมูล-รายวัน
                </div>

                {/* 3 KPI Summary Boxes */}
                {renderLookerKpis(dailyData, 'DAILY', 'วันนี้')}

                {/* Legend Bar */}
                {renderLookerLegend('ดำเนินการแล้ว-วันนี้', 'อยู่ระหว่างดำเนินการ-วันนี้')}

                {/* Horizontal Stacked Bar Chart for Staff */}
                {renderStaffChart(dailyData.providerList, 'DAILY', 'วันนี้')}
              </div>

              {/* Staff Table */}
              <div className="mt-2">
                {renderStaffTable(dailyData.providerList, 'DAILY', 'วันนี้')}
              </div>
            </div>

            {/* Column 2 (Middle 4 cols): ข้อมูลประเภทเอกสาร & Balanced Chart & Table */}
            <div className="xl:col-span-4 space-y-3 bg-[#0d1630]/90 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col justify-between">
              <div>
                {/* Red Header Bar with Toggle between Monthly, Daily, Total, and Comparison */}
                <div className="bg-[#80121d] text-white py-1.5 px-3 rounded-lg flex items-center justify-between font-bold text-base sm:text-lg font-['Prompt','Sarabun',sans-serif] tracking-wide shadow-md mb-3">
                  <span className="truncate pr-1">
                    ประเภทเอกสาร {middleDocTab === 'MONTHLY' ? '(เดือนนี้)' : middleDocTab === 'DAILY' ? '(วันนี้)' : middleDocTab === 'TOTAL' ? '(ทั้งหมด)' : '(เปรียบเทียบ)'}
                  </span>
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 text-xs shrink-0">
                    <button
                      onClick={() => setMiddleDocTab('MONTHLY')}
                      className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                        middleDocTab === 'MONTHLY'
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      เดือนนี้
                    </button>
                    <button
                      onClick={() => setMiddleDocTab('DAILY')}
                      className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                        middleDocTab === 'DAILY'
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      วันนี้
                    </button>
                    <button
                      onClick={() => setMiddleDocTab('TOTAL')}
                      className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                        middleDocTab === 'TOTAL'
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setMiddleDocTab('COMPARISON')}
                      className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${
                        middleDocTab === 'COMPARISON'
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                      title="เปรียบเทียบ 3 ช่วงเวลา"
                    >
                      3 ช่วง
                    </button>
                  </div>
                </div>

                {/* 3 KPI Summary Boxes for chosen doc section */}
                {renderLookerKpis(
                  middleDocTab === 'DAILY'
                    ? dailyData
                    : middleDocTab === 'TOTAL'
                    ? totalData
                    : monthlyData,
                  middleDocTab === 'DAILY' ? 'DAILY' : middleDocTab === 'TOTAL' ? 'TOTAL' : 'MONTHLY',
                  middleDocTab === 'DAILY' ? 'วันนี้' : middleDocTab === 'TOTAL' ? 'สะสมทั้งหมด' : 'เดือนนี้'
                )}

                {/* Legend Bar */}
                {renderLookerLegend(
                  middleDocTab === 'DAILY'
                    ? 'ดำเนินการแล้ว-วันนี้'
                    : middleDocTab === 'TOTAL'
                    ? 'ดำเนินการแล้ว-ทั้งหมด'
                    : 'ดำเนินการแล้ว-เดือนนี้',
                  middleDocTab === 'DAILY'
                    ? 'อยู่ระหว่างดำเนินการ-วันนี้'
                    : middleDocTab === 'TOTAL'
                    ? 'อยู่ระหว่างดำเนินการ-ทั้งหมด'
                    : 'อยู่ระหว่างดำเนินการ-เดือนนี้'
                )}

                {/* Horizontal Stacked Bar Chart for 6 Document Types */}
                {renderDocTypeChart(
                  (middleDocTab === 'DAILY'
                    ? dailyData
                    : middleDocTab === 'TOTAL'
                    ? totalData
                    : monthlyData
                  ).docTypeList,
                  middleDocTab === 'DAILY' ? 'DAILY' : middleDocTab === 'TOTAL' ? 'TOTAL' : 'MONTHLY',
                  middleDocTab === 'DAILY' ? 'วันนี้' : middleDocTab === 'TOTAL' ? 'สะสมทั้งหมด' : 'เดือนนี้'
                )}
              </div>

              {/* Document Types Table or Multi-Period Comparison Table */}
              <div className="mt-2">
                {middleDocTab === 'COMPARISON' ? (
                  renderDocTypeComparisonTable()
                ) : (
                  renderDocTypeTable(
                    (middleDocTab === 'DAILY'
                      ? dailyData
                      : middleDocTab === 'TOTAL'
                      ? totalData
                      : monthlyData
                    ).docTypeList,
                    middleDocTab === 'DAILY' ? 'ระหว่างดำเนินการ' : 'ระหว่างทำ',
                    middleDocTab === 'DAILY' ? 'DAILY' : middleDocTab === 'TOTAL' ? 'TOTAL' : 'MONTHLY',
                    middleDocTab === 'DAILY' ? 'วันนี้' : middleDocTab === 'TOTAL' ? 'สะสมทั้งหมด' : 'เดือนนี้'
                  )
                )}
              </div>
            </div>

            {/* Column 3 (Right 4 cols): ข้อมูลสะสม-รายเดือน หรือ ทั้งหมด */}
            <div className="xl:col-span-4 space-y-3 bg-[#0d1630]/90 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col justify-between">
              <div>
                {/* Red Header Bar with Toggle between Monthly and Total */}
                <div className="bg-[#80121d] text-white py-1.5 px-3 rounded-lg flex items-center justify-between font-bold text-base sm:text-lg font-['Prompt','Sarabun',sans-serif] tracking-wide shadow-md mb-3">
                  <span>
                    {rightSectionTab === 'MONTHLY' ? 'ข้อมูลสะสม-รายเดือน' : 'ข้อมูลสะสม-ทั้งหมด'}
                  </span>
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setRightSectionTab('MONTHLY')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                        rightSectionTab === 'MONTHLY'
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      รายเดือน
                    </button>
                    <button
                      onClick={() => setRightSectionTab('TOTAL')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                        rightSectionTab === 'TOTAL'
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      ทั้งหมด
                    </button>
                  </div>
                </div>

                {/* 3 KPI Summary Boxes for chosen right section */}
                {renderLookerKpis(
                  rightSectionTab === 'MONTHLY' ? monthlyData : totalData,
                  rightSectionTab === 'MONTHLY' ? 'MONTHLY' : 'TOTAL',
                  rightSectionTab === 'MONTHLY' ? 'เดือนนี้' : 'สะสมทั้งหมด'
                )}

                {/* Legend Bar */}
                {renderLookerLegend(
                  rightSectionTab === 'MONTHLY' ? 'ดำเนินการแล้ว-เดือนนี้' : 'ดำเนินการแล้ว-ทั้งหมด',
                  rightSectionTab === 'MONTHLY' ? 'อยู่ระหว่างดำเนินการ-เดือนนี้' : 'อยู่ระหว่างดำเนินการ-ทั้งหมด'
                )}

                {/* Horizontal Stacked Bar Chart for Staff */}
                {renderStaffChart(
                  (rightSectionTab === 'MONTHLY' ? monthlyData : totalData).providerList,
                  rightSectionTab === 'MONTHLY' ? 'MONTHLY' : 'TOTAL',
                  rightSectionTab === 'MONTHLY' ? 'เดือนนี้' : 'สะสมทั้งหมด'
                )}
              </div>

              {/* Staff Table */}
              <div className="mt-2">
                {renderStaffTable(
                  (rightSectionTab === 'MONTHLY' ? monthlyData : totalData).providerList,
                  rightSectionTab === 'MONTHLY' ? 'MONTHLY' : 'TOTAL',
                  rightSectionTab === 'MONTHLY' ? 'เดือนนี้' : 'สะสมทั้งหมด'
                )}
              </div>
            </div>
          </div>
        ) : activeSection === 'ALL_SECTIONS' ? (
          /* Show all 3 Layouts stacked in full balanced width */
          <div className="space-y-8">
            {renderComprehensiveLayout('DAILY')}
            {renderComprehensiveLayout('MONTHLY')}
            {renderComprehensiveLayout('TOTAL')}
          </div>
        ) : activeSection === 'DAILY' ? (
          /* 1. รายวัน (เต็มหน้าจอ บาลานซ์ แน่น ไม่ผอม สวยงาม) */
          <div>
            {renderComprehensiveLayout('DAILY')}
          </div>
        ) : activeSection === 'MONTHLY' ? (
          /* 2. รายเดือน (เต็มหน้าจอ บาลานซ์ แน่น ไม่ผอม สวยงาม) */
          <div>
            {renderComprehensiveLayout('MONTHLY')}
          </div>
        ) : (
          /* 3. สะสมรวม (เต็มหน้าจอ บาลานซ์ แน่น ไม่ผอม สวยงาม) */
          <div>
            {renderComprehensiveLayout('TOTAL')}
          </div>
        )}
      </main>

      {/* Drilldown Modal for Double-Clicking Charts/Tables */}
      {drilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e1630] border-2 border-sky-500/50 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white font-['Sarabun',sans-serif]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#121c3b] via-[#1a2c5e] to-[#121c3b] px-6 py-4 border-b border-sky-500/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 text-xl">
                  📑
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-['Prompt','Sarabun',sans-serif] text-white">
                    {drilldownData.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-sky-200/90 font-medium mt-0.5">
                    {drilldownData.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrilldownData(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-xl transition-all cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-4 border-b border-slate-800 bg-[#080e22] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">พบทั้งหมด:</span>
                <span className="px-3 py-1 rounded-full bg-amber-400 text-black font-mono font-bold text-xs">
                  {(drilldownData.items || []).length} ฉบับ
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">(คลิกที่รายการเพื่อดูประวัติและรายละเอียดเต็ม)</span>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่, ชื่อเรื่อง, ผู้ส่ง..."
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  className="w-full bg-[#121c3b] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                {drilldownSearch && (
                  <button
                    onClick={() => setDrilldownSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Document Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(() => {
                const searchLower = drilldownSearch.toLowerCase().trim();
                const filtered = (drilldownData.items || []).filter((doc) => {
                  if (!searchLower) return true;
                  const receiveNo = (doc.receiveNo || '').toLowerCase();
                  const agency = (doc.agency || '').toLowerCase();
                  const sender = (doc.sender || '').toLowerCase();
                  const docType = (doc.docType || '').toLowerCase();
                  const docRef = (doc.docRef || '').toLowerCase();
                  const docNo = (doc.docNo || '').toLowerCase();
                  const prov = (getItemProvider(doc) || '').toLowerCase();
                  return (
                    receiveNo.includes(searchLower) ||
                    agency.includes(searchLower) ||
                    sender.includes(searchLower) ||
                    docType.includes(searchLower) ||
                    docRef.includes(searchLower) ||
                    docNo.includes(searchLower) ||
                    prov.includes(searchLower)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
                      <p className="text-base font-bold">ไม่พบรายการเอกสาร</p>
                      <p className="text-xs text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    </div>
                  );
                }

                return (
                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#080e22]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#121c3b] border-b border-slate-700 text-sky-200 font-['Prompt','Sarabun',sans-serif] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12 font-bold">#</th>
                          <th className="py-2.5 px-3 font-bold w-36">1. เลขทะเบียนรับ</th>
                          <th className="py-2.5 px-3 font-bold">2. หน่วยงาน/ผู้ส่ง</th>
                          <th className="py-2.5 px-3 font-bold w-36">3. ประเภท</th>
                          <th className="py-2.5 px-3 font-bold w-36">4. เลขที่ อว</th>
                          <th className="py-2.5 px-3 font-bold w-32">5. ผู้ให้บริการ</th>
                          <th className="py-2.5 px-3 text-center font-bold w-24">สถานะ</th>
                          <th className="py-2.5 px-3 text-center font-bold w-16">ดู</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-['Sarabun',sans-serif]">
                        {filtered.map((doc, idx) => {
                          const isDone = isItemCompleted(doc);
                          const prov = getItemProvider(doc);
                          return (
                            <tr
                              key={doc.id || `drill-${idx}`}
                              onClick={() => openDocDetail(doc)}
                              className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                                {doc.receiveNo || '-'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-200">
                                <div className="line-clamp-2" title={doc.agency}>
                                  {doc.agency || '-'}
                                </div>
                                {doc.sender && (
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    ผู้ส่ง: {doc.sender}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[11px] border border-slate-700">
                                  {doc.docType || 'ทั่วไป'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-cyan-200">
                                {doc.docRef || '-'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-sky-200">
                                {prov || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    isDone
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                      : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                                  }`}
                                >
                                  {isDone ? 'แล้วเสร็จ' : 'ระหว่างทำ'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDocDetail(doc);
                                  }}
                                  className="p-1 text-slate-400 hover:text-sky-300 hover:bg-sky-950 rounded-md transition-colors"
                                  title="ดูประวัติและรายละเอียด"
                                >
                                  <Eye className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="bg-[#080e22] px-6 py-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setDrilldownData(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History / Detail Modal */}
      {selectedHistoryDoc && (
        <HistoryModal
          isOpen={Boolean(selectedHistoryDoc)}
          onClose={() => setSelectedHistoryDoc(null)}
          document={selectedHistoryDoc}
          onEditRound={() => {}}
          onAddRound={() => {}}
        />
      )}
    </div>
  );
};
