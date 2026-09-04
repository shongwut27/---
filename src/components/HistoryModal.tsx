import React from 'react';
import { GroupedDocument, DocumentItem } from '../types';
import {
  X,
  History,
  Building2,
  FileText,
  Calendar,
  User,
  Clock,
  Edit3,
  Plus,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Tag,
  Send,
} from 'lucide-react';

interface HistoryModalProps {
  document: GroupedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onEditRound: (item: DocumentItem) => void;
  onAddRound: (doc: GroupedDocument) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  document,
  isOpen,
  onClose,
  onEditRound,
  onAddRound,
}) => {
  if (!isOpen || !document) return null;

  const getStatusBadge = (status: string) => {
    if (!status) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          รอดำเนินการ
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
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 font-['Prompt','Sarabun',sans-serif]">
                  ประวัติการเข้า-ออกเอกสาร
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {document.totalRounds} รอบ
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                เลขที่เอกสาร: <strong className="text-slate-800 font-semibold font-mono">{document.docNo}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Overview Summary Box */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-medium">หน่วยงาน:</span>
            <span className="font-semibold text-slate-800 truncate">{document.agency || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-medium">ประเภท:</span>
            <span className="font-semibold text-slate-800 truncate">{document.docType || '-'}</span>
          </div>
        </div>

        {/* Modal Body: Timeline of Rounds */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-600 font-['Prompt','Sarabun',sans-serif] pb-1">
            เรียงลำดับจากรอบล่าสุด (บนสุด) ไปยังรอบแรก:
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-5">
            {document.rounds.map((roundItem, idx) => {
              const isLatest = idx === 0;

              return (
                <div key={`${roundItem.id || 'round'}-${roundItem.round}-${idx}`} className="relative">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      isLatest
                        ? 'border-blue-600 bg-blue-600 ring-4 ring-blue-100'
                        : 'border-slate-300 bg-slate-100'
                    }`}
                  >
                    {isLatest && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>

                  {/* Round Card */}
                  <div
                    className={`rounded-xl border p-4 transition-all ${
                      isLatest
                        ? 'bg-white border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isLatest
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          ครั้งที่ {roundItem.round} {isLatest ? '(รอบล่าสุด)' : ''}
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          {roundItem.department}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(roundItem.returnStatus)}
                        <button
                          onClick={() => {
                            onClose();
                            onEditRound(roundItem);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลรอบนี้"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Round details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-normal block text-xs">เลขทะเบียนรับ</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {roundItem.receiveNo || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-normal block text-xs">เลขที่ อว</span>
                        <span className="font-medium text-slate-800 font-mono">
                          {roundItem.docRef || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-normal block text-xs">ผู้ให้บริการ (Final)</span>
                        <span className="font-semibold text-emerald-700">
                          {roundItem.providerFinal || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-normal block text-xs">วันที่รับ</span>
                        <span className="font-medium text-slate-700">
                          {roundItem.dateReceive || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-normal block text-xs">วันที่ลงโต๊ะ</span>
                        <span className="font-medium text-slate-700">
                          {roundItem.dateDesk || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-normal block text-xs">วันที่ส่งคืน</span>
                        <span className="font-medium text-slate-700">
                          {roundItem.dateReturn || '-'}
                        </span>
                      </div>
                      {roundItem.sender && (
                        <div>
                          <span className="text-slate-500 font-normal block text-xs">ผู้ส่งเอกสาร</span>
                          <span className="font-medium text-slate-700">
                            {roundItem.sender}
                          </span>
                        </div>
                      )}
                      {roundItem.phone && (
                        <div>
                          <span className="text-slate-500 font-normal block text-xs">โทรศัพท์</span>
                          <span className="font-medium text-slate-700">
                            {roundItem.phone}
                          </span>
                        </div>
                      )}
                      {roundItem.note && (
                        <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                          <span className="text-slate-500 font-normal block text-xs">หมายเหตุ:</span>
                          <span className="text-slate-700 italic text-xs">
                            {roundItem.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onAddRound(document);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรอบการเข้า-ออกใหม่</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
