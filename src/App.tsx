import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAllRDOs, 
  saveRDO, 
  deleteRDO, 
  syncPendingReports, 
  initializeSeedDataIfEmpty, 
  createNewRDOReport,
  exportAllReportsToJSON,
  importReportsFromJSON,
} from './services/storage';
import { RDOReport } from './types/rdo';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Header } from './components/Header';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { RDOList } from './components/RDOList';
import { RDOEditor } from './components/RDOEditor';
import { RDOPrintView } from './components/RDOPrintView';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { calculateElapsedDays } from './utils/dateUtils';

export default function App() {
  const [reports, setReports] = useState<RDOReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string>('');
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'print'>('list');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const isOnline = useOnlineStatus();
  const prevOnlineRef = useRef<boolean>(isOnline);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  // 1. Initial Load & Seed if empty
  const loadReports = useCallback(async () => {
    try {
      await initializeSeedDataIfEmpty();
      const all = await getAllRDOs();
      setReports(all);
      if (all.length > 0 && !activeReportId) {
        setActiveReportId(all[0].id);
      }
    } catch (err) {
      console.error('Error loading RDO reports:', err);
    }
  }, [activeReportId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // 2. Real Sync with Cloud Server
  const triggerSync = useCallback(async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    try {
      const result = await syncPendingReports();
      setLastSyncTime(new Date().toISOString());
      if (result.syncedCount > 0) {
        showToast(`${result.syncedCount} Diário(s) e fotos sincronizados com o servidor da publicação com sucesso!`, 'success');
      } else {
        showToast('Todos os diários de obra já estão 100% sincronizados na nuvem!', 'info');
      }
      const updated = await getAllRDOs();
      setReports(updated);
    } catch (err: any) {
      console.error('Sync failed:', err);
      showToast(err?.message || 'Falha na sincronização. Os dados continuam salvos seguramente no seu celular.', 'warning');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Pull fresh data from cloud server
  const handleRefreshFromServer = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const updated = await getAllRDOs();
      setReports(updated);
      setLastSyncTime(new Date().toISOString());
      showToast('Dados da publicação atualizados do servidor com sucesso!', 'success');
    } catch (err) {
      console.error('Refresh error:', err);
      showToast('Não foi possível conectar ao servidor para atualizar.', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when transitioning from offline to online
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      showToast('Conexão restabelecida! Enviando fotos e relatórios para a publicação...', 'info');
      triggerSync();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, triggerSync]);

  // Periodic poll to keep publication updated if opened on other devices (every 45s)
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isSyncing) {
        getAllRDOs().then((updated) => {
          setReports((prev) => {
            // Only update if there are changes to prevent unnecessary re-renders
            if (JSON.stringify(prev) !== JSON.stringify(updated)) {
              return updated;
            }
            return prev;
          });
        }).catch(() => {});
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [isOnline, isSyncing]);

  // Export and Import backup
  const handleExportBackup = async () => {
    try {
      await exportAllReportsToJSON();
      showToast('Arquivo de backup (.json) exportado com sucesso!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Falha ao exportar backup.', 'warning');
    }
  };

  const handleImportBackup = async (content: string) => {
    try {
      const count = await importReportsFromJSON(content);
      const updated = await getAllRDOs();
      setReports(updated);
      showToast(`${count} diário(s) importado(s) com sucesso para o aparelho!`, 'success');
    } catch (err: any) {
      console.error('Import error:', err);
      showToast(err?.message || 'Erro ao importar arquivo de backup.', 'warning');
    }
  };

  // Active report object
  const activeReport = reports.find((r) => r.id === activeReportId) || reports[0];

  // Update active report in memory & persist to IndexedDB
  const handleUpdateActiveReport = (updated: RDOReport) => {
    const finalUpdated: RDOReport = {
      ...updated,
      syncStatus: isOnline ? 'synced' : 'pending_sync',
      updatedAt: new Date().toISOString(),
    };

    setReports((prev) => prev.map((r) => (r.id === finalUpdated.id ? finalUpdated : r)));

    // Save to local storage & push to server if online
    saveRDO(finalUpdated, true)
      .then((saved) => {
        setLastSavedAt(new Date());
        if (saved.syncStatus !== finalUpdated.syncStatus) {
          setReports((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        }
      })
      .catch((err) => console.error('Save error:', err));
  };

  // Manual save trigger from Editor
  const handleSaveActiveReport = async () => {
    if (!activeReport) return;
    setIsSaving(true);
    try {
      const saved = await saveRDO(activeReport, true);
      setLastSavedAt(new Date());
      setReports((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      if (saved.syncStatus === 'synced') {
        showToast(`RDO #${activeReport.reportNumber} salvo e sincronizado na nuvem com sucesso!`, 'success');
      } else {
        showToast(
          `RDO #${activeReport.reportNumber} salvo na memória do celular (Offline). Será sincronizado automaticamente ao reconectar!`,
          'info'
        );
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast('Erro ao salvar relatório.', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  // Create new RDO
  const handleCreateNewRDO = async () => {
    const highestNumber = reports.reduce((max, r) => Math.max(max, r.reportNumber || 0), 0);
    const nextNumber = highestNumber + 1;
    const newReport = createNewRDOReport(nextNumber);

    // If there is an existing report, inherit the project info and calculate elapsed days automatically
    if (activeReport?.projectInfo) {
      const autoDays = calculateElapsedDays(activeReport.projectInfo.startDate, newReport.date);
      newReport.projectInfo = {
        ...activeReport.projectInfo,
        elapsedDays: autoDays > 0 ? autoDays : (activeReport.projectInfo.elapsedDays || 0) + 1,
      };
    }

    await saveRDO(newReport);
    setReports((prev) => [newReport, ...prev]);
    setActiveReportId(newReport.id);
    setActiveView('editor');
    showToast(`Novo RDO #${nextNumber} criado com sucesso!`, 'success');
  };

  // Duplicate RDO (clones equipment, labor, project info for the next day)
  const handleDuplicateRDO = async (idToDuplicate: string) => {
    const source = reports.find((r) => r.id === idToDuplicate);
    if (!source) return;

    const highestNumber = reports.reduce((max, r) => Math.max(max, r.reportNumber || 0), 0);
    const nextNumber = highestNumber + 1;

    // Tomorrow's date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const autoDays = calculateElapsedDays(source.projectInfo.startDate, tomorrowStr);
    const duplicated: RDOReport = {
      ...source,
      id: 'rdo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      reportNumber: nextNumber,
      date: tomorrowStr,
      projectInfo: {
        ...source.projectInfo,
        elapsedDays: autoDays > 0 ? autoDays : (source.projectInfo.elapsedDays || 0) + 1,
      },
      stoppages: [],
      photos: [],
      signatures: {
        engineer: { signed: false, signerName: source.projectInfo.engineerName, signerRole: 'Responsável Técnico' },
        inspector: { signed: false, signerName: source.projectInfo.clientInspector, signerRole: 'Fiscal da Obra' },
      },
      syncStatus: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveRDO(duplicated);
    setReports((prev) => [duplicated, ...prev]);
    setActiveReportId(duplicated.id);
    setActiveView('editor');
    showToast(`RDO duplicado como #${nextNumber} para o dia seguinte!`, 'success');
  };

  // Delete RDO
  const handleDeleteRDO = async (idToDelete: string) => {
    await deleteRDO(idToDelete);
    const updated = reports.filter((r) => r.id !== idToDelete);
    setReports(updated);
    if (activeReportId === idToDelete) {
      if (updated.length > 0) {
        setActiveReportId(updated[0].id);
      } else {
        setActiveReportId('');
        setActiveView('list');
      }
    }
    showToast('Diário de Obra excluído com sucesso.', 'info');
  };

  const pendingSyncCount = reports.filter((r) => r.syncStatus === 'pending_sync').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased selection:bg-amber-200">
      
      {/* 1. Global Navigation Header */}
      <Header
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onNewRDO={handleCreateNewRDO}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onManualSync={triggerSync}
        activeRDONumber={activeReport?.reportNumber}
      />

      {/* 2. Offline & Sync Status Banner */}
      <OfflineSyncBadge
        pendingCount={pendingSyncCount}
        isSyncing={isSyncing}
        onManualSync={triggerSync}
        onTriggerSync={triggerSync}
        onRefreshFromServer={handleRefreshFromServer}
        lastSyncTime={lastSyncTime}
      />

      {/* 3. Main Body Route/View Switcher */}
      <main className="flex-1 pb-16">
        {activeView === 'list' && (
          <RDOList
            reports={reports}
            selectedReportId={activeReportId}
            onSelectReport={(id) => {
              setActiveReportId(id);
              setActiveView('editor');
            }}
            onOpenPrint={(id) => {
              setActiveReportId(id);
              setActiveView('print');
            }}
            onDeleteReport={handleDeleteRDO}
            onDuplicateReport={handleDuplicateRDO}
            onNewReport={handleCreateNewRDO}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onRefreshFromServer={handleRefreshFromServer}
            isSyncing={isSyncing}
          />
        )}

        {activeView === 'editor' && activeReport && (
          <RDOEditor
            report={activeReport}
            onUpdateReport={handleUpdateActiveReport}
            onSave={handleSaveActiveReport}
            onPrint={() => setActiveView('print')}
            onBackToList={() => setActiveView('list')}
            isSaving={isSaving}
            lastSavedAt={lastSavedAt}
          />
        )}

        {activeView === 'editor' && !activeReport && (
          <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl shadow-xs text-center space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Nenhum RDO selecionado</h3>
            <p className="text-xs text-slate-500">Selecione um relatório na lista ou crie um novo diário de obra.</p>
            <button
              onClick={handleCreateNewRDO}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              Criar Novo Diário
            </button>
          </div>
        )}

        {activeView === 'print' && activeReport && (
          <RDOPrintView
            report={activeReport}
            onBack={() => setActiveView('editor')}
          />
        )}
      </main>

      {/* 4. Global Toast Floating Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-slate-900/95 text-emerald-300 border-emerald-500/50'
                : toastMessage.type === 'warning'
                ? 'bg-amber-900/95 text-amber-200 border-amber-500/50'
                : 'bg-slate-900/95 text-sky-200 border-sky-500/50'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Footer / Copyright in App */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-[11px] text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RDO Obras • Sistema de Apontamento e Diário Diário de Campo Profissional</span>
          <span className="text-slate-500 font-semibold">100% Funcional Offline no Canteiro de Obras</span>
        </div>
      </footer>
    </div>
  );
}
