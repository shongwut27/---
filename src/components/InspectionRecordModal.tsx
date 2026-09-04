import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem } from '../types';
import {
  X,
  Save,
  Check,
  ChevronDown,
  Clock,
  ClipboardCheck,
  Search,
  FileText,
  AlertCircle,
  Building2,
  User,
} from 'lucide-react';

// QA Options (45 ตัวเลือก)
export const QA_OPTIONS = [
  '111-มูลค่าต่ำ-S-รายการน้อย',
  '112-มูลค่าต่ำ-S-รายการพอได้',
  '113-มูลค่าต่ำ-S-รายการเยอะมาก',
  '121-มูลค่าต่ำ-M-รายการน้อย',
  '122-มูลค่าต่ำ-M-รายการพอได้',
  '123-มูลค่าต่ำ-M-รายการเยอะมาก',
  '131-มูลค่าต่ำ-L-รายการน้อย',
  '132-มูลค่าต่ำ-L-รายการพอได้',
  '133-มูลค่าต่ำ-L-รายการเยอะมาก',
  '211-มูลค่าสูง-S-รายการน้อย',
  '212-มูลค่าสูง-S-รายการพอได้',
  '213-มูลค่าสูง-S-รายการเยอะมาก',
  '221-มูลค่าสูง-M-รายการน้อย',
  '222-มูลค่าสูง-M-รายการพอได้',
  '223-มูลค่าสูง-M-รายการเยอะมาก',
  '231-มูลค่าสูง-L-รายการน้อย',
  '232-มูลค่าสูง-L-รายการพอได้',
  '233-มูลค่าสูง-L-รายการเยอะมาก',
  '311-มูลค่าสูงมาก-S-รายการน้อย',
  '312-มูลค่าสูงมาก-S-รายการพอได้',
  '313-มูลค่าสูงมาก-S-รายการเยอะมาก',
  '321-มูลค่าสูงมาก-M-รายการน้อย',
  '322-มูลค่าสูงมาก-M-รายการพอได้',
  '323-มูลค่าสูงมาก-M-รายการเยอะมาก',
  '331-มูลค่าสูงมาก-L-รายการน้อย',
  '332-มูลค่าสูงมาก-L-รายการพอได้',
  '333-มูลค่าสูงมาก-L-รายการเยอะมาก',
  '411-สู๊งสูง-S-รายการน้อย',
  '412-สู๊งสูง-S-รายการพอได้',
  '413-สู๊งสูง-S-รายการเยอะมาก',
  '421-สู๊งสูง-M-รายการน้อย',
  '422-สู๊งสูง-M-รายการพอได้',
  '423-สู๊งสูง-M-รายการเยอะมาก',
  '431-สู๊งสูง-L-รายการน้อย',
  '432-สู๊งสูง-L-รายการพอได้',
  '433-สู๊งสูง-L-รายการเยอะมาก',
  '511-สูงปี๊ด-S-รายการน้อย',
  '512-สูงปี๊ด-S-รายการพอได้',
  '513-สูงปี๊ด-S-รายการเยอะมาก',
  '521-สูงปี๊ด-M-รายการน้อย',
  '522-สูงปี๊ด-M-รายการพอได้',
  '523-สูงปี๊ด-M-รายการเยอะมาก',
  '531-สูงปี๊ด-L-รายการน้อย',
  '532-สูงปี๊ด-L-รายการพอได้',
  '533-สูงปี๊ด-L-รายการเยอะมาก',
];

// การดำเนินการ Options (5 ตัวเลือก)
export const ACTION_OPTIONS = [
  'ตรวจสอบ',
  'บันทึกบัญชี',
  'จัดเตรียมเอกสาร/ทำบันทึกข้อความ',
  'บันทึกระบบ GFMIS',
  'ยังไม่ผ่านการตรวจสอบ/ไม่สามารถตรวจสอบได้',
];

// สถานะ Options (17 ตัวเลือก)
export const STATUS_OPTIONS = [
  'ถูกต้อง/ส่งต่องานงบประมาณ',
  'ถูกต้อง/ส่งต่องานจ่ายเงิน',
  'ถูกต้อง/ส่งคืน',
  'แก้ไข/ส่งคืน',
  'ถูกต้อง/ส่งสอบทาน',
  'นำเสนอหัวหน้าส่วน',
  'เบิกจ่ายไม่ได้ตามระเบียบฯ',
  'ถูกต้อง/ส่งอนุมัติใบเบิกฯ',
  'ถูกต้อง/ส่งงานตรวจจ่าย',
  'ถูกต้อง/รอบันทึก/ERROR ระบบ',
  'ถูกต้อง/เก็บเข้าแฟ้ม',
  'ส่งต่อ/ส่วนบริหารงานวิจัยเพื่อตรวจสอบ',
  'ถูกต้อง/ส่งงานบัญชี',
  'รับเอกสารฝากแนบเพิ่ม',
  'แก้ไข/พักเอกสารไว้ธุรการ',
  'ส่งตรวจสอบรายได้',
  'ส่งงานงบประมาณ',
];

// Group-กรณีแก้ไข Options (11 ตัวเลือก)
export const EDIT_GROUP_OPTIONS = [
  'เอกสารไม่ถูกต้อง/ไม่ครบถ้วน',
  'ไม่เป็นไปตามระเบียบ/ประกาศ/คำสั่ง',
  'ค่าใช้จ่ายไม่สอดคล้องกับงบประมาณ',
  'นำเสนอหัวหน้าส่วน',
  'โปรดเสนออนุมัติก่อน',
  'ไม่ได้ระบุช่วงเวลาขออนุมัติดำเนินการ/ระบุช่วงเวลาไม่ถูกต้อง',
  'แนบบันทึกกันเหลื่อมปี',
  'ทบทวนการเบิกจ่าย',
  'ERROR-ระบบ',
  'ส่งเอกสารผิดที่ /เอกสารอนุมัติแล้วต้องส่งเบิกจ่ายเงิน',
  'อื่น ๆ',
];

interface SearchableComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
}

const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'เลือกหรือพิมพ์ค้นหา...',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={wrapperRef} id={id}>
      <label className="block text-slate-800 font-bold mb-1.5 text-base sm:text-lg">
        {label}
      </label>

      <div className="relative">
        <div
          onClick={() => {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }}
          className="w-full px-4 py-3 bg-slate-50 hover:bg-white border border-slate-300 hover:border-sky-400 rounded-xl text-base sm:text-lg flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-sky-500 focus-within:bg-white transition-all shadow-xs min-h-[52px]"
        >
          <span className={`truncate ${value ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col text-base">
            {/* Search Input inside Dropdown */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`พิมพ์เพื่อค้นหา (${options.length} รายการ)...`}
                className="w-full bg-transparent text-base focus:outline-none text-slate-900 placeholder-slate-400 font-normal"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="overflow-y-auto p-1.5 divide-y divide-slate-100">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt === value;
                  return (
                    <button
                      key={`${opt}-${idx}`}
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer text-base ${
                        isSelected
                          ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                          : 'text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && <Check className="w-5 h-5 text-sky-600 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-slate-400 text-base">
                  ไม่พบรายการที่ตรงกับ &quot;{searchTerm}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface InspectionRecordModalProps {
  item: DocumentItem | null;
  documents?: DocumentItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: DocumentItem) => void;
}

export const InspectionRecordModal: React.FC<InspectionRecordModalProps> = ({
  item,
  documents = [],
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(item);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [actionDate, setActionDate] = useState<string>('');
  const [subType, setSubType] = useState<string>('');
  const [qa, setQa] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [editGroup, setEditGroup] = useState<string>('');
  const [editDetail, setEditDetail] = useState<string>('');

  // Initializing state whenever modal opens or selected item changes
  useEffect(() => {
    if (item) {
      setSelectedDoc(item);
      // วันที่ดำเนินการ: แสดงวันและเวลาปัจจุบันโดยอัตโนมัติ (Timestamp) สามารถแก้ไขได้
      setActionDate(item.actionDate?.trim() || new Date().toLocaleString('th-TH'));
      setSubType(item.subType || '');
      setQa(item.qa || '');
      setAction(item.action || '');
      setStatus(item.status || item.returnStatus || '');
      setEditGroup(item.editGroup || '');
      setEditDetail(item.editDetail || '');
    } else if (documents.length > 0) {
      const first = documents[0];
      setSelectedDoc(first);
      setActionDate(first.actionDate?.trim() || new Date().toLocaleString('th-TH'));
      setSubType(first.subType || '');
      setQa(first.qa || '');
      setAction(first.action || '');
      setStatus(first.status || first.returnStatus || '');
      setEditGroup(first.editGroup || '');
      setEditDetail(first.editDetail || '');
    }
  }, [item, isOpen, documents]);

  if (!isOpen) return null;

  const handleDocSelectChange = (docNo: string) => {
    const found = documents.find((d) => d.docNo === docNo);
    if (found) {
      setSelectedDoc(found);
      setActionDate(found.actionDate?.trim() || new Date().toLocaleString('th-TH'));
      setSubType(found.subType || '');
      setQa(found.qa || '');
      setAction(found.action || '');
      setStatus(found.status || found.returnStatus || '');
      setEditGroup(found.editGroup || '');
      setEditDetail(found.editDetail || '');
    }
  };

  const handleResetTimestamp = () => {
    setActionDate(new Date().toLocaleString('th-TH'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setIsSaving(true);
    const updated: DocumentItem = {
      ...selectedDoc,
      actionDate: actionDate.trim(),
      subType: subType.trim(),
      qa: qa.trim(),
      action: action.trim(),
      status: status.trim(),
      editGroup: editGroup.trim(),
      editDetail: editDetail.trim(),
      // ซิงค์สถานะการส่งคืนเพื่อให้การกรองงานที่ทำเสร็จอัปเดตทันที
      returnStatus: status.trim() || selectedDoc.returnStatus,
    };

    setTimeout(() => {
      onSave(updated);
      setIsSaving(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-sky-100 bg-sky-50/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shrink-0">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Prompt','Sarabun',sans-serif]">
                บันทึกข้อมูลผลการตรวจจ่าย (งานตรวจจ่าย)
              </h3>
              <p className="text-sm sm:text-base text-sky-800 font-medium mt-0.5">
                กรอกข้อมูลการดำเนินการ, QA, สถานะ และกรณีแก้ไขสำหรับเอกสาร
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6 text-base">
            {/* Document Info Card / Selector */}
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 font-['Prompt','Sarabun',sans-serif]">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <span>เอกสารที่บันทึกข้อมูล:</span>
                </span>

                {documents.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-sm sm:text-base font-medium">เปลี่ยนเอกสาร:</span>
                    <select
                      value={selectedDoc?.docNo || ''}
                      onChange={(e) => handleDocSelectChange(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-[280px] truncate shadow-2xs"
                    >
                      {documents.map((d, idx) => (
                        <option key={`${d.id || d.rowId || 'doc'}-${d.docNo || d.receiveNo || idx}`} value={d.docNo || d.receiveNo || String(d.rowId)}>
                          {d.docNo || d.receiveNo || `แถวที่ ${d.rowId}`} - {d.agency || d.docType}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {selectedDoc && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs sm:text-sm block font-medium">เลขที่เอกสาร</span>
                    <span className="font-mono font-bold text-slate-900 text-base sm:text-lg truncate block">
                      {selectedDoc.docNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs sm:text-sm block font-medium">เลขทะเบียนรับ</span>
                    <span className="font-mono font-bold text-slate-900 text-base sm:text-lg truncate block">
                      {selectedDoc.receiveNo || '-'}
                    </span>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-slate-500 text-xs sm:text-sm block font-medium">หน่วยงาน</span>
                    <span className="font-bold text-slate-900 text-base sm:text-lg truncate block" title={selectedDoc.agency}>
                      {selectedDoc.agency || '-'}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500 text-xs sm:text-sm block font-medium">ประเภทเอกสาร</span>
                    <span className="font-bold text-slate-900 text-base sm:text-lg truncate block">
                      {selectedDoc.docType || '-'}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500 text-xs sm:text-sm block font-medium">ผู้ให้บริการ</span>
                    <span className="font-bold text-emerald-800 text-base sm:text-lg truncate block">
                      {selectedDoc.providerFinal || selectedDoc.providerAuto || '-'}
                    </span>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-slate-500 text-xs sm:text-sm block font-medium">ผู้ส่ง</span>
                    <span className="font-bold text-slate-800 text-base sm:text-lg truncate block" title={selectedDoc.sender}>
                      {selectedDoc.sender || '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 1. วันที่ดำเนินการ (Timestamp) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-bold text-base sm:text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-600" />
                  <span>วันที่ดำเนินการ</span>
                  <span className="text-slate-400 font-normal text-xs sm:text-sm">(Timestamp ปัจจุบันอัตโนมัติ / แก้ไขได้)</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetTimestamp}
                  className="text-sm sm:text-base text-sky-600 hover:text-sky-800 hover:underline font-bold cursor-pointer"
                >
                  ใช้วัน-เวลาปัจจุบัน
                </button>
              </div>
              <input
                type="text"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                placeholder="เช่น 3/9/2569 11:30:00"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-white border border-slate-300 hover:border-sky-400 rounded-xl text-base sm:text-lg font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* 2. ประเภทเอกสารย่อย: ช่องพิมพ์ข้อความ (Text Input) */}
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-base sm:text-lg">
                ประเภทเอกสารย่อย
              </label>
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="ระบุประเภทเอกสารย่อย เช่น ค่าใช้จ่ายเดินทาง, คืนเงินยืมทดรอง, ค่าจ้างเหมา..."
                className="w-full px-4 py-3 bg-slate-50 hover:bg-white border border-slate-300 hover:border-sky-400 rounded-xl text-base sm:text-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* 3. QA.: Dropdown แบบมีไกด์พิมพ์ค้นหาได้ (45 ตัวเลือก) */}
            <SearchableCombobox
              label="QA. (45 ตัวเลือก)"
              value={qa}
              onChange={(val) => setQa(val)}
              options={QA_OPTIONS}
              placeholder="เลือกหรือพิมพ์ค้นหา QA เช่น 111, 211, มูลค่าต่ำ..."
              id="qa-combobox"
            />

            {/* 4. การดำเนินการ: Dropdown แบบมีไกด์พิมพ์ค้นหาได้ (5 ตัวเลือก) */}
            <SearchableCombobox
              label="การดำเนินการ (5 ตัวเลือก)"
              value={action}
              onChange={(val) => setAction(val)}
              options={ACTION_OPTIONS}
              placeholder="เลือกหรือพิมพ์ค้นหาการดำเนินการ เช่น ตรวจสอบ, บันทึกบัญชี..."
              id="action-combobox"
            />

            {/* 5. สถานะ: Dropdown แบบมีไกด์พิมพ์ค้นหาได้ (17 ตัวเลือก) */}
            <SearchableCombobox
              label="สถานะ (17 ตัวเลือก)"
              value={status}
              onChange={(val) => setStatus(val)}
              options={STATUS_OPTIONS}
              placeholder="เลือกหรือพิมพ์ค้นหาสถานะ เช่น ถูกต้อง/ส่งต่องานจ่ายเงิน..."
              id="status-combobox"
            />

            {/* 6. Group-กรณีแก้ไข: Dropdown แบบมีไกด์พิมพ์ค้นหาได้ (11 ตัวเลือก) */}
            <SearchableCombobox
              label="Group-กรณีแก้ไข (11 ตัวเลือก)"
              value={editGroup}
              onChange={(val) => setEditGroup(val)}
              options={EDIT_GROUP_OPTIONS}
              placeholder="เลือกหรือพิมพ์ค้นหากรณีแก้ไข เช่น เอกสารไม่ถูกต้อง..."
              id="edit-group-combobox"
            />

            {/* 7. รายละเอียดกรณีแก้ไข: ช่องพิมพ์ข้อความ (Textarea/Input) */}
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-base sm:text-lg">
                รายละเอียดกรณีแก้ไข
              </label>
              <textarea
                rows={3}
                value={editDetail}
                onChange={(e) => setEditDetail(e.target.value)}
                placeholder="ระบุรายละเอียดกรณีแก้ไข เอกสารที่ต้องแนบเพิ่ม หรือข้อมูลที่ต้องปรับปรุง..."
                className="w-full px-4 py-3 bg-slate-50 hover:bg-white border border-slate-300 hover:border-sky-400 rounded-xl text-base sm:text-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all shadow-xs resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base sm:text-lg font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-colors shadow-md cursor-pointer disabled:opacity-50 font-['Prompt','Sarabun',sans-serif]"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
