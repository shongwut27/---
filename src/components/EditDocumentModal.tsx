import React, { useState, useEffect } from 'react';
import { DocumentItem, DepartmentType } from '../types';
import { X, Check, Edit3, Save, Calendar, Building2, User, Phone, FileText } from 'lucide-react';

interface EditDocumentModalProps {
  item: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: DocumentItem) => void;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<DocumentItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleChange = (field: keyof DocumentItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onSave(formData as DocumentItem);
      setIsSaving(false);
      onClose();
    }, 250);
  };

  const setNow = (field: 'dateReceive' | 'dateDesk' | 'dateReturn') => {
    const nowStr = new Date().toLocaleString('th-TH');
    handleChange(field, nowStr);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แก้ไขข้อมูลเอกสาร
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                เลขที่: {formData.docNo} (รอบที่ {formData.round})
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
            {/* Row 1: Document Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขที่เอกสาร <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.docNo || ''}
                  onChange={(e) => handleChange('docNo', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขทะเบียนรับ
                </label>
                <input
                  type="text"
                  value={formData.receiveNo || ''}
                  onChange={(e) => handleChange('receiveNo', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขที่ อว/ ชื่อ
                </label>
                <input
                  type="text"
                  value={formData.docRef || ''}
                  onChange={(e) => handleChange('docRef', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Agency & Doc Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อหน่วยงาน
                </label>
                <input
                  type="text"
                  value={formData.agency || ''}
                  onChange={(e) => handleChange('agency', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ประเภทเอกสาร
                </label>
                <input
                  type="text"
                  value={formData.docType || ''}
                  onChange={(e) => handleChange('docType', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Department & Final Provider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ฝ่ายผู้ให้บริการ
                </label>
                <select
                  value={formData.department || 'งานตรวจจ่าย'}
                  onChange={(e) => handleChange('department', e.target.value as DepartmentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  value={formData.providerFinal || ''}
                  onChange={(e) => handleChange('providerFinal', e.target.value)}
                  placeholder="เช่น (8)ทรงวุฒิ, (7)ภาคินี, (S2)จิรวรรณ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-emerald-800"
                />
              </div>
            </div>

            {/* Row 4: Sender, Phone & EP, N/O */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ผู้ส่งเอกสาร
                </label>
                <input
                  type="text"
                  value={formData.sender || ''}
                  onChange={(e) => handleChange('sender', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  โทรศัพท์
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  งานธุรการ EP
                </label>
                <input
                  type="text"
                  value={formData.ep || ''}
                  onChange={(e) => handleChange('ep', e.target.value)}
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
                  value={formData.no || ''}
                  onChange={(e) => handleChange('no', e.target.value)}
                  placeholder="N/O"
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
                    onClick={() => setNow('dateReceive')}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    ตอนนี้
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.dateReceive || ''}
                  onChange={(e) => handleChange('dateReceive', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">วันที่ลงโต๊ะ</label>
                  <button
                    type="button"
                    onClick={() => setNow('dateDesk')}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    ตอนนี้
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.dateDesk || ''}
                  onChange={(e) => handleChange('dateDesk', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">วันที่ส่งคืน</label>
                  <button
                    type="button"
                    onClick={() => setNow('dateReturn')}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    ตอนนี้
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.dateReturn || ''}
                  onChange={(e) => handleChange('dateReturn', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 6: Return Status */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                สถานะการส่งคืน
              </label>
              <select
                value={formData.returnStatus || 'ส่งต่อจ่ายทั่วไป'}
                onChange={(e) => handleChange('returnStatus', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ส่งต่อจ่ายทั่วไป">ส่งต่อจ่ายทั่วไป</option>
                <option value="ติดต่อรับคืน">ติดต่อรับคืน</option>
                <option value="ส่งต่อเคาท์เตอร์จ่าย">ส่งต่อเคาท์เตอร์จ่าย</option>
                <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                <option value="ส่งคืนแล้ว">ส่งคืนแล้ว</option>
                <option value="ยกเลิก">ยกเลิก</option>
              </select>
            </div>

            {/* Row 7: Notes */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                เหตุผล/หมายเหตุ
              </label>
              <textarea
                rows={2}
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม หรือเหตุผลการส่งคืน/แก้ไข..."
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
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
