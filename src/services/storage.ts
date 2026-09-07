import { RDOReport, ProjectInfo } from '../types/rdo';
import { calculateElapsedDays } from '../utils/dateUtils';

const DB_NAME = 'rdo_gestao_obras_db';
const DB_VERSION = 1;
const STORE_NAME = 'rdo_reports';
const BACKUP_KEY = 'rdo_reports_backup_v1';

// 1. Open or create IndexedDB safely
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 2. Read only from local IndexedDB (instant, zero network)
export async function getLocalRDOsOnly(): Promise<RDOReport[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        let reports: RDOReport[] = request.result || [];
        if (reports.length === 0) {
          reports = getFromLocalStorage();
        }
        reports.sort((a, b) => (b.reportNumber || 0) - (a.reportNumber || 0));
        resolve(reports);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB fallback to LocalStorage', err);
    const reports = getFromLocalStorage();
    reports.sort((a, b) => (b.reportNumber || 0) - (a.reportNumber || 0));
    return reports;
  }
}

// 3. Save only to local IndexedDB (and LocalStorage backup)
export async function saveLocalOnly(report: RDOReport): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(report);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, saving to LocalStorage', err);
  }

  // Also update LocalStorage backup
  try {
    const all = getFromLocalStorage();
    const idx = all.findIndex((r) => r.id === report.id);
    if (idx >= 0) {
      all[idx] = report;
    } else {
      all.push(report);
    }
    backupToLocalStorage(all);
  } catch {
    // ignore
  }
}

// 4. LocalStorage helpers
function backupToLocalStorage(reports: RDOReport[]) {
  try {
    // Avoid saving large photo base64 arrays in localStorage to avoid 5MB quota errors
    const lightweightReports = reports.map((r) => ({
      ...r,
      photos: r.photos.map((p) => ({
        ...p,
        base64Data: p.base64Data?.length > 5000 ? p.base64Data.substring(0, 100) + '...[truncated_for_ls]' : p.base64Data,
      })),
    }));
    localStorage.setItem(BACKUP_KEY, JSON.stringify(lightweightReports));
  } catch {
    // Ignore localStorage quota errors silently as IndexedDB is primary
  }
}

function getFromLocalStorage(): RDOReport[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 5. GET all RDOs with bi-directional cloud synchronization
export async function getAllRDOs(): Promise<RDOReport[]> {
  // First load from local storage immediately so UI is instant and 100% offline-ready
  let localReports = await getLocalRDOsOnly();

  // If online, check server for updates and sync
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch('/api/reports', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const serverReports: RDOReport[] = await res.json();

        if (Array.isArray(serverReports)) {
          // If server is empty but local has reports, sync local reports to server!
          if (serverReports.length === 0 && localReports.length > 0) {
            fetch('/api/reports/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reports: localReports }),
            }).catch(console.warn);
          } else {
            // Merge server reports into local IndexedDB
            const localPendingMap = new Set(
              localReports.filter((r) => r.syncStatus === 'pending_sync').map((r) => r.id)
            );

            for (const sReport of serverReports) {
              // Only overwrite local if this report is NOT pending offline sync
              if (!localPendingMap.has(sReport.id)) {
                await saveLocalOnly({
                  ...sReport,
                  syncStatus: 'synced',
                });
              }
            }

            // Also, if local has pending offline reports, trigger background sync
            const pendingList = localReports.filter((r) => r.syncStatus === 'pending_sync');
            if (pendingList.length > 0) {
              syncPendingReports().catch(console.warn);
            }

            // Reload fresh merged list from local IndexedDB
            localReports = await getLocalRDOsOnly();
          }
        }
      }
    } catch {
      // Offline or server unreachable: continue gracefully with local reports
    }
  }

  localReports.sort((a, b) => (b.reportNumber || 0) - (a.reportNumber || 0));
  return localReports;
}

// 6. Get single RDO by ID
export async function getRDOById(id: string): Promise<RDOReport | null> {
  const all = await getLocalRDOsOnly();
  return all.find((r) => r.id === id) || null;
}

// 7. Save RDO with automatic server synchronization
export async function saveRDO(report: RDOReport, forceImmediatePush = true): Promise<RDOReport> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  const toSave: RDOReport = {
    ...report,
    updatedAt: new Date().toISOString(),
    syncStatus: isOnline ? 'synced' : 'pending_sync',
  };

  // 1. Always save to local IndexedDB first (guarantees zero data loss on field)
  await saveLocalOnly(toSave);

  // 2. If online and forceImmediatePush, push to server API immediately
  if (isOnline && forceImmediatePush) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000); // 12s for photos

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const result = await res.json();
        const serverReport = result.report || toSave;
        serverReport.syncStatus = 'synced';
        await saveLocalOnly(serverReport);
        return serverReport;
      } else {
        // Mark as pending sync if server rejected or errored
        toSave.syncStatus = 'pending_sync';
        await saveLocalOnly(toSave);
      }
    } catch {
      // Server unreachable: keep safely marked as pending_sync
      toSave.syncStatus = 'pending_sync';
      await saveLocalOnly(toSave);
    }
  }

  return toSave;
}

// 8. Delete RDO locally and on server
export async function deleteRDO(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const all = getFromLocalStorage().filter((r) => r.id !== id);
    backupToLocalStorage(all);
  } catch {
    const all = getFromLocalStorage().filter((r) => r.id !== id);
    backupToLocalStorage(all);
  }

  // Delete on server if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  }
}

// 9. Sync all pending reports to server (Real HTTP Upload)
export async function syncPendingReports(): Promise<{ syncedCount: number; errors: number; totalReports: number }> {
  const localReports = await getLocalRDOsOnly();
  const pending = localReports.filter((r) => r.syncStatus === 'pending_sync');

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Sem conexão com a internet. Os dados continuam salvos com segurança no seu celular e serão sincronizados assim que você reconectar.');
  }

  // If there are pending reports, send them. If none pending, send all to ensure full mirror.
  const reportsToSend = pending.length > 0 ? pending : localReports;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000); // 25s for large photos payload

    const res = await fetch('/api/reports/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports: reportsToSend }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Servidor respondeu com código de erro ${res.status}`);
    }

    const data = await res.json();
    const serverReports: RDOReport[] = data.reports || [];

    // Save all returned reports with status synced
    for (const sReport of serverReports) {
      await saveLocalOnly({
        ...sReport,
        syncStatus: 'synced',
        syncedAt: data.serverTime || new Date().toISOString(),
      });
    }

    return {
      syncedCount: data.syncedCount ?? pending.length,
      errors: 0,
      totalReports: serverReports.length,
    };
  } catch (err: any) {
    console.error('Erro na sincronização de relatórios:', err);
    throw new Error(err?.message || 'Falha ao conectar com o servidor da publicação.');
  }
}

// 10. Export all RDOs to a JSON backup file (User Data Portability)
export async function exportAllReportsToJSON(): Promise<void> {
  const reports = await getLocalRDOsOnly();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reports, null, 2));
  const downloadAnchor = document.createElement('a');
  const todayStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `RDO_OBRAS_BACKUP_${todayStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// 11. Import RDOs from a JSON backup file
export async function importReportsFromJSON(jsonString: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Arquivo JSON inválido. Deve conter uma lista de relatórios.');
    }

    let count = 0;
    for (const report of parsed) {
      if (report && report.id && report.reportNumber) {
        await saveLocalOnly({
          ...report,
          syncStatus: 'pending_sync',
        });
        count++;
      }
    }

    // Push imported reports to server if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncPendingReports().catch(console.warn);
    }

    return count;
  } catch (err: any) {
    throw new Error('Erro ao processar arquivo de backup: ' + err?.message);
  }
}

// 12. Sample construction projects & Seed data
export function getSavedPersonnelPreferences() {
  try {
    const engineerName = localStorage.getItem('rdo_pref_engineer_name') || '';
    const engineerCREA = localStorage.getItem('rdo_pref_engineer_crea') || '';
    const inspectorName = localStorage.getItem('rdo_pref_inspector_name') || '';
    return { engineerName, engineerCREA, inspectorName };
  } catch {
    return { engineerName: '', engineerCREA: '', inspectorName: '' };
  }
}

export const DEFAULT_PROJECT_INFO: ProjectInfo = {
  projectName: 'Edifício Residencial Horizonte Park',
  codeOrContract: 'CTR-2026/089-ENG',
  artNumber: 'ART-SP 28941042-8',
  clientName: 'Incorporadora & Construtora Vanguarda S/A',
  location: 'Av. Paulista, 1420 - Bela Vista, São Paulo - SP',
  engineerName: '',
  engineerCREA: '',
  clientInspector: '',
  totalDays: 540,
  elapsedDays: 142,
  startDate: '2026-04-10',
};

// Sample SVG Mock Photos for Construction Works
const SAMPLE_PHOTO_CONSTRUCTION_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23cbd5e1"/><rect x="40" y="240" width="520" height="130" fill="%2364748b"/><rect x="100" y="80" width="160" height="160" fill="%23e2e8f0" stroke="%2394a3b8" stroke-width="4"/><path d="M100 80 L180 20 L260 80 Z" fill="%23f97316"/><rect x="320" y="140" width="200" height="100" fill="%2338bdf8" opacity="0.8"/><circle cx="500" cy="80" r="40" fill="%23facc15"/><text x="50" y="380" font-family="sans-serif" font-size="20" fill="white" font-weight="bold">VISTA GERAL - ARMAÇÃO BLOCO A</text></svg>`;

const SAMPLE_PHOTO_CONSTRUCTION_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2394a3b8"/><rect x="0" y="260" width="600" height="140" fill="%2378350f"/><rect x="120" y="190" width="180" height="90" fill="%23eab308" rx="10"/><circle cx="150" cy="285" r="28" fill="%231e293b"/><circle cx="270" cy="285" r="28" fill="%231e293b"/><path d="M280 210 L390 150 L450 200" stroke="%23ca8a04" stroke-width="14" stroke-linecap="round" fill="none"/><text x="40" y="380" font-family="sans-serif" font-size="20" fill="white" font-weight="bold">RETROESCAVADEIRA - VALA DE DRENAGEM</text></svg>`;

export function createNewRDOReport(nextNumber: number, customDate?: string): RDOReport {
  const today = customDate || new Date().toISOString().split('T')[0];
  const id = 'rdo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const pref = getSavedPersonnelPreferences();
  const engineerName = pref.engineerName || '';
  const engineerCREA = pref.engineerCREA || '';
  const inspectorName = pref.inspectorName || '';

  const autoDays = calculateElapsedDays(DEFAULT_PROJECT_INFO.startDate, today);

  return {
    id,
    reportNumber: nextNumber,
    date: today,
    projectInfo: {
      ...DEFAULT_PROJECT_INFO,
      elapsedDays: autoDays >= 0 ? autoDays : DEFAULT_PROJECT_INFO.elapsedDays,
      engineerName: engineerName,
      engineerCREA: engineerCREA,
      clientInspector: inspectorName,
    },
    weather: {
      morning: { condition: 'ensolarado', groundCondition: 'seco', temperature: 24, rainMm: 0, notes: 'Céu claro, vento fraco' },
      afternoon: { condition: 'parcialmente_nublado', groundCondition: 'praticavel', temperature: 28, rainMm: 0, notes: 'Aumento de nebulosidade' },
      night: { condition: 'nublado', groundCondition: 'seco', temperature: 21, rainMm: 0 },
      autoFetched: false,
    },
    directLabor: [
      { id: 'dl_1', role: 'Encarregado de Obras', company: 'Próprio', quantity: 2, hoursWorked: 8.8 },
      { id: 'dl_2', role: 'Pedreiro', company: 'Próprio', quantity: 6, hoursWorked: 8.8 },
      { id: 'dl_3', role: 'Servente de Obras', company: 'Próprio', quantity: 10, hoursWorked: 8.8 },
      { id: 'dl_4', role: 'Armador de Ferro', company: 'AçoForte Terceirizada', quantity: 4, hoursWorked: 8.8 },
      { id: 'dl_5', role: 'Carpinteiro de Formas', company: 'Próprio', quantity: 3, hoursWorked: 8.8 },
      { id: 'dl_6', role: 'Eletricista Predial', company: 'Voltz Instalações', quantity: 2, hoursWorked: 8.8 },
    ],
    indirectLabor: [
      { id: 'il_1', role: 'Engenheiro Residente', quantity: 1, hoursWorked: 8.8 },
      { id: 'il_2', role: 'Técnico de Seg. Trabalho (TST)', quantity: 1, hoursWorked: 8.8 },
      { id: 'il_3', role: 'Mestre de Obras Geral', quantity: 1, hoursWorked: 8.8 },
      { id: 'il_4', role: 'Almoxarife / Controle', quantity: 1, hoursWorked: 8.8 },
      { id: 'il_5', role: 'Estagiário de Engenharia', quantity: 1, hoursWorked: 6.0 },
    ],
    equipment: [
      { id: 'eq_1', name: 'Escavadeira Hidráulica 20T', codeOrPlate: 'ESC-01', quantity: 1, status: 'operando', hoursOperated: 7.5, hoursStandby: 1.3, hoursMaintenance: 0 },
      { id: 'eq_2', name: 'Retroescavadeira 4x4', codeOrPlate: 'RET-02', quantity: 1, status: 'operando', hoursOperated: 8.0, hoursStandby: 0.8, hoursMaintenance: 0 },
      { id: 'eq_3', name: 'Caminhão Basculante 14m³', codeOrPlate: 'CAM-05', quantity: 2, status: 'operando', hoursOperated: 6.5, hoursStandby: 2.3, hoursMaintenance: 0 },
      { id: 'eq_4', name: 'Betoneira 400L Elétrica', codeOrPlate: 'BET-01', quantity: 2, status: 'operando', hoursOperated: 5.0, hoursStandby: 3.8, hoursMaintenance: 0 },
      { id: 'eq_5', name: 'Compactador de Solo (Sapo)', codeOrPlate: 'CMP-03', quantity: 1, status: 'espera', hoursOperated: 2.0, hoursStandby: 6.8, hoursMaintenance: 0 },
    ],
    stoppages: [],
    activities: [
      {
        id: 'act_1',
        sector: 'Bloco A - Pavimento Térreo',
        description: 'Montagem de formas e armações metálicas das vigas V-101 e V-102. Aplicação de desmoldante ecológico.',
        progressPercent: 75,
        status: 'em_andamento',
        safetyDDS: true,
        crew: 'Equipe de Carpintaria e Armação',
        notes: 'Previsão de concretagem para amanhã às 10:00.',
      },
      {
        id: 'act_2',
        sector: 'Subsolo 1 - Estacionamento',
        description: 'Execução de alvenaria de vedação com bloco cerâmico e amarração estrutural.',
        progressPercent: 40,
        status: 'em_andamento',
        safetyDDS: true,
        crew: 'Equipe de Alvenaria',
      },
    ],
    safety: {
      ddsRealized: true,
      ddsTheme: 'Uso obrigatório de cinto tipo paraquedista e linha de vida em trabalhos acima de 2 metros (NR-35)',
      incidentsReported: false,
      incidentDetails: '',
      epiInspectionStatus: 'conforme',
      wasteManagementNotes: 'Caçambas de entulho recolhidas e triagem de madeira/aço realizada no ecoponto da obra.',
    },
    photos: [],
    signatures: {
      engineer: {
        signed: false,
        signerName: engineerName,
        signerRole: 'Engenheiro Responsável Técnico',
      },
      inspector: {
        signed: false,
        signerName: inspectorName,
        signerRole: 'Fiscal da Contratante',
      },
    },
    generalNotes: 'Dia produtivo no canteiro. Entrega de materiais conferida conforme romaneio.',
    syncStatus: 'pending_sync',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function initializeSeedDataIfEmpty(): Promise<void> {
  const existing = await getLocalRDOsOnly();
  if (existing.length > 0) return;

  const sampleRDO: RDOReport = {
    id: 'rdo_sample_042',
    reportNumber: 42,
    date: new Date().toISOString().split('T')[0],
    projectInfo: { ...DEFAULT_PROJECT_INFO },
    weather: {
      morning: { condition: 'ensolarado', groundCondition: 'seco', temperature: 23, rainMm: 0, notes: 'Condições excelentes para escavação e fôrmas' },
      afternoon: { condition: 'chuva_fraca', groundCondition: 'praticavel', temperature: 27, rainMm: 4.2, notes: 'Pancada isolada entre 14:30 e 15:15' },
      night: { condition: 'nublado', groundCondition: 'seco', temperature: 20, rainMm: 0 },
      autoFetched: true,
      fetchedCity: 'São Paulo - SP',
      fetchedTemp: 26,
      fetchedHumidity: 68,
      fetchedDescription: 'Tempo Parcialmente Nublado com pancadas leves à tarde',
    },
    directLabor: [
      { id: 'dl_s1', role: 'Encarregado Geral', company: 'Próprio', quantity: 2, hoursWorked: 8.8 },
      { id: 'dl_s2', role: 'Pedreiro de Alvenaria', company: 'Próprio', quantity: 8, hoursWorked: 8.8 },
      { id: 'dl_s3', role: 'Servente de Apoio', company: 'Próprio', quantity: 12, hoursWorked: 8.8 },
      { id: 'dl_s4', role: 'Armador de Ferro', company: 'AçoForte Ltda', quantity: 5, hoursWorked: 8.8 },
      { id: 'dl_s5', role: 'Carpinteiro', company: 'Próprio', quantity: 4, hoursWorked: 8.8 },
      { id: 'dl_s6', role: 'Encanador Hidráulico', company: 'Sanear Terceirizada', quantity: 2, hoursWorked: 8.8 },
    ],
    indirectLabor: [
      { id: 'il_s1', role: 'Engenheiro Residente', quantity: 1, hoursWorked: 8.8 },
      { id: 'il_s2', role: 'Técnico de Seg. Trabalho (TST)', quantity: 1, hoursWorked: 8.8 },
      { id: 'il_s3', role: 'Mestre de Obras', quantity: 1, hoursWorked: 8.8 },
      { id: 'il_s4', role: 'Almoxarife', quantity: 1, hoursWorked: 8.8 },
    ],
    equipment: [
      { id: 'eq_s1', name: 'Escavadeira Hidráulica 20T', codeOrPlate: 'ESC-01', quantity: 1, status: 'operando', hoursOperated: 6.5, hoursStandby: 1.5, hoursMaintenance: 0.8 },
      { id: 'eq_s2', name: 'Retroescavadeira Case 580', codeOrPlate: 'RET-02', quantity: 1, status: 'operando', hoursOperated: 7.0, hoursStandby: 1.8, hoursMaintenance: 0 },
      { id: 'eq_s3', name: 'Caminhão Basculante 14m³', codeOrPlate: 'CAM-05', quantity: 2, status: 'operando', hoursOperated: 6.0, hoursStandby: 2.8, hoursMaintenance: 0 },
      { id: 'eq_s4', name: 'Gerador a Diesel 75kVA', codeOrPlate: 'GER-01', quantity: 1, status: 'operando', hoursOperated: 8.8, hoursStandby: 0, hoursMaintenance: 0 },
    ],
    stoppages: [
      {
        id: 'stp_1',
        reason: 'clima_chuva',
        affectedTeamOrEquipment: 'Equipe de Terraplenagem & Escavadeira ESC-01',
        startTime: '14:30',
        endTime: '15:15',
        totalHours: 0.75,
        impactLevel: 'medio',
        description: 'Chuva localizada impediu o tráfego dos caminhões basculantes na rampa de terra. Reiniciado após secagem parcial.',
      },
      {
        id: 'stp_2',
        reason: 'quebra_equipamento',
        affectedTeamOrEquipment: 'Escavadeira Hidráulica ESC-01',
        startTime: '10:15',
        endTime: '11:00',
        totalHours: 0.75,
        impactLevel: 'baixo',
        description: 'Rompimento da mangueira hidráulica auxiliar. Substituição efetuada pela equipe mecânica no local.',
      },
    ],
    activities: [
      {
        id: 'act_s1',
        sector: 'Bloco A - Fundação e Vigas Baldrame',
        description: 'Conclusão da armação e posicionamento dos espaçadores plásticos nas vigas VB-12 a VB-16. Liberação topográfica conferida.',
        progressPercent: 90,
        status: 'em_andamento',
        safetyDDS: true,
        crew: 'Equipe Armação AçoForte',
        notes: 'Topógrafo verificou cota de nível antes do fechamento das fôrmas.',
      },
      {
        id: 'act_s2',
        sector: 'Área Periférica - Muro de Arrimo',
        description: 'Perfuração e concretagem de 6 estacas hélice contínua Ø 40cm, profundidade média de 14 metros.',
        progressPercent: 60,
        status: 'em_andamento',
        safetyDDS: true,
        crew: 'Equipe de Fundações Especiais',
        notes: 'Consumo de concreto usinado Fck 30 MPa: 18m³.',
      },
      {
        id: 'act_s3',
        sector: 'Canteiro Geral - Drenagem Provisória',
        description: 'Instalação de canaletas para contenção de águas pluviais e ligação de bomba submersível na bacia de decantação.',
        progressPercent: 100,
        status: 'concluido',
        safetyDDS: true,
        crew: 'Equipe de Apoio e Serventes',
      },
    ],
    safety: {
      ddsRealized: true,
      ddsTheme: 'Diálogo Diário: Cuidados na movimentação de cargas suspensas e isolamento do raio do guindaste (NR-18)',
      incidentsReported: false,
      incidentDetails: '',
      epiInspectionStatus: 'conforme',
      wasteManagementNotes: 'Triagem de resíduos classe A e destinação de 2 caçambas para bota-fora licenciado.',
    },
    photos: [
      {
        id: 'photo_seed_1',
        base64Data: SAMPLE_PHOTO_CONSTRUCTION_1,
        caption: 'Conferência de armação das vigas baldrame do Bloco A com espaçadores instalados.',
        sectorTag: 'Bloco A - Fundação',
        timestamp: new Date().toISOString(),
        latitude: -23.5505,
        longitude: -46.6333,
        takenOffline: true,
      },
      {
        id: 'photo_seed_2',
        base64Data: SAMPLE_PHOTO_CONSTRUCTION_2,
        caption: 'Abertura de vala para drenagem de águas pluviais com retroescavadeira.',
        sectorTag: 'Área Periférica',
        timestamp: new Date().toISOString(),
        latitude: -23.5505,
        longitude: -46.6333,
        takenOffline: true,
      },
    ],
    signatures: {
      engineer: {
        signed: true,
        signerName: 'Eng. Roberto Albuquerque Silva',
        signerRole: 'Engenheiro Responsável Técnico',
        signedAt: new Date().toISOString(),
      },
      inspector: {
        signed: false,
        signerName: 'Arq. Mariana Mendonça (Fiscal)',
        signerRole: 'Fiscal da Contratante',
      },
    },
    generalNotes: 'Relatório diário elaborado conforme diretrizes do canteiro. Previsão de chegada de concreto usinado amanhã às 08h30. Sem desvios críticos.',
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
  };

  await saveLocalOnly(sampleRDO);

  // If online, also seed server
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleRDO),
    }).catch(() => {});
  }
}
