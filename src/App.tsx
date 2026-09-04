import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DocumentItem, GroupedDocument, DepartmentType } from './types';
import {
  getLocalDocuments,
  saveLocalDocuments,
  fetchFromGoogleSheet,
  syncToGas,
  getStoredGasUrl,
  setStoredGasUrl,
} from './services/sheetService';
import { Navbar } from './components/Navbar';
import { DepartmentTabs } from './components/DepartmentTabs';
import { StatsBar } from './components/StatsBar';
import { DocumentCard } from './components/DocumentCard';
import { HistoryModal } from './components/HistoryModal';
import { EditDocumentModal } from './components/EditDocumentModal';
import { InspectionRecordModal } from './components/InspectionRecordModal';
import { NewDocModal } from './components/NewDocModal';
import { GasCodeModal } from './components/GasCodeModal';
import { LoginModal } from './components/LoginModal';
import { initAuth, logout } from './services/authService';
import { INITIAL_SHEET_ID } from './data/initialData';
import { FileSearch, FolderX, CheckCircle, RefreshCw, ClipboardCheck } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDept, setCurrentDept] = useState<DepartmentType | 'ALL'>('งานตรวจจ่าย');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [returnStatusFilter, setReturnStatusFilter] = useState<string>('ALL');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [workStatusFilter, setWorkStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [multiRoundOnly, setMultiRoundOnly] = useState<boolean>(false);
  const [gasUrl, setGasUrl] = useState<string>(getStoredGasUrl());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('document_tracker_user_email');
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('document_tracker_user_name') || 'Shongwut Tabunsom';
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('document_tracker_user_avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
  });

  const handleLogin = (email: string, name?: string, avatar?: string) => {
    localStorage.setItem('document_tracker_user_email', email);
    if (name) localStorage.setItem('document_tracker_user_name', name);
    if (avatar !== undefined) localStorage.setItem('document_tracker_user_avatar', avatar);
    setUserEmail(email);
    if (name) setUserName(name);
    if (avatar !== undefined) setUserAvatar(avatar);
    showToast(`เข้าสู่ระบบด้วย Google Account (${email}) สำเร็จ`);
  };

  const handleLogout = () => {
    localStorage.removeItem('document_tracker_user_email');
    localStorage.removeItem('document_tracker_user_name');
    localStorage.removeItem('document_tracker_user_avatar');
    logout().catch(() => {});
    setUserEmail(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // Modal States
  const [historyDoc, setHistoryDoc] = useState<GroupedDocument | null>(null);
  const [editItem, setEditItem] = useState<DocumentItem | null>(null);
  const [inspectItem, setInspectItem] = useState<DocumentItem | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState<boolean>(false);
  const [newDocTarget, setNewDocTarget] = useState<GroupedDocument | null>(null);
  const [isNewDocOpen, setIsNewDocOpen] = useState<boolean>(false);
  const [isGasCodeOpen, setIsGasCodeOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initial Load: Fetch live directly from Google Sheet DATA as primary source of truth
  const loadData = useCallback(async (showNotice = false) => {
    setIsLoading(true);
    try {
      const liveData = await fetchFromGoogleSheet();
      setDocuments(liveData);
      saveLocalDocuments(liveData);
      if (showNotice) {
        showToast(`✅ ซิงค์ข้อมูลล่าสุดจาก Google Sheet เรียบร้อยแล้ว (${liveData.length} รายการ)`);
      }
    } catch (err) {
      console.warn('Could not fetch live from Google Sheets, using local/cached data:', err);
      const fallback = getLocalDocuments();
      if (fallback && fallback.length > 0) {
        setDocuments(fallback);
      }
      if (showNotice) {
        showToast('⚠️ ไม่สามารถเชื่อมต่อ Google Sheet ได้ กำลังใช้ข้อมูลสำรอง');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to Firebase Auth state
    const unsubscribeAuth = initAuth((user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        if (user.displayName) setUserName(user.displayName);
        if (user.photoURL) setUserAvatar(user.photoURL);
        localStorage.setItem('document_tracker_user_email', user.email);
        if (user.displayName) localStorage.setItem('document_tracker_user_name', user.displayName);
        if (user.photoURL) localStorage.setItem('document_tracker_user_avatar', user.photoURL);
      }
    });

    // Auto-sync whenever user focuses back to the tab
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic sync every 15 seconds so Google Sheet changes reflect automatically
    const timer = setInterval(() => {
      loadData();
    }, 15000);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('focus', handleFocus);
      clearInterval(timer);
    };
  }, [loadData]);

  // Group documents by docNo (เลขที่เอกสาร) or receiveNo (เลขทะเบียนรับ) and sort rounds (latest first)
  const groupedDocuments = useMemo<GroupedDocument[]>(() => {
    const map = new Map<string, DocumentItem[]>();

    documents.forEach((item) => {
      const key = (item.docNo && item.docNo.trim() !== '')
        ? item.docNo.trim()
        : (item.receiveNo && item.receiveNo.trim() !== '')
          ? `REC-${item.receiveNo.trim()}`
          : (item.docRef && item.docRef.trim() !== '')
            ? `REF-${item.docRef.trim()}`
            : `row-${item.rowId || item.id}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });

    const result: GroupedDocument[] = [];

    map.forEach((rounds, docKey) => {
      // Sort rounds descending: Round N (latest) is index 0
      rounds.sort((a, b) => b.round - a.round);
      const latest = rounds[0];

      result.push({
        docNo: latest.docNo || latest.receiveNo || latest.docRef || docKey,
        agency: latest.agency,
        docType: latest.docType,
        docRef: latest.docRef,
        sender: latest.sender,
        phone: latest.phone,
        department: latest.department,
        totalRounds: rounds.length,
        latestRound: latest,
        rounds: rounds,
      });
    });

    return result;
  }, [documents]);

  // Department counts & statistics
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      งานตรวจจ่าย: 0,
      งานสอบทาน: 0,
      งานการเงิน: 0,
      งานงบประมาณ: 0,
      ALL: 0,
      multiRound: 0,
    };

    groupedDocuments.forEach((doc) => {
      c.ALL = (c.ALL || 0) + 1;
      if (doc.department && c[doc.department] !== undefined) {
        c[doc.department] = (c[doc.department] || 0) + 1;
      }
      if (doc.totalRounds > 1) {
        c.multiRound = (c.multiRound || 0) + 1;
      }
    });

    return c;
  }, [groupedDocuments]);

  // List of unique providers available in current dataset
  const availableProviders = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((doc) => {
      const p = doc.providerFinal?.trim() || doc.providerChange?.trim() || doc.providerAuto?.trim();
      if (p && p !== '-' && p !== 'ไม่เลือก') {
        set.add(p);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [documents]);

  // Counts for work status (all, pending, completed)
  const workStatusCounts = useMemo(() => {
    let all = 0;
    let pending = 0;
    let completed = 0;

    groupedDocuments.forEach((doc) => {
      if (currentDept !== 'ALL' && doc.department !== currentDept) {
        return;
      }
      // If a provider is selected, count only for this provider ("ของคนนี้ทั้งหมด")
      if (selectedProvider !== 'ALL') {
        const p = doc.latestRound.providerFinal?.trim() || doc.latestRound.providerChange?.trim() || doc.latestRound.providerAuto?.trim() || '';
        if (p !== selectedProvider) {
          return;
        }
      }

      all++;
      const hasStatus = Boolean(
        (doc.latestRound.returnStatus && doc.latestRound.returnStatus.trim() !== '') ||
        (doc.latestRound.status && doc.latestRound.status.trim() !== '')
      );
      if (hasStatus) {
        // 2. งานที่ทำเสร็จ - คืองานทั้งหมดที่ลงข้อมูลแล้ว
        completed++;
      } else {
        // 1. งานที่ค้างในมือ - คืองานที่ส่งเข้ามาลงโต๊ะนี้แล้วยังไม่มีการลงสถานะ
        pending++;
      }
    });

    return { all, pending, completed };
  }, [groupedDocuments, currentDept, selectedProvider]);

  // Filtered documents list for current view
  const filteredDocuments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return groupedDocuments.filter((doc) => {
      // 1. Department Filter
      if (currentDept !== 'ALL' && doc.department !== currentDept) {
        return false;
      }

      // 2. Multi-round only filter
      if (multiRoundOnly && doc.totalRounds <= 1) {
        return false;
      }

      // 3. Provider filter (ผู้ให้บริการ)
      if (selectedProvider !== 'ALL') {
        const p = doc.latestRound.providerFinal?.trim() || doc.latestRound.providerChange?.trim() || doc.latestRound.providerAuto?.trim() || '';
        if (p !== selectedProvider) {
          return false;
        }
      }

      // 4. Work status filter:
      // 1. งานที่ค้างในมือ - คืองานที่ส่งเข้ามาลงโต๊ะนี้แล้วยังไม่มีการลงสถานะ
      // 2. งานที่ทำเสร็จ - คืองานทั้งหมดที่ลงข้อมูลแล้ว
      // 3. งานทั้งหมด - คืองานที่เข้ามาของคนนี้ทั้งหมด
      const hasStatus = Boolean(
        (doc.latestRound.returnStatus && doc.latestRound.returnStatus.trim() !== '') ||
        (doc.latestRound.status && doc.latestRound.status.trim() !== '')
      );
      if (workStatusFilter === 'PENDING') {
        if (hasStatus) return false;
      } else if (workStatusFilter === 'COMPLETED') {
        if (!hasStatus) return false;
      }

      // 5. Return Status filter
      if (returnStatusFilter !== 'ALL') {
        const status = doc.latestRound.returnStatus || '';
        if (!status.includes(returnStatusFilter)) {
          return false;
        }
      }

      // 6. Real-time Search filter
      if (q) {
        const matchDocNo = (doc.docNo || '').toLowerCase().includes(q);
        const matchAgency = (doc.agency || '').toLowerCase().includes(q);
        const matchRecv = (doc.latestRound.receiveNo || '').toLowerCase().includes(q);
        const matchRef = (doc.docRef || '').toLowerCase().includes(q);
        const matchSender = (doc.sender || '').toLowerCase().includes(q);
        const matchPhone = (doc.phone || '').toLowerCase().includes(q);
        const matchProvider = (doc.latestRound.providerFinal || '').toLowerCase().includes(q);
        const matchType = (doc.docType || '').toLowerCase().includes(q);

        return (
          matchDocNo ||
          matchAgency ||
          matchRecv ||
          matchRef ||
          matchSender ||
          matchPhone ||
          matchProvider ||
          matchType
        );
      }

      return true;
    });
  }, [
    groupedDocuments,
    currentDept,
    multiRoundOnly,
    selectedProvider,
    workStatusFilter,
    returnStatusFilter,
    searchQuery,
  ]);

  // Stats for the active filter
  const activeStats = useMemo(() => {
    let returned = 0;
    let pending = 0;
    let totalRoundsSum = 0;
    let multiRoundCount = 0;

    filteredDocuments.forEach((doc) => {
      totalRoundsSum += doc.totalRounds;
      if (doc.totalRounds > 1) multiRoundCount++;

      const hasStatus = Boolean(
        (doc.latestRound.returnStatus && doc.latestRound.returnStatus.trim() !== '') ||
        (doc.latestRound.status && doc.latestRound.status.trim() !== '')
      );
      if (hasStatus) {
        returned++;
      } else {
        pending++;
      }
    });

    return {
      totalDocs: filteredDocuments.length,
      totalRounds: totalRoundsSum,
      multiRoundDocs: multiRoundCount,
      returnedDocs: returned,
      pendingDocs: pending,
    };
  }, [filteredDocuments]);

  // Handle Edit Save
  const handleSaveEdit = (updatedItem: DocumentItem) => {
    setDocuments((prev) => {
      const next = prev.map((item) => {
        if (
          item.id === updatedItem.id ||
          String(item.rowId) === String(updatedItem.rowId) ||
          (item.docNo && item.docNo === updatedItem.docNo && item.round === updatedItem.round)
        ) {
          return { ...item, ...updatedItem };
        }
        return item;
      });
      saveLocalDocuments(next);
      return next;
    });

    const docIdentifier = updatedItem.docNo || updatedItem.receiveNo || updatedItem.docRef || `แถว ${updatedItem.rowId}`;
    showToast(`⏳ กำลังบันทึกข้อมูลเอกสาร ${docIdentifier} เข้า Google Sheet โดยตรง...`);
    syncToGas('updateDocument', updatedItem).then((success) => {
      if (success) {
        showToast(`✅ บันทึกข้อมูลเอกสาร ${docIdentifier} ลง Google Sheet สำเร็จ`);
      } else {
        showToast(`✅ บันทึกข้อมูลเอกสาร ${docIdentifier} ในระบบเรียบร้อยแล้ว`);
      }
      loadData();
      setTimeout(() => loadData(), 800);
    });
  };

  // Handle Add New Document or Add New Round
  const handleSaveNew = (newItem: DocumentItem) => {
    setDocuments((prev) => {
      const next = [newItem, ...prev];
      saveLocalDocuments(next);
      return next;
    });

    const isRound = newItem.round > 1;
    const action = isRound ? 'addRound' : 'createDocument';
    const docIdentifier = newItem.docNo || newItem.receiveNo || newItem.docRef || 'เอกสารใหม่';

    showToast(`⏳ กำลังบันทึกข้อมูล ${docIdentifier} เข้า Google Sheet โดยตรง...`);
    syncToGas(action, newItem).then((success) => {
      if (success) {
        showToast(
          isRound
            ? `✅ เพิ่มรอบใหม่ (ครั้งที่ ${newItem.round}) สำหรับเอกสาร ${newItem.docNo} ใน Google Sheet สำเร็จ`
            : `✅ บันทึกรับเอกสารใหม่ ${newItem.docNo} เข้า Google Sheet เรียบร้อยแล้ว`
        );
      } else {
        showToast(`✅ บันทึกข้อมูล ${docIdentifier} ในระบบเรียบร้อยแล้ว`);
      }
      loadData();
      setTimeout(() => loadData(), 800);
    });
  };

  // Handle GAS URL Save
  const handleSaveGasUrl = (url: string) => {
    setStoredGasUrl(url);
    setGasUrl(url);
    showToast('บันทึกการตั้งค่า Google Apps Script Web App URL เรียบร้อย');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/90 font-['Sarabun',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-950 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        onOpenGasModal={() => setIsGasCodeOpen(true)}
        onOpenNewDocModal={() => {
          setNewDocTarget(null);
          setIsNewDocOpen(true);
        }}
        onOpenSettingsModal={() => setIsGasCodeOpen(true)}
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Department Navigation Tabs (4 ฝ่าย) & Search/Filter */}
        <DepartmentTabs
          currentDept={currentDept}
          onSelectDept={(dept) => setCurrentDept(dept)}
          counts={counts}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          returnStatusFilter={returnStatusFilter}
          onReturnStatusChange={(st) => setReturnStatusFilter(st)}
          multiRoundOnly={multiRoundOnly}
          onMultiRoundToggle={(val) => setMultiRoundOnly(val)}
          selectedProvider={selectedProvider}
          onProviderChange={(p) => setSelectedProvider(p)}
          availableProviders={availableProviders}
          workStatusFilter={workStatusFilter}
          onWorkStatusChange={(st) => setWorkStatusFilter(st)}
          workStatusCounts={workStatusCounts}
        />

        {/* Executive Stats Summary */}
        <StatsBar
          currentDept={currentDept}
          totalDocs={activeStats.totalDocs}
          totalRounds={activeStats.totalRounds}
          multiRoundDocs={activeStats.multiRoundDocs}
          returnedDocs={activeStats.returnedDocs}
          pendingDocs={activeStats.pendingDocs}
        />

        {/* Document Cards Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc, idx) => (
              <DocumentCard
                key={doc.latestRound?.id ? `${doc.docNo || 'doc'}-${doc.latestRound.id}` : `doc-card-${idx}-${doc.docNo}`}
                document={doc}
                onEdit={(item) => setEditItem(item)}
                onInspect={(item) => {
                  setInspectItem(item);
                  setIsInspectModalOpen(true);
                }}
                onViewHistory={(d) => setHistoryDoc(d)}
                onAddRound={(d) => {
                  setNewDocTarget(d);
                  setIsNewDocOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-6 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <FolderX className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1 font-['Prompt','Sarabun',sans-serif]">
              ไม่พบข้อมูลเอกสารที่ตรงกับเงื่อนไข
            </h3>
            <p className="text-xs text-slate-500 font-normal max-w-sm mx-auto mb-4">
              {searchQuery
                ? `ไม่พบเอกสารที่มีคำว่า "${searchQuery}" ในฝ่าย${currentDept !== 'ALL' ? currentDept : 'ทั้งหมด'}`
                : `ยังไม่มีเอกสารใน${currentDept !== 'ALL' ? currentDept : 'ระบบ'}`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>ล้างคำค้นหา</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ระบบติดตามเอกสารการเบิกจ่าย ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง
          </span>
          <span className="text-xs text-slate-400">
            ระบบติดตามสถานะเอกสาร 4 ฝ่าย ส่วนการเงินและบัญชี มหาวิทยาลัยแม่ฟ้าหลวง
          </span>
        </div>
      </footer>

      {/* Modals */}
      <HistoryModal
        isOpen={Boolean(historyDoc)}
        document={historyDoc}
        onClose={() => setHistoryDoc(null)}
        onEditRound={(item) => setEditItem(item)}
        onAddRound={(doc) => {
          setNewDocTarget(doc);
          setIsNewDocOpen(true);
        }}
      />

      <EditDocumentModal
        isOpen={Boolean(editItem)}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSaveEdit}
      />

      <InspectionRecordModal
        isOpen={isInspectModalOpen}
        item={inspectItem}
        documents={filteredDocuments.map((d) => d.latestRound)}
        onClose={() => {
          setIsInspectModalOpen(false);
          setInspectItem(null);
        }}
        onSave={(updated) => {
          handleSaveEdit(updated);
          setIsInspectModalOpen(false);
          setInspectItem(null);
        }}
      />

      <NewDocModal
        isOpen={isNewDocOpen}
        targetDoc={newDocTarget}
        currentDept={currentDept}
        onClose={() => {
          setIsNewDocOpen(false);
          setNewDocTarget(null);
        }}
        onSaveNew={handleSaveNew}
      />

      <GasCodeModal
        isOpen={isGasCodeOpen}
        onClose={() => setIsGasCodeOpen(false)}
        gasUrl={gasUrl}
        onSaveGasUrl={handleSaveGasUrl}
      />

      <LoginModal
        isOpen={!userEmail}
        onLogin={handleLogin}
      />
    </div>
  );
}
