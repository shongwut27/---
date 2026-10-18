import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DocumentItem } from '../types';
import { REVIEW_PROVIDER_OPTIONS } from './ReviewRecordModal';
import {
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  FileText,
  User,
  RefreshCw,
  Search,
  ChevronDown,
  Inbox,
  CheckSquare,
  Square,
  Filter,
  Layers,
  Save,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface BatchReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  onBatchSave: (
    selectedDocIds: string[],
    receiveDate: string,
    provider: string
  ) => Promise<void> | void;
  availableProviders?: string[];
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

export const BatchReceiveModal: React.FC<BatchReceiveModalProps> = ({
  isOpen,
  onClose,
  documents = [],
  onBatchSave,
  availableProviders = [],
}) => {
  // 1.1 วันที่รับเอกสาร (ขึ้นอัตโนมัติ สามารถแก้ไขได้)
  const [receiveDate, setReceiveDate] = useState<string>('');
  // 1.2 ผู้ให้บริการ (มีปุ่มดรอปดาวน์สามารถพิมพ์ไกด์ได้)
  const [provider, setProvider] = useState<string>('');

  // ตัวกรองประเภท และการค้นหา
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyUnreceived, setOnlyUnreceived] = useState<boolean>(true);

  // รายการเอกสารที่ถูกติ๊กเลือก (ID ของเอกสาร)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ตั้งค่าวันที่รับเริ่มต้นเมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setReceiveDate(getCurrentThaiDateTime());
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // รายชื่อผู้ให้บริการ (งานสอบทาน)
  const providerOptions = REVIEW_PROVIDER_OPTIONS;

  // รายการประเภทเอกสารทั้งหมดที่มีในข้อมูล
  const docTypeOptions = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((doc) => {
      if (doc.docType && doc.docType.trim() !== '') {
        types.add(doc.docType.trim());
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b, 'th'));
  }, [documents]);

  // กรองรายการเอกสารตามประเภท, คำค้นหา, และสถานะการรับ
  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return documents.filter((doc) => {
      // กรองเฉพาะที่ยังไม่ได้รับ
      const isAlreadyReceived = Boolean(doc.reviewReceiveDate && doc.reviewReceiveDate.trim() !== '');
      if (onlyUnreceived && isAlreadyReceived) {
        return false;
      }

      // กรองตามประเภทเอกสาร
      if (typeFilter !== 'ALL' && (doc.docType || '').trim() !== typeFilter) {
        return false;
      }

      // ค้นหาตามข้อความ
      if (q) {
        const matchDocNo = (doc.docNo || '').toLowerCase().includes(q);
        const matchRecvNo = (doc.receiveNo || '').toLowerCase().includes(q);
        const matchAgency = (doc.agency || '').toLowerCase().includes(q);
        const matchSender = (doc.sender || '').toLowerCase().includes(q);
        const matchDocRef = (doc.docRef || '').toLowerCase().includes(q);
        const matchDocType = (doc.docType || '').toLowerCase().includes(q);
        if (!matchDocNo && !matchRecvNo && !matchAgency && !matchSender && !matchDocRef && !matchDocType) {
          return false;
        }
      }

      return true;
    });
  }, [documents, onlyUnreceived, typeFilter, searchQuery]);

  // สลับการเลือกทีละรายการ
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // เลือกทั้งหมดที่กำลังแสดงอยู่
  const handleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredDocuments.forEach((doc) => {
        if (doc.id) next.add(doc.id);
      });
      return next;
    });
  };

  // ยกเลิกการเลือกทั้งหมด
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // บันทึกรับเอกสารทั้งหมดที่เลือก
  const handleSave = async () => {
    if (selectedIds.size === 0) {
      setErrorMessage('กรุณาติ๊กเลือกเอกสารอย่างน้อย 1 รายการที่ต้องการบันทึกรับ');
      return;
    }
    if (!receiveDate.trim()) {
      setErrorMessage('กรุณาระบุวันที่รับเอกสาร');
      return;
    }
    if (!provider.trim()) {
      setErrorMessage('กรุณาระบุผู้ให้บริการ (งานสอบทาน) ก่อนบันทึกรับเอกสาร');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onBatchSave(Array.from(selectedIds), receiveDate.trim(), provider.trim());
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isAllVisibleSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((doc) => doc.id && selectedIds.has(doc.id));

  return (
    <div
      id="batch-receive-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="batch-receive-modal-container"
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-600 via-pink-700 to-rose-700 text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Prompt','Sarabun',sans-serif] tracking-tight">
                บันทึกรับเอกสารหลายชุดพร้อมกัน (งานสอบทาน)
              </h3>
              <p className="text-xs text-pink-100 font-light">
                กรอกประเภท ติ๊กเลือกชุดที่ได้รับ กรอกผู้ให้บริการช่องเดียว แล้วกดบันทึกเข้า Google Sheet พร้อมกัน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Controls: Common Receipt Info (1.1 วันที่รับ & 1.2 ผู้ให้บริการ) */}
        <div className="p-4 sm:p-5 bg-pink-50/50 border-b border-pink-100 space-y-4">
          <div className="bg-white rounded-2xl border-2 border-pink-200 p-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-pink-100">
              <Layers className="w-4 h-4 text-pink-600" />
              <span className="text-xs font-bold text-pink-900 font-['Prompt','Sarabun',sans-serif]">
                ข้อมูลการรับเอกสารที่จะนำไปบันทึกให้กับทุกชุดที่เลือก (คอลัมน์ Y - Z)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    title="ตั้งค่าเป็นวันและเวลาปัจจุบัน"
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
                  ขึ้นมาอัตโนมัติ สามารถคลิกแก้ไขปรับปรุงวัน-เวลาได้
                </span>
              </div>

              {/* 1.2 ผู้ให้บริการ (กรอกช่องเดียว มีปุ่มดรอปดาวน์สามารถพิมพ์ไกด์ได้) */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-pink-600" />
                  <span>1.2 ผู้ให้บริการ (กรอกช่องเดียวใช้ทุกชุดที่เลือก)</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <SearchableCombobox
                  value={provider}
                  onChange={(val) => setProvider(val)}
                  options={providerOptions}
                  placeholder="เลือกผู้ให้บริการ หรือพิมพ์ค้นหา/ระบุชื่อ..."
                />
                <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
                  * บังคับระบุผู้ให้บริการ (เลือกจากดรอปดาวน์ หรือพิมพ์ค้นหา/ระบุชื่อ)
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar: กรองประเภทเอกสาร + ช่องค้นหา + ตัวสลับสถานะ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* กรองประเภทเอกสาร */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                กรองประเภทเอกสาร:
              </label>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all appearance-none pr-8 cursor-pointer"
                >
                  <option value="ALL">-- ทุกประเภทเอกสาร ({documents.length}) --</option>
                  {docTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* ค้นหาด่วน */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ค้นหาเอกสาร:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาเลขที่, ทะเบียน, หน่วยงาน..."
                  className="w-full px-3 py-2 pl-8 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* สลับตัวกรองสถานะการรับ */}
            <div className="flex flex-col justify-end">
              <span className="text-xs font-bold text-slate-700 block mb-1">
                แสดงรายการ:
              </span>
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setOnlyUnreceived(true)}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center truncate ${
                    onlyUnreceived
                      ? 'bg-white text-pink-800 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เฉพาะที่ยังไม่ได้รับ
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyUnreceived(false)}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center truncate ${
                    !onlyUnreceived
                      ? 'bg-white text-pink-800 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Document Selection List & Header */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isAllVisibleSelected ? handleDeselectAll : handleSelectAllVisible}
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-pink-700 cursor-pointer"
            >
              {isAllVisibleSelected ? (
                <CheckSquare className="w-4 h-4 text-pink-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllVisibleSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดง'}
              </span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              พบ {filteredDocuments.length} รายการ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600">
              เลือกแล้ว:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              selectedIds.size > 0
                ? 'bg-pink-600 text-white shadow-2xs'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {selectedIds.size} รายการ
            </span>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[11px] text-slate-500 hover:text-rose-600 underline cursor-pointer ml-1"
              >
                ล้างการเลือก
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Document List */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-2">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => {
              const isSelected = doc.id ? selectedIds.has(doc.id) : false;
              const hasReceived = Boolean(doc.reviewReceiveDate && doc.reviewReceiveDate.trim() !== '');

              return (
                <div
                  key={doc.id || `doc-row-${doc.rowId}`}
                  onClick={() => doc.id && toggleSelect(doc.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-pink-50/80 border-pink-400 ring-2 ring-pink-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="pt-0.5 sm:pt-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-pink-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0 hover:text-slate-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold font-mono text-sm text-pink-900 bg-pink-100/70 px-2 py-0.5 rounded-md border border-pink-200">
                          ทะเบียน {doc.receiveNo || '-'}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          เลขที่ {doc.docNo || '-'}
                        </span>
                        {doc.docType && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.docType}
                          </span>
                        )}
                        {hasReceived ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            รับแล้ว ({doc.reviewReceiveDate})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800">
                            ยังไม่ได้รับ
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="truncate max-w-xs">
                          {doc.agency || 'ไม่ระบุหน่วยงาน'}
                        </span>
                        {doc.sender && (
                          <span className="truncate max-w-xs text-slate-400">
                            ผู้ส่ง: {doc.sender}
                          </span>
                        )}
                        {(doc.dateReceive || doc.dateDesk) && (
                          <span className="text-slate-400 text-[11px]">
                            ธุรการส่ง: {doc.dateReceive || doc.dateDesk}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* แสดงสถานะปัจจุบัน หรือผู้ให้บริการปัจจุบัน */}
                  <div className="text-right sm:text-right text-xs shrink-0 pl-8 sm:pl-0">
                    {hasReceived ? (
                      <div className="text-slate-600">
                        <span className="text-[11px] text-slate-400 block">ผู้ให้บริการเดิม</span>
                        <span className="font-semibold text-pink-800">{doc.reviewProvider || '-'}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        พร้อมรับเอกสาร
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">ไม่พบรายการเอกสารตามเงื่อนไขที่เลือก</p>
              <p className="text-xs text-slate-400 mt-1">
                ลองสลับตัวเลือกเป็น "เอกสารทั้งหมด" หรือล้างคำค้นหา
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-slate-600 w-full sm:w-auto text-center sm:text-left">
            {selectedIds.size > 0 ? (
              <span>
                พร้อมบันทึกรับ <strong className="text-pink-700">{selectedIds.size} ชุด</strong> ให้กับผู้ให้บริการ:{' '}
                <strong className="text-slate-800">{provider.trim() || '(ไม่ระบุ)'}</strong>
              </span>
            ) : (
              <span className="text-slate-400">กรุณาติ๊กเลือกเอกสารจากรายการด้านบน</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || selectedIds.size === 0}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                isSubmitting || selectedIds.size === 0
                  ? 'bg-pink-300 cursor-not-allowed shadow-none'
                  : 'bg-pink-600 hover:bg-pink-700 active:bg-pink-800 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกลง Google Sheet...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกรับเอกสาร ({selectedIds.size} รายการ)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
