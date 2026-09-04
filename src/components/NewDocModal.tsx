import React, { useState, useEffect } from 'react';
import { DocumentItem, GroupedDocument, DepartmentType } from '../types';
import { X, PlusCircle, Calendar, Save } from 'lucide-react';

interface NewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDoc?: GroupedDocument | null; // If provided, adds a new round for this document
  currentDept: DepartmentType | 'ALL';
  onSaveNew: (item: DocumentItem) => void;
}

export const NewDocModal: React.FC<NewDocModalProps> = ({
  isOpen,
  onClose,
  targetDoc,
  currentDept,
  onSaveNew,
}) => {
  const isAddRound = Boolean(targetDoc);

  const [docNo, setDocNo] = useState('');
  const [receiveNo, setReceiveNo] = useState('');
  const [docRef, setDocRef] = useState('');
  const [agency, setAgency] = useState('');
  const [docType, setDocType] = useState('คืนเงินยืมทดรอง');
  const [sender, setSender] = useState('');
  const [phone, setPhone] = useState('');
  const [ep, setEp] = useState('');
  const [no, setNo] = useState('N');
  const [dateReceive, setDateReceive] = useState('');
  const [dateDesk, setDateDesk] = useState('');
  const [dateReturn, setDateReturn] = useState('');
  const [returnStatus, setReturnStatus] = useState('กำลังดำเนินการ');
  const [providerFinal, setProviderFinal] = useState('');
  const [department, setDepartment] = useState<DepartmentType>('งานตรวจจ่าย');
  const [note, setNote] = useState('');

  useEffect(() => {
    const nowStr = new Date().toLocaleString('th-TH');
    setDateReceive(nowStr);
    setDateDesk(nowStr);
    setDateReturn('');

    if (targetDoc) {
      const lr = targetDoc.latestRound;
      setDocNo(targetDoc.docNo);
      setReceiveNo(lr.receiveNo || '');
      setDocRef(lr.docRef || '');
      setAgency(targetDoc.agency || '');
      setDocType(targetDoc.docType || 'คืนเงินยืมทดรอง');
      setSender(lr.sender || '');
      setPhone(lr.phone || '');
      setEp(lr.ep || '');
      setNo(lr.no || 'N');
      setReturnStatus('กำลังดำเนินการ');
      setProviderFinal(lr.providerFinal || '');
      setDepartment(lr.department || 'งานตรวจจ่าย');
      setNote('');
    } else {
      setDocNo('');
      setReceiveNo('');
      setDocRef('');
      setAgency('');
      setDocType('คืนเงินยืมทดรอง');
      setSender('');
      setPhone('');
      setEp('');
      setNo('N');
      setReturnStatus('กำลังดำเนินการ');
      setProviderFinal('');
      setDepartment(currentDept !== 'ALL' ? currentDept : 'งานตรวจจ่าย');
      setNote('');
    }
  }, [targetDoc, currentDept, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNo.trim()) return;

    const newRoundNum = targetDoc ? targetDoc.totalRounds + 1 : 1;

    const newItem: DocumentItem = {
      id: `doc-new-${Date.now()}`,
      rowId: Date.now(),
      ep: ep.trim(),
      no: no.trim() || 'N',
      receiveNo: receiveNo.trim(),
      sender: sender.trim(),
      phone: phone.trim(),
      docRef: docRef.trim(),
      agency: agency.trim(),
      docNo: docNo.trim(),
      docType: docType.trim(),
      dateReceive: dateReceive.trim(),
      dateDesk: dateDesk.trim(),
      dateReturn: dateReturn.trim(),
      returnStatus: returnStatus.trim(),
      providerAuto: providerFinal.trim(),
      providerChange: '',
      providerFinal: providerFinal.trim(),
      note: note.trim(),
      subType: '',
      qa: '',
      actionDate: dateDesk.trim(),
      action: isAddRound ? 'บันทึกรอบใหม่' : 'ลงทะเบียนรับใหม่',
      status: 'รอดำเนินการ',
      editGroup: '',
      editDetail: '',
      department: department,
      round: newRoundNum,
    };

    onSaveNew(newItem);
    onClose();
  };

  const setNow = (setter: (val: string) => void) => {
    setter(new Date().toLocaleString('th-TH'));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAddRound
                  ? `เพิ่มรอบการเข้า-ออกใหม่ (ครั้งที่ ${targetDoc ? targetDoc.totalRounds + 1 : 2})`
                  : 'ลงทะเบียนรับเอกสารใหม่'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {isAddRound ? `เลขที่เอกสาร: ${targetDoc?.docNo}` : 'บันทึกเข้า Google Sheets (DATA)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4 text-xs">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขที่เอกสาร <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  readOnly={isAddRound}
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  placeholder="เช่น 6910006216"
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    isAddRound ? 'bg-slate-100 text-slate-700 font-bold border-slate-200' : 'bg-slate-50 border-slate-200 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขทะเบียนรับ
                </label>
                <input
                  type="text"
                  value={receiveNo}
                  onChange={(e) => setReceiveNo(e.target.value)}
                  placeholder="เช่น 69070234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขที่ อว/ ชื่อ
                </label>
                <input
                  type="text"
                  value={docRef}
                  onChange={(e) => setDocRef(e.target.value)}
                  placeholder="เช่น 7714/1414"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อหน่วยงาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="เช่น สำนักวิชาวิทยาศาสตร์สุขภาพ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ประเภทเอกสาร
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="คืนเงินยืมทดรอง">คืนเงินยืมทดรอง</option>
                  <option value="ยืมเงินทดรองจ่าย">ยืมเงินทดรองจ่าย</option>
                  <option value="เบิกจ่ายตรวจรับพัสดุ">เบิกจ่ายตรวจรับพัสดุ</option>
                  <option value="เบิกสำรองจ่าย">เบิกสำรองจ่าย</option>
                  <option value="ค่าอาหารทำการนอกเวลา">ค่าอาหารทำการนอกเวลา</option>
                  <option value="สวัสดิการ">สวัสดิการ</option>
                  <option value="เบิกจ่ายทั่วไป">เบิกจ่ายทั่วไป</option>
                  <option value="งานเงินเดือน">งานเงินเดือน</option>
                  <option value="ทุนการศึกษา">ทุนการศึกษา</option>
                  <option value="หนังสือภายนอก">หนังสือภายนอก</option>
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ฝ่ายผู้ให้บริการ
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="งานตรวจจ่าย">งานตรวจจ่าย</option>
                  <option value="งานสอบทาน">งานสอบทาน</option>
                  <option value="งานการเงิน">งานการเงิน</option>
                  <option value="งานงบประมาณ">งานงบประมาณ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ผู้ให้บริการ (Final)
                </label>
                <input
                  type="text"
                  value={providerFinal}
                  onChange={(e) => setProviderFinal(e.target.value)}
                  placeholder="เช่น (8)ทรงวุฒิ, (7)ภาคินี, (S2)จิรวรรณ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-emerald-800"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ผู้ส่งเอกสาร
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="ชื่อผู้ส่ง"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  โทรศัพท์
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เบอร์โทร"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  งานธุรการ EP
                </label>
                <input
                  type="text"
                  value={ep}
                  onChange={(e) => setEp(e.target.value)}
                  placeholder="EP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  N/O
                </label>
                <input
                  type="text"
                  value={no}
                  onChange={(e) => setNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5: Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">วันที่รับ</label>
                  <button
                    type="button"
                    onClick={() => setNow(setDateReceive)}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    ตอนนี้
                  </button>
                </div>
                <input
                  type="text"
                  value={dateReceive}
                  onChange={(e) => setDateReceive(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">วันที่ลงโต๊ะ</label>
                  <button
                    type="button"
                    onClick={() => setNow(setDateDesk)}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    ตอนนี้
                  </button>
                </div>
                <input
                  type="text"
                  value={dateDesk}
                  onChange={(e) => setDateDesk(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">วันที่ส่งคืน</label>
                <input
                  type="text"
                  value={dateReturn}
                  onChange={(e) => setDateReturn(e.target.value)}
                  placeholder="ยังไม่ส่งคืน"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 6 */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                สถานะการส่งคืน
              </label>
              <select
                value={returnStatus}
                onChange={(e) => setReturnStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                <option value="ส่งต่อจ่ายทั่วไป">ส่งต่อจ่ายทั่วไป</option>
                <option value="ติดต่อรับคืน">ติดต่อรับคืน</option>
                <option value="ส่งต่อเคาท์เตอร์จ่าย">ส่งต่อเคาท์เตอร์จ่าย</option>
                <option value="ส่งคืนแล้ว">ส่งคืนแล้ว</option>
              </select>
            </div>

            {/* Row 7 */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                เหตุผล/หมายเหตุ
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAddRound ? 'บันทึกรอบใหม่' : 'ลงทะเบียนรับเอกสาร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
