import React from 'react';
import { GroupedDocument, DocumentItem } from '../types';
import {
  Building2,
  FileText,
  User,
  Phone,
  Calendar,
  Clock,
  Send,
  Edit3,
  History,
  Plus,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock3,
  ClipboardCheck,
} from 'lucide-react';

interface DocumentCardProps {
  document: GroupedDocument;
  onEdit: (item: DocumentItem) => void;
  onViewHistory: (doc: GroupedDocument) => void;
  onAddRound: (doc: GroupedDocument) => void;
  onInspect?: (item: DocumentItem) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onEdit,
  onViewHistory,
  onAddRound,
  onInspect,
}) => {
  const lr = document.latestRound;
  const isMultiRound = document.totalRounds > 1;

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Clock3 className="w-3 h-3 text-slate-500" />
          <span>รอดำเนินการ</span>
        </span>
      );
    }
    if (status.includes('ส่งต่อจ่าย')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Send className="w-3 h-3 text-blue-600" />
          <span>{status}</span>
        </span>
      );
    }
    if (status.includes('ติดต่อรับคืน')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>{status}</span>
        </span>
      );
    }
    if (status.includes('เคาท์เตอร์')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Tag className="w-3 h-3 text-purple-600" />
          <span>{status}</span>
        </span>
      );
    }
    if (status.includes('ส่งคืน')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <span>{status}</span>
      </span>
    );
  };

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'งานตรวจจ่าย':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'งานสอบทาน':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'งานการเงิน':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'งานงบประมาณ':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const isInspectionDept = document.department === 'งานตรวจจ่าย';
  const isRecorded = Boolean(
    (lr.status && lr.status.trim() !== '') ||
    (lr.action && lr.action.trim() !== '') ||
    (lr.qa && lr.qa.trim() !== '') ||
    (lr.actionDate && lr.actionDate.trim() !== '') ||
    (lr.subType && lr.subType.trim() !== '') ||
    (lr.editGroup && lr.editGroup.trim() !== '')
  );

  let cardContainerClass = 'bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
  let cardHeaderClass = 'p-4 border-b border-slate-100';
  let receiveNoBoxClass = 'mt-2.5 mb-3 bg-blue-50/50 border border-blue-100/80 rounded-xl p-3';
  let lowerSectionClass = 'p-4 bg-slate-50/50 flex-1 flex flex-col justify-between';
  let innerBoxClass = 'bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs mb-3';
  let inspectBtnClass = 'w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-base sm:text-lg font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-all shadow-md hover:shadow-lg cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';

  if (isInspectionDept) {
    if (isRecorded) {
      // บันทึกแล้วให้สีเขียว (สีเขียวทั้งการ์ด)
      cardContainerClass = 'bg-emerald-50 rounded-2xl border-2 border-emerald-400 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-4 border-b border-emerald-200/80';
      receiveNoBoxClass = 'mt-2.5 mb-3 bg-emerald-100/60 border border-emerald-200 rounded-xl p-3';
      lowerSectionClass = 'p-4 bg-emerald-100/50 flex-1 flex flex-col justify-between border-t border-emerald-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-emerald-200 p-3.5 shadow-2xs mb-3';
      inspectBtnClass = 'w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-base sm:text-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else {
      // ยังไม่บันทึกให้สีส้ม (สีส้มทั้งการ์ด)
      cardContainerClass = 'bg-orange-50 rounded-2xl border-2 border-orange-400 shadow-sm hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-4 border-b border-orange-200/80';
      receiveNoBoxClass = 'mt-2.5 mb-3 bg-orange-100/60 border border-orange-200 rounded-xl p-3';
      lowerSectionClass = 'p-4 bg-orange-100/50 flex-1 flex flex-col justify-between border-t border-orange-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-orange-200 p-3.5 shadow-2xs mb-3';
      inspectBtnClass = 'w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-base sm:text-lg font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    }
  }

  return (
    <div className={cardContainerClass}>
      {/* Card Header */}
      <div className={cardHeaderClass}>
        {/* Top Badges Row: Dept, EP, No & Status / Round */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDeptColor(lr.department)}`}>
              {lr.department}
            </span>
            {lr.ep && (
              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                EP: {lr.ep}
              </span>
            )}
            {lr.no && (
              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {lr.no}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInspectionDept ? (
              isRecorded ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>บันทึกแล้ว</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-600 text-white shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                  <span>ยังไม่บันทึก</span>
                </span>
              )
            ) : (
              getStatusBadge(lr.returnStatus)
            )}
            {isMultiRound ? (
              <button
                onClick={() => onViewHistory(document)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                title="กดเพื่อดูประวัติย้อนหลังทุกรอบ"
              >
                <History className="w-3 h-3 text-blue-600" />
                <span>{document.totalRounds} รอบ</span>
              </button>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                รอบที่ 1
              </span>
            )}
          </div>
        </div>

        {/* 2.1 เลขทะเบียนรับ (ขอเด่นที่สุด) */}
        <div className={receiveNoBoxClass}>
          <span className="text-[11px] text-blue-700 font-medium block">
            เลขทะเบียนรับ
          </span>
          <div className="text-xl sm:text-2xl font-bold text-blue-900 font-mono tracking-tight flex items-baseline justify-between gap-2 mt-0.5">
            <span>{lr.receiveNo || 'ไม่มีเลขทะเบียนรับ'}</span>
            <span className="text-[11px] font-sans font-normal text-slate-500">
              (รอบที่ {lr.round})
            </span>
          </div>
        </div>

        {/* 2.2 หน่วยงาน / ผู้ส่ง / เบอร์โทร */}
        <div className="space-y-1.5 py-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-1.5 text-slate-800 font-medium line-clamp-1" title={lr.agency}>
            <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-500 font-normal shrink-0">หน่วยงาน:</span>
            <span className="truncate">{lr.agency || 'ไม่ระบุหน่วยงาน'}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-slate-700">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate" title={lr.sender}>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-normal shrink-0">ผู้ส่ง:</span>
              <span className="truncate">{lr.sender || '-'}</span>
            </div>
            {lr.phone && (
              <div className="flex items-center gap-1 text-slate-600 shrink-0">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-xs">{lr.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2.3 ประเภทเอกสาร / เลขที่ อว / เลขที่เอกสาร */}
        <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-normal shrink-0">ประเภท:</span>
            <span className="font-medium text-slate-800 truncate">{lr.docType || 'ไม่ระบุประเภทเอกสาร'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="truncate">
              <span className="text-slate-500 font-sans font-normal mr-1">เลขที่ อว:</span>
              <span className="font-medium text-slate-800">{lr.docRef || '-'}</span>
            </div>
            <div className="truncate">
              <span className="text-slate-500 font-sans font-normal mr-1">เลขที่เอกสาร:</span>
              <span className="font-medium text-slate-800">{lr.docNo || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.4 วันที่รับ วันที่ลงโต๊ะ วันที่ส่งคืน ผู้ให้บริการ */}
      <div className={lowerSectionClass}>
        <div className={innerBoxClass}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <span className="text-slate-500 font-normal block text-xs">วันที่รับ</span>
              <span className="font-medium text-slate-700 block">
                {lr.dateReceive || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-normal block text-xs">วันที่ลงโต๊ะ</span>
              <span className="font-medium text-slate-700 block">
                {lr.dateDesk || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-normal block text-xs">วันที่ส่งคืน</span>
              <span className="font-medium text-slate-700 block">
                {lr.dateReturn || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-normal block text-xs">ผู้ให้บริการ (Final)</span>
              <span className="font-semibold text-emerald-700 block truncate">
                {lr.providerFinal || '-'}
              </span>
            </div>

            {lr.note && (
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-normal block text-xs">หมายเหตุ</span>
                <span className="text-slate-700 text-xs line-clamp-1 italic">
                  {lr.note}
                </span>
              </div>
            )}

            {/* ผลการดำเนินการ / QA / สถานะตรวจจ่าย */}
            {(lr.action || lr.qa || lr.status || lr.subType) && (
              <div className="col-span-2 pt-2.5 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                  <span>ข้อมูลงานตรวจจ่าย:</span>
                  {lr.actionDate && <span className="font-mono text-xs text-slate-500">{lr.actionDate}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {lr.subType && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                      {lr.subType}
                    </span>
                  )}
                  {lr.qa && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200">
                      QA: {lr.qa}
                    </span>
                  )}
                  {lr.action && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
                      {lr.action}
                    </span>
                  )}
                  {lr.status && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                      {lr.status}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {isInspectionDept ? (
            /* 1. ในการ์ด เอาปุ่มแก้ไข และปุ่ม + ออก */
            /* 2. ขยายปุ่มบันทึกข้อมูลให้เต็มการดเลย */
            onInspect && (
              <button
                onClick={() => onInspect(lr)}
                className={inspectBtnClass}
                title="บันทึกข้อมูลผลการตรวจจ่าย (วันที่ดำเนินการ, ประเภทเอกสารย่อย, QA., การดำเนินการ, สถานะ, กรณีแก้ไข)"
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>บันทึกข้อมูล</span>
              </button>
            )
          ) : (
            <>
              {isMultiRound && (
                <button
                  onClick={() => onViewHistory(document)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>ดูประวัติ</span>
                </button>
              )}

              <button
                onClick={() => onEdit(lr)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>แก้ไข</span>
              </button>

              <button
                onClick={() => onAddRound(document)}
                title="บันทึกการเข้า-ออกรอบถัดไปสำหรับเอกสารฉบับนี้"
                className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
