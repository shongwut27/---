import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DocumentItem, GroupedDocument, DepartmentType } from './types';
import {
  getLocalDocuments,
  saveLocalDocuments,
  fetchFromGoogleSheet,
  syncToGas,
  batchSaveToGoogleSheet,
  getStoredGasUrl,
  setStoredGasUrl,
} from './services/sheetService';
import { Navbar } from './components/Navbar';
import { DepartmentTabs } from './components/DepartmentTabs';
import { StatsBar } from './components/StatsBar';
import { DocumentCard } from './components/DocumentCard';
import { DocumentTable } from './components/DocumentTable';
import { HistoryModal } from './components/HistoryModal';
import { EditDocumentModal } from './components/EditDocumentModal';
import { InspectionRecordModal } from './components/InspectionRecordModal';
import { ReviewRecordModal, isReviewProviderFinal } from './components/ReviewRecordModal';
import { FinanceRecordModal } from './components/FinanceRecordModal';
import { BudgetRecordModal } from './components/BudgetRecordModal';
import { BudgetCompletedModal } from './components/BudgetCompletedModal';
import { BatchReceiveModal } from './components/BatchReceiveModal';
import { NewDocModal } from './components/NewDocModal';
import { GasCodeModal } from './components/GasCodeModal';
import { LoginModal } from './components/LoginModal';
import { ReportDashboard } from './components/ReportDashboard';
import { initAuth, logout } from './services/authService';
import { supabase, SUPABASE_TABLE } from './services/supabaseClient';
import { INITIAL_SHEET_ID } from './data/initialData';
import { parseThaiDate } from './utils/workingDays';
import { FileSearch, FolderX, CheckCircle, RefreshCw, ClipboardCheck, Inbox } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDept, setCurrentDept] = useState<DepartmentType | 'ALL'>('งานตรวจจ่าย');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('ALL');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [workStatusFilter, setWorkStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'RECEIVED'>('ALL');
  const [multiRoundOnly, setMultiRoundOnly] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [gasUrl, setGasUrl] = useState<string>(getStoredGasUrl());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'CARDS' | 'REPORT'>('CARDS');
  const [displayMode, setDisplayMode] = useState<'CARD' | 'TABLE'>(() => {
    return (localStorage.getItem('document_tracker_display_mode') as 'CARD' | 'TABLE') || 'CARD';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('document_tracker_theme') as 'light' | 'dark') || 'light';
  });

  const handleDisplayModeChange = (mode: 'CARD' | 'TABLE') => {
    setDisplayMode(mode);
    localStorage.setItem('document_tracker_display_mode', mode);
  };

  const handleToggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('document_tracker_theme', newTheme);
  };
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('document_tracker_user_email');
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('document_tracker_user_name') || 'Shongwut Tabunsom';
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('document_tracker_user_avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
  });

  const handleLogin = (email: string, name?: string, avatar?: string) => {
    localStorage.setItem('document_tracker_user_email', email);
    if (name) localStorage.setItem('document_tracker_user_name', name);
    if (avatar !== undefined) localStorage.setItem('document_tracker_user_avatar', avatar);
    setUserEmail(email);
    if (name) setUserName(name);
    if (avatar !== undefined) setUserAvatar(avatar);
    showToast(`เข้าสู่ระบบด้วย Google Account (${email}) สำเร็จ`);
  };

  const handleLogout = () => {
    localStorage.removeItem('document_tracker_user_email');
    localStorage.removeItem('document_tracker_user_name');
    localStorage.removeItem('document_tracker_user_avatar');
    logout().catch(() => {});
    setUserEmail(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // Modal States
  const [historyDoc, setHistoryDoc] = useState<GroupedDocument | null>(null);
  const [editItem, setEditItem] = useState<DocumentItem | null>(null);
  const [inspectItem, setInspectItem] = useState<DocumentItem | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState<boolean>(false);
  const [reviewItem, setReviewItem] = useState<DocumentItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [financeItem, setFinanceItem] = useState<DocumentItem | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState<boolean>(false);
  const [budgetItem, setBudgetItem] = useState<DocumentItem | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [isBudgetCompletedModalOpen, setIsBudgetCompletedModalOpen] = useState<boolean>(false);
  const [budgetCompletedPeriod, setBudgetCompletedPeriod] = useState<'today' | 'this_month' | 'all'>('today');
  const [isBatchReceiveOpen, setIsBatchReceiveOpen] = useState<boolean>(false);
  const [newDocTarget, setNewDocTarget] = useState<GroupedDocument | null>(null);
  const [isNewDocOpen, setIsNewDocOpen] = useState<boolean>(false);
  const [isGasCodeOpen, setIsGasCodeOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initial Load: Fetch live directly from Supabase ("2570-ระบบติดตามเอกสาร") as primary source of truth
  const loadData = useCallback(async (showNotice = false) => {
    setIsLoading(true);
    try {
      const liveData = await fetchFromGoogleSheet();
      setDocuments(liveData);
      saveLocalDocuments(liveData);
      if (showNotice) {
        showToast(`✅ ซิงค์ข้อมูลล่าสุดจาก Supabase เรียบร้อยแล้ว (${liveData.length} รายการ)`);
      }
    } catch (err) {
      console.warn('Could not fetch live from Supabase, using local/cached data:', err);
      setDocuments((prev) => {
        if (prev && prev.length > 0) return prev;
        const fallback = getLocalDocuments();
        return fallback && fallback.length > 0 ? fallback : prev;
      });
      if (showNotice) {
        showToast('⚠️ ไม่สามารถเชื่อมต่อ Supabase ได้ กำลังใช้ข้อมูลสำรอง');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to Firebase Auth state
    const unsubscribeAuth = initAuth((user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        if (user.displayName) setUserName(user.displayName);
        if (user.photoURL) setUserAvatar(user.photoURL);
        localStorage.setItem('document_tracker_user_email', user.email);
        if (user.displayName) localStorage.setItem('document_tracker_user_name', user.displayName);
        if (user.photoURL) localStorage.setItem('document_tracker_user_avatar', user.photoURL);
      }
    });

    // Subscribe to Supabase Realtime updates on table "2570-ระบบติดตามเอกสาร"
    const channel = supabase
      .channel('doc-tracker-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SUPABASE_TABLE },
        () => {
          loadData();
        }
      )
      .subscribe();

    // Auto-sync whenever user focuses back to the tab
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic sync every 15 seconds so database changes reflect automatically
    const timer = setInterval(() => {
      loadData();
    }, 15000);

    return () => {
      unsubscribeAuth();
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      clearInterval(timer);
    };
  }, [loadData]);

  // เอกสารทั้งหมด (งานตรวจจ่าย) คือเอกสารที่มีข้อมูลอยู่ใน google sheet ทุกแถว (ตัดส่วนเข้า-ออกหลายรอบออก)
  const groupedDocuments = useMemo<GroupedDocument[]>(() => {
    return documents.map((item) => ({
      docNo: item.docNo || item.receiveNo || item.docRef || `row-${item.rowId || item.id}`,
      agency: item.agency,
      docType: item.docType,
      docRef: item.docRef,
      sender: item.sender,
      phone: item.phone,
      department: item.department,
      totalRounds: 1,
      latestRound: item,
      rounds: [item],
    }));
  }, [documents]);

  // Helper ตรวจสอบเอกสารที่เข้าสู่ "งานสอบทาน"
  // 1. เข้ามาจากงานธุรการ หรือเอกสารระบุฝ่ายงานสอบทาน
  // 2. มีผู้ให้บริการ (Final) เป็นหนึ่งในรายชื่อของงานสอบทาน (คอลัมน์ P)
  // 3. เข้ามาจากงานตรวจจ่ายที่มีการระบุสถานะ "ส่งสอบทาน" (คอลัมน์ V)
  // 4. มีการบันทึกข้อมูลงานสอบทานแล้ว (คอลัมน์ Y-AD)
  const isDocInReview = useCallback((doc: GroupedDocument): boolean => {
    const lr = doc.latestRound;
    if (!lr) return false;
    if (doc.department === 'งานสอบทาน' || lr.department === 'งานสอบทาน') return true;
    if (isReviewProviderFinal(lr.providerFinal) || doc.rounds.some((r) => isReviewProviderFinal(r.providerFinal))) return true;
    if (lr.status && lr.status.includes('ส่งสอบทาน')) return true;
    if (doc.rounds.some((r) => r.status && r.status.includes('ส่งสอบทาน'))) return true;
    if (lr.returnStatus && lr.returnStatus.includes('ส่งสอบทาน')) return true;
    if (
      Boolean(
        (lr.reviewReceiveDate && lr.reviewReceiveDate.trim() !== '') ||
        (lr.reviewProvider && lr.reviewProvider.trim() !== '') ||
        (lr.reviewActionDate && lr.reviewActionDate.trim() !== '') ||
        (lr.reviewStatus && lr.reviewStatus.trim() !== '') ||
        (lr.reviewEditType && lr.reviewEditType.trim() !== '') ||
        (lr.reviewEditDetail && lr.reviewEditDetail.trim() !== '')
      )
    ) {
      return true;
    }
    return false;
  }, []);

  // Helper ตรวจสอบเอกสารที่เข้าสู่ "งานการเงิน" (งานเบิกจ่ายเงิน)
  // เอกสารจะเข้ามา 2 ทาง:
  // ทางที่ 1: มาจาก ธุรการรับจะเลือกผู้ให้บริการเป็น "งานเบิกจ่ายเงิน"
  // ทางที่ 2: มาจากงานสอบทาน ในช่องสถานะเป็น "ถูกต้อง/ส่งต่องานจ่ายเงิน"
  const isDocInFinance = useCallback((doc: GroupedDocument): boolean => {
    const lr = doc.latestRound;
    if (!lr) return false;

    // ทางที่ 1: มาจาก ธุรการรับจะเลือกผู้ให้บริการเป็น "งานเบิกจ่ายเงิน"
    if (
      doc.department === 'งานการเงิน' ||
      (doc.department as string) === 'งานเบิกจ่ายเงิน' ||
      lr.department === 'งานการเงิน' ||
      (lr.department as string) === 'งานเบิกจ่ายเงิน' ||
      lr.providerFinal === 'งานเบิกจ่ายเงิน' ||
      lr.providerChange === 'งานเบิกจ่ายเงิน' ||
      lr.providerAuto === 'งานเบิกจ่ายเงิน' ||
      (lr.providerFinal && lr.providerFinal.includes('งานเบิกจ่ายเงิน')) ||
      (lr.providerChange && lr.providerChange.includes('งานเบิกจ่ายเงิน')) ||
      (lr.providerAuto && lr.providerAuto.includes('งานเบิกจ่ายเงิน'))
    ) {
      return true;
    }

    // ทางที่ 2: มาจากงานสอบทาน ในช่องสถานะเป็น "ถูกต้อง/ส่งต่องานจ่ายเงิน"
    if (
      lr.reviewStatus === 'ถูกต้อง/ส่งต่องานจ่ายเงิน' ||
      (lr.reviewStatus && (lr.reviewStatus.includes('ถูกต้อง/ส่งต่องานจ่ายเงิน') || lr.reviewStatus.includes('ส่งต่องานจ่ายเงิน') || lr.reviewStatus.includes('ส่งต่อจ่าย')))
    ) {
      return true;
    }

    // หรือมีข้อมูลการบันทึกในส่วนของงานการเงินแล้ว (คอลัมน์ AE ถึง AQ)
    if (
      Boolean(
        (lr.financeReceiveDate && lr.financeReceiveDate.trim() !== '') ||
        (lr.financePaymentType && lr.financePaymentType.trim() !== '') ||
        (lr.financePreparer && lr.financePreparer.trim() !== '') ||
        (lr.financeActionDate && lr.financeActionDate.trim() !== '') ||
        (lr.financeReviewDate && lr.financeReviewDate.trim() !== '') ||
        (lr.disbursementDate && lr.disbursementDate.trim() !== '') ||
        (lr.disbursementPayer && lr.disbursementPayer.trim() !== '') ||
        (lr.disbursementNotifyDate && lr.disbursementNotifyDate.trim() !== '') ||
        (lr.financeIssueDate && lr.financeIssueDate.trim() !== '') ||
        (lr.financeIssueDetail && lr.financeIssueDetail.trim() !== '')
      )
    ) {
      return true;
    }

    return false;
  }, []);

  // Helper to determine if a doc belongs to / appears in Budget
  // หน้างานงบประมาณ: งานที่สามารถบันทึกได้จะเป็นงานทุกประเภทที่เข้ามาในระบบ
  const isDocInBudget = useCallback((_doc: GroupedDocument) => {
    return true;
  }, []);


  // List of unique providers available in current dataset
  const availableProviders = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((doc) => {
      const p = doc.providerFinal?.trim() || doc.providerChange?.trim() || doc.providerAuto?.trim();
      if (p && p !== '-' && p !== 'ไม่เลือก') {
        set.add(p);
      }
      if (doc.reviewProvider && doc.reviewProvider.trim() && doc.reviewProvider !== '-' && doc.reviewProvider !== 'ไม่เลือก') {
        set.add(doc.reviewProvider.trim());
      }
      if (doc.financePreparer && doc.financePreparer.trim() && doc.financePreparer !== '-' && doc.financePreparer !== 'ไม่เลือก') {
        set.add(doc.financePreparer.trim());
      }
      if (doc.disbursementPayer && doc.disbursementPayer.trim() && doc.disbursementPayer !== '-' && doc.disbursementPayer !== 'ไม่เลือก') {
        set.add(doc.disbursementPayer.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [documents]);

  // List of unique docTypes available in current dataset
  const availableDocTypes = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((doc) => {
      const dt = doc.docType?.trim();
      if (dt && dt !== '-' && dt !== '') {
        set.add(dt);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [documents]);

  // Deduplicated documents for current department & provider (แสดงเฉพาะรอบล่าสุดหากเลขทะเบียนรับเดียวกันเข้ามาหลายรอบ)
  const getDeptDedupedDocs = useCallback((dept: DepartmentType | 'ALL') => {
    const deptDocs = groupedDocuments.filter((doc) => {
      // 1. Department Filter
      if (dept === 'งานสอบทาน') {
        if (!isDocInReview(doc)) return false;
      } else if (dept === 'งานการเงิน') {
        if (!isDocInFinance(doc)) return false;
      } else if (dept === 'งานงบประมาณ') {
        if (!isDocInBudget(doc)) return false;
      } else if (dept === 'งานตรวจจ่าย') {
        const lr = doc.latestRound;
        const p = lr?.providerFinal?.trim() || lr?.providerChange?.trim() || lr?.providerAuto?.trim() || '';
        // หน้างานตรวจจ่าย จะเป็นเอกสารทุกประเภท ยกเว้น งานเบิกจ่ายเงิน
        if (p === 'งานเบิกจ่ายเงิน' || p.includes('งานเบิกจ่ายเงิน')) return false;
        if (lr?.docType?.trim() === 'งานเบิกจ่ายเงิน' || lr?.docType?.includes('งานเบิกจ่ายเงิน')) return false;
        const isReviewFinal = isReviewProviderFinal(lr?.providerFinal) || doc.rounds.some((r) => isReviewProviderFinal(r.providerFinal));
        if (isReviewFinal) return false;
        if (doc.department !== 'งานตรวจจ่าย') return false;
      } else if (dept !== 'ALL' && doc.department !== dept) {
        return false;
      }

      // 2. Provider filter (ผู้ให้บริการ)
      if (selectedProvider !== 'ALL') {
        const p = dept === 'งานสอบทาน' && doc.latestRound.reviewProvider?.trim()
          ? doc.latestRound.reviewProvider.trim()
          : dept === 'งานการเงิน' && (doc.latestRound.financePreparer?.trim() || doc.latestRound.disbursementPayer?.trim())
          ? (doc.latestRound.financePreparer?.trim() || doc.latestRound.disbursementPayer?.trim() || '')
          : (doc.latestRound.providerFinal?.trim() || doc.latestRound.providerChange?.trim() || doc.latestRound.providerAuto?.trim() || '');
        if (p !== selectedProvider) {
          return false;
        }
      }

      return true;
    });

    return deptDocs;
  }, [groupedDocuments, selectedProvider, isDocInReview, isDocInFinance, isDocInBudget]);

  const currentDeptDeduplicatedDocs = useMemo(() => getDeptDedupedDocs(currentDept), [getDeptDedupedDocs, currentDept]);

  // ตัวกรองทั่วไป (ค้นหา, ช่วงเวลา, ประเภท ฯลฯ) ใช้ร่วมกันทั้งรายการเอกสารและตัวเลขบนแท็บฝ่ายงาน
  const applyGeneralFilters = useCallback((docs: GroupedDocument[]) => {
    const q = searchQuery.toLowerCase().trim();

    return docs.filter((doc) => {
      // 1. Multi-round only filter
      if (multiRoundOnly && doc.totalRounds <= 1) {
        return false;
      }

      // 2. Return Status filter
      if (returnStatusFilter !== 'ALL') {
        const status = doc.latestRound.returnStatus || '';
        if (!status.includes(returnStatusFilter)) {
          return false;
        }
      }

      // 3. Real-time Search filter
      if (q) {
        const matchDocNo = (doc.docNo || '').toLowerCase().includes(q);
        const matchAgency = (doc.agency || '').toLowerCase().includes(q);
        const matchRecv = (doc.latestRound.receiveNo || '').toLowerCase().includes(q);
        const matchRef = (doc.docRef || '').toLowerCase().includes(q);
        const matchSender = (doc.sender || '').toLowerCase().includes(q);
        const matchPhone = (doc.phone || '').toLowerCase().includes(q);
        const matchProvider = (doc.latestRound.providerFinal || '').toLowerCase().includes(q);
        const matchType = (doc.docType || '').toLowerCase().includes(q);

        if (
          !matchDocNo &&
          !matchAgency &&
          !matchRecv &&
          !matchRef &&
          !matchSender &&
          !matchPhone &&
          !matchProvider &&
          !matchType
        ) {
          return false;
        }
      }

      // 4. Time Period Filter (วันนี้, เดือนนี้, ทั้งหมด, หรือเลือกวันที่)
      if (timeFilter !== 'ALL') {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();

        const lr = doc.latestRound;
        const candidateDates: (string | undefined)[] = [
          lr?.dateReceive,
          lr?.dateDesk,
          lr?.actionDate,
          lr?.dateReturn,
          lr?.reviewReceiveDate,
          lr?.reviewActionDate,
          lr?.financeReceiveDate,
          lr?.financeActionDate,
          lr?.disbursementDate,
          lr?.budgetReceiveDate,
          lr?.budgetActionDate,
          lr?.budgetCoverDate,
          lr?.budgetDocSetDate,
        ];

        const parsedList = candidateDates
          .filter((str): str is string => Boolean(str && str.trim() !== '' && str.trim() !== '-'))
          .map((str) => parseThaiDate(str))
          .filter((d): d is Date => d !== null);

        if (parsedList.length === 0) {
          return false;
        }

        if (timeFilter === 'TODAY') {
          const hasToday = parsedList.some(
            (d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === currentDate
          );
          if (!hasToday) return false;
        } else if (timeFilter === 'THIS_MONTH') {
          const hasThisMonth = parsedList.some(
            (d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth
          );
          if (!hasThisMonth) return false;
        } else if (timeFilter === 'CUSTOM' && customDate) {
          const [cYearStr, cMonthStr, cDayStr] = customDate.split('-');
          const targetYear = parseInt(cYearStr, 10);
          const targetMonth = parseInt(cMonthStr, 10) - 1;
          const targetDay = parseInt(cDayStr, 10);

          const matchesCustom = parsedList.some(
            (d) => d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === targetDay
          );
          if (!matchesCustom) return false;
        }
      }

      // 5. Multi-select Document Type filter (เลือกได้หลายประเภท)
      if (selectedDocTypes.length > 0) {
        const type = (doc.docType || doc.latestRound?.docType || '').trim();
        if (!selectedDocTypes.includes(type)) {
          return false;
        }
      }

      return true;
    });
  }, [multiRoundOnly, returnStatusFilter, searchQuery, timeFilter, customDate, selectedDocTypes]);

  // Base filtered documents for current department & general filters (ก่อนแยกตาม workStatusFilter)
  const baseFilteredDocs = useMemo(
    () => applyGeneralFilters(currentDeptDeduplicatedDocs),
    [applyGeneralFilters, currentDeptDeduplicatedDocs]
  );

  // ตัวเลขบนแท็บฝ่ายงาน: ใช้ขั้นตอนเดียวกับรายการเอกสาร (กรอง + ตัดซ้ำเลขทะเบียนรับ) เพื่อให้ตัวเลขตรงกันทุกจุด
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      งานตรวจจ่าย: 0,
      งานสอบทาน: 0,
      งานการเงิน: 0,
      งานงบประมาณ: 0,
      ALL: 0,
      multiRound: 0,
    };
    (['งานตรวจจ่าย', 'งานสอบทาน', 'งานการเงิน', 'งานงบประมาณ', 'ALL'] as const).forEach((d) => {
      c[d] = applyGeneralFilters(getDeptDedupedDocs(d)).length;
    });
    c.multiRound = groupedDocuments.filter((doc) => doc.totalRounds > 1).length;
    return c;
  }, [applyGeneralFilters, getDeptDedupedDocs, groupedDocuments]);

  // Counts for work status (1.เอกสารที่เข้ามาทั้งหมด = 2.บันทึกรับแล้ว + 3.ดำเนินการแล้ว + 4.งานค้างในมือ)
  const workStatusCounts = useMemo(() => {
    let all = baseFilteredDocs.length;
    let pending = 0;
    let completed = 0;
    let received = 0;

    baseFilteredDocs.forEach((doc) => {
      if (currentDept === 'งานสอบทาน') {
        const isReviewDone = Boolean(doc.latestRound.reviewStatus && doc.latestRound.reviewStatus.trim() !== '' && doc.latestRound.reviewStatus.trim() !== '-');
        const isReviewReceived = Boolean(
          (doc.latestRound.reviewReceiveDate && doc.latestRound.reviewReceiveDate.trim() !== '' && doc.latestRound.reviewReceiveDate.trim() !== '-') ||
          (doc.latestRound.reviewProvider && doc.latestRound.reviewProvider.trim() !== '' && doc.latestRound.reviewProvider.trim() !== '-' && doc.latestRound.reviewProvider.trim() !== 'ไม่เลือก')
        );

        // 3. ดำเนินการแล้ว (COMPLETED - สีเขียว): บันทึกสถานะการตรวจแล้ว
        if (isReviewDone) {
          completed++;
        }
        // 2. บันทึกรับแล้ว (RECEIVED - สีส้ม): กดรับแล้วแต่ยังไม่ได้บันทึกสถานะ
        else if (isReviewReceived) {
          received++;
        }
        // 4. งานค้างในมือ (PENDING - สีแดง): ยังไม่ได้บันทึกรับเอกสาร
        else {
          pending++;
        }
      } else if (currentDept === 'งานการเงิน') {
        const isFinanceCompleted = Boolean(doc.latestRound.disbursementDate && doc.latestRound.disbursementDate.trim() !== '');
        const isFinanceReceived = Boolean(
          (doc.latestRound.financeReceiveDate && doc.latestRound.financeReceiveDate.trim() !== '') ||
          (doc.latestRound.financePreparer && doc.latestRound.financePreparer.trim() !== '') ||
          (doc.latestRound.financePaymentType && doc.latestRound.financePaymentType.trim() !== '')
        );
        if (isFinanceCompleted) {
          completed++;
        } else if (isFinanceReceived) {
          received++;
        } else {
          pending++;
        }
      } else if (currentDept === 'งานงบประมาณ') {
        const isBudgetCompleted = Boolean(
          (doc.latestRound.budgetActionDate && doc.latestRound.budgetActionDate.trim() !== '') ||
          (doc.latestRound.budgetStatus && doc.latestRound.budgetStatus.trim() !== '')
        );
        const isBudgetReceived = Boolean(
          (doc.latestRound.budgetReceiveDate && doc.latestRound.budgetReceiveDate.trim() !== '') ||
          (doc.latestRound.budgetFR && doc.latestRound.budgetFR.trim() !== '') ||
          (doc.latestRound.budgetFC && doc.latestRound.budgetFC.trim() !== '') ||
          (doc.latestRound.budgetPR && doc.latestRound.budgetPR.trim() !== '')
        );
        if (isBudgetCompleted) {
          completed++;
        } else if (isBudgetReceived) {
          received++;
        } else {
          pending++;
        }
      } else {
        const hasRX = Boolean(
          (doc.latestRound.subType && doc.latestRound.subType.trim() !== '') ||
          (doc.latestRound.qa && doc.latestRound.qa.trim() !== '') ||
          (doc.latestRound.actionDate && doc.latestRound.actionDate.trim() !== '') ||
          (doc.latestRound.action && doc.latestRound.action.trim() !== '') ||
          (doc.latestRound.status && doc.latestRound.status.trim() !== '') ||
          (doc.latestRound.editGroup && doc.latestRound.editGroup.trim() !== '') ||
          (doc.latestRound.editDetail && doc.latestRound.editDetail.trim() !== '')
        );
        if (hasRX) {
          completed++;
        } else {
          pending++;
        }
      }
    });

    return { all, pending, completed, received };
  }, [baseFilteredDocs, currentDept]);

  // List of completed budget documents categorized by Today, This Month, All (สำหรับงานงบประมาณ - คำนวณล้อตามตัวกรองที่เลือก)
  const { budgetTodayDocs, budgetThisMonthDocs, budgetAllDocs } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    const todayList: GroupedDocument[] = [];
    const monthList: GroupedDocument[] = [];
    const allList: GroupedDocument[] = [];

    // All documents where budget work is completed / recorded in baseFilteredDocs
    baseFilteredDocs.forEach((doc) => {
      const lr = doc.latestRound;
      if (!lr) return;

      const isCompleted = Boolean(
        (lr.budgetActionDate && lr.budgetActionDate.trim() !== '' && lr.budgetActionDate.trim() !== '-') ||
        (lr.budgetStatus && lr.budgetStatus.trim() !== '' && lr.budgetStatus.trim() !== '-') ||
        (lr.budgetReceiveDate && lr.budgetReceiveDate.trim() !== '' && lr.budgetReceiveDate.trim() !== '-') ||
        (lr.budgetFR && lr.budgetFR.trim() !== '' && lr.budgetFR.trim() !== '-') ||
        (lr.budgetFC && lr.budgetFC.trim() !== '' && lr.budgetFC.trim() !== '-') ||
        (lr.budgetPR && lr.budgetPR.trim() !== '' && lr.budgetPR.trim() !== '-')
      );

      if (!isCompleted) return;

      allList.push(doc);

      // Check date from budgetActionDate, budgetReceiveDate, or actionDate
      const dateStr = lr.budgetActionDate?.trim() || lr.budgetReceiveDate?.trim() || lr.actionDate?.trim() || lr.dateReceive?.trim();
      const parsed = parseThaiDate(dateStr);

      if (parsed) {
        const y = parsed.getFullYear();
        const m = parsed.getMonth();
        const d = parsed.getDate();

        if (y === currentYear && m === currentMonth) {
          monthList.push(doc);
          if (d === currentDate) {
            todayList.push(doc);
          }
        }
      } else {
        // If cannot parse date, keep in monthList and todayList
        todayList.push(doc);
        monthList.push(doc);
      }
    });

    return {
      budgetTodayDocs: todayList,
      budgetThisMonthDocs: monthList,
      budgetAllDocs: allList,
    };
  }, [baseFilteredDocs]);

  // Filtered documents list for current view
  const filteredDocuments = useMemo(() => {
    // สำหรับหน้างานงบประมาณ: แสดงเฉพาะเอกสารที่กดบันทึกข้อมูลแล้ว และแสดงตามกล่องสถิติที่เลือก (วันนี้, เดือนนี้, ทั้งหมด)
    if (currentDept === 'งานงบประมาณ') {
      if (budgetCompletedPeriod === 'today') return budgetTodayDocs;
      if (budgetCompletedPeriod === 'this_month') return budgetThisMonthDocs;
      return budgetAllDocs;
    }

    if (workStatusFilter === 'ALL') {
      return baseFilteredDocs;
    }

    return baseFilteredDocs.filter((doc) => {
      // Work status filter:
      if (currentDept === 'งานสอบทาน') {
        const isReviewDone = Boolean(doc.latestRound.reviewStatus && doc.latestRound.reviewStatus.trim() !== '' && doc.latestRound.reviewStatus.trim() !== '-');
        const isReviewReceived = Boolean(
          (doc.latestRound.reviewReceiveDate && doc.latestRound.reviewReceiveDate.trim() !== '' && doc.latestRound.reviewReceiveDate.trim() !== '-') ||
          (doc.latestRound.reviewProvider && doc.latestRound.reviewProvider.trim() !== '' && doc.latestRound.reviewProvider.trim() !== '-' && doc.latestRound.reviewProvider.trim() !== 'ไม่เลือก')
        );

        // 4. งานค้างในมือ (PENDING): ยังไม่ได้กดรับเอกสาร
        if (workStatusFilter === 'PENDING') {
          if (isReviewReceived || isReviewDone) return false;
        }
        // 3. ดำเนินการแล้ว (COMPLETED): บันทึกสถานะการตรวจแล้ว
        else if (workStatusFilter === 'COMPLETED') {
          if (!isReviewDone) return false;
        }
        // 2. บันทึกรับแล้ว (RECEIVED): กดรับเอกสารแล้ว แต่ยังไม่ได้บันทึกสถานะดำเนินการ
        else if (workStatusFilter === 'RECEIVED') {
          if (!isReviewReceived || isReviewDone) return false;
        }
      } else if (currentDept === 'งานการเงิน') {
        const isFinanceCompleted = Boolean(doc.latestRound.disbursementDate && doc.latestRound.disbursementDate.trim() !== '');
        const isFinanceReceived = Boolean(
          (doc.latestRound.financeReceiveDate && doc.latestRound.financeReceiveDate.trim() !== '') ||
          (doc.latestRound.financePreparer && doc.latestRound.financePreparer.trim() !== '') ||
          (doc.latestRound.financePaymentType && doc.latestRound.financePaymentType.trim() !== '')
        );
        if (workStatusFilter === 'PENDING' && (isFinanceReceived || isFinanceCompleted)) return false;
        if (workStatusFilter === 'COMPLETED' && !isFinanceCompleted) return false;
        if (workStatusFilter === 'RECEIVED' && (!isFinanceReceived || isFinanceCompleted)) return false;
      } else {
        const hasRX = Boolean(
          (doc.latestRound.subType && doc.latestRound.subType.trim() !== '') ||
          (doc.latestRound.qa && doc.latestRound.qa.trim() !== '') ||
          (doc.latestRound.actionDate && doc.latestRound.actionDate.trim() !== '') ||
          (doc.latestRound.action && doc.latestRound.action.trim() !== '') ||
          (doc.latestRound.status && doc.latestRound.status.trim() !== '') ||
          (doc.latestRound.editGroup && doc.latestRound.editGroup.trim() !== '') ||
          (doc.latestRound.editDetail && doc.latestRound.editDetail.trim() !== '')
        );
        if (workStatusFilter === 'PENDING') {
          if (hasRX) return false;
        } else if (workStatusFilter === 'COMPLETED') {
          if (!hasRX) return false;
        }
      }

      return true;
    });
  }, [baseFilteredDocs, workStatusFilter, currentDept, budgetCompletedPeriod, budgetTodayDocs, budgetThisMonthDocs, budgetAllDocs]);

  // Stats for the active filter
  const activeStats = useMemo(() => {
    let returned = 0;
    let pending = 0;
    let totalRoundsSum = 0;
    let multiRoundCount = 0;

    filteredDocuments.forEach((doc) => {
      totalRoundsSum += doc.totalRounds;
      if (doc.totalRounds > 1) multiRoundCount++;

      const hasRX = Boolean(
        (doc.latestRound.subType && doc.latestRound.subType.trim() !== '') ||
        (doc.latestRound.qa && doc.latestRound.qa.trim() !== '') ||
        (doc.latestRound.actionDate && doc.latestRound.actionDate.trim() !== '') ||
        (doc.latestRound.action && doc.latestRound.action.trim() !== '') ||
        (doc.latestRound.status && doc.latestRound.status.trim() !== '') ||
        (doc.latestRound.editGroup && doc.latestRound.editGroup.trim() !== '') ||
        (doc.latestRound.editDetail && doc.latestRound.editDetail.trim() !== '')
      );
      if (hasRX) {
        returned++;
      } else {
        pending++;
      }
    });

    return {
      totalDocs: filteredDocuments.length,
      totalRounds: totalRoundsSum,
      multiRoundDocs: multiRoundCount,
      returnedDocs: returned,
      pendingDocs: pending,
    };
  }, [filteredDocuments]);

  // Handle Edit Save
  const handleSaveEdit = (updatedItem: DocumentItem) => {
    setDocuments((prev) => {
      const next = prev.map((item) => {
        if (
          item.id === updatedItem.id ||
          (item.rowId && updatedItem.rowId && String(item.rowId) === String(updatedItem.rowId))
        ) {
          return { ...item, ...updatedItem };
        }
        return item;
      });
      saveLocalDocuments(next);
      return next;
    });

    const docIdentifier = updatedItem.docNo || updatedItem.receiveNo || updatedItem.docRef || `แถว ${updatedItem.rowId}`;
    showToast(`⏳ กำลังบันทึกข้อมูลเอกสาร ${docIdentifier} เข้า Supabase โดยตรง...`);
    syncToGas('updateDocument', updatedItem).then((success) => {
      if (success) {
        showToast(`✅ บันทึกข้อมูลเอกสาร ${docIdentifier} ลง Supabase สำเร็จ`);
        setTimeout(() => loadData(), 800);
      } else {
        showToast(`⚠️ บันทึกลง Supabase ไม่สำเร็จ (บันทึกข้อมูลในระบบชั่วคราวแล้ว)`);
      }
    });
  };

  // Handle Save Review (บันทึกข้อมูลของงานสอบทาน บันทึกลง Supabase ตาราง "2570-ระบบติดตามเอกสาร")
  const handleSaveReview = (updatedItem: DocumentItem) => {
    setDocuments((prev) => {
      const next = prev.map((item) => {
        if (
          item.id === updatedItem.id ||
          (item.rowId && updatedItem.rowId && Number(item.rowId) === Number(updatedItem.rowId))
        ) {
          return { ...item, ...updatedItem };
        }
        return item;
      });
      saveLocalDocuments(next);
      return next;
    });

    const docIdentifier = updatedItem.docNo || updatedItem.receiveNo || updatedItem.docRef || `แถว ${updatedItem.rowId}`;
    showToast(`⏳ กำลังบันทึกข้อมูลงานสอบทาน ${docIdentifier} ลง Supabase...`);
    syncToGas('updateReview', updatedItem).then((success) => {
      if (success) {
        showToast(`✅ บันทึกข้อมูลงานสอบทาน ${docIdentifier} ลง Supabase สำเร็จ`);
        setTimeout(() => loadData(), 800);
      } else {
        showToast(`⚠️ บันทึกลง Supabase ไม่สำเร็จ (บันทึกข้อมูลในระบบชั่วคราวแล้ว)`);
      }
    });
  };

  // Handle Save Finance (บันทึกข้อมูลของงานการเงิน บันทึกลง Supabase ตาราง "2570-ระบบติดตามเอกสาร")
  const handleSaveFinance = async (updatedItem: DocumentItem) => {
    setDocuments((prev) => {
      const next = prev.map((item) => {
        if (
          item.id === updatedItem.id ||
          (item.rowId && updatedItem.rowId && Number(item.rowId) === Number(updatedItem.rowId))
        ) {
          return { ...item, ...updatedItem };
        }
        return item;
      });
      saveLocalDocuments(next);
      return next;
    });

    const docIdentifier = updatedItem.docNo || updatedItem.receiveNo || updatedItem.docRef || `แถว ${updatedItem.rowId}`;
    showToast(`⏳ กำลังบันทึกข้อมูลงานการเงิน ${docIdentifier} ลง Supabase...`);
    const success = await syncToGas('updateFinance', updatedItem);
    if (success) {
      showToast(`✅ บันทึกข้อมูลงานการเงิน ${docIdentifier} ลง Supabase สำเร็จ`);
      setTimeout(() => loadData(), 800);
      return true;
    } else {
      showToast(`⚠️ บันทึกลง Supabase ไม่สำเร็จ (บันทึกข้อมูลในระบบชั่วคราวแล้ว)`);
      return false;
    }
  };

  // Handle Save Budget (บันทึกข้อมูลของงานงบประมาณ บันทึกลง Supabase ตาราง "2570-ระบบติดตามเอกสาร")
  const handleSaveBudget = async (updatedItem: DocumentItem) => {
    setDocuments((prev) => {
      const next = prev.map((item) => {
        if (
          item.id === updatedItem.id ||
          (item.rowId && updatedItem.rowId && Number(item.rowId) === Number(updatedItem.rowId))
        ) {
          return { ...item, ...updatedItem };
        }
        return item;
      });
      saveLocalDocuments(next);
      return next;
    });

    const docIdentifier = updatedItem.docNo || updatedItem.receiveNo || updatedItem.docRef || `แถว ${updatedItem.rowId}`;
    showToast(`⏳ กำลังบันทึกข้อมูลงานงบประมาณ ${docIdentifier} ลง Supabase...`);
    const success = await syncToGas('updateBudget', updatedItem);
    if (success) {
      showToast(`✅ บันทึกข้อมูลงานงบประมาณ ${docIdentifier} ลง Supabase สำเร็จ`);
      setTimeout(() => loadData(), 800);
      return true;
    } else {
      showToast(`⚠️ บันทึกลง Supabase ไม่สำเร็จ (บันทึกข้อมูลในระบบชั่วคราวแล้ว)`);
      return false;
    }
  };

  // Handle Clear Recorded Data (ล้างข้อมูลที่เคยบันทึกไปให้เป็นค่าว่างเหมือนเดิม)
  const handleClearRecord = (
    item: DocumentItem,
    dept: DepartmentType | 'ALL' = currentDept,
    scope: 'all' | 'review_status_only' = 'all'
  ) => {
    const targetDept = dept === 'ALL' ? item.department : dept;
    const docIdentifier = item.docNo || item.receiveNo || item.docRef || `แถว ${item.rowId}`;

    if (targetDept === 'งานสอบทาน') {
      const cleared: DocumentItem =
        scope === 'review_status_only'
          ? {
              ...item,
              reviewActionDate: '',
              reviewStatus: '',
              reviewEditType: '',
              reviewEditDetail: '',
            }
          : {
              ...item,
              reviewReceiveDate: '',
              reviewProvider: '',
              reviewActionDate: '',
              reviewStatus: '',
              reviewEditType: '',
              reviewEditDetail: '',
            };
      handleSaveReview(cleared);
      showToast(`🗑️ ล้างข้อมูลงานสอบทานของเอกสาร ${docIdentifier} เป็นค่าว่างเรียบร้อยแล้ว`);
    } else if (targetDept === 'งานการเงิน') {
      const cleared: DocumentItem = {
        ...item,
        financeReceiveDate: '',
        financePaymentType: '',
        financePreparer: '',
        financeUrgentCheck: '',
        financeActionDate: '',
        financeReviewDate: '',
        disbursementDate: '',
        disbursementPayer: '',
        disbursementNotifyDate: '',
        disbursementActivityStartDate: '',
        disbursementActivityEndDate: '',
        financeIssueDate: '',
        financeIssueDetail: '',
      };
      handleSaveFinance(cleared);
      showToast(`🗑️ ล้างข้อมูลงานการเงินของเอกสาร ${docIdentifier} เป็นค่าว่างเรียบร้อยแล้ว`);
    } else if (targetDept === 'งานงบประมาณ') {
      const cleared: DocumentItem = {
        ...item,
        budgetActionDate: '',
        budgetFR: '',
        budgetFC: '',
        budgetPR: '',
        budgetStatus: '',
        budgetReceiveDate: '',
        budgetCoverDate: '',
        budgetDocSetDate: '',
      };
      handleSaveBudget(cleared);
      showToast(`🗑️ ล้างข้อมูลงานงบประมาณของเอกสาร ${docIdentifier} เป็นค่าว่างเรียบร้อยแล้ว`);
    } else {
      const cleared: DocumentItem = {
        ...item,
        actionDate: '',
        subType: '',
        qa: '',
        action: '',
        status: '',
        editGroup: '',
        editDetail: '',
      };
      handleSaveEdit(cleared);
      showToast(`🗑️ ล้างข้อมูลผลการตรวจจ่ายของเอกสาร ${docIdentifier} เป็นค่าว่างเรียบร้อยแล้ว`);
    }
  };

  // Handle Batch Receive Save (บันทึกรับเอกสารหลายชุดพร้อมกัน งานสอบทาน)
  const handleSaveBatchReceive = async (
    selectedIds: string[],
    batchReceiveDate: string,
    batchProvider: string
  ) => {
    const targetItems: DocumentItem[] = [];
    setDocuments((prev) => {
      const next = prev.map((item) => {
        if (selectedIds.includes(item.id)) {
          const updated: DocumentItem = {
            ...item,
            reviewReceiveDate: batchReceiveDate.trim(),
            reviewProvider: batchProvider.trim(),
          };
          targetItems.push(updated);
          return updated;
        }
        return item;
      });
      saveLocalDocuments(next);
      return next;
    });

    if (targetItems.length === 0) return;

    showToast(`⏳ กำลังบันทึกรับเอกสาร ${targetItems.length} ชุดลง Supabase...`);
    try {
      const res = await batchSaveToGoogleSheet(targetItems);
      if (res.success) {
        showToast(`✅ บันทึกรับเอกสาร ${targetItems.length} ชุดลง Supabase เรียบร้อยแล้ว`);
      } else {
        showToast(`⚠️ บันทึกลง Supabase บางส่วนสำเร็จ (บันทึกข้อมูลในระบบเรียบร้อยแล้ว)`);
      }
    } catch (err) {
      console.error('Batch save error:', err);
      showToast(`✅ บันทึกรับเอกสาร ${targetItems.length} ชุดในระบบเรียบร้อยแล้ว`);
    } finally {
      setTimeout(() => loadData(), 800);
    }
  };

  // Handle Add New Document or Add New Round
  const handleSaveNew = (newItem: DocumentItem) => {
    setDocuments((prev) => {
      const next = [newItem, ...prev];
      saveLocalDocuments(next);
      return next;
    });

    const isRound = newItem.round > 1;
    const action = isRound ? 'addRound' : 'createDocument';
    const docIdentifier = newItem.docNo || newItem.receiveNo || newItem.docRef || 'เอกสารใหม่';

    showToast(`⏳ กำลังบันทึกข้อมูล ${docIdentifier} เข้า Supabase โดยตรง...`);
    syncToGas(action, newItem).then((success) => {
      if (success) {
        showToast(
          isRound
            ? `✅ เพิ่มรอบใหม่ (ครั้งที่ ${newItem.round}) สำหรับเอกสาร ${newItem.docNo} ใน Supabase สำเร็จ`
            : `✅ บันทึกรับเอกสารใหม่ ${newItem.docNo} เข้า Supabase เรียบร้อยแล้ว`
        );
      } else {
        showToast(`✅ บันทึกข้อมูล ${docIdentifier} ในระบบเรียบร้อยแล้ว`);
      }
      loadData();
      setTimeout(() => loadData(), 800);
    });
  };

  // Handle GAS URL Save
  const handleSaveGasUrl = (url: string) => {
    setStoredGasUrl(url);
    setGasUrl(url);
    showToast('บันทึกการตั้งค่าการเชื่อมต่อฐานข้อมูลเรียบร้อย');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-['Sarabun',sans-serif] transition-colors duration-200 ${isDark ? 'bg-[#0a1128] text-slate-100' : 'bg-[#f0f7ff] text-slate-900'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-950 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        onOpenGasModal={() => setIsGasCodeOpen(true)}
        onOpenNewDocModal={() => {
          setNewDocTarget(null);
          setIsNewDocOpen(true);
        }}
        onOpenSettingsModal={() => setIsGasCodeOpen(true)}
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
        onOpenReport={() => setCurrentView(currentView === 'REPORT' ? 'CARDS' : 'REPORT')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* View Router: Executive Report Dashboard vs Document Cards */}
      {currentView === 'REPORT' ? (
        <ReportDashboard
          documents={documents}
          groupedDocuments={groupedDocuments}
          currentDept={currentDept}
          onSelectDept={(dept) => setCurrentDept(dept)}
          onBackToCards={() => setCurrentView('CARDS')}
          onRefresh={() => loadData(true)}
          isLoading={isLoading}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      ) : (
        /* Main Content Area */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Department Navigation Tabs (4 ฝ่าย) & Search/Filter */}
          <DepartmentTabs
            currentDept={currentDept}
            onSelectDept={(dept) => setCurrentDept(dept)}
            counts={counts}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            returnStatusFilter={returnStatusFilter}
            onReturnStatusChange={(st) => setReturnStatusFilter(st)}
            multiRoundOnly={multiRoundOnly}
            onMultiRoundToggle={(val) => setMultiRoundOnly(val)}
            selectedProvider={selectedProvider}
            onProviderChange={(p) => setSelectedProvider(p)}
            availableProviders={availableProviders}
            workStatusFilter={workStatusFilter}
            onWorkStatusChange={(st) => setWorkStatusFilter(st)}
            workStatusCounts={workStatusCounts}
            onOpenReport={() => setCurrentView('REPORT')}
            timeFilter={timeFilter}
            onTimeFilterChange={(tf) => setTimeFilter(tf)}
            customDate={customDate}
            onCustomDateChange={(cd) => setCustomDate(cd)}
            selectedDocTypes={selectedDocTypes}
            onSelectedDocTypesChange={(types) => setSelectedDocTypes(types)}
            availableDocTypes={availableDocTypes}
            theme={theme}
            displayMode={displayMode}
            onDisplayModeChange={handleDisplayModeChange}
          />

          {/* Executive Stats Summary */}
          <StatsBar
            currentDept={currentDept}
            totalDocs={workStatusCounts.all}
            totalRounds={workStatusCounts.all}
            returnedDocs={workStatusCounts.completed}
            pendingDocs={workStatusCounts.pending}
            receivedDocs={workStatusCounts.received}
            workStatusFilter={workStatusFilter}
            onWorkStatusChange={(st) => setWorkStatusFilter(st)}
            budgetCompletedToday={budgetTodayDocs.length}
            budgetCompletedThisMonth={budgetThisMonthDocs.length}
            budgetCompletedAll={budgetAllDocs.length}
            budgetCompletedPeriod={budgetCompletedPeriod}
            onBudgetStatClick={(period) => {
              setBudgetCompletedPeriod(period);
            }}
          />

          {/* Action bar for งานสอบทาน: บันทึกรับเอกสารหลายชุดพร้อมกัน */}
          {currentDept === 'งานสอบทาน' && (
            <div className="mb-4 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border border-pink-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-pink-950 font-['Prompt','Sarabun',sans-serif]">
                    งานสอบทาน: บันทึกรับเอกสารหลายชุดพร้อมกัน
                  </h4>
                  <p className="text-xs text-pink-700">
                    กรองประเภท ติ๊กเลือกชุดที่ได้รับ กรอกผู้ให้บริการช่องเดียว แล้วบันทึกลง Supabase พร้อมกันทันที
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchReceiveOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] shrink-0"
              >
                <Inbox className="w-4 h-4" />
                <span>บันทึกรับเอกสารหลายชุดพร้อมกัน</span>
              </button>
            </div>
          )}

          {/* Action bar for งานการเงิน: จัดทำเช็ค/โอนเงิน และการจ่ายเงิน */}
          {currentDept === 'งานการเงิน' && (
            <div className="mb-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 font-['Prompt','Sarabun',sans-serif]">
                    งานการเงิน: จัดทำเช็ค/โอนเงิน และบันทึกการจ่ายเงิน
                  </h4>
                  <p className="text-xs text-emerald-700">
                    เลือกเอกสารเพื่อบันทึกประเภทการจ่าย, ผู้จัดทำ, เช็คด่วน, ผู้จ่ายเงิน และหมายเหตุปัญหา (คอลัมน์ AE:AQ)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFinanceItem(filteredDocuments[0]?.latestRound || null);
                  setIsFinanceModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] shrink-0"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>บันทึกข้อมูลงานการเงิน</span>
              </button>
            </div>
          )}

          {/* Action bar for งานงบประมาณ: FR, FC, PR, สถานะ และวันที่ดำเนินการ */}
          {currentDept === 'งานงบประมาณ' && (
            <div className="mb-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950 font-['Prompt','Sarabun',sans-serif]">
                    งานงบประมาณ: จัดการงบประมาณ (FR, FC, PR, สถานะ)
                  </h4>
                  <p className="text-xs text-amber-700">
                    เลือกเอกสารเพื่อบันทึก FR/FC/PR 10 หลัก, สถานะงบประมาณ, วันที่รับ/ดำเนินการ (คอลัมน์ AR:AY)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBudgetItem(filteredDocuments[0]?.latestRound || null);
                  setIsBudgetModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif] shrink-0"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>บันทึกข้อมูลงานงบประมาณ</span>
              </button>
            </div>
          )}

          {/* Document Cards Grid or Table View */}
          {filteredDocuments.length > 0 ? (
            displayMode === 'TABLE' ? (
              <DocumentTable
                documents={filteredDocuments}
                currentDept={currentDept}
                theme={theme}
                onEdit={(item) => setEditItem(item)}
                onInspect={(item) => {
                  setInspectItem(item);
                  setIsInspectModalOpen(true);
                }}
                onReview={(item) => {
                  setReviewItem(item);
                  setIsReviewModalOpen(true);
                }}
                onFinance={(item) => {
                  setFinanceItem(item);
                  setIsFinanceModalOpen(true);
                }}
                onBudget={(item) => {
                  setBudgetItem(item);
                  setIsBudgetModalOpen(true);
                }}
                onClearRecord={handleClearRecord}
                onViewHistory={(d) => setHistoryDoc(d)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc, idx) => (
                  <DocumentCard
                    key={doc.latestRound?.id ? `${doc.docNo || 'doc'}-${doc.latestRound.id}` : `doc-card-${idx}-${doc.docNo}`}
                    document={doc}
                    currentDept={currentDept}
                    onEdit={(item) => setEditItem(item)}
                    onInspect={(item) => {
                      setInspectItem(item);
                      setIsInspectModalOpen(true);
                    }}
                    onReview={(item) => {
                      setReviewItem(item);
                      setIsReviewModalOpen(true);
                    }}
                    onFinance={(item) => {
                      setFinanceItem(item);
                      setIsFinanceModalOpen(true);
                    }}
                    onBudget={(item) => {
                      setBudgetItem(item);
                      setIsBudgetModalOpen(true);
                    }}
                    onClearRecord={handleClearRecord}
                    onViewHistory={(d) => setHistoryDoc(d)}
                    onAddRound={(d) => {
                      setNewDocTarget(d);
                      setIsNewDocOpen(true);
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            <div className={`rounded-2xl border p-12 text-center my-6 shadow-2xs ${isDark ? 'bg-[#111e42] border-sky-900/60' : 'bg-white border-slate-200'}`}>
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <FolderX className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className={`text-base font-bold mb-1 font-['Prompt','Sarabun',sans-serif] ${isDark ? 'text-white' : 'text-slate-800'}`}>
                ไม่พบข้อมูลเอกสารที่ตรงกับเงื่อนไข
              </h3>
              <p className="text-xs text-slate-500 font-normal max-w-sm mx-auto mb-4">
                {searchQuery
                  ? `ไม่พบเอกสารที่มีคำว่า "${searchQuery}" ในฝ่าย${currentDept !== 'ALL' ? currentDept : 'ทั้งหมด'}`
                  : `ยังไม่มีเอกสารใน${currentDept !== 'ALL' ? currentDept : 'ระบบ'}`}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>ล้างคำค้นหา</span>
                </button>
              )}
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ระบบติดตามเอกสารการเบิกจ่าย ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง
          </span>
          <span className="text-xs text-slate-400">
            ระบบติดตามสถานะเอกสาร 4 ฝ่าย ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง
          </span>
        </div>
      </footer>

      {/* Modals */}
      <HistoryModal
        isOpen={Boolean(historyDoc)}
        document={historyDoc}
        onClose={() => setHistoryDoc(null)}
        onEditRound={(item) => setEditItem(item)}
        onAddRound={(doc) => {
          setNewDocTarget(doc);
          setIsNewDocOpen(true);
        }}
      />

      <EditDocumentModal
        isOpen={Boolean(editItem)}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSaveEdit}
      />

      <InspectionRecordModal
        isOpen={isInspectModalOpen}
        item={inspectItem}
        documents={filteredDocuments.map((d) => d.latestRound)}
        onClose={() => {
          setIsInspectModalOpen(false);
          setInspectItem(null);
        }}
        onSave={(updated) => {
          handleSaveEdit(updated);
          setIsInspectModalOpen(false);
          setInspectItem(null);
        }}
      />

      <ReviewRecordModal
        isOpen={isReviewModalOpen}
        item={reviewItem}
        documents={filteredDocuments.map((d) => d.latestRound)}
        availableProviders={availableProviders}
        onOpenBatchReceive={() => setIsBatchReceiveOpen(true)}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewItem(null);
        }}
        onSave={(updated, part) => {
          handleSaveReview(updated);
          if (part === 'receive') {
            showToast('✅ บันทึกการรับเอกสาร (พาร์ท 1) เรียบร้อยแล้ว');
          } else if (part === 'status') {
            showToast('✅ บันทึกสถานะการตรวจ (พาร์ท 2) เรียบร้อยแล้ว');
          } else {
            showToast('✅ บันทึกข้อมูลงานสอบทานเรียบร้อยแล้ว');
            setIsReviewModalOpen(false);
            setReviewItem(null);
          }
        }}
      />

      <FinanceRecordModal
        isOpen={isFinanceModalOpen}
        item={financeItem}
        documents={filteredDocuments.map((d) => d.latestRound)}
        onClose={() => {
          setIsFinanceModalOpen(false);
          setFinanceItem(null);
        }}
        onSave={async (updated) => {
          const ok = await handleSaveFinance(updated);
          if (ok) {
            setIsFinanceModalOpen(false);
            setFinanceItem(null);
          }
        }}
      />

      <BudgetRecordModal
        isOpen={isBudgetModalOpen}
        item={budgetItem}
        documents={documents}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetItem(null);
        }}
        onSave={async (updated) => {
          await handleSaveBudget(updated);
        }}
      />

      <BudgetCompletedModal
        isOpen={isBudgetCompletedModalOpen}
        onClose={() => setIsBudgetCompletedModalOpen(false)}
        period={budgetCompletedPeriod}
        onSelectPeriod={(p) => setBudgetCompletedPeriod(p)}
        todayDocs={budgetTodayDocs}
        thisMonthDocs={budgetThisMonthDocs}
        allDocs={budgetAllDocs}
        onOpenBudgetRecord={(item) => {
          setBudgetItem(item);
          setIsBudgetModalOpen(true);
        }}
      />

      <BatchReceiveModal
        isOpen={isBatchReceiveOpen}
        documents={documents}
        availableProviders={availableProviders}
        onClose={() => setIsBatchReceiveOpen(false)}
        onBatchSave={handleSaveBatchReceive}
      />

      <NewDocModal
        isOpen={isNewDocOpen}
        targetDoc={newDocTarget}
        currentDept={currentDept}
        onClose={() => {
          setIsNewDocOpen(false);
          setNewDocTarget(null);
        }}
        onSaveNew={handleSaveNew}
      />

      <GasCodeModal
        isOpen={isGasCodeOpen}
        onClose={() => setIsGasCodeOpen(false)}
        gasUrl={gasUrl}
        onSaveGasUrl={handleSaveGasUrl}
      />

      <LoginModal
        isOpen={!userEmail}
        onLogin={handleLogin}
      />
    </div>
  );
}
