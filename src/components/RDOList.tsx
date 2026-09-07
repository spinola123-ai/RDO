import React, { useState, useRef } from 'react';
import { 
  FileText, Calendar, Users, Truck, Clock, Camera, CheckCircle2, 
  AlertCircle, Printer, Trash2, Copy, Search, ArrowRight, Sun, CloudRain,
  ShieldCheck, PenTool, Download, Upload, RefreshCw, MessageSquare
} from 'lucide-react';
import { RDOReport } from '../types/rdo';
import { WhatsAppSummaryModal } from './WhatsAppSummaryModal';
import { PWAInstallButton } from './PWAInstallButton';

interface RDOListProps {
  reports: RDOReport[];
  selectedReportId: string;
  onSelectReport: (id: string) => void;
  onOpenPrint: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onDuplicateReport: (id: string) => void;
  onNewReport: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonContent: string) => void;
  onRefreshFromServer?: () => void;
  isSyncing?: boolean;
}

export const RDOList: React.FC<RDOListProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onOpenPrint,
  onDeleteReport,
  onDuplicateReport,
  onNewReport,
  onExportBackup,
  onImportBackup,
  onRefreshFromServer,
  isSyncing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSync, setFilterSync] = useState<'all' | 'synced' | 'pending' | 'draft'>('all');
  const [whatsAppReport, setWhatsAppReport] = useState<RDOReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportBackup) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredReports = reports.filter((r) => {
    // Sync filter
    if (filterSync === 'synced' && r.syncStatus !== 'synced') return false;
    if (filterSync === 'pending' && r.syncStatus !== 'pending_sync') return false;
    if (filterSync === 'draft' && r.syncStatus !== 'draft') return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesNumber = String(r.reportNumber).includes(term);
    const matchesDate = r.date.toLowerCase().includes(term);
    const matchesProject = r.projectInfo.projectName?.toLowerCase().includes(term);
    const matchesActivity = r.activities?.some(a => 
      a.description.toLowerCase().includes(term) || a.sector.toLowerCase().includes(term)
    );

    return matchesNumber || matchesDate || matchesProject || matchesActivity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Summary Card */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1">
            Sistema de Campo Construtora
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Diários de Obra Registrados
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Acompanhamento diário com fotos offline, efetivo direto/indireto, apontamento de horas paradas, clima integrado e assinaturas técnicas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {onRefreshFromServer && (
            <button
              onClick={onRefreshFromServer}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-400 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs shadow-xs transition"
              title="Puxar dados atualizados do servidor da publicação"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Atualizar da Nuvem</span>
            </button>
          )}

          {onExportBackup && (
            <button
              onClick={onExportBackup}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs shadow-xs transition"
              title="Exportar todos os relatórios e fotos em arquivo JSON de backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup</span>
            </button>
          )}

          {onImportBackup && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs shadow-xs transition"
                title="Importar relatórios de um arquivo JSON"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar</span>
              </button>
            </>
          )}

          <button
            onClick={onNewReport}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition"
          >
            <FileText className="w-4 h-4" />
            Criar Novo Diário (RDO)
          </button>
        </div>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número (#42), data, frente de obra ou serviço..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-sky-500"
          />
        </div>

        {/* Sync Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilterSync('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterSync === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({reports.length})
          </button>

          <button
            onClick={() => setFilterSync('synced')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterSync === 'synced'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sincronizados ({reports.filter(r => r.syncStatus === 'synced').length})
          </button>

          <button
            onClick={() => setFilterSync('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterSync === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pendentes ({reports.filter(r => r.syncStatus === 'pending_sync').length})
          </button>

          <button
            onClick={() => setFilterSync('draft')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterSync === 'draft'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rascunhos ({reports.filter(r => r.syncStatus === 'draft').length})
          </button>
        </div>
      </div>

      {/* RDO Cards Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum relatório diário encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'Nenhum RDO corresponde à sua busca atual.' : 'Comece registrando o primeiro diário de campo da obra.'}
          </p>
          <button
            onClick={onNewReport}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Criar RDO #1
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const isSelected = report.id === selectedReportId;
            const directWorkers = report.directLabor.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            const indirectWorkers = report.indirectLabor.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            const totalHH = (
              report.directLabor.reduce((acc, curr) => acc + (curr.quantity * (curr.hoursWorked || 0)), 0) +
              report.indirectLabor.reduce((acc, curr) => acc + (curr.quantity * (curr.hoursWorked || 0)), 0)
            );
            const machineCount = report.equipment.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
            const stoppageHours = report.stoppages.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
            const isSigned = report.signatures.engineer.signed;

            return (
              <div
                key={report.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isSelected ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top Header */}
                <div className="p-4 border-b border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        #{String(report.reportNumber).padStart(3, '0')}
                      </span>
                      {report.syncStatus === 'synced' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sincronizado
                        </span>
                      ) : report.syncStatus === 'pending_sync' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Pendente de Nuvem
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          Rascunho
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(report.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                    {report.projectInfo.projectName || 'Obra Sem Nome'}
                  </h3>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Resp: {report.projectInfo.engineerName || 'Não informado'}</span>
                  </p>
                </div>

                {/* Card Metrics Grid */}
                <div className="p-4 bg-slate-50/50 space-y-3 text-xs">
                  {/* Weather snapshot */}
                  <div className="flex items-center justify-between text-slate-700 pb-2 border-b border-slate-200/60">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      {report.weather.morning.condition === 'chuva_fraca' || report.weather.afternoon.condition === 'chuva_forte' ? (
                        <CloudRain className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span>Clima: <strong className="capitalize">{report.weather.morning.condition.replace('_', ' ')}</strong></span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Solo: {report.weather.morning.groundCondition}
                    </span>
                  </div>

                  {/* Workforce & Machinery Stats */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500 flex items-center gap-1 mb-0.5">
                        <Users className="w-3 h-3 text-emerald-600" />
                        <span>Efetivo:</span>
                      </div>
                      <span className="font-bold text-slate-800 text-xs">
                        {directWorkers + indirectWorkers} pessoas ({totalHH.toFixed(0)} HH)
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-slate-500 flex items-center gap-1 mb-0.5">
                        <Truck className="w-3 h-3 text-amber-600" />
                        <span>Máquinas:</span>
                      </div>
                      <span className="font-bold text-slate-800 text-xs">
                        {machineCount} equipamentos
                      </span>
                    </div>
                  </div>

                  {/* Highlights (Stoppages & Photos) */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      <strong>{report.photos.length} fotos</strong>
                    </span>

                    {stoppageHours > 0 ? (
                      <span className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        {stoppageHours.toFixed(1)}h paradas
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Sem paralisação</span>
                    )}

                    <span className="flex items-center gap-1 font-semibold">
                      <PenTool className="w-3 h-3 text-slate-400" />
                      {isSigned ? (
                        <span className="text-emerald-600">Assinado</span>
                      ) : (
                        <span className="text-amber-600">Não assinado</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* WhatsApp Quick Summary Button */}
                    <button
                      onClick={() => setWhatsAppReport(report)}
                      className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                      title="Enviar resumo do RDO pelo WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button
                      onClick={() => onOpenPrint(report.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                      title="Imprimir / Salvar PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicateReport(report.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                      title="Duplicar para o dia seguinte (copia equipe e máquinas)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o RDO #${report.reportNumber}?`)) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Excluir RDO"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectReport(report.id)}
                    className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition"
                  >
                    <span>Editar Diário</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Summary Modal */}
      {whatsAppReport && (
        <WhatsAppSummaryModal
          isOpen={true}
          onClose={() => setWhatsAppReport(null)}
          report={whatsAppReport}
        />
      )}
    </div>
  );
};
