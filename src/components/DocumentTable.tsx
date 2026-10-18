import React, { useState } from 'react';
import { GroupedDocument, DocumentItem, DepartmentType } from '../types';
import { calculateWorkingDays } from '../utils/workingDays';
import {
  ClipboardCheck,
  History,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Building2,
  User,
  Phone,
  FileText,
  MousePointerClick,
  Trash2,
  X,
  UserCheck,
} from 'lucide-react';

interface DocumentTableProps {
  documents: GroupedDocument[];
  currentDept: DepartmentType | 'ALL';
  onEdit: (item: DocumentItem) => void;
  onInspect: (item: DocumentItem) => void;
  onReview?: (item: DocumentItem) => void;
  onFinance?: (item: DocumentItem) => void;
  onBudget?: (item: DocumentItem) => void;
  onClearRecord?: (
    item: DocumentItem,
    dept: DepartmentType | 'ALL',
    scope?: 'all' | 'review_status_only'
  ) => void;
  onViewHistory: (doc: GroupedDocument) => void;
  theme?: 'light' | 'dark';
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  currentDept,
  onEdit,
  onInspect,
  onReview,
  onFinance,
  onBudget,
  onClearRecord,
  onViewHistory,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);

  const hasRecordedData = (lr: DocumentItem) => {
    if (currentDept === 'งานสอบทาน') {
      return Boolean(
        (lr.reviewReceiveDate && lr.reviewReceiveDate.trim() !== '' && lr.reviewReceiveDate.trim() !== '-') ||
        (lr.reviewProvider && lr.reviewProvider.trim() !== '' && lr.reviewProvider.trim() !== '-' && lr.reviewProvider.trim() !== 'ไม่เลือก') ||
        (lr.reviewStatus && lr.reviewStatus.trim() !== '' && lr.reviewStatus.trim() !== '-')
      );
    }
    if (currentDept === 'งานการเงิน') {
      return Boolean(
        (lr.financeReceiveDate && lr.financeReceiveDate.trim() !== '') ||
        (lr.financePreparer && lr.financePreparer.trim() !== '') ||
        (lr.disbursementDate && lr.disbursementDate.trim() !== '')
      );
    }
    if (currentDept === 'งานงบประมาณ') {
      return Boolean(
        (lr.budgetActionDate && lr.budgetActionDate.trim() !== '') ||
        (lr.budgetStatus && lr.budgetStatus.trim() !== '') ||
        (lr.budgetReceiveDate && lr.budgetReceiveDate.trim() !== '') ||
        (lr.budgetFR && lr.budgetFR.trim() !== '') ||
        (lr.budgetFC && lr.budgetFC.trim() !== '') ||
        (lr.budgetPR && lr.budgetPR.trim() !== '')
      );
    }
    return Boolean(
      (lr.subType && lr.subType.trim() !== '') ||
      (lr.qa && lr.qa.trim() !== '') ||
      (lr.actionDate && lr.actionDate.trim() !== '') ||
      (lr.action && lr.action.trim() !== '') ||
      (lr.status && lr.status.trim() !== '') ||
      (lr.editGroup && lr.editGroup.trim() !== '') ||
      (lr.editDetail && lr.editDetail.trim() !== '')
    );
  };

  const handleTriggerRecord = (lr: DocumentItem) => {
    if (currentDept === 'งานสอบทาน' && onReview) {
      onReview(lr);
    } else if (currentDept === 'งานการเงิน' && onFinance) {
      onFinance(lr);
    } else if (currentDept === 'งานงบประมาณ' && onBudget) {
      onBudget(lr);
    } else {
      onInspect(lr);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').trim();
    if (!s || s === '-') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 max-w-full shadow-2xs">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="truncate">รอดำเนินการ</span>
        </span>
      );
    }
    if (s.includes('แก้ไข') || s.includes('ไม่ผ่าน') || s.includes('ไม่ได้') || s.includes('ERROR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 max-w-full shadow-2xs">
          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span className="truncate" title={s}>{s}</span>
        </span>
      );
    }
    if (s.includes('ถูกต้อง') || s.includes('เรียบร้อย') || s.includes('อนุมัติ') || s.includes('จ่ายแล้ว')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 max-w-full shadow-2xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate" title={s}>{s}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 max-w-full shadow-2xs">
        <RotateCcw className="w-3 h-3 text-sky-600 shrink-0" />
        <span className="truncate" title={s}>{s}</span>
      </span>
    );
  };

  const getWorkingDaysForDoc = (latestRound: DocumentItem) => {
    if (currentDept === 'งานสอบทาน') {
      const start = latestRound.reviewReceiveDate || latestRound.actionDate || latestRound.dateReceive;
      const end = latestRound.reviewActionDate;
      return calculateWorkingDays(start, end);
    }
    if (currentDept === 'งานการเงิน') {
      const start = latestRound.financeReceiveDate || latestRound.reviewActionDate || latestRound.dateReceive;
      const end = latestRound.disbursementDate || latestRound.financeActionDate;
      return calculateWorkingDays(start, end);
    }
    if (currentDept === 'งานงบประมาณ') {
      const start = latestRound.budgetReceiveDate || latestRound.dateReceive;
      const end = latestRound.budgetActionDate;
      return calculateWorkingDays(start, end);
    }
    return calculateWorkingDays(latestRound.dateReceive, latestRound.dateReturn || latestRound.actionDate);
  };

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0f172a] border-sky-900/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Top Hint Bar */}
      <div
        className={`px-3.5 py-2 border-b flex items-center justify-between text-[11px] ${
          isDark
            ? 'bg-[#0b1329] border-sky-900/60 text-sky-300/90'
            : 'bg-sky-50/70 border-slate-200/80 text-sky-800'
        }`}
      >
        <div className="flex items-center gap-1.5 font-medium">
          <MousePointerClick className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>คำแนะนำ: <strong className="font-bold">ดับเบิ้ลคลิกที่แถวข้อมูล</strong> หรือกดปุ่มบันทึกผลด้านหน้าเพื่อเปิดหน้าต่างบันทึกผล</span>
        </div>
        <span className="text-[10px] font-bold opacity-80">แสดง {documents.length} รายการ</span>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed text-left border-collapse text-xs">
          <thead>
            <tr
              className={`border-b font-['Prompt','Sarabun',sans-serif] text-[11px] tracking-tight ${
                isDark
                  ? 'bg-[#111e3b] border-sky-900/80 text-sky-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
              }`}
            >
              <th className="py-2.5 px-3 font-bold w-[170px] shrink-0">บันทึกผล / จัดการ</th>
              <th className="py-2.5 px-3 font-bold w-[26%]">เลขทะเบียนรับ / หน่วยงาน / ผู้ส่ง / โทร</th>
              <th className="py-2.5 px-3 font-bold w-[20%]">ประเภทเอกสาร / เลขที่ อว. / เลขที่เอกสาร</th>
              <th className="py-2.5 px-3 font-bold w-[13%]">ผู้ให้บริการ</th>
              <th className="py-2.5 px-3 font-bold w-[18%]">
                {currentDept === 'งานสอบทาน'
                  ? 'การดำเนินการ / สถานะสอบทาน'
                  : currentDept === 'งานการเงิน'
                  ? 'การดำเนินการ / สถานะการเงิน'
                  : currentDept === 'งานงบประมาณ'
                  ? 'เลขคุม / สถานะงบประมาณ'
                  : 'การดำเนินการ / สถานะ'}
              </th>
              <th className="py-2.5 px-3 font-bold w-[23%]">จัดกลุ่มแก้ไข / หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-sky-900/40' : 'divide-slate-100'}`}>
            {documents.map((doc, idx) => {
              const lr = doc.latestRound;
              const rowKey = lr?.id || `${doc.docNo}-${idx}`;
              const isRowRecorded = hasRecordedData(lr);
              const workingDays = getWorkingDaysForDoc(lr);
              const provider =
                currentDept === 'งานสอบทาน' && lr.reviewProvider?.trim()
                  ? lr.reviewProvider.trim()
                  : currentDept === 'งานการเงิน' && (lr.financePreparer?.trim() || lr.disbursementPayer?.trim())
                  ? lr.financePreparer?.trim() || lr.disbursementPayer?.trim()
                  : lr.providerFinal?.trim() || lr.providerChange?.trim() || lr.providerAuto?.trim() || '-';

              return (
                <tr
                  key={lr?.id ? `${doc.docNo || 'doc'}-${lr.id}` : `row-${idx}`}
                  onDoubleClick={() => handleTriggerRecord(lr)}
                  title="ดับเบิ้ลคลิกเพื่อเปิดหน้าต่างบันทึกผล"
                  className={`transition-colors cursor-pointer select-none ${
                    isDark ? 'hover:bg-sky-950/50' : 'hover:bg-sky-50/70'
                  }`}
                >
                  {/* 1. ปุ่มบันทึกผลไว้หน้าสุด + ล้างค่า + ลำดับ + ประวัติ/แก้ไข */}
                  <td
                    className="py-2.5 px-3 align-top"
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    {confirmClearId === rowKey && onClearRecord ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => {
                            onClearRecord(lr, currentDept, 'all');
                            setConfirmClearId(null);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs"
                          title="ยืนยันล้างข้อมูลที่บันทึกเป็นค่าว่าง"
                        >
                          <Trash2 className="w-3 h-3 shrink-0" />
                          <span>ยืนยันล้างค่า</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearId(null)}
                          className="p-1 rounded text-slate-500 hover:bg-white cursor-pointer"
                          title="ยกเลิก"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="w-5 text-[10px] font-mono text-slate-400 font-bold text-right mr-0.5 shrink-0">
                          {idx + 1}.
                        </span>
                        {currentDept === 'งานสอบทาน' && onReview ? (
                          <button
                            onClick={() => onReview(lr)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="บันทึกข้อมูลงานสอบทาน"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>บันทึกผล</span>
                          </button>
                        ) : currentDept === 'งานการเงิน' && onFinance ? (
                          <button
                            onClick={() => onFinance(lr)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="บันทึกข้อมูลงานการเงิน"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>บันทึกผล</span>
                          </button>
                        ) : currentDept === 'งานงบประมาณ' && onBudget ? (
                          <button
                            onClick={() => onBudget(lr)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="บันทึกข้อมูลงานงบประมาณ"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>บันทึกผล</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onInspect(lr)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="บันทึกผลการตรวจจ่าย"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>บันทึกผล</span>
                          </button>
                        )}

                        {isRowRecorded && onClearRecord && (
                          <button
                            type="button"
                            onClick={() => setConfirmClearId(rowKey)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                              isDark
                                ? 'border-rose-800/80 text-rose-300 hover:bg-rose-950/60'
                                : 'border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100'
                            }`}
                            title="ล้างข้อมูลที่บันทึกเป็นค่าว่างเหมือนเดิม"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => onViewHistory(doc)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                            isDark
                              ? 'border-sky-800 text-sky-300 hover:bg-sky-900/50'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                          title="ดูประวัติเอกสาร"
                        >
                          <History className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onEdit(lr)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                            isDark
                              ? 'border-sky-800 text-slate-300 hover:bg-sky-900/50'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                          title="แก้ไขข้อมูลเอกสารทั้งหมด"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* 2.1 คอลัมน์ 4 บรรทัด: เลขทะเบียนรับ / หน่วยงาน / ผู้ส่ง / โทร */}
                  <td className="py-2.5 px-3 align-top overflow-hidden">
                    {/* บรรทัด 1: เลขทะเบียนรับ (เด่น) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-md border tracking-wide shadow-2xs ${
                          isDark
                            ? 'bg-sky-950 text-sky-200 border-sky-700'
                            : 'bg-blue-50 text-blue-900 border-blue-300'
                        }`}
                        title={`เลขทะเบียนรับ: ${lr.receiveNo || '-'}`}
                      >
                        {lr.receiveNo || '-'}
                      </span>
                      {(lr.round || 1) > 1 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                          รอบ {lr.round}
                        </span>
                      )}
                    </div>

                    {/* บรรทัด 2: หน่วยงาน */}
                    <div
                      className={`font-bold text-[11px] truncate flex items-center gap-1.5 mt-1.5 ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}
                      title={`หน่วยงาน: ${doc.agency || '-'}`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{doc.agency || '-'}</span>
                    </div>

                    {/* บรรทัด 3: ผู้ส่ง */}
                    <div
                      className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate"
                      title={`ผู้ส่งเอกสาร: ${doc.sender || '-'}`}
                    >
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.sender || '-'}</span>
                    </div>

                    {/* บรรทัด 4: โทร */}
                    <div
                      className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono truncate"
                      title={`เบอร์โทรศัพท์: ${doc.phone || '-'}`}
                    >
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{doc.phone && doc.phone !== '-' ? doc.phone : '-'}</span>
                    </div>
                  </td>

                  {/* 2.2 คอลัมน์ 3 บรรทัด: ประเภทเอกสาร / เลขที่ อว. / เลขที่เอกสาร */}
                  <td className="py-2.5 px-3 align-top overflow-hidden">
                    {/* บรรทัด 1: ประเภทเอกสาร */}
                    <div
                      className={`font-bold text-[11px] truncate flex items-center gap-1.5 ${
                        isDark ? 'text-sky-200' : 'text-slate-800'
                      }`}
                      title={`ประเภทเอกสาร: ${doc.docType || '-'}`}
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{doc.docType || '-'}</span>
                      {lr.subType && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 truncate shrink-0">
                          {lr.subType}
                        </span>
                      )}
                    </div>

                    {/* บรรทัด 2: เลขที่ อว. */}
                    <div className="text-[10px] text-slate-500 font-mono mt-1.5 truncate" title={`เลขที่ อว: ${doc.docRef || '-'}`}>
                      <span className="text-slate-400">อว:</span> <span className="font-semibold text-slate-700">{doc.docRef || '-'}</span>
                    </div>

                    {/* บรรทัด 3: เลขที่เอกสาร */}
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate" title={`เลขที่เอกสาร: ${doc.docNo || '-'}`}>
                      <span className="text-slate-400">เอกสาร:</span> <span className="font-semibold text-slate-700">{doc.docNo || '-'}</span>
                    </div>
                  </td>

                  {/* 2.3 คอลัมน์: ผู้ให้บริการ */}
                  <td className="py-2.5 px-3 align-top overflow-hidden">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border truncate max-w-full ${
                          provider && provider !== '-'
                            ? isDark
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isDark
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={`ผู้ให้บริการ: ${provider}`}
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate">{provider || '-'}</span>
                      </span>
                      {workingDays !== null && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            workingDays > 3
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title={`ระยะเวลาดำเนินการ: ${workingDays} วันทำการ`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {workingDays} วัน
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2.4 คอลัมน์ 2 บรรทัด: การดำเนินการ / สถานะ */}
                  <td className="py-2.5 px-3 align-top overflow-hidden">
                    {currentDept === 'งานสอบทาน' ? (
                      <div>
                        {/* บรรทัด 1: การดำเนินการ */}
                        <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 truncate">
                          <span>{lr.reviewActionDate ? `สอบทานเมื่อ ${lr.reviewActionDate}` : 'งานสอบทาน'}</span>
                        </div>
                        {/* บรรทัด 2: สถานะ */}
                        <div className="mt-1.5">
                          {getStatusBadge(lr.reviewStatus || '')}
                        </div>
                      </div>
                    ) : currentDept === 'งานการเงิน' ? (
                      <div>
                        {/* บรรทัด 1: การดำเนินการ */}
                        <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 truncate">
                          <span>{lr.financePaymentType || 'งานการเงิน'}</span>
                          {lr.urgentCheckType && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800">
                              {lr.urgentCheckType}
                            </span>
                          )}
                        </div>
                        {/* บรรทัด 2: สถานะ */}
                        <div className="mt-1.5">
                          {getStatusBadge(
                            lr.disbursementDate
                              ? `จ่ายแล้ว (${lr.disbursementDate})`
                              : lr.financeReceiveDate
                              ? 'รับเอกสารการเงินแล้ว'
                              : ''
                          )}
                        </div>
                      </div>
                    ) : currentDept === 'งานงบประมาณ' ? (
                      <div>
                        {/* บรรทัด 1: การดำเนินการ / เลขคุม */}
                        <div className="text-[10px] font-mono text-amber-700 truncate">
                          {[
                            lr.budgetFR && `FR:${lr.budgetFR}`,
                            lr.budgetFC && `FC:${lr.budgetFC}`,
                            lr.budgetPR && `PR:${lr.budgetPR}`,
                          ]
                            .filter(Boolean)
                            .join(' | ') || '-'}
                        </div>
                        {/* บรรทัด 2: สถานะ */}
                        <div className="mt-1.5">
                          {getStatusBadge(lr.budgetStatus || '')}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* บรรทัด 1: การดำเนินการ */}
                        <div
                          className={`text-[11px] font-semibold truncate ${
                            isDark ? 'text-slate-200' : 'text-slate-700'
                          }`}
                          title={`การดำเนินการ: ${lr.action || '-'}`}
                        >
                          <span>{lr.action || '-'}</span>
                        </div>
                        {/* บรรทัด 2: สถานะ */}
                        <div className="mt-1.5">
                          {getStatusBadge(lr.status || lr.returnStatus || '')}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* 2.5 คอลัมน์: จัดกลุ่ม(Group-กรณีแก้ไข) + หมายเหตุ(หมายเหตุ_งานตรวจ) */}
                  <td className="py-2.5 px-3 align-top overflow-hidden">
                    {currentDept === 'งานสอบทาน' ? (
                      <div>
                        {/* บรรทัด 1: จัดกลุ่มแก้ไข */}
                        {lr.reviewEditType ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 truncate max-w-full">
                            <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                            <span className="truncate">{lr.reviewEditType}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                        {/* บรรทัด 2: หมายเหตุ */}
                        {lr.reviewEditDetail ? (
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-2" title={`หมายเหตุ: ${lr.reviewEditDetail}`}>
                            {lr.reviewEditDetail}
                          </div>
                        ) : null}
                      </div>
                    ) : currentDept === 'งานการเงิน' ? (
                      <div>
                        {/* บรรทัด 1: หมายเหตุไม่จ่าย */}
                        {lr.financeIssueDetail ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 truncate max-w-full">
                            <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                            <span className="truncate">{lr.financeIssueDetail}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                        {/* บรรทัด 2: หมายเหตุทั่วไป */}
                        {lr.note ? (
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-2" title={`หมายเหตุ: ${lr.note}`}>
                            {lr.note}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div>
                        {/* บรรทัด 1: Group-กรณีแก้ไข */}
                        {lr.editGroup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 truncate max-w-full">
                            <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                            <span className="truncate" title={`Group-กรณีแก้ไข: ${lr.editGroup}`}>
                              {lr.editGroup}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                        {/* บรรทัด 2: หมายเหตุ_งานตรวจ */}
                        {(lr.editDetail || lr.note) ? (
                          <div className="text-[10px] text-slate-500 mt-1 line-clamp-2" title={`หมายเหตุ: ${lr.editDetail || lr.note}`}>
                            {lr.editDetail || lr.note}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
