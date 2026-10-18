import React from 'react';
import { GroupedDocument, DocumentItem } from '../types';
import { calculateWorkingDays } from '../utils/workingDays';
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
  PieChart,
} from 'lucide-react';

interface DocumentCardProps {
  document: GroupedDocument;
  onEdit: (item: DocumentItem) => void;
  onViewHistory: (doc: GroupedDocument) => void;
  onAddRound: (doc: GroupedDocument) => void;
  onInspect?: (item: DocumentItem) => void;
  onReview?: (item: DocumentItem) => void;
  onFinance?: (item: DocumentItem) => void;
  onBudget?: (item: DocumentItem) => void;
  currentDept?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onEdit,
  onViewHistory,
  onAddRound,
  onInspect,
  onReview,
  onFinance,
  onBudget,
  currentDept,
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

  const isInspectionDept = currentDept === 'งานตรวจจ่าย' || (!currentDept && document.department === 'งานตรวจจ่าย');
  const isReviewDept =
    currentDept === 'งานสอบทาน' ||
    (!currentDept && document.department === 'งานสอบทาน') ||
    (currentDept !== 'งานตรวจจ่าย' &&
      currentDept !== 'งานการเงิน' &&
      Boolean(lr.reviewStatus || lr.reviewActionDate || lr.reviewReceiveDate || lr.reviewProvider));
  const isFinanceDept =
    currentDept === 'งานการเงิน' ||
    (!currentDept && document.department === 'งานการเงิน') ||
    (currentDept !== 'งานตรวจจ่าย' &&
      currentDept !== 'งานสอบทาน' &&
      currentDept !== 'งานงบประมาณ' &&
      Boolean(
        lr.financePaymentType ||
        lr.financePreparer ||
        lr.disbursementDate ||
        lr.disbursementPayer ||
        lr.financeReceiveDate
      ));

  const isBudgetDept =
    currentDept === 'งานงบประมาณ' ||
    (!currentDept && document.department === 'งานงบประมาณ') ||
    (currentDept !== 'งานตรวจจ่าย' &&
      currentDept !== 'งานสอบทาน' &&
      currentDept !== 'งานการเงิน' &&
      Boolean(
        lr.budgetActionDate ||
        lr.budgetStatus ||
        lr.budgetFR ||
        lr.budgetFC ||
        lr.budgetPR ||
        lr.budgetReceiveDate
      ));

  const isRecorded = Boolean(
    (lr.subType && lr.subType.trim() !== '') ||
    (lr.qa && lr.qa.trim() !== '') ||
    (lr.actionDate && lr.actionDate.trim() !== '') ||
    (lr.action && lr.action.trim() !== '') ||
    (lr.status && lr.status.trim() !== '') ||
    (lr.editGroup && lr.editGroup.trim() !== '') ||
    (lr.editDetail && lr.editDetail.trim() !== '')
  );

  // 1. ตรวจสอบการกดรับเอกสารของงานสอบทาน (พาร์ท 1): มีวันที่รับ หรือระบุผู้ให้บริการของงานสอบทานแล้ว
  const isReviewReceived = Boolean(
    (lr.reviewReceiveDate && lr.reviewReceiveDate.trim() !== '' && lr.reviewReceiveDate.trim() !== '-') ||
    (lr.reviewProvider && lr.reviewProvider.trim() !== '' && lr.reviewProvider.trim() !== '-' && lr.reviewProvider.trim() !== 'ไม่เลือก')
  );

  // 2. สถานะการตรวจ (พาร์ท 2) จนกว่าจะบันทึกสถานะจึงจะเป็นสีเขียว (งานที่ทำเสร็จ)
  const isReviewRecorded = Boolean(lr.reviewStatus && lr.reviewStatus.trim() !== '' && lr.reviewStatus.trim() !== '-');

  // 3. สถานะของงานการเงิน
  const isFinanceCompleted = Boolean(lr.disbursementDate && lr.disbursementDate.trim() !== '');
  const isFinanceReceived = Boolean(
    (lr.financeReceiveDate && lr.financeReceiveDate.trim() !== '') ||
    (lr.financePreparer && lr.financePreparer.trim() !== '') ||
    (lr.financePaymentType && lr.financePaymentType.trim() !== '') ||
    (lr.financeActionDate && lr.financeActionDate.trim() !== '')
  );

  // 4. สถานะของงานงบประมาณ
  const isBudgetCompleted = Boolean(lr.budgetActionDate && lr.budgetActionDate.trim() !== '') || Boolean(lr.budgetStatus && lr.budgetStatus.trim() !== '');
  const isBudgetReceived = Boolean(
    (lr.budgetReceiveDate && lr.budgetReceiveDate.trim() !== '') ||
    (lr.budgetFR && lr.budgetFR.trim() !== '') ||
    (lr.budgetFC && lr.budgetFC.trim() !== '') ||
    (lr.budgetPR && lr.budgetPR.trim() !== '')
  );

  // คำนวณวันทำการงานตรวจจ่าย
  // 2.1 กรณียังไม่มีการบันทึกข้อมูล นับวันจากธุรการส่งเข้ามา (dateReceive/dateDesk) - วันที่ปัจจุบัน ไม่รวม เสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์
  // 2.2 กรณีที่มีการบันทึกข้อมูลแล้ว นับวันจากธุรการส่งเข้ามา (dateReceive/dateDesk) - วันที่ดำเนินการ (actionDate) ไม่รวม เสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์
  const startDateStr = lr.dateReceive?.trim() || lr.dateDesk?.trim();
  const endDateStr = isRecorded ? (lr.actionDate?.trim() || undefined) : undefined;
  const workingDays = calculateWorkingDays(startDateStr, endDateStr);

  // คำนวณวันทำการงานสอบทาน
  const reviewStartDateStr = lr.reviewReceiveDate?.trim() || lr.dateReceive?.trim() || lr.dateDesk?.trim();
  const reviewEndDateStr = isReviewRecorded ? (lr.reviewActionDate?.trim() || undefined) : undefined;
  const reviewWorkingDays = calculateWorkingDays(reviewStartDateStr, reviewEndDateStr);

  // คำนวณวันทำการงานการเงิน
  const financeStartDateStr = lr.financeReceiveDate?.trim() || lr.reviewActionDate?.trim() || lr.dateReceive?.trim() || lr.dateDesk?.trim();
  const financeEndDateStr = isFinanceCompleted ? (lr.disbursementDate?.trim() || undefined) : undefined;
  const financeWorkingDays = calculateWorkingDays(financeStartDateStr, financeEndDateStr);

  // คำนวณวันทำการงานงบประมาณ
  const budgetStartDateStr = lr.budgetReceiveDate?.trim() || lr.financeActionDate?.trim() || lr.reviewActionDate?.trim() || lr.dateReceive?.trim() || lr.dateDesk?.trim();
  const budgetEndDateStr = isBudgetCompleted ? (lr.budgetActionDate?.trim() || undefined) : undefined;
  const budgetWorkingDays = calculateWorkingDays(budgetStartDateStr, budgetEndDateStr);

  let cardContainerClass = 'bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
  let cardHeaderClass = 'p-3.5 border-b border-slate-100';
  let receiveNoBoxClass = 'mt-2 mb-2.5 bg-blue-50/50 border border-blue-100/80 rounded-xl p-2.5';
  let lowerSectionClass = 'p-3.5 bg-slate-50/50 flex-1 flex flex-col justify-between';
  let innerBoxClass = 'bg-white rounded-xl border border-slate-200 p-3 shadow-2xs mb-2.5';
  let inspectBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
  let reviewBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 active:bg-pink-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
  let financeBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
  let budgetBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';

  if (isInspectionDept) {
    if (isRecorded) {
      // บันทึกแล้วให้สีเขียว (สีเขียวทั้งการ์ด)
      cardContainerClass = 'bg-emerald-50 rounded-2xl border-2 border-emerald-400 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-emerald-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-emerald-100/60 border border-emerald-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-emerald-100/50 flex-1 flex flex-col justify-between border-t border-emerald-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-emerald-200 p-3 shadow-2xs mb-2.5';
      inspectBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else {
      // ยังไม่บันทึกให้สีส้ม (สีส้มทั้งการ์ด)
      cardContainerClass = 'bg-orange-50 rounded-2xl border-2 border-orange-400 shadow-sm hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-orange-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-orange-100/60 border border-orange-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-orange-100/50 flex-1 flex flex-col justify-between border-t border-orange-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-orange-200 p-3 shadow-2xs mb-2.5';
      inspectBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    }
  } else if (isReviewDept) {
    if (isReviewRecorded) {
      // 3. เอกสารที่เข้ามาแล้ว รับแล้ว บันทึกสถานะการตรวจแล้ว สีเขียว
      cardContainerClass = 'bg-emerald-50 rounded-2xl border-2 border-emerald-400 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-emerald-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-emerald-100/60 border border-emerald-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-emerald-100/50 flex-1 flex flex-col justify-between border-t border-emerald-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-emerald-200 p-3 shadow-2xs mb-2.5';
      reviewBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else if (isReviewReceived) {
      // 2. เอกสารเข้ามา กดรับเอกสารแล้ว สีส้ม
      cardContainerClass = 'bg-orange-50 rounded-2xl border-2 border-orange-400 shadow-sm hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-orange-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-orange-100/60 border border-orange-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-orange-100/50 flex-1 flex flex-col justify-between border-t border-orange-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-orange-200 p-3 shadow-2xs mb-2.5';
      reviewBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else {
      // 1. เอกสารเข้ามา ยังไม่ได้รับ การ์ดสีแดง
      cardContainerClass = 'bg-red-50 rounded-2xl border-2 border-red-500 shadow-sm hover:border-red-600 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-red-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-red-100/60 border border-red-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-red-100/50 flex-1 flex flex-col justify-between border-t border-red-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-red-200 p-3 shadow-2xs mb-2.5';
      reviewBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    }
  } else if (isFinanceDept) {
    if (isFinanceCompleted) {
      // จ่ายเงินเรียบร้อยแล้ว สีเขียว
      cardContainerClass = 'bg-emerald-50 rounded-2xl border-2 border-emerald-400 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-emerald-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-emerald-100/60 border border-emerald-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-emerald-100/50 flex-1 flex flex-col justify-between border-t border-emerald-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-emerald-200 p-3 shadow-2xs mb-2.5';
      financeBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else if (isFinanceReceived) {
      // มีการรับเอกสารหรือจัดทำแล้วแต่ยังไม่จ่ายเงิน สีส้ม
      cardContainerClass = 'bg-orange-50 rounded-2xl border-2 border-orange-400 shadow-sm hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-orange-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-orange-100/60 border border-orange-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-orange-100/50 flex-1 flex flex-col justify-between border-t border-orange-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-orange-200 p-3 shadow-2xs mb-2.5';
      financeBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else {
      // ยังไม่ได้รับเอกสารในงานการเงิน สีแดง
      cardContainerClass = 'bg-rose-50 rounded-2xl border-2 border-rose-400 shadow-sm hover:border-rose-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-rose-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-rose-100/60 border border-rose-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-rose-100/50 flex-1 flex flex-col justify-between border-t border-rose-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-rose-200 p-3 shadow-2xs mb-2.5';
      financeBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    }
  } else if (isBudgetDept) {
    if (isBudgetCompleted) {
      // ดำเนินการงบประมาณแล้ว สีเขียว
      cardContainerClass = 'bg-emerald-50 rounded-2xl border-2 border-emerald-400 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-emerald-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-emerald-100/60 border border-emerald-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-emerald-100/50 flex-1 flex flex-col justify-between border-t border-emerald-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-emerald-200 p-3 shadow-2xs mb-2.5';
      budgetBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else if (isBudgetReceived) {
      // มีการลงรับเอกสารงบประมาณแล้วแต่ยังไม่เสร็จ สีส้ม
      cardContainerClass = 'bg-orange-50 rounded-2xl border-2 border-orange-400 shadow-sm hover:border-orange-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-orange-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-orange-100/60 border border-orange-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-orange-100/50 flex-1 flex flex-col justify-between border-t border-orange-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-orange-200 p-3 shadow-2xs mb-2.5';
      budgetBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
    } else {
      // ยังไม่ได้รับเอกสารงบประมาณ สีแดง
      cardContainerClass = 'bg-rose-50 rounded-2xl border-2 border-rose-400 shadow-sm hover:border-rose-500 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden';
      cardHeaderClass = 'p-3.5 border-b border-rose-200/80';
      receiveNoBoxClass = 'mt-2 mb-2.5 bg-rose-100/60 border border-rose-200 rounded-xl p-2.5';
      lowerSectionClass = 'p-3.5 bg-rose-100/50 flex-1 flex flex-col justify-between border-t border-rose-200/60';
      innerBoxClass = 'bg-white/95 rounded-xl border border-rose-200 p-3 shadow-2xs mb-2.5';
      budgetBtnClass = 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-[\'Prompt\',\'Sarabun\',sans-serif]';
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
                  <span>บันทึกแล้ว{workingDays !== null ? ` (${workingDays} วันทำการ)` : ''}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-600 text-white shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                  <span>ยังไม่บันทึก{workingDays !== null ? ` (${workingDays} วันทำการ)` : ''}</span>
                </span>
              )
            ) : isReviewDept ? (
              isReviewRecorded ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>บันทึกสถานะแล้ว{reviewWorkingDays !== null ? ` (${reviewWorkingDays} วันทำการ)` : ''}</span>
                </span>
              ) : isReviewReceived ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-600 text-white shadow-2xs">
                  <Clock3 className="w-3.5 h-3.5 text-white" />
                  <span>รับเอกสารแล้ว{reviewWorkingDays !== null ? ` (${reviewWorkingDays} วันทำการ)` : ''}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                  <span>ยังไม่ได้รับ{reviewWorkingDays !== null ? ` (${reviewWorkingDays} วันทำการ)` : ''}</span>
                </span>
              )
            ) : isFinanceDept ? (
              isFinanceCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>จ่ายเงินแล้ว{financeWorkingDays !== null ? ` (${financeWorkingDays} วันทำการ)` : ''}</span>
                </span>
              ) : isFinanceReceived ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-600 text-white shadow-2xs">
                  <Clock3 className="w-3.5 h-3.5 text-white" />
                  <span>กำลังดำเนินการ{financeWorkingDays !== null ? ` (${financeWorkingDays} วันทำการ)` : ''}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                  <span>ยังไม่ได้รับ{financeWorkingDays !== null ? ` (${financeWorkingDays} วันทำการ)` : ''}</span>
                </span>
              )
            ) : (
              getStatusBadge(lr.returnStatus)
            )}
            {isMultiRound && (
              <button
                onClick={() => onViewHistory(document)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                title="กดเพื่อดูประวัติย้อนหลังทุกรอบ"
              >
                <History className="w-3 h-3 text-blue-600" />
                <span>{document.totalRounds} รอบ</span>
              </button>
            )}
          </div>
        </div>

        {/* 2.1 เลขทะเบียนรับ */}
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

            {/* ข้อมูลงานสอบทาน (ถ้ามี หรือถ้ากำลังเปิดดูฝ่ายงานสอบทาน) */}
            {(isReviewDept ||
              lr.reviewStatus ||
              lr.reviewReceiveDate ||
              lr.reviewProvider ||
              lr.reviewActionDate ||
              lr.reviewEditType ||
              lr.reviewEditDetail) && (
              <div className="col-span-2 pt-2.5 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-pink-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-pink-600" />
                    ข้อมูลงานสอบทาน:
                  </span>
                  {lr.reviewActionDate && (
                    <span className="font-mono text-[11px] text-slate-600 font-semibold bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                      วันดำเนินการ: {lr.reviewActionDate}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">วันที่รับ (สอบทาน)</span>
                    <span className="font-mono font-medium text-slate-800">{lr.reviewReceiveDate || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">ผู้ให้บริการ (สอบทาน)</span>
                    <span className="font-semibold text-pink-700 truncate block">{lr.reviewProvider || '-'}</span>
                  </div>
                </div>
                {(lr.reviewStatus || lr.reviewEditType) && (
                  <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                    {lr.reviewStatus && (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                          lr.reviewStatus.includes('ผ่าน')
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : lr.reviewStatus.includes('แก้ไข')
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-pink-100 text-pink-900 border-pink-300'
                        }`}
                      >
                        สถานะ: {lr.reviewStatus}
                      </span>
                    )}
                    {lr.reviewEditType && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                        แก้ไข: {lr.reviewEditType}
                      </span>
                    )}
                  </div>
                )}
                {lr.reviewEditDetail && (
                  <p className="text-[11px] text-slate-700 bg-white/90 p-2 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-800 mr-1">หมายเหตุ:</span>
                    {lr.reviewEditDetail}
                  </p>
                )}
              </div>
            )}

            {/* ข้อมูลงานการเงิน (ถ้ามี หรือถ้ากำลังเปิดดูฝ่ายงานการเงิน) */}
            {(isFinanceDept ||
              lr.financeReceiveDate ||
              lr.financePaymentType ||
              lr.financePreparer ||
              lr.financeUrgentCheck ||
              lr.financeActionDate ||
              lr.financeReviewDate ||
              lr.disbursementDate ||
              lr.disbursementPayer ||
              lr.disbursementNotifyDate ||
              lr.disbursementActivityStartDate ||
              lr.disbursementActivityEndDate ||
              lr.financeIssueDetail) && (
              <div className="col-span-2 pt-2.5 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ข้อมูลงานการเงิน:
                  </span>
                  <div className="flex items-center gap-1">
                    {(lr.reviewStatus && (lr.reviewStatus === 'ถูกต้อง/ส่งต่องานจ่ายเงิน' || lr.reviewStatus.includes('ส่งต่องานจ่ายเงิน') || lr.reviewStatus.includes('ส่งต่อจ่าย'))) ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-200 shadow-2xs">
                        ทางที่ 2: งานสอบทาน (ถูกต้อง/ส่งต่องานจ่ายเงิน)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs">
                        ทางที่ 1: ธุรการรับ (งานเบิกจ่ายเงิน)
                      </span>
                    )}
                    {lr.disbursementDate ? (
                      <span className="font-mono text-[11px] text-emerald-800 font-semibold bg-white/90 px-2 py-0.5 rounded border border-emerald-200">
                        จ่ายเงิน: {lr.disbursementDate}
                      </span>
                    ) : lr.financeActionDate ? (
                      <span className="font-mono text-[11px] text-slate-600 font-semibold bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                        ทำรายการ: {lr.financeActionDate}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">ประเภทการจ่าย</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-800">{lr.financePaymentType || '-'}</span>
                      {lr.financeUrgentCheck === 'ด่วน' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ด่วน
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">ผู้จัดทำเช็ค/โอน</span>
                    <span className="font-semibold text-emerald-700 truncate block">{lr.financePreparer || '-'}</span>
                  </div>
                </div>

                {(lr.disbursementDate || lr.disbursementPayer || lr.disbursementNotifyDate) && (
                  <div className="grid grid-cols-2 gap-2 text-xs bg-teal-50/70 p-2.5 rounded-xl border border-teal-200/70">
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium">ผู้จ่ายเงิน</span>
                      <span className="font-semibold text-teal-800">{lr.disbursementPayer || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium">แจ้งติดต่อรับเงิน</span>
                      <span className="font-mono font-medium text-slate-700">{lr.disbursementNotifyDate || '-'}</span>
                    </div>
                  </div>
                )}

                {lr.financeIssueDetail && (
                  <p className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <span className="font-semibold text-rose-900 mr-1">กรณีติดปัญหา/แก้ไข:</span>
                    {lr.financeIssueDetail}
                    {lr.financeIssueDate && <span className="ml-1 text-slate-500 font-mono">({lr.financeIssueDate})</span>}
                  </p>
                )}
              </div>
            )}

            {/* รายละเอียดการบันทึกงานงบประมาณ (AR:AY) */}
            {(lr.budgetActionDate || lr.budgetStatus || lr.budgetFR || lr.budgetFC || lr.budgetPR || lr.budgetReceiveDate || lr.budgetCoverDate || lr.budgetDocSetDate) && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <PieChart className="w-3.5 h-3.5 text-amber-600" />
                    <span>ข้อมูลงานงบประมาณ</span>
                  </span>
                  {lr.budgetStatus && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {lr.budgetStatus}
                    </span>
                  )}
                </div>

                {(lr.budgetFR || lr.budgetFC || lr.budgetPR) && (
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono bg-white/80 p-2 rounded-lg border border-amber-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">FR:</span>
                      <span className="font-semibold text-slate-800">{lr.budgetFR || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">FC:</span>
                      <span className="font-semibold text-slate-800">{lr.budgetFC || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">PR:</span>
                      <span className="font-semibold text-slate-800">{lr.budgetPR || '-'}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  {lr.budgetReceiveDate && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">วันที่รับเอกสาร:</span>
                      <span className="font-medium text-slate-800">{lr.budgetReceiveDate}</span>
                    </div>
                  )}
                  {lr.budgetActionDate && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">วันที่ดำเนินการ:</span>
                      <span className="font-medium text-slate-800">{lr.budgetActionDate}</span>
                    </div>
                  )}
                  {lr.budgetCoverDate && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">วันที่ตามใบปะหน้า:</span>
                      <span className="font-medium text-slate-800">{lr.budgetCoverDate}</span>
                    </div>
                  )}
                  {lr.budgetDocSetDate && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">วันที่ตามชุดเอกสาร:</span>
                      <span className="font-medium text-slate-800">{lr.budgetDocSetDate}</span>
                    </div>
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
          ) : isReviewDept ? (
            /* สำหรับงานสอบทาน: ขยายปุ่มบันทึกข้อมูลให้เต็มการ์ดเช่นเดียวกับงานตรวจจ่าย */
            onReview && (
              <button
                onClick={() => onReview(lr)}
                className={reviewBtnClass}
                title="บันทึกข้อมูลงานสอบทาน (การรับเอกสาร และสถานะการตรวจ)"
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>บันทึกข้อมูล</span>
              </button>
            )
          ) : isFinanceDept ? (
            /* สำหรับงานการเงิน: ขยายปุ่มบันทึกข้อมูลให้เต็มการ์ด */
            onFinance && (
              <button
                onClick={() => onFinance(lr)}
                className={financeBtnClass}
                title="บันทึกข้อมูลงานการเงิน (จัดทำเช็ค/โอนเงิน และการจ่ายเงิน)"
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>บันทึกข้อมูลงานการเงิน</span>
              </button>
            )
          ) : isBudgetDept ? (
            /* สำหรับงานงบประมาณ: ขยายปุ่มบันทึกข้อมูลให้เต็มการ์ด */
            onBudget && (
              <button
                onClick={() => onBudget(lr)}
                className={budgetBtnClass}
                title="บันทึกข้อมูลงานงบประมาณ (FR, FC, PR, สถานะ, วันที่ดำเนินการ)"
              >
                <ClipboardCheck className="w-5 h-5" />
                <span>บันทึกข้อมูลงานงบประมาณ</span>
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
