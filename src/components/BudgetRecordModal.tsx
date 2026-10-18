import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  PieChart,
  Hash,
  FileSpreadsheet,
  Check,
  Sparkles,
} from 'lucide-react';

// ตัวเลือกสถานะสำหรับงานงบประมาณ (คอลัมน์ AV)
export const BUDGET_STATUS_OPTIONS = [
  'คืนงบประมาณแล้ว/กิจกรรมเสร็จสิ้นแล้ว',
  'ERROR',
  'ไม่สามารถคืนได้/รอติดต่อ ศ.ไอที',
  'ยังไม่คืนงบ/กิจกรรมยังไม่เสร็จสิ้น',
  'ส่งต่องานบัญชี Com 2300',
  'ส่งต่องานบัญชี คลินิกทัตกรรม',
  'เก็บเข้าแฟ้ม',
  'อื่น ๆ',
];

interface BudgetRecordModalProps {
  isOpen: boolean;
  item: DocumentItem | null;
  documents?: DocumentItem[];
  onClose: () => void;
  onSave: (updatedItem: DocumentItem) => Promise<boolean | void>;
}

// Helper: Format date for input datetime-local (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(val?: string): string {
  if (!val || val.trim() === '') return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
    return val.substring(0, 16);
  }
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

export const BudgetRecordModal: React.FC<BudgetRecordModalProps> = ({
  isOpen,
  item,
  documents = [],
  onClose,
  onSave,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(item);
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);

  // Form Fields - งานงบประมาณ (คอลัมน์ AR ถึง AY ใน Google Sheet)
  const [budgetActionDate, setBudgetActionDate] = useState<string>(''); // AR: วันที่ดำเนินการ
  const [budgetFR, setBudgetFR] = useState<string>(''); // AS: FR 10 หลัก
  const [budgetFC, setBudgetFC] = useState<string>(''); // AT: FC 10 หลัก
  const [budgetPR, setBudgetPR] = useState<string>(''); // AU: PR 10 หลัก
  const [budgetStatus, setBudgetStatus] = useState<string>(''); // AV: สถานะ
  const [budgetStatusCustom, setBudgetStatusCustom] = useState<string>(''); // AV: กรณีเลือก อื่น ๆ
  const [budgetReceiveDate, setBudgetReceiveDate] = useState<string>(''); // AW: วันที่รับเอกสาร
  const [budgetCoverDate, setBudgetCoverDate] = useState<string>(''); // AX: วันที่ตามใบปะหน้า
  const [budgetDocSetDate, setBudgetDocSetDate] = useState<string>(''); // AY: วันที่ตามชุดเอกสาร

  // Status Search / Guide dropdown state
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [statusSearchText, setStatusSearchText] = useState('');
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Sync state with selected document
  useEffect(() => {
    const doc = item || selectedDoc;
    if (doc) {
      setSelectedDoc(doc);
      setBudgetActionDate(toDatetimeLocal(doc.budgetActionDate) || (isOpen && !doc.budgetActionDate ? getCurrentDatetimeLocal() : ''));
      setBudgetFR(doc.budgetFR ? String(doc.budgetFR).replace(/\D/g, '').slice(0, 10) : '');
      setBudgetFC(doc.budgetFC ? String(doc.budgetFC).replace(/\D/g, '').slice(0, 10) : '');
      setBudgetPR(doc.budgetPR ? String(doc.budgetPR).replace(/\D/g, '').slice(0, 10) : '');

      const currentStatus = doc.budgetStatus || '';
      if (BUDGET_STATUS_OPTIONS.includes(currentStatus)) {
        setBudgetStatus(currentStatus);
        setBudgetStatusCustom('');
      } else if (currentStatus.trim() !== '') {
        setBudgetStatus('อื่น ๆ');
        setBudgetStatusCustom(currentStatus);
      } else {
        setBudgetStatus('');
        setBudgetStatusCustom('');
      }

      setBudgetReceiveDate(toDatetimeLocal(doc.budgetReceiveDate) || (isOpen && !doc.budgetReceiveDate ? getCurrentDatetimeLocal() : ''));
      setBudgetCoverDate(toDateOnly(doc.budgetCoverDate));
      setBudgetDocSetDate(toDateOnly(doc.budgetDocSetDate));
    } else {
      setSelectedDoc(null);
      setBudgetActionDate(getCurrentDatetimeLocal());
      setBudgetFR('');
      setBudgetFC('');
      setBudgetPR('');
      setBudgetStatus('');
      setBudgetStatusCustom('');
      setBudgetReceiveDate(getCurrentDatetimeLocal());
      setBudgetCoverDate('');
      setBudgetDocSetDate('');
    }
  }, [item, isOpen]);

  // Click outside to close status dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter documents for selection (หากค้นหาตามเลขทะเบียนรับ หรือเอกสารเข้ามาหลายรอบ ให้แสดงเฉพาะรอบล่าสุด)
  const filteredDocs = useMemo(() => {
    const rawMatches = searchDocQuery.trim() === ''
      ? documents
      : documents.filter(
          (d) =>
            d.docNo?.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
            d.receiveNo?.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
            d.agency?.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
            d.sender?.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
            d.docRef?.toLowerCase().includes(searchDocQuery.toLowerCase())
        );

    // รวมกลุ่ม/คัดกรองตามเลขทะเบียนรับ (receiveNo) หากเป็นเลขเดียวกันเข้ามาหลายรอบ ให้แสดงเฉพาะรอบล่าสุด
    const recvMap = new Map<string, DocumentItem>();
    const deduplicated: DocumentItem[] = [];

    for (const d of rawMatches) {
      const recv = (d.receiveNo || '').trim();
      if (recv) {
        if (!recvMap.has(recv)) {
          recvMap.set(recv, d);
          deduplicated.push(d);
        } else {
          const existing = recvMap.get(recv)!;
          const existingRound = existing.round || 0;
          const curRound = d.round || 0;
          const existingRow = Number(existing.rowId) || 0;
          const curRow = Number(d.rowId) || 0;

          if (curRound > existingRound || (curRound === existingRound && curRow > existingRow)) {
            const idx = deduplicated.indexOf(existing);
            if (idx !== -1) {
              deduplicated[idx] = d;
            }
            recvMap.set(recv, d);
          }
        }
      } else {
        deduplicated.push(d);
      }
    }

    return deduplicated.slice(0, 15);
  }, [documents, searchDocQuery]);

  // Filtered status options based on search query
  const filteredStatusOptions = useMemo(() => {
    return BUDGET_STATUS_OPTIONS.filter((opt) =>
      opt.toLowerCase().includes(statusSearchText.toLowerCase())
    );
  }, [statusSearchText]);

  if (!isOpen) return null;

  const handleSelectStatus = (option: string) => {
    setBudgetStatus(option);
    if (option !== 'อื่น ๆ') {
      setBudgetStatusCustom('');
    }
    setIsStatusDropdownOpen(false);
    setStatusSearchText('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) {
      setErrorMessage('กรุณาเลือกเอกสารที่ต้องการบันทึกข้อมูลงานงบประมาณ');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    // Final status value calculation
    let finalStatus = budgetStatus;
    if (budgetStatus === 'อื่น ๆ') {
      finalStatus = budgetStatusCustom.trim() || 'อื่น ๆ';
    }

    const updatedItem: DocumentItem = {
      ...selectedDoc,
      budgetActionDate: budgetActionDate ? formatToSheetDatetime(budgetActionDate) : '',
      budgetFR: budgetFR.trim(),
      budgetFC: budgetFC.trim(),
      budgetPR: budgetPR.trim(),
      budgetStatus: finalStatus.trim(),
      budgetReceiveDate: budgetReceiveDate ? formatToSheetDatetime(budgetReceiveDate) : '',
      budgetCoverDate: budgetCoverDate ? formatToSheetDate(budgetCoverDate) : '',
      budgetDocSetDate: budgetDocSetDate ? formatToSheetDate(budgetDocSetDate) : '',
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-5 sm:px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <PieChart className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2 font-['Prompt','Sarabun',sans-serif]">
                <span>บันทึกข้อมูลงานงบประมาณ</span>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                  คอลัมน์ AR:AY
                </span>
              </h2>
              <p className="text-xs text-amber-100/90 font-light">
                ระบบจัดการ จัดสรร และควบคุมงบประมาณ มหาวิทยาลัยแม่ฟ้าหลวง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/15 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Selection / Info Banner */}
        <div className="p-4 sm:p-5 bg-amber-50/60 border-b border-amber-200/80 shrink-0">
          {!selectedDoc ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                เลือกเอกสารที่ต้องการบันทึกข้อมูลงานงบประมาณ:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาด้วย เลขที่เอกสาร, ทะเบียนรับ, หน่วยงาน หรือผู้ส่ง..."
                  value={searchDocQuery}
                  onChange={(e) => {
                    setSearchDocQuery(e.target.value);
                    setIsSearchingDoc(true);
                  }}
                  onFocus={() => setIsSearchingDoc(true)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
              </div>

              {isSearchingDoc && (
                <div className="mt-2 max-h-48 overflow-y-auto bg-white rounded-xl border border-amber-200 shadow-lg divide-y divide-slate-100">
                  {filteredDocs.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      ไม่พบเอกสารที่ค้นหา
                    </div>
                  ) : (
                    filteredDocs.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setIsSearchingDoc(false);
                          setSearchDocQuery('');
                        }}
                        className="w-full text-left p-3 hover:bg-amber-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center space-x-2">
                            <span className="font-extrabold font-mono text-slate-900">
                              ทะเบียนรับ {doc.receiveNo || '-'}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-normal">
                              เลขที่ {doc.docNo || '-'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {doc.agency || doc.sender || '-'}
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                          เลือก
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="px-2.5 py-0.5 bg-amber-600 text-white rounded-md text-sm font-extrabold font-mono">
                      ทะเบียนรับ: {selectedDoc.receiveNo || '-'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono font-normal">
                      เลขที่เอกสาร: {selectedDoc.docNo || '-'}
                    </span>
                    {selectedDoc.rowId && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">
                        แถวที่ {selectedDoc.rowId}
                      </span>
                    )}
                    {selectedDoc.reviewStatus && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs">
                        สอบทาน: {selectedDoc.reviewStatus}
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
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline self-start sm:self-center cursor-pointer"
              >
                เปลี่ยนเอกสาร
              </button>
            </div>
          )}
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
              <span>บันทึกข้อมูลงานงบประมาณสำเร็จเรียบร้อย!</span>
            </div>
          )}

          <div className="bg-amber-50/30 border border-amber-200/80 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-['Prompt','Sarabun',sans-serif]">
                    กรอกข้อมูลงานงบประมาณ
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ข้อมูลจะถูกบันทึกลงใน Google Sheet คอลัมน์ AR ถึง AY
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                AR : AY
              </span>
            </div>

            {/* Section 1: การลงรับ & วันที่ดำเนินการ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* วันที่รับเอกสาร (AW) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>วันที่รับเอกสาร (คอลัมน์ AW)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setBudgetReceiveDate(getCurrentDatetimeLocal())}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-semibold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 cursor-pointer transition-colors"
                    title="ใส่วันที่และเวลาปัจจุบันอัตโนมัติ"
                  >
                    <Clock className="w-3 h-3" />
                    <span>ตอนนี้</span>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={budgetReceiveDate}
                  onChange={(e) => setBudgetReceiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* วันที่ดำเนินการ (AR) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>วันที่ดำเนินการ (คอลัมน์ AR)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setBudgetActionDate(getCurrentDatetimeLocal())}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-semibold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 cursor-pointer transition-colors"
                    title="ใส่วันที่และเวลาปัจจุบันอัตโนมัติ"
                  >
                    <Clock className="w-3 h-3" />
                    <span>ตอนนี้</span>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={budgetActionDate}
                  onChange={(e) => setBudgetActionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Section 2: เลขรหัส 10 หลัก (FR, FC, PR) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  รหัสเอกสารการเงิน / งบประมาณ (ตัวเลข 10 หลัก)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* FR (AS) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      FR (คอลัมน์ AS)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {budgetFR.length}/10
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      inputMode="numeric"
                      value={budgetFR}
                      placeholder="เช่น 1000123456"
                      onChange={(e) => setBudgetFR(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* FC (AT) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      FC (คอลัมน์ AT)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {budgetFC.length}/10
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      inputMode="numeric"
                      value={budgetFC}
                      placeholder="เช่น 2000123456"
                      onChange={(e) => setBudgetFC(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* PR (AU) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      PR (คอลัมน์ AU)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {budgetPR.length}/10
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      inputMode="numeric"
                      value={budgetPR}
                      placeholder="เช่น 3000123456"
                      onChange={(e) => setBudgetPR(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: สถานะ (AV) พร้อมตัวเลือกแบบมีไกด์พิมพ์ค้นหา */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3" ref={statusDropdownRef}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>สถานะงานงบประมาณ (คอลัมน์ AV)</span>
                </label>
                {budgetStatus && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    เลือก: {budgetStatus}
                  </span>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer text-left"
                >
                  <span className={budgetStatus ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                    {budgetStatus || '-- เลือกหรือพิมพ์ค้นหาสถานะ --'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu with Guide & Search */}
                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative p-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="พิมพ์ค้นหาสถานะ..."
                        value={statusSearchText}
                        onChange={(e) => setStatusSearchText(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {filteredStatusOptions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          ไม่พบตัวเลือกที่ตรงกัน
                        </div>
                      ) : (
                        filteredStatusOptions.map((opt) => {
                          const isSelected = budgetStatus === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectStatus(opt)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-100 text-amber-900 font-bold'
                                  : 'hover:bg-amber-50/70 text-slate-700'
                              }`}
                            >
                              <span>{opt}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ช่องกรอกข้อมูลเพิ่มเติมกรณีเลือก "อื่น ๆ" */}
              {budgetStatus === 'อื่น ๆ' && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระบุรายละเอียดสถานะอื่น ๆ:
                  </label>
                  <input
                    type="text"
                    value={budgetStatusCustom}
                    placeholder="กรอกรายละเอียดสถานะ..."
                    onChange={(e) => setBudgetStatusCustom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-amber-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Section 4: วันที่ตามใบปะหน้า (AX) และ วันที่ตามชุดเอกสาร (AY) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* วันที่ตามใบปะหน้า (AX) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>วันที่ตามใบปะหน้า (คอลัมน์ AX)</span>
                </label>
                <input
                  type="date"
                  value={budgetCoverDate}
                  onChange={(e) => setBudgetCoverDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* วันที่ตามชุดเอกสาร (AY) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                  <span>วันที่ตามชุดเอกสาร (คอลัมน์ AY)</span>
                </label>
                <input
                  type="date"
                  value={budgetDocSetDate}
                  onChange={(e) => setBudgetDocSetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <div className="mr-auto">
              {isConfirmingClear ? (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl">
                  <span className="text-xs font-bold text-rose-800">ยืนยันล้างค่าเป็นว่าง?</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedDoc) return;
                      const cleared: DocumentItem = {
                        ...selectedDoc,
                        budgetActionDate: '',
                        budgetFR: '',
                        budgetFC: '',
                        budgetPR: '',
                        budgetStatus: '',
                        budgetReceiveDate: '',
                        budgetCoverDate: '',
                        budgetDocSetDate: '',
                      };
                      setIsConfirmingClear(false);
                      await onSave(cleared);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
                  >
                    ยืนยันล้างค่าว่าง
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(true)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  title="ล้างข้อมูลงานงบประมาณที่เคยบันทึกให้เป็นค่าว่างเหมือนเดิม"
                >
                  ล้างข้อมูลเป็นค่าว่าง
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 font-['Prompt','Sarabun',sans-serif]"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลงานงบประมาณ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
