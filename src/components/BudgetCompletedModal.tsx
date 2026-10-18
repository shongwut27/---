import React, { useState, useMemo } from 'react';
import { GroupedDocument, DocumentItem } from '../types';
import {
  X,
  Search,
  CheckCircle2,
  Calendar,
  PieChart,
  ClipboardCheck,
  Building2,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface BudgetCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: 'today' | 'this_month' | 'all';
  onSelectPeriod: (period: 'today' | 'this_month' | 'all') => void;
  todayDocs: GroupedDocument[];
  thisMonthDocs: GroupedDocument[];
  allDocs: GroupedDocument[];
  onOpenBudgetRecord: (item: DocumentItem) => void;
}

export const BudgetCompletedModal: React.FC<BudgetCompletedModalProps> = ({
  isOpen,
  onClose,
  period,
  onSelectPeriod,
  todayDocs,
  thisMonthDocs,
  allDocs,
  onOpenBudgetRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const currentList = useMemo(() => {
    if (period === 'today') return todayDocs;
    if (period === 'this_month') return thisMonthDocs;
    return allDocs;
  }, [period, todayDocs, thisMonthDocs, allDocs]);

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentList;

    return currentList.filter((doc) => {
      const lr = doc.latestRound;
      if (!lr) return false;
      return (
        lr.receiveNo?.toLowerCase().includes(q) ||
        lr.docNo?.toLowerCase().includes(q) ||
        lr.agency?.toLowerCase().includes(q) ||
        lr.docRef?.toLowerCase().includes(q) ||
        lr.budgetFR?.toLowerCase().includes(q) ||
        lr.budgetFC?.toLowerCase().includes(q) ||
        lr.budgetPR?.toLowerCase().includes(q) ||
        lr.budgetStatus?.toLowerCase().includes(q) ||
        lr.budgetActionDate?.toLowerCase().includes(q)
      );
    });
  }, [currentList, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden font-['Sarabun',sans-serif]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <CheckCircle2 className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-['Prompt','Sarabun',sans-serif] flex items-center gap-2 text-white">
                <span>ข้อมูลงานงบประมาณที่ทำเสร็จ</span>
              </h3>
              <p className="text-xs text-amber-100 font-light">
                ดูรายการเอกสารที่ดำเนินการเสร็จสิ้น และสามารถกดใส่/แก้ไขข้อมูลด้านงบประมาณได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => onSelectPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                period === 'today'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ข้อมูลวันนี้</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${period === 'today' ? 'bg-amber-700 text-amber-100' : 'bg-slate-300 text-slate-700'}`}>
                {todayDocs.length}
              </span>
            </button>

            <button
              onClick={() => onSelectPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                period === 'this_month'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>เดือนนี้</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${period === 'this_month' ? 'bg-amber-700 text-amber-100' : 'bg-slate-300 text-slate-700'}`}>
                {thisMonthDocs.length}
              </span>
            </button>

            <button
              onClick={() => onSelectPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Prompt','Sarabun',sans-serif] ${
                period === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>ทั้งหมด</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${period === 'all' ? 'bg-amber-700 text-amber-100' : 'bg-slate-300 text-slate-700'}`}>
                {allDocs.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขรับ, เลขหนังสือ, FR, FC, PR..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600 font-['Prompt','Sarabun',sans-serif]">
                ไม่พบรายการงานงบประมาณที่ทำเสร็จในหมวดนี้
              </p>
              {searchQuery && <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง</p>}
            </div>
          ) : (
            filteredList.map((doc) => {
              const lr = doc.latestRound;
              return (
                <div
                  key={doc.id || lr.id || lr.receiveNo}
                  className="bg-white rounded-xl border border-amber-200/80 p-3.5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                        เลขรับ: {lr.receiveNo || '-'}
                      </span>
                      {lr.docNo && (
                        <span className="text-xs font-semibold text-slate-700 font-mono">
                          เลขที่: {lr.docNo}
                        </span>
                      )}
                      {lr.budgetStatus && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {lr.budgetStatus}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate" title={lr.title}>
                      {lr.title || 'ไม่มีชื่อเรื่อง'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {lr.agency && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{lr.agency}</span>
                        </span>
                      )}
                      {lr.budgetActionDate && (
                        <span className="flex items-center gap-1 text-amber-800 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>วันที่ดำเนินการ: {lr.budgetActionDate}</span>
                        </span>
                      )}
                    </div>

                    {/* FR, FC, PR Badges */}
                    {(lr.budgetFR || lr.budgetFC || lr.budgetPR) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                        {lr.budgetFR && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800">
                            <strong className="text-slate-500 font-sans">FR:</strong> {lr.budgetFR}
                          </span>
                        )}
                        {lr.budgetFC && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800">
                            <strong className="text-slate-500 font-sans">FC:</strong> {lr.budgetFC}
                          </span>
                        )}
                        {lr.budgetPR && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800">
                            <strong className="text-slate-500 font-sans">PR:</strong> {lr.budgetPR}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button: ใส่/แก้ไขข้อมูลด้านงบประมาณ */}
                  <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBudgetRecord(lr);
                      }}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-all shadow-xs hover:shadow-sm cursor-pointer font-['Prompt','Sarabun',sans-serif]"
                      title="ใส่หรือแก้ไขข้อมูลด้านงบประมาณสำหรับเอกสารนี้"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>ใส่ข้อมูลด้านงบประมาณ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>แสดง {filteredList.length} จากทั้งหมด {currentList.length} รายการ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-medium transition-all cursor-pointer font-['Prompt','Sarabun',sans-serif]"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
