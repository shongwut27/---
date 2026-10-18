import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem } from '../types';
import {
  X,
  Save,
  Clock,
  Search,
  FileText,
  AlertCircle,
  Building2,
  User,
  CheckCircle2,
  Calendar,
  ChevronDown,
  DollarSign,
  Send,
  Zap,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

// ตัวเลือก: ประเภทการจ่าย (5 ตัวเลือก)
export const PAYMENT_TYPE_OPTIONS = [
  'โอนเงิน',
  'เช็ค',
  'โอนเข้าบัญชีพร้อมเงินเดือน',
  'เงินสด',
  'โอนผ่านระบบ GFMIS',
];

// ตัวเลือก: ผู้จัดทำเช็ค/โอนเงิน และ ผู้จ่ายเงิน (8 คน)
export const FINANCE_OFFICER_OPTIONS = [
  'บุญญาพร',
  'รุ่งนภา',
  'พรปวีณ์',
  'กมลลักษณ์',
  'กฤษณา',
  'จิรวรรณ',
  'ธัญชนก',
  'ประกายมาศ',
];

// ตัวเลือก: รายละเอียดกรณีแก้ไข (กรณีไม่สามารถจ่ายเงิน/ทำเช็ค/โอนเงินได้)
export const FINANCE_ISSUE_OPTIONS = [
  'ยังไม่ถึงกำหนดจ่ายเงิน',
  'ERROR-ติดระบบ',
  'เอกสารไม่ครบถ้วน/รอเอกสารเพิ่มเติม',
  'ส่งคืน/ตรวจจ่ายเพื่อตั้งหนี้เพิ่มเติม',
];

type FinanceTabType = 'finance' | 'review_cheque' | 'disbursement' | 'issue';

interface FinanceRecordModalProps {
  isOpen: boolean;
  item: DocumentItem | null;
  documents?: DocumentItem[];
  onClose: () => void;
  onSave: (updatedItem: DocumentItem) => Promise<boolean | void>;
}

// Helper: Format date for input datetime-local (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(val?: string): string {
  if (!val || val.trim() === '') return '';
  // If already in YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
    return val.substring(0, 16);
  }
  // If in Thai format d/M/yyyy HH:mm:ss
  const dmyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2})?:?(\d{2})?:?(\d{2})?/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = parseInt(dmyMatch[3], 10);
    if (year > 2400) year -= 543;
    const hour = (dmyMatch[4] || '00').padStart(2, '0');
    const minute = (dmyMatch[5] || '00').padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
  return '';
}

// Helper: Format date for input date (YYYY-MM-DD)
function toDateOnly(val?: string): string {
  if (!val || val.trim() === '') return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.substring(0, 10);
  }
  const dmyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = parseInt(dmyMatch[3], 10);
    if (year > 2400) year -= 543;
    return `${year}-${month}-${day}`;
  }
  return '';
}

// Helper: Format input datetime value back to display/sheet format d/M/yyyy HH:mm:ss
function formatToSheetDatetime(val: string): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return val;
  }
}

// Helper: Format input date value back to display/sheet format d/M/yyyy
function formatToSheetDate(val: string): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return val;
  }
}

function getCurrentDatetimeLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const FinanceRecordModal: React.FC<FinanceRecordModalProps> = ({
  isOpen,
  item,
  documents = [],
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<FinanceTabType>('finance');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(item);
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);

  // Form Fields - หน้า 1: งานการเงิน (AE:AI)
  const [financeReceiveDate, setFinanceReceiveDate] = useState<string>('');
  const [financePaymentType, setFinancePaymentType] = useState<string>('');
  const [financePreparer, setFinancePreparer] = useState<string>('');
  const [financeUrgentCheck, setFinanceUrgentCheck] = useState<boolean>(false);
  const [financeActionDate, setFinanceActionDate] = useState<string>('');

  // Form Fields - หน้า 2: งานสอบทานเช็ค (AJ)
  const [financeReviewDate, setFinanceReviewDate] = useState<string>('');

  // Form Fields - หน้า 3: งานจ่ายเงิน (AK:AO)
  const [disbursementDate, setDisbursementDate] = useState<string>('');
  const [disbursementPayer, setDisbursementPayer] = useState<string>('');
  const [disbursementNotifyDate, setDisbursementNotifyDate] = useState<string>('');
  const [disbursementActivityStartDate, setDisbursementActivityStartDate] = useState<string>('');
  const [disbursementActivityEndDate, setDisbursementActivityEndDate] = useState<string>('');

  // Form Fields - หน้า 4: กรณีไม่สามารถจ่ายเงิน/ทำเช็ค/โอนเงินได้ (AP:AQ)
  const [financeIssueDate, setFinanceIssueDate] = useState<string>('');
  const [financeIssuePreset, setFinanceIssuePreset] = useState<string>('');
  const [financeIssueCustom, setFinanceIssueCustom] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tabs: { id: FinanceTabType; number: number; label: string; shortDesc: string }[] = [
    { id: 'finance', number: 1, label: 'งานการเงิน', shortDesc: 'จัดทำเช็ค/โอนเงิน' },
    { id: 'review_cheque', number: 2, label: 'งานสอบทานเช็ค', shortDesc: 'สอบทานเช็ค/โอนเงิน' },
    { id: 'disbursement', number: 3, label: 'งานจ่ายเงิน', shortDesc: 'จ่ายเงิน & กิจกรรม' },
    { id: 'issue', number: 4, label: 'กรณีไม่สามารถจ่ายเงิน/ทำเช็ค/โอนเงินได้', shortDesc: 'ปัญหา/แก้ไข' },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);

  // Sync state with selected document
  useEffect(() => {
    const doc = item || selectedDoc;
    if (doc) {
      setSelectedDoc(doc);
      setFinanceReceiveDate(toDatetimeLocal(doc.financeReceiveDate) || (isOpen && !doc.financeReceiveDate ? getCurrentDatetimeLocal() : ''));
      setFinancePaymentType(doc.financePaymentType || 'โอนเงิน');
      setFinancePreparer(doc.financePreparer || '');
      setFinanceUrgentCheck(doc.financeUrgentCheck === 'ด่วน' || doc.financeUrgentCheck === 'true');
      setFinanceActionDate(toDatetimeLocal(doc.financeActionDate) || '');
      setFinanceReviewDate(toDatetimeLocal(doc.financeReviewDate) || '');

      setDisbursementDate(toDatetimeLocal(doc.disbursementDate) || '');
      setDisbursementPayer(doc.disbursementPayer || '');
      setDisbursementNotifyDate(toDatetimeLocal(doc.disbursementNotifyDate) || '');
      setDisbursementActivityStartDate(toDateOnly(doc.disbursementActivityStartDate) || '');
      setDisbursementActivityEndDate(toDateOnly(doc.disbursementActivityEndDate) || '');

      setFinanceIssueDate(toDatetimeLocal(doc.financeIssueDate) || '');
      const detail = doc.financeIssueDetail || '';
      if (FINANCE_ISSUE_OPTIONS.includes(detail)) {
        setFinanceIssuePreset(detail);
        setFinanceIssueCustom('');
      } else if (detail) {
        setFinanceIssuePreset('อื่น ๆ');
        setFinanceIssueCustom(detail);
      } else {
        setFinanceIssuePreset('');
        setFinanceIssueCustom('');
      }
    } else {
      setSelectedDoc(null);
      setFinanceReceiveDate(getCurrentDatetimeLocal());
      setFinancePaymentType('โอนเงิน');
      setFinancePreparer('');
      setFinanceUrgentCheck(false);
      setFinanceActionDate('');
      setFinanceReviewDate('');
      setDisbursementDate('');
      setDisbursementPayer('');
      setDisbursementNotifyDate('');
      setDisbursementActivityStartDate('');
      setDisbursementActivityEndDate('');
      setFinanceIssueDate('');
      setFinanceIssuePreset('');
      setFinanceIssueCustom('');
    }
    setActiveTab('finance');
    setSaveSuccess(false);
    setErrorMessage(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  // Filter documents for autocomplete search
  const filteredDocs = searchDocQuery.trim()
    ? documents.filter((d) => {
        const q = searchDocQuery.toLowerCase();
        return (
          (d.docNo && d.docNo.toLowerCase().includes(q)) ||
          (d.receiveNo && d.receiveNo.toLowerCase().includes(q)) ||
          (d.docRef && d.docRef.toLowerCase().includes(q)) ||
          (d.agency && d.agency.toLowerCase().includes(q)) ||
          (d.sender && d.sender.toLowerCase().includes(q))
        );
      }).slice(0, 15)
    : [];

  const handleSelectDoc = (d: DocumentItem) => {
    setSelectedDoc(d);
    setIsSearchingDoc(false);
    setSearchDocQuery('');

    setFinanceReceiveDate(toDatetimeLocal(d.financeReceiveDate) || getCurrentDatetimeLocal());
    setFinancePaymentType(d.financePaymentType || 'โอนเงิน');
    setFinancePreparer(d.financePreparer || '');
    setFinanceUrgentCheck(d.financeUrgentCheck === 'ด่วน' || d.financeUrgentCheck === 'true');
    setFinanceActionDate(toDatetimeLocal(d.financeActionDate) || '');
    setFinanceReviewDate(toDatetimeLocal(d.financeReviewDate) || '');

    setDisbursementDate(toDatetimeLocal(d.disbursementDate) || '');
    setDisbursementPayer(d.disbursementPayer || '');
    setDisbursementNotifyDate(toDatetimeLocal(d.disbursementNotifyDate) || '');
    setDisbursementActivityStartDate(toDateOnly(d.disbursementActivityStartDate) || '');
    setDisbursementActivityEndDate(toDateOnly(d.disbursementActivityEndDate) || '');

    setFinanceIssueDate(toDatetimeLocal(d.financeIssueDate) || '');
    const detail = d.financeIssueDetail || '';
    if (FINANCE_ISSUE_OPTIONS.includes(detail)) {
      setFinanceIssuePreset(detail);
      setFinanceIssueCustom('');
    } else if (detail) {
      setFinanceIssuePreset('อื่น ๆ');
      setFinanceIssueCustom(detail);
    } else {
      setFinanceIssuePreset('');
      setFinanceIssueCustom('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) {
      setErrorMessage('กรุณาเลือกเอกสารที่ต้องการบันทึก');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    // Resolve issue detail
    let finalIssueDetail = '';
    if (financeIssuePreset === 'อื่น ๆ') {
      finalIssueDetail = financeIssueCustom.trim();
    } else if (financeIssuePreset) {
      finalIssueDetail = financeIssuePreset;
    }

    const updatedItem: DocumentItem = {
      ...selectedDoc,
      // งานการเงิน (AE:AQ)
      financeReceiveDate: financeReceiveDate ? formatToSheetDatetime(financeReceiveDate) : (selectedDoc.financeReceiveDate || ''),
      financePaymentType: financePaymentType || '',
      financePreparer: financePreparer || '',
      financeUrgentCheck: financeUrgentCheck ? 'ด่วน' : '',
      financeActionDate: financeActionDate ? formatToSheetDatetime(financeActionDate) : '',
      financeReviewDate: financeReviewDate ? formatToSheetDatetime(financeReviewDate) : '',
      disbursementDate: disbursementDate ? formatToSheetDatetime(disbursementDate) : '',
      disbursementPayer: disbursementPayer || '',
      disbursementNotifyDate: disbursementNotifyDate ? formatToSheetDatetime(disbursementNotifyDate) : '',
      disbursementActivityStartDate: disbursementActivityStartDate ? formatToSheetDate(disbursementActivityStartDate) : '',
      disbursementActivityEndDate: disbursementActivityEndDate ? formatToSheetDate(disbursementActivityEndDate) : '',
      financeIssueDate: financeIssueDate ? formatToSheetDatetime(financeIssueDate) : '',
      financeIssueDetail: finalIssueDetail,
    };

    try {
      await onSave(updatedItem);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const goToNextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">บันทึกข้อมูลงานการเงิน</h2>
              <p className="text-xs text-emerald-100 font-normal">
                บันทึกข้อมูลแบ่งเป็น 4 หน้า (คอลัมน์ AE ถึง AQ ในชีท DATA)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Selection or Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          {!selectedDoc ? (
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ค้นหาและเลือกเอกสารที่ต้องการบันทึก:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDocQuery}
                  onChange={(e) => {
                    setSearchDocQuery(e.target.value);
                    setIsSearchingDoc(true);
                  }}
                  onFocus={() => setIsSearchingDoc(true)}
                  placeholder="ค้นหาเลขที่เอกสาร, เลขทะเบียนรับ, หน่วยงาน หรือผู้ส่ง..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              {/* Autocomplete dropdown */}
              {isSearchingDoc && filteredDocs.length > 0 && (
                <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.id || `${doc.docNo}-${doc.rowId}`}
                      type="button"
                      onClick={() => handleSelectDoc(doc)}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 flex items-center space-x-2">
                          <span>{doc.docNo || 'ไม่มีเลขที่เอกสาร'}</span>
                          {doc.receiveNo && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-normal">
                              รับ #{doc.receiveNo}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {doc.agency || doc.sender || '-'}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        เลือก
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedDoc.docNo || 'ไม่มีเลขที่เอกสาร'}
                    </span>
                    {selectedDoc.receiveNo && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                        ทะเบียนรับ: {selectedDoc.receiveNo}
                      </span>
                    )}
                    {selectedDoc.rowId && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">
                        แถวที่ {selectedDoc.rowId}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500 flex-wrap">
                    {selectedDoc.agency && (
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedDoc.agency}</span>
                      </span>
                    )}
                    {selectedDoc.sender && (
                      <span className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedDoc.sender}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline self-start sm:self-center cursor-pointer"
              >
                เปลี่ยนเอกสาร
              </button>
            </div>
          )}
        </div>

        {/* 4 Pages Navigation Tabs */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-start p-2.5 sm:p-3 rounded-t-xl transition-all cursor-pointer border-t-2 ${
                    isActive
                      ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm font-bold'
                      : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 w-full">
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold shrink-0 ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {tab.number}
                    </span>
                    <span className="text-xs truncate text-left">{tab.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal pl-6 hidden sm:inline truncate">
                    {tab.shortDesc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[64vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>บันทึกข้อมูลงานการเงินสำเร็จเรียบร้อย!</span>
            </div>
          )}

          {/* ===================== หน้า 1: งานการเงิน ===================== */}
          {activeTab === 'finance' && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">หน้า 1 : งานการเงิน</h3>
                    <p className="text-[11px] text-slate-500">คอลัมน์ AE ถึง AI ใน Google Sheet</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                  1 / 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {/* วันที่-รับเอกสาร (AE) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      วันที่-รับเอกสาร
                    </label>
                    <button
                      type="button"
                      onClick={() => setFinanceReceiveDate(getCurrentDatetimeLocal())}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                    >
                      ตอนนี้
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={financeReceiveDate}
                    onChange={(e) => setFinanceReceiveDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  />
                </div>

                {/* ประเภทการจ่าย (AF) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ประเภทการจ่าย
                  </label>
                  <div className="relative">
                    <select
                      value={financePaymentType}
                      onChange={(e) => setFinancePaymentType(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
                    >
                      <option value="">-- เลือกประเภทการจ่าย --</option>
                      {PAYMENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* ผู้จัดทำเช็ค/โอนเงิน (AG) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ผู้จัดทำเช็ค/โอนเงิน
                  </label>
                  <div className="relative">
                    <select
                      value={financePreparer}
                      onChange={(e) => setFinancePreparer(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
                    >
                      <option value="">-- เลือกผู้จัดทำ --</option>
                      {FINANCE_OFFICER_OPTIONS.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* กรณีเช็คด่วน (AH) */}
                <div className="flex items-center pt-1 sm:pt-4">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200 px-3.5 py-2.5 rounded-xl transition-all w-full">
                    <input
                      type="checkbox"
                      checked={financeUrgentCheck}
                      onChange={(e) => setFinanceUrgentCheck(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                    />
                    <div className="flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-900">กรณีเช็คด่วน</span>
                      {financeUrgentCheck && (
                        <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                          ด่วน
                        </span>
                      )}
                    </div>
                  </label>
                </div>

                {/* วันที่-ทำรายการ (AI) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      วันที่-ทำรายการ
                    </label>
                    <button
                      type="button"
                      onClick={() => setFinanceActionDate(getCurrentDatetimeLocal())}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                    >
                      ตอนนี้
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={financeActionDate}
                    onChange={(e) => setFinanceActionDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== หน้า 2: งานสอบทานเช็ค ===================== */}
          {activeTab === 'review_cheque' && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">หน้า 2 : งานสอบทานเช็ค</h3>
                    <p className="text-[11px] text-slate-500">คอลัมน์ AJ ใน Google Sheet</p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
                  2 / 4
                </span>
              </div>

              <div className="max-w-md pt-1">
                {/* วันที่สอบทาน-เช็ค/โอนเงิน (AJ) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      วันที่สอบทาน-เช็ค/โอนเงิน
                    </label>
                    <button
                      type="button"
                      onClick={() => setFinanceReviewDate(getCurrentDatetimeLocal())}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      ตอนนี้
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={financeReviewDate}
                    onChange={(e) => setFinanceReviewDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    * ระบุวันที่และเวลาที่ดำเนินการสอบทานความถูกต้องของเช็คหรือข้อมูลการโอนเงิน
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================== หน้า 3: งานจ่ายเงิน ===================== */}
          {activeTab === 'disbursement' && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-100" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">หน้า 3 : งานจ่ายเงิน</h3>
                    <p className="text-[11px] text-slate-500">คอลัมน์ AK ถึง AO ใน Google Sheet</p>
                  </div>
                </div>
                <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2.5 py-1 rounded-full">
                  3 / 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {/* วันที่-จ่ายเงิน (AK) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      วันที่-จ่ายเงิน
                    </label>
                    <button
                      type="button"
                      onClick={() => setDisbursementDate(getCurrentDatetimeLocal())}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                    >
                      ตอนนี้
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={disbursementDate}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  />
                </div>

                {/* ผู้จ่ายเงิน (AL) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ผู้จ่ายเงิน
                  </label>
                  <div className="relative">
                    <select
                      value={disbursementPayer}
                      onChange={(e) => setDisbursementPayer(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
                    >
                      <option value="">-- เลือกผู้จ่ายเงิน --</option>
                      {FINANCE_OFFICER_OPTIONS.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* วันที่แจ้งหน่วยงานติดต่อรับเงิน (AM) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      วันที่แจ้งหน่วยงานติดต่อรับเงิน
                    </label>
                    <button
                      type="button"
                      onClick={() => setDisbursementNotifyDate(getCurrentDatetimeLocal())}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                    >
                      ตอนนี้
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={disbursementNotifyDate}
                    onChange={(e) => setDisbursementNotifyDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  />
                </div>

                {/* วันที่เริ่มกิจกรรม (กรณีเงินยืมทดรอง) (AN) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    วันที่เริ่มกิจกรรม (กรณีเงินยืมทดรอง)
                  </label>
                  <input
                    type="date"
                    value={disbursementActivityStartDate}
                    onChange={(e) => setDisbursementActivityStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  />
                </div>

                {/* วันสิ้นสุดกิจกรรม (AO) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    วันสิ้นสุดกิจกรรม
                  </label>
                  <input
                    type="date"
                    value={disbursementActivityEndDate}
                    onChange={(e) => setDisbursementActivityEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================== หน้า 4: กรณีไม่สามารถจ่ายเงิน/ทำเช็ค/โอนเงินได้ ===================== */}
          {activeTab === 'issue' && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      หน้า 4 : กรณีไม่สามารถจ่ายเงิน/ทำเช็ค/โอนเงินได้
                    </h3>
                    <p className="text-[11px] text-slate-500">คอลัมน์ AP ถึง AQ ใน Google Sheet</p>
                  </div>
                </div>
                <span className="text-xs bg-rose-100 text-rose-800 font-semibold px-2.5 py-1 rounded-full">
                  4 / 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* วันที่ (AP) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      วันที่พบปัญหา / แก้ไข
                    </label>
                    <button
                      type="button"
                      onClick={() => setFinanceIssueDate(getCurrentDatetimeLocal())}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      ตอนนี้
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={financeIssueDate}
                    onChange={(e) => setFinanceIssueDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                  />
                </div>

                {/* รายละเอียดกรณีแก้ไข (AQ) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    รายละเอียดกรณีแก้ไข
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={financeIssuePreset}
                        onChange={(e) => setFinanceIssuePreset(e.target.value)}
                        className="w-full appearance-none px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm cursor-pointer"
                      >
                        <option value="">-- เลือกรายละเอียดกรณีแก้ไข --</option>
                        {FINANCE_ISSUE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                        <option value="อื่น ๆ">อื่น ๆ (ระบุเอง)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {financeIssuePreset === 'อื่น ๆ' && (
                      <input
                        type="text"
                        value={financeIssueCustom}
                        onChange={(e) => setFinanceIssueCustom(e.target.value)}
                        placeholder="พิมพ์ระบุรายละเอียดเพิ่มเติม..."
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions & Navigation */}
          <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={goToPrevTab}
                disabled={currentTabIndex === 0}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>หน้าก่อนหน้า</span>
              </button>

              <button
                type="button"
                onClick={goToNextTab}
                disabled={currentTabIndex === tabs.length - 1}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>หน้าถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึกลง Google Sheet...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกข้อมูลงานการเงิน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

