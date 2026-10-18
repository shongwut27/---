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
  Sparkles,
  RotateCcw,
  Hash,
  UserCheck,
  Layers,
  MessageSquareText,
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

// ประเภทเอกสารย่อย Options (12 ตัวเลือก)
export const SUB_TYPE_OPTIONS = [
  'งานคืนเงินกองทุุนสำรองเลี้ยงชีพ',
  'เอกสารสินเชื่อ',
  'เอกสารประกอบเงินเดือน(slip/หนังสือรับรองภาษี)',
  'งานเปิด/ปิดบัญชี/ข้อมูลหลักผู้ขาย(โควิด)',
  'เปลี่ยนแปลงผู้มีอำนาจลงนาม',
  'รายงานแสดงยอดเงินคงเหลือประจำเดือน',
  'ฝาก/ถอนเงิน',
  'ดอกเบี้ยเงินฝาก',
  'เบิกจ่ายเงินงบประมาณ/โควิด',
  'โอนเข้าบัญชีเงินเดือน',
  'งานคืนเงินกองทุนสะสมสมทบ(ทำบันทึก)',
  'งานคืนเงินกองทุนสะสมสมทบ',
];

interface SearchableComboboxProps {
  stepNumber?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  required?: boolean;
  highlightStatus?: boolean;
}

const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  stepNumber,
  label,
  value,
  onChange,
  options,
  placeholder = 'เลือกหรือพิมพ์ค้นหา...',
  id,
  required,
  highlightStatus = false,
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

  const normalize = (str: string) => str.toLowerCase().replace(/\u0E38+/g, '\u0E38');
  const filteredOptions = options.filter((opt) =>
    normalize(opt).includes(normalize(searchTerm))
  );

  const getStatusDotColor = (text: string) => {
    if (!text) return 'bg-slate-300';
    if (text.includes('แก้ไข') || text.includes('ไม่ผ่าน') || text.includes('ไม่ได้') || text.includes('ERROR')) {
      return 'bg-rose-500';
    }
    if (text.includes('ถูกต้อง')) {
      return 'bg-emerald-500';
    }
    return 'bg-blue-500';
  };

  return (
    <div className="relative" ref={wrapperRef} id={id}>
      <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs sm:text-[13px] h-5 font-['Prompt','Sarabun',sans-serif]">
        {stepNumber && (
          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono font-bold inline-flex items-center justify-center shrink-0">
            {stepNumber}
          </span>
        )}
        <span>{label}</span>
        {required && <span className="text-rose-500 font-bold">*</span>}
      </label>

      <div className="relative">
        <div
          onClick={() => {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all shadow-2xs min-h-[42px] ${
            isOpen
              ? 'border-blue-500 ring-3 ring-blue-500/15'
              : value
              ? 'border-slate-300 hover:border-blue-400'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-white'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {highlightStatus && value && (
              <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(value)}`} />
            )}
            <span className={`truncate ${value ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
              {value || placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                title="ล้างค่า"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-100">
            {/* Search Input inside Dropdown */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500 shrink-0 ml-1" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      onChange(filteredOptions[0]);
                      setIsOpen(false);
                    } else if (searchTerm.trim()) {
                      onChange(searchTerm.trim());
                      setIsOpen(false);
                    }
                  }
                }}
                placeholder="พิมพ์เพื่อค้นหาตัวเลือก..."
                className="w-full bg-transparent text-xs sm:text-sm focus:outline-none text-slate-900 placeholder-slate-400 font-normal"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="overflow-y-auto p-1.5 space-y-0.5">
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
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200/80'
                          : 'text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {highlightStatus && (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(opt)}`} />
                        )}
                        <span className="truncate">{opt}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-slate-400 text-xs">
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
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Form Fields
  const [actionDate, setActionDate] = useState<string>('');
  const [subType, setSubType] = useState<string>('');
  const [qa, setQa] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [editGroup, setEditGroup] = useState<string>('');
  const [editDetail, setEditDetail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prevOpenRef = useRef(false);
  const prevDocKeyRef = useRef<string | number | null>(null);

  // Initializing state only when modal freshly opens or selected item genuinely changes
  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }

    const currentDoc = item || (documents && documents.length > 0 ? documents[0] : null);
    const docKey = currentDoc ? `${currentDoc.id || currentDoc.rowId || currentDoc.docNo}` : null;

    if (!prevOpenRef.current || prevDocKeyRef.current !== docKey) {
      prevOpenRef.current = true;
      prevDocKeyRef.current = docKey;

      if (currentDoc) {
        setSelectedDoc(currentDoc);
        const docProvider = currentDoc.providerFinal?.trim() || currentDoc.providerAuto?.trim() || '';
        const docIsPrakaymas = docProvider.includes('ประกายมาศ');
        let initSubType = docIsPrakaymas ? (currentDoc.subType || '') : '';
        let initQa = currentDoc.qa || '';
        if (!docIsPrakaymas && !initQa && currentDoc.subType) {
          initQa = currentDoc.subType;
        }

        setActionDate(currentDoc.actionDate?.trim() || new Date().toLocaleString('th-TH'));
        setSubType(initSubType);
        setQa(initQa);
        setAction(currentDoc.action || '');
        setStatus(currentDoc.status || '');
        setEditGroup(currentDoc.editGroup || '');
        setEditDetail(currentDoc.editDetail || '');
        setErrorMessage(null);
      }
    }
  }, [isOpen, item?.id, item?.rowId]);

  if (!isOpen) return null;

  const currentProvider = selectedDoc?.providerFinal?.trim() || selectedDoc?.providerAuto?.trim() || '';
  const isPrakaymas = currentProvider.includes('ประกายมาศ');

  const handleDocSelectChange = (docNo: string) => {
    const found = documents.find((d) => d.docNo === docNo);
    if (found) {
      setSelectedDoc(found);
      const docProvider = found.providerFinal?.trim() || found.providerAuto?.trim() || '';
      const docIsPrakaymas = docProvider.includes('ประกายมาศ');
      let initSubType = docIsPrakaymas ? (found.subType || '') : '';
      let initQa = found.qa || '';
      if (!docIsPrakaymas && !initQa && found.subType) {
        initQa = found.subType;
      }

      setActionDate(found.actionDate?.trim() || new Date().toLocaleString('th-TH'));
      setSubType(initSubType);
      setQa(initQa);
      setAction(found.action || '');
      setStatus(found.status || '');
      setEditGroup(found.editGroup || '');
      setEditDetail(found.editDetail || '');
      setErrorMessage(null);
    }
  };

  const handleResetTimestamp = () => {
    setActionDate(new Date().toLocaleString('th-TH'));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    if (!actionDate.trim()) {
      setErrorMessage('กรุณากรอก "วันที่ดำเนินการ"');
      return;
    }
    if (!action.trim()) {
      setErrorMessage('กรุณาเลือกหรือระบุ "การดำเนินการ"');
      return;
    }
    if (!status.trim()) {
      setErrorMessage('กรุณาเลือกหรือระบุ "สถานะ"');
      return;
    }
    if (status.includes('แก้ไข') && !editGroup.trim()) {
      setErrorMessage('กรณีสถานะมีคำว่าแก้ไข บังคับให้เลือก "Group-กรณีแก้ไข"');
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);
    const updated: DocumentItem = {
      ...selectedDoc,
      actionDate: actionDate.trim(),
      subType: isPrakaymas ? subType.trim() : '',
      qa: qa.trim(),
      action: action.trim(),
      status: status.trim(),
      editGroup: editGroup.trim(),
      editDetail: editDetail.trim(),
    };

    setTimeout(() => {
      onSave(updated);
      setIsSaving(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Accent Strip */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-sky-400 to-blue-600 w-full" />

        {/* Executive Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-sky-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md text-amber-300 flex items-center justify-center shadow-inner shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white font-['Prompt','Sarabun',sans-serif] leading-tight">
                  บันทึกข้อมูลผลการตรวจจ่าย
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  งานตรวจจ่าย
                </span>
              </div>
              <p className="text-[11px] text-sky-200/85 font-normal mt-0.5 truncate">
                ระบุผลการดำเนินการ ระดับ QA สถานะเอกสาร และรายละเอียดการตรวจสอบ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-5 max-h-[82vh] overflow-y-auto space-y-4 text-xs sm:text-sm bg-slate-50/40">
            {/* Document Summary Ticket Card */}
            {selectedDoc && (
              <div className="bg-white border border-sky-200/90 rounded-2xl overflow-hidden shadow-xs">
                {/* Top Ticket Bar: Key Badges & Document Switcher */}
                <div className="px-3.5 py-2.5 bg-gradient-to-r from-sky-50/90 via-blue-50/50 to-white border-b border-sky-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-extrabold text-sm shadow-2xs">
                      <Hash className="w-4 h-4 text-sky-200" />
                      <span>ทะเบียนรับ: {selectedDoc.receiveNo || '-'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium text-[11px]">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>เลขที่เอกสาร: {selectedDoc.docNo || '-'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedDoc.providerFinal || selectedDoc.providerAuto || '-'}</span>
                    </span>
                  </div>

                  {documents.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px] font-semibold">สลับเอกสาร:</span>
                      <select
                        value={selectedDoc?.docNo || ''}
                        onChange={(e) => handleDocSelectChange(e.target.value)}
                        className="bg-white border border-slate-200 hover:border-blue-400 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[190px] truncate cursor-pointer shadow-2xs"
                      >
                        {documents.map((d, idx) => (
                          <option
                            key={`${d.id || d.rowId || 'doc'}-${d.docNo || d.receiveNo || idx}`}
                            value={d.docNo || d.receiveNo || String(d.rowId)}
                          >
                            {d.docNo || d.receiveNo || `แถวที่ ${d.rowId}`} - {d.agency || d.docType}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Bottom Ticket Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 px-3.5 py-2.5 bg-white text-xs">
                  <div className="py-1 sm:py-0 sm:pr-3 flex items-start gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">หน่วยงาน</span>
                      <span className="font-bold text-slate-800 truncate block" title={selectedDoc.agency}>
                        {selectedDoc.agency || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="py-1 sm:py-0 sm:px-3 flex items-start gap-2 min-w-0">
                    <Layers className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">ประเภทเอกสาร</span>
                      <span className="font-bold text-slate-800 truncate block" title={selectedDoc.docType}>
                        {selectedDoc.docType || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="py-1 sm:py-0 sm:pl-3 flex items-start gap-2 min-w-0">
                    <User className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">ผู้ส่งเอกสาร</span>
                      <span className="font-bold text-slate-800 truncate block" title={selectedDoc.sender}>
                        {selectedDoc.sender || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields Section Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-xs">
              {/* Row 1: 1. วันที่ดำเนินการ & 2. QA. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                <div>
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs sm:text-[13px] h-5 font-['Prompt','Sarabun',sans-serif]">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono font-bold inline-flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>วันที่ดำเนินการ</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="w-4 h-4 text-blue-500 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={actionDate}
                      onChange={(e) => {
                        setActionDate(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="เช่น 18/10/2569 14:25:05"
                      className="w-full pl-9 pr-24 py-2.5 bg-white border border-slate-300 hover:border-blue-400 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none transition-all shadow-2xs min-h-[42px]"
                    />
                    <button
                      type="button"
                      onClick={handleResetTimestamp}
                      className="absolute right-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 text-[10px] font-bold transition-colors cursor-pointer"
                      title="ตั้งเป็นวันและเวลาปัจจุบัน"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>เวลาปัจจุบัน</span>
                    </button>
                  </div>
                </div>

                {/* 2. QA.: Dropdown */}
                <SearchableCombobox
                  stepNumber="2"
                  label="ระดับความซับซ้อน (QA.)"
                  value={qa}
                  onChange={(val) => setQa(val)}
                  options={QA_OPTIONS}
                  placeholder="เลือกหรือพิมพ์ค้นหา QA เช่น 111..."
                  id="qa-combobox"
                />
              </div>

              {/* ประเภทเอกสารย่อย (แสดงเฉพาะผู้ให้บริการคือ ประกายมาศ) */}
              {isPrakaymas && (
                <SearchableCombobox
                  stepNumber="•"
                  label="ประเภทเอกสารย่อย (เฉพาะโต๊ะประกายมาศ)"
                  value={subType}
                  onChange={(val) => {
                    setSubType(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  options={SUB_TYPE_OPTIONS}
                  placeholder="เลือกหรือพิมพ์ค้นหาประเภทเอกสารย่อย..."
                  id="subtype-combobox"
                />
              )}

              {/* Row 2: 3. การดำเนินการ & 4. สถานะ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                <SearchableCombobox
                  stepNumber="3"
                  label="การดำเนินการ"
                  required
                  value={action}
                  onChange={(val) => {
                    setAction(val);
                    setStatus('');
                    if (errorMessage) setErrorMessage(null);
                  }}
                  options={ACTION_OPTIONS}
                  placeholder="เลือกการดำเนินการ..."
                  id="action-combobox"
                />

                <SearchableCombobox
                  stepNumber="4"
                  label="สถานะผลการตรวจ"
                  required
                  highlightStatus
                  value={status}
                  onChange={(val) => {
                    setStatus(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  options={STATUS_OPTIONS}
                  placeholder="เลือกสถานะผลการตรวจ..."
                  id="status-combobox"
                />
              </div>

              {/* Group-กรณีแก้ไข: แสดงเฉพาะกรณีเลือกสถานะที่มีคำว่า "แก้ไข" */}
              {status.includes('แก้ไข') && (
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 animate-in fade-in duration-150">
                  <SearchableCombobox
                    stepNumber="!"
                    label="Group-กรณีแก้ไข (บังคับระบุเมื่อส่งแก้ไข)"
                    required
                    value={editGroup}
                    onChange={(val) => {
                      setEditGroup(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    options={EDIT_GROUP_OPTIONS}
                    placeholder="เลือกสาเหตุการส่งแก้ไข..."
                    id="edit-group-combobox"
                  />
                </div>
              )}

              {/* 5. หมายเหตุ */}
              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs sm:text-[13px] h-5 font-['Prompt','Sarabun',sans-serif]">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono font-bold inline-flex items-center justify-center shrink-0">
                    5
                  </span>
                  <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
                  <span>หมายเหตุ / รายละเอียดเพิ่มเติม</span>
                </label>
                <textarea
                  rows={2}
                  value={editDetail}
                  onChange={(e) => setEditDetail(e.target.value)}
                  placeholder="ระบุหมายเหตุ เอกสารที่ต้องแนบเพิ่ม หรือข้อมูลที่ต้องปรับปรุง (ถ้ามี)..."
                  className="w-full px-3.5 py-2 bg-slate-50/50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 focus:outline-none transition-all shadow-2xs resize-none"
                />
              </div>
            </div>

            {/* แสดงข้อความแจ้งเตือนเมื่อยังกรอกข้อมูลบังคับไม่ครบถ้วน */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            {isConfirmingClear ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-rose-800">ยืนยันล้างค่าเป็นว่าง?</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedDoc) return;
                    const cleared: DocumentItem = {
                      ...selectedDoc,
                      actionDate: '',
                      subType: '',
                      qa: '',
                      action: '',
                      status: '',
                      editGroup: '',
                      editDetail: '',
                    };
                    setIsConfirmingClear(false);
                    onSave(cleared);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  ยืนยันล้างค่าว่าง
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
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="ล้างข้อมูลผลการตรวจจ่ายที่เคยบันทึกไว้ให้กลับเป็นค่าว่างเหมือนเดิม"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างข้อมูลเป็นค่าว่าง</span>
              </button>
            )}

            <div className="flex items-center justify-end gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 font-['Prompt','Sarabun',sans-serif]"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
