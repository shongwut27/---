import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem } from '../types';
import {
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  FileText,
  User,
  Phone,
  RefreshCw,
  Search,
  ChevronDown,
  Inbox,
  ClipboardList,
  Save,
  Clock,
  Sparkles,
  Info,
  Layers,
  Loader2,
} from 'lucide-react';

interface ReviewRecordModalProps {
  isOpen: boolean;
  item: DocumentItem | null;
  documents?: DocumentItem[];
  onClose: () => void;
  onSave: (updatedItem: DocumentItem, savePart?: 'receive' | 'status' | 'all') => void;
  availableProviders?: string[];
  onOpenBatchReceive?: () => void;
}

// ตัวเลือกสถานะเบื้องต้นสำหรับงานสอบทาน (สามารถพิมพ์ไกด์หรือพิมพ์ข้อความใหม่ได้)
export const REVIEW_STATUS_OPTIONS = [
  'ถูกต้อง/ส่งต่องานงบประมาณ',
  'ถูกต้อง/ส่งต่องานจ่ายเงิน',
  'ถูกต้อง/ส่งคืนเพื่อดำเนินการต่อ',
  'แก้ไข/ส่งคืน',
  'ถูกต้อง/เก็บเข้าแฟ้ม',
  'ถูกต้อง/พร้อมดำเนินการโอนพร้อมเงินเดือน',
  'แก้ไข/ส่งคืนหน่วยงาน',
  'แก้ไข/ส่งคืนงานตรวจ',
];

// ตัวเลือกประเภทแก้ไขเบื้องต้นสำหรับงานสอบทาน (จะแสดงเมื่อสถานะเป็นแก้ไข)
export const REVIEW_EDIT_TYPE_OPTIONS = [
  'เอกสารไม่ถูกต้อง/ครบถ้วน',
  'ไม่เป็นไปตามระเบียบ',
  'ค่าใช้จ่ายไม่สอดคล้องกับงบประมาณ',
  'บันทึกบัญชีไม่ถูกต้อง',
  'จัดทำใบนำเสนอ',
];

// ตัวเลือกผู้ให้บริการสำหรับงานสอบทาน
export const REVIEW_PROVIDER_OPTIONS = [
  '(C1)กาญจนา',
  '(C2)ณัฐนันท์',
  '(C3)สิริลักษ์',
  '(C4)พรพิไล',
  '(C5)ทิพาธร',
  '(S1)จารุวรรณ',
  '(ส7)ผ่องพรรณ',
  '(AR)กัณติกา',
];

// ฟังก์ชันตรวจสอบว่าเป็นหนึ่งในรายชื่อผู้ให้บริการของงานสอบทานหรือไม่
export function isReviewProviderFinal(provider?: string): boolean {
  if (!provider) return false;
  const p = provider.trim().replace(/\s+/g, '');
  return REVIEW_PROVIDER_OPTIONS.some((rp) => {
    const cleanRp = rp.trim().replace(/\s+/g, '');
    if (p === cleanRp || p.includes(cleanRp)) return true;
    const nameOnly = rp.replace(/\(.*?\)/g, '').trim();
    if (nameOnly && p === nameOnly) return true;
    return false;
  });
}

function getCurrentThaiDateTime(): string {
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const y = now.getFullYear() + 543;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
}

// Searchable Combobox Component (ดรอปดาวน์ที่พิมพ์ไกด์ค้นหาได้)
interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

const SearchableCombobox: React.FC<ComboboxProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'เลือกหรือพิมพ์ระบุ...',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 text-xs">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <button
                key={`${opt}-${idx}`}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setSearchTerm(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg hover:bg-pink-50 hover:text-pink-900 transition-colors cursor-pointer flex items-center justify-between ${
                  value === opt ? 'bg-pink-50 text-pink-900 font-bold' : 'text-slate-700 font-medium'
                }`}
              >
                <span>{opt}</span>
                {value === opt && <CheckCircle2 className="w-3.5 h-3.5 text-pink-600 shrink-0" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-slate-400 text-xs italic">
              กด Enter เพื่อใช้ "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ReviewRecordModal: React.FC<ReviewRecordModalProps> = ({
  isOpen,
  item,
  documents = [],
  onClose,
  onSave,
  availableProviders = [],
  onOpenBatchReceive,
}) => {
  // Active selected document
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(item);
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState<boolean>(false);

  // Part 1: การรับเอกสาร
  const [receiveDate, setReceiveDate] = useState<string>('');
  const [provider, setProvider] = useState<string>('');

  // Part 2: สถานะการตรวจ
  const [actionDate, setActionDate] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [editType, setEditType] = useState<string>('');
  const [editDetail, setEditDetail] = useState<string>('');

  // Success toast within modal
  const [modalNotice, setModalNotice] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);

  // ป็อปอัปแสดงสถานะระหว่างรอ และสถานะว่าบันทึกข้อมูลแล้ว
  const [savePopup, setSavePopup] = useState<{
    isOpen: boolean;
    status: 'waiting' | 'success';
    title: string;
    message: string;
    onComplete?: () => void;
  }>({
    isOpen: false,
    status: 'waiting',
    title: '',
    message: '',
  });

  const handleClosePopup = () => {
    if (savePopup.onComplete) {
      savePopup.onComplete();
    }
    setSavePopup((prev) => ({ ...prev, isOpen: false }));
  };

  // Sync selected doc when prop changes
  useEffect(() => {
    if (item) {
      setSelectedDoc(item);
    }
  }, [item]);

  // Load values from selected document
  useEffect(() => {
    if (selectedDoc) {
      // 1.1 วันที่รับเอกสาร (มาอัตโนมัติ สามารถแก้ไขได้)
      setReceiveDate(selectedDoc.reviewReceiveDate?.trim() || getCurrentThaiDateTime());
      // 1.2 ผู้ให้บริการ
      setProvider(
        selectedDoc.reviewProvider?.trim() ||
        (isReviewProviderFinal(selectedDoc.providerFinal) ? selectedDoc.providerFinal.trim() : '')
      );

      // 2.1 วันที่ดำเนินการ (มาอัตโนมัติ สามารถแก้ไขได้)
      setActionDate(selectedDoc.reviewActionDate?.trim() || getCurrentThaiDateTime());
      // 2.2 สถานะ
      setStatus(selectedDoc.reviewStatus?.trim() || '');
      // 2.3 ประเภทแก้ไข
      setEditType(selectedDoc.reviewEditType?.trim() || '');
      // 2.4 หมายเหตุ
      setEditDetail(selectedDoc.reviewEditDetail?.trim() || '');
    }
  }, [selectedDoc]);

  if (!isOpen || !selectedDoc) return null;

  // รายชื่อผู้ให้บริการสำหรับดรอปดาวน์ (งานสอบทาน)
  const providerOptions = REVIEW_PROVIDER_OPTIONS;

  // ตรวจสอบว่าเอกสารนี้เคยผ่านการกดรับเอกสารแล้วหรือไม่ (คอลัมน์ Y หรือ Z มีข้อมูล)
  const isDocumentReceived = Boolean(
    (selectedDoc.reviewReceiveDate && selectedDoc.reviewReceiveDate.trim() !== '') ||
    (selectedDoc.reviewProvider && selectedDoc.reviewProvider.trim() !== '')
  );

  // ตรวจสอบว่าเลือกสถานะเป็นแก้ไขหรือไม่ (ข้อ 2.3)
  const isEditStatus = status.trim().includes('แก้ไข');

  // บันทึกเฉพาะพาร์ท 1: การรับเอกสาร
  const handleSaveReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveDate.trim()) {
      alert('กรุณาระบุวันที่รับเอกสาร');
      return;
    }
    if (!provider.trim()) {
      alert('กรุณาระบุผู้ให้บริการ (งานสอบทาน) ก่อนบันทึกการรับเอกสาร');
      return;
    }
    const updated: DocumentItem = {
      ...selectedDoc,
      reviewReceiveDate: receiveDate.trim(),
      reviewProvider: provider.trim(),
      reviewActionDate: selectedDoc.reviewActionDate || '',
      reviewStatus: selectedDoc.reviewStatus || '',
      reviewEditType: selectedDoc.reviewEditType || '',
      reviewEditDetail: selectedDoc.reviewEditDetail || '',
    };
    setSelectedDoc(updated);

    // ป็อปอัปเด้งขึ้นมาระหว่างรอ
    setSavePopup({
      isOpen: true,
      status: 'waiting',
      title: 'กำลังบันทึกข้อมูล...',
      message: 'กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลการรับเอกสาร (พาร์ท 1)',
    });

    onSave(updated, 'receive');

    // แสดงสถานะว่าบันทึกข้อมูลแล้ว
    setTimeout(() => {
      setSavePopup({
        isOpen: true,
        status: 'success',
        title: 'บันทึกข้อมูลแล้ว',
        message: 'บันทึกข้อมูลการรับเอกสาร (พาร์ท 1) เรียบร้อยแล้ว',
        onComplete: () => {
          setSavePopup((prev) => ({ ...prev, isOpen: false }));
        },
      });
      setModalNotice('บันทึกข้อมูลการรับเอกสารเรียบร้อยแล้ว');
      setTimeout(() => setModalNotice(null), 2500);

      // ปิดป็อปอัปอัตโนมัติ
      setTimeout(() => {
        setSavePopup((prev) => (prev.status === 'success' ? { ...prev, isOpen: false } : prev));
      }, 1600);
    }, 650);
  };

  // บันทึกเฉพาะพาร์ท 2: สถานะการตรวจ
  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    // ถ้าเอกสารยังไม่ได้กดรับจะไม่สามารถ บันทึกสถานะได้ ต้องไปกดรับก่อน
    if (!isDocumentReceived) {
      alert('เอกสารนี้ยังไม่ได้กดรับ กรุณากดรับเอกสาร (พาร์ท 1) ก่อนจึงจะสามารถบันทึกสถานะได้');
      return;
    }
    if (!actionDate.trim()) {
      alert('กรุณาระบุวันที่ดำเนินการ');
      return;
    }
    if (!status.trim()) {
      alert('กรุณาเลือกหรือระบุสถานะการตรวจ');
      return;
    }
    const updated: DocumentItem = {
      ...selectedDoc,
      reviewReceiveDate: receiveDate.trim() || selectedDoc.reviewReceiveDate || '',
      reviewProvider: provider.trim() || selectedDoc.reviewProvider || '',
      reviewActionDate: actionDate.trim(),
      reviewStatus: status.trim(),
      reviewEditType: isEditStatus ? editType.trim() : '',
      reviewEditDetail: editDetail.trim(),
    };
    setSelectedDoc(updated);

    // ป็อปอัปเด้งขึ้นมาระหว่างรอ
    setSavePopup({
      isOpen: true,
      status: 'waiting',
      title: 'กำลังบันทึกข้อมูล...',
      message: 'กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลสถานะการตรวจ (พาร์ท 2)',
    });

    onSave(updated, 'status');

    // แสดงสถานะว่าบันทึกข้อมูลแล้ว
    setTimeout(() => {
      setSavePopup({
        isOpen: true,
        status: 'success',
        title: 'บันทึกข้อมูลแล้ว',
        message: 'บันทึกข้อมูลสถานะการตรวจ (พาร์ท 2) เรียบร้อยแล้ว',
        onComplete: () => {
          setSavePopup((prev) => ({ ...prev, isOpen: false }));
        },
      });
      setModalNotice('บันทึกข้อมูลสถานะการตรวจเรียบร้อยแล้ว');
      setTimeout(() => setModalNotice(null), 2500);

      // ปิดป็อปอัปอัตโนมัติ
      setTimeout(() => {
        setSavePopup((prev) => (prev.status === 'success' ? { ...prev, isOpen: false } : prev));
      }, 1600);
    }, 650);
  };

  // บันทึกทั้ง 2 พาร์ทพร้อมกัน
  const handleSaveAll = () => {
    // ถ้าเอกสารยังไม่ได้กดรับจะไม่สามารถ บันทึกสถานะได้ ต้องไปกดรับก่อน
    if (!isDocumentReceived) {
      alert('เอกสารนี้ยังไม่ได้กดรับ กรุณากดรับเอกสาร (พาร์ท 1) ก่อนจึงจะสามารถบันทึกสถานะได้');
      return;
    }
    const updated: DocumentItem = {
      ...selectedDoc,
      reviewReceiveDate: receiveDate.trim() || selectedDoc.reviewReceiveDate || '',
      reviewProvider: provider.trim() || selectedDoc.reviewProvider || '',
      reviewActionDate: actionDate.trim(),
      reviewStatus: status.trim(),
      reviewEditType: isEditStatus ? editType.trim() : '',
      reviewEditDetail: editDetail.trim(),
    };
    setSelectedDoc(updated);

    // ป็อปอัปเด้งขึ้นมาระหว่างรอ
    setSavePopup({
      isOpen: true,
      status: 'waiting',
      title: 'กำลังบันทึกข้อมูล...',
      message: 'กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลงานสอบทานทั้งหมด (พาร์ท 1 + 2)',
    });

    // แสดงสถานะว่าบันทึกข้อมูลแล้ว
    setTimeout(() => {
      setSavePopup({
        isOpen: true,
        status: 'success',
        title: 'บันทึกข้อมูลแล้ว',
        message: 'บันทึกข้อมูลงานสอบทาน (พาร์ท 1 + 2) เรียบร้อยแล้ว',
        onComplete: () => {
          setSavePopup((prev) => ({ ...prev, isOpen: false }));
          onSave(updated, 'all');
        },
      });

      // ปิดป็อปอัปอัตโนมัติและบันทึกทั้งหมด
      setTimeout(() => {
        setSavePopup({
          isOpen: false,
          status: 'success',
          title: '',
          message: '',
        });
        onSave(updated, 'all');
      }, 1600);
    }, 650);
  };

  // ค้นหาเอกสารสำหรับสลับเอกสาร
  const filteredDocs = documents.filter((d) => {
    if (!searchDocQuery) return true;
    const q = searchDocQuery.toLowerCase();
    return (
      (d.receiveNo || '').toLowerCase().includes(q) ||
      (d.docNo || '').toLowerCase().includes(q) ||
      (d.agency || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-pink-600 via-pink-700 to-rose-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-['Prompt','Sarabun',sans-serif]">
                  บันทึกข้อมูลงานสอบทาน
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30">
                  ฝ่ายงานสอบทาน
                </span>
              </div>
              <p className="text-xs text-pink-100 font-normal">
                บันทึกการรับเอกสารและสถานะการตรวจสอบ (เชื่อมโยง Google Sheet คอลัมน์ Y ถึง AD)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Notice */}
        {modalNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{modalNotice}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* Document Switcher & Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            {/* Quick Switch Dropdown */}
            {documents.length > 1 && (
              <div className="mb-3.5 pb-3 border-b border-slate-100 relative">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  สลับเลือกเอกสารที่ต้องการบันทึก:
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDocDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="truncate">
                      เลขทะเบียน: {selectedDoc.receiveNo || '-'} | เอกสาร: {selectedDoc.docNo || '-'} | {selectedDoc.agency || '-'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>

                  {isDocDropdownOpen && (
                    <div className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1 text-xs">
                      <div className="p-1.5 border-b border-slate-100">
                        <input
                          type="text"
                          value={searchDocQuery}
                          onChange={(e) => setSearchDocQuery(e.target.value)}
                          placeholder="ค้นหาเลขทะเบียน หรือเลขที่เอกสาร..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredDocs.map((d) => (
                        <button
                          key={d.id || `doc-${d.rowId}`}
                          type="button"
                          onClick={() => {
                            setSelectedDoc(d);
                            setIsDocDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-pink-50 hover:text-pink-900 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              ทะเบียน {d.receiveNo || '-'}
                            </span>
                            <span className="text-slate-500 ml-2">เลขที่ {d.docNo || '-'}</span>
                            <div className="text-[11px] text-slate-400 truncate max-w-sm">
                              {d.agency || '-'} ({d.sender || '-'})
                            </div>
                          </div>
                          {d.id === selectedDoc.id && (
                            <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-pink-50/60 border border-pink-100 rounded-xl p-3">
                <span className="text-[11px] text-pink-700 font-semibold block">
                  เลขทะเบียนรับ
                </span>
                <span className="text-xl font-bold font-mono text-pink-950 block mt-0.5">
                  {selectedDoc.receiveNo || 'ไม่มีเลขทะเบียนรับ'}
                </span>
                <span className="text-[11px] text-slate-500">
                  (รอบที่ {selectedDoc.round || 1})
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 truncate">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500">หน่วยงาน:</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {selectedDoc.agency || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500">ผู้ส่ง:</span>
                  <span className="font-medium truncate">{selectedDoc.sender || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500">เบอร์โทร:</span>
                  <span className="font-mono">{selectedDoc.phone || '-'}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 truncate">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500">เลขที่เอกสาร:</span>
                  <span className="font-normal font-mono text-slate-600 truncate">
                    {selectedDoc.docNo || '-'}
                  </span>
                </div>
                <div className="truncate text-slate-700">
                  <span className="text-slate-500 mr-1">เลขที่ อว:</span>
                  <span className="font-mono font-medium">{selectedDoc.docRef || '-'}</span>
                </div>
                <div className="truncate text-slate-700">
                  <span className="text-slate-500 mr-1">ประเภท:</span>
                  <span className="font-medium text-slate-800">{selectedDoc.docType || '-'}</span>
                </div>
              </div>
            </div>

            {/* ข้อมูลที่ส่งมาจากงานตรวจจ่าย (ถ้ามี) */}
            {(selectedDoc.qa || selectedDoc.action || selectedDoc.status) && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-600">ผลจากงานตรวจจ่าย:</span>
                {selectedDoc.qa && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-bold border border-sky-200">
                    QA: {selectedDoc.qa}
                  </span>
                )}
                {selectedDoc.action && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                    {selectedDoc.action}
                  </span>
                )}
                {selectedDoc.status && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    {selectedDoc.status}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 2 PARTS RECORDING FORM (แยกกันบันทึกนะ) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* PART 1: 1. การรับเอกสาร */}
            <form
              onSubmit={handleSaveReceive}
              className="bg-white rounded-2xl border-2 border-pink-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-pink-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-pink-900 font-['Prompt','Sarabun',sans-serif]">
                        1. การรับเอกสาร (พาร์ท 1)
                      </h4>
                      <p className="text-[11px] text-pink-600">
                        บันทึกการรับเอกสารเข้างานสอบทาน (คอลัมน์ Y - Z)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {onOpenBatchReceive && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenBatchReceive();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors cursor-pointer"
                        title="คลิกเพื่อเปิดหน้าต่างบันทึกรับเอกสารหลายชุดพร้อมกัน"
                      >
                        <Layers className="w-3 h-3" />
                        <span>รับหลายชุดพร้อมกัน</span>
                      </button>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                      พาร์ท 1
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* 1.1 วันที่รับเอกสาร (มาอัตโนมัติ สามารถแก้ไขได้) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-pink-600" />
                        <span>1.1 วันที่รับเอกสาร</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setReceiveDate(getCurrentThaiDateTime())}
                        className="inline-flex items-center gap-1 text-[11px] text-pink-600 hover:text-pink-700 font-medium cursor-pointer"
                        title="ใช้วันที่และเวลาปัจจุบัน"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>ใช้วันที่ปัจจุบัน</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={receiveDate}
                      onChange={(e) => setReceiveDate(e.target.value)}
                      placeholder="เช่น 9/9/2569 09:30:00"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      มาอัตโนมัติ สามารถคลิกแก้ไขปรับปรุงวัน-เวลาได้ตามต้องการ
                    </span>
                  </div>

                  {/* 1.2 ผู้ให้บริการ (มีปุ่มดรอปดาวน์สามารถพิมพ์ไกด์ได้) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <User className="w-3.5 h-3.5 text-pink-600" />
                      <span>1.2 ผู้ให้บริการ</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <SearchableCombobox
                      value={provider}
                      onChange={(val) => setProvider(val)}
                      options={providerOptions}
                      placeholder="เลือกผู้ให้บริการ หรือพิมพ์ค้นหา/ระบุชื่อ..."
                    />
                    <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
                      * บังคับระบุผู้ให้บริการสำหรับการรับเอกสาร
                    </span>
                  </div>
                </div>
              </div>

              {/* ปุ่มบันทึกเฉพาะพาร์ท 1 */}
              <div className="pt-4 mt-5 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 active:bg-pink-800 shadow-sm transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif]"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกเฉพาะการรับเอกสาร (พาร์ท 1)</span>
                </button>
              </div>
            </form>

            {/* PART 2: 2. สถานะการตรวจ */}
            <form
              onSubmit={handleSaveStatus}
              className={`bg-white rounded-2xl border-2 p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all ${
                !isDocumentReceived ? 'border-slate-200 bg-slate-50/50' : 'border-indigo-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      !isDocumentReceived ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900 font-['Prompt','Sarabun',sans-serif]">
                        2. สถานะการตรวจ (พาร์ท 2)
                      </h4>
                      <p className="text-[11px] text-indigo-600">
                        บันทึกผลการสอบทาน (คอลัมน์ AA - AD)
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    !isDocumentReceived ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    พาร์ท 2
                  </span>
                </div>

                {/* กล่องเตือนถ้ายังไม่ได้กดรับเอกสาร */}
                {!isDocumentReceived && (
                  <div className="mb-3.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-950">
                        ยังไม่ได้กดรับเอกสาร (ไม่สามารถบันทึกสถานะได้)
                      </span>
                      <span className="text-amber-800">
                        ต้องบันทึกการรับเอกสารในพาร์ท 1 (ด้านซ้าย) ให้เรียบร้อยก่อน จึงจะสามารถบันทึกสถานะการตรวจได้
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5">
                  {/* 2.1 วันที่ดำเนินการ (มาอัตโนมัติ สามารถแก้ไขได้) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>2.1 วันที่ดำเนินการ</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setActionDate(getCurrentThaiDateTime())}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                        title="ใช้วันที่และเวลาปัจจุบัน"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>ใช้วันที่ปัจจุบัน</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={actionDate}
                      onChange={(e) => setActionDate(e.target.value)}
                      placeholder="เช่น 9/9/2569 11:30:00"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      มาอัตโนมัติ สามารถคลิกแก้ไขปรับปรุงวัน-เวลาได้
                    </span>
                  </div>

                  {/* 2.2 สถานะ (มีปุ่มดรอปดาวน์สามารถพิมพ์ไกด์ได้) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2.2 สถานะ</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <SearchableCombobox
                      value={status}
                      onChange={(val) => setStatus(val)}
                      options={REVIEW_STATUS_OPTIONS}
                      placeholder="เลือกสถานะ หรือพิมพ์ไกด์ค้นหา..."
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      เลือกสถานะ เช่น ถูกต้อง, แก้ไข, ผ่านการสอบทาน ฯลฯ
                    </span>
                  </div>

                  {/* 2.3 ประเภทแก้ไข (เด้งขึ้นก็ต่อเมื่อเลือกสถานะเป็นแก้ไข) */}
                  {isEditStatus && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-xs font-bold text-amber-900 flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>2.3 ประเภทแก้ไข</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <SearchableCombobox
                        value={editType}
                        onChange={(val) => setEditType(val)}
                        options={REVIEW_EDIT_TYPE_OPTIONS}
                        placeholder="เลือกประเภทแก้ไข หรือพิมพ์ระบุ..."
                      />
                      <span className="text-[10px] text-amber-700 mt-0.5 block">
                        แสดงเฉพาะกรณีสถานะมีคำว่า "แก้ไข"
                      </span>
                    </div>
                  )}

                  {/* 2.4 หมายเหตุ (มีช่องให้กรอกข้อมูล) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      2.4 หมายเหตุ
                    </label>
                    <textarea
                      rows={2}
                      value={editDetail}
                      onChange={(e) => setEditDetail(e.target.value)}
                      placeholder="ระบุหมายเหตุ หรือรายละเอียดเพิ่มเติม..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* ปุ่มบันทึกเฉพาะพาร์ท 2 */}
              <div className="pt-4 mt-5 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={!isDocumentReceived}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-['Prompt','Sarabun',sans-serif] transition-all ${
                    !isDocumentReceived
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm cursor-pointer'
                  }`}
                  title={!isDocumentReceived ? 'ต้องบันทึกรับเอกสาร (พาร์ท 1) ก่อน' : 'บันทึกเฉพาะสถานะการตรวจ (พาร์ท 2)'}
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกเฉพาะสถานะการตรวจ (พาร์ท 2)</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {isConfirmingClear ? (
            <div className="flex flex-wrap items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-rose-800">เลือกรูปแบบการล้างค่า:</span>
              <button
                type="button"
                onClick={() => {
                  if (!selectedDoc) return;
                  const clearedStatusOnly: DocumentItem = {
                    ...selectedDoc,
                    reviewActionDate: '',
                    reviewStatus: '',
                    reviewEditType: '',
                    reviewEditDetail: '',
                  };
                  setIsConfirmingClear(false);
                  onSave(clearedStatusOnly, 'all');
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer"
              >
                ล้างเฉพาะพาร์ท 2 (ผลตรวจ)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedDoc) return;
                  const clearedAll: DocumentItem = {
                    ...selectedDoc,
                    reviewReceiveDate: '',
                    reviewProvider: '',
                    reviewActionDate: '',
                    reviewStatus: '',
                    reviewEditType: '',
                    reviewEditDetail: '',
                  };
                  setIsConfirmingClear(false);
                  onSave(clearedAll, 'all');
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
              >
                ล้างทั้งหมดเป็นค่าว่าง
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="ล้างข้อมูลงานสอบทานที่เคยบันทึกไว้ให้กลับเป็นค่าว่างเหมือนเดิม"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ล้างข้อมูลเป็นค่าว่าง</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={!isDocumentReceived}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold font-['Prompt','Sarabun',sans-serif] transition-colors ${
                !isDocumentReceived
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'text-white bg-slate-800 hover:bg-slate-900 active:bg-black shadow-sm cursor-pointer'
              }`}
              title={!isDocumentReceived ? 'ต้องบันทึกรับเอกสาร (พาร์ท 1) ก่อน' : 'บันทึกทั้งหมด (พาร์ท 1 + 2)'}
            >
              <Save className="w-4 h-4" />
              <span>บันทึกทั้งหมด (พาร์ท 1 + 2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ป็อปอัปแสดงสถานะระหว่างรอ และสถานะว่าบันทึกข้อมูลแล้ว */}
      {savePopup.isOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center transform transition-all animate-in zoom-in-95 duration-200">
            {savePopup.status === 'waiting' ? (
              <div className="flex flex-col items-center py-2">
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="w-18 h-18 rounded-full bg-pink-50 border-4 border-pink-100 flex items-center justify-center shadow-inner">
                    <Loader2 className="w-9 h-9 text-pink-600 animate-spin" />
                  </div>
                </div>
                <h4 className="text-xl font-black text-slate-800 font-['Prompt','Sarabun',sans-serif] mb-2">
                  {savePopup.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed px-2">
                  {savePopup.message}
                </p>
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150" />
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-300" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner ring-8 ring-emerald-50/70 animate-bounce duration-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="inline-block px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full mb-2">
                  ดำเนินการสำเร็จ
                </div>
                <h4 className="text-2xl font-black text-emerald-600 font-['Prompt','Sarabun',sans-serif] mb-1.5">
                  {savePopup.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed px-2 mb-5">
                  {savePopup.message}
                </p>
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="w-full py-2.5 px-5 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md hover:shadow-lg transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif]"
                >
                  ตกลง
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
