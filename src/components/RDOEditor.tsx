import React, { useState } from 'react';
import { 
  Building2, CloudSun, Users, Truck, Clock, ClipboardList, Camera, 
  Shield, PenTool, Save, Printer, ArrowLeft, CheckCircle2, AlertCircle, MessageSquare
} from 'lucide-react';
import { RDOReport } from '../types/rdo';
import { GeneralInfoSection } from './sections/GeneralInfoSection';
import { WeatherSection } from './sections/WeatherSection';
import { LaborSection } from './sections/LaborSection';
import { EquipmentSection } from './sections/EquipmentSection';
import { StoppagesSection } from './sections/StoppagesSection';
import { ActivitiesSection } from './sections/ActivitiesSection';
import { PhotosSection } from './sections/PhotosSection';
import { SafetySection } from './sections/SafetySection';
import { SignatureSection } from './sections/SignatureSection';
import { WhatsAppSummaryModal } from './WhatsAppSummaryModal';
import { calculateElapsedDays } from '../utils/dateUtils';

interface RDOEditorProps {
  report: RDOReport;
  onUpdateReport: (updated: RDOReport) => void;
  onSave: () => void;
  onPrint: () => void;
  onBackToList: () => void;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

type TabKey = 
  | 'geral' 
  | 'clima' 
  | 'efetivo' 
  | 'maquinas' 
  | 'paradas' 
  | 'atividades' 
  | 'fotos' 
  | 'seguranca' 
  | 'assinaturas';

export const RDOEditor: React.FC<RDOEditorProps> = ({
  report,
  onUpdateReport,
  onSave,
  onPrint,
  onBackToList,
  isSaving,
  lastSavedAt,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('geral');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const navItems = [
    { key: 'geral' as TabKey, label: 'Identificação', icon: Building2 },
    { key: 'clima' as TabKey, label: 'Clima & Solo', icon: CloudSun },
    { key: 'efetivo' as TabKey, label: 'Mão de Obra', icon: Users, count: report.directLabor.reduce((acc, c) => acc + (c.quantity || 0), 0) + report.indirectLabor.reduce((acc, c) => acc + (c.quantity || 0), 0) },
    { key: 'maquinas' as TabKey, label: 'Máquinas', icon: Truck, count: report.equipment.reduce((acc, c) => acc + (c.quantity || 0), 0) },
    { key: 'paradas' as TabKey, label: 'Horas Paradas', icon: Clock, count: report.stoppages.length, highlight: report.stoppages.length > 0 },
    { key: 'atividades' as TabKey, label: 'Atividades', icon: ClipboardList, count: report.activities.length },
    { key: 'fotos' as TabKey, label: 'Fotos Offline', icon: Camera, count: report.photos.length },
    { key: 'seguranca' as TabKey, label: 'SST & Meio Ambiente', icon: Shield },
    { key: 'assinaturas' as TabKey, label: 'Assinaturas', icon: PenTool, isSigned: report.signatures.engineer.signed },
  ];

  const handleNextTab = () => {
    const currentIndex = navItems.findIndex(item => item.key === activeTab);
    if (currentIndex < navItems.length - 1) {
      setActiveTab(navItems[currentIndex + 1].key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    const currentIndex = navItems.findIndex(item => item.key === activeTab);
    if (currentIndex > 0) {
      setActiveTab(navItems[currentIndex - 1].key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Action Top Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Voltar à lista de diários"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div 
                className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/70 px-2 py-1 rounded-xl shadow-2xs"
                title="Você pode alterar livremente o número deste RDO (ex: 1, 2, 3...)"
              >
                <span className="font-mono font-black text-amber-900 text-xs sm:text-sm pl-1">RDO #</span>
                <input
                  type="number"
                  min="1"
                  value={report.reportNumber === 0 ? '' : report.reportNumber}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      onUpdateReport({ ...report, reportNumber: 0 });
                      return;
                    }
                    const val = parseInt(raw, 10);
                    if (!isNaN(val)) {
                      onUpdateReport({ ...report, reportNumber: val });
                    }
                  }}
                  onBlur={() => {
                    if (!report.reportNumber || report.reportNumber < 1) {
                      onUpdateReport({ ...report, reportNumber: 1 });
                    }
                  }}
                  className="w-16 bg-white font-black text-sm sm:text-base text-slate-900 px-2 py-0.5 rounded-lg border border-amber-300 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              <input
                type="date"
                value={report.date}
                onChange={(e) => onUpdateReport({ ...report, date: e.target.value })}
                className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-200/80 transition focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                title="Clique para alterar a data do diário"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {report.projectInfo.projectName || 'Obra Sem Nome'}
            </p>
          </div>
        </div>

        {/* Save & Print Actions */}
        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Salvo às {lastSavedAt.toLocaleTimeString('pt-BR')}
            </span>
          )}

          {/* WhatsApp Summary Button */}
          <button
            type="button"
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs shadow-xs transition"
            title="Enviar resumo do RDO para grupo do WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar RDO'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-2 shadow-md overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-102'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-slate-950 text-white'
                        : item.highlight
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {item.isSigned && (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Section Content */}
      <div>
        {activeTab === 'geral' && (
          <GeneralInfoSection
            projectInfo={report.projectInfo}
            reportNumber={report.reportNumber}
            reportDate={report.date}
            date={report.date}
            onUpdateProjectInfo={(projectInfo) => {
              onUpdateReport({
                ...report,
                projectInfo,
                signatures: {
                  ...report.signatures,
                  engineer: {
                    ...report.signatures.engineer,
                    signerName: projectInfo.engineerName,
                  },
                  inspector: {
                    ...report.signatures.inspector,
                    signerName: projectInfo.clientInspector,
                  },
                },
              });
              try {
                if (projectInfo.engineerName) localStorage.setItem('rdo_pref_engineer_name', projectInfo.engineerName);
                if (projectInfo.engineerCREA) localStorage.setItem('rdo_pref_engineer_crea', projectInfo.engineerCREA);
                if (projectInfo.clientInspector) localStorage.setItem('rdo_pref_inspector_name', projectInfo.clientInspector);
              } catch {}
            }}
            onUpdateNumber={(reportNumber) => onUpdateReport({ ...report, reportNumber })}
            onUpdateReportNumber={(reportNumber) => onUpdateReport({ ...report, reportNumber })}
            onUpdateDate={(date) => {
              const autoElapsed = calculateElapsedDays(report.projectInfo.startDate, date);
              onUpdateReport({
                ...report,
                date,
                projectInfo: {
                  ...report.projectInfo,
                  ...(autoElapsed > 0 ? { elapsedDays: autoElapsed } : {}),
                },
              });
            }}
            onUpdateReportDate={(date) => {
              const autoElapsed = calculateElapsedDays(report.projectInfo.startDate, date);
              onUpdateReport({
                ...report,
                date,
                projectInfo: {
                  ...report.projectInfo,
                  ...(autoElapsed > 0 ? { elapsedDays: autoElapsed } : {}),
                },
              });
            }}
          />
        )}

        {activeTab === 'clima' && (
          <WeatherSection
            weather={report.weather}
            location={report.projectInfo.location}
            onUpdateWeather={(weather) => onUpdateReport({ ...report, weather })}
          />
        )}

        {activeTab === 'efetivo' && (
          <LaborSection
            directLabor={report.directLabor}
            indirectLabor={report.indirectLabor}
            onUpdateDirectLabor={(directLabor) => onUpdateReport({ ...report, directLabor })}
            onUpdateIndirectLabor={(indirectLabor) => onUpdateReport({ ...report, indirectLabor })}
          />
        )}

        {activeTab === 'maquinas' && (
          <EquipmentSection
            equipment={report.equipment}
            onUpdateEquipment={(equipment) => onUpdateReport({ ...report, equipment })}
          />
        )}

        {activeTab === 'paradas' && (
          <StoppagesSection
            stoppages={report.stoppages}
            onUpdateStoppages={(stoppages) => onUpdateReport({ ...report, stoppages })}
          />
        )}

        {activeTab === 'atividades' && (
          <ActivitiesSection
            activities={report.activities}
            onUpdateActivities={(activities) => onUpdateReport({ ...report, activities })}
          />
        )}

        {activeTab === 'fotos' && (
          <PhotosSection
            photos={report.photos}
            onUpdatePhotos={(photos) => onUpdateReport({ ...report, photos })}
          />
        )}

        {activeTab === 'seguranca' && (
          <SafetySection
            safety={report.safety}
            generalNotes={report.generalNotes}
            onUpdateSafety={(safety) => onUpdateReport({ ...report, safety })}
            onUpdateGeneralNotes={(generalNotes) => onUpdateReport({ ...report, generalNotes })}
          />
        )}

        {activeTab === 'assinaturas' && (
          <SignatureSection
            signatures={report.signatures}
            engineerName={report.projectInfo.engineerName}
            engineerCREA={report.projectInfo.engineerCREA}
            inspectorName={report.projectInfo.clientInspector}
            onUpdateSignaturesAndPersonnel={(newSignatures, newPersonnel) => {
              onUpdateReport({
                ...report,
                signatures: newSignatures,
                projectInfo: {
                  ...report.projectInfo,
                  engineerName: newPersonnel.engineerName,
                  engineerCREA: newPersonnel.engineerCREA,
                  clientInspector: newPersonnel.clientInspector,
                },
              });
              try {
                if (newPersonnel.engineerName) localStorage.setItem('rdo_pref_engineer_name', newPersonnel.engineerName);
                if (newPersonnel.engineerCREA) localStorage.setItem('rdo_pref_engineer_crea', newPersonnel.engineerCREA);
                if (newPersonnel.clientInspector) localStorage.setItem('rdo_pref_inspector_name', newPersonnel.clientInspector);
              } catch {}
            }}
          />
        )}
      </div>

      {/* Bottom Step Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={handlePrevTab}
          disabled={navItems.findIndex(i => i.key === activeTab) === 0}
          className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition"
        >
          ← Seção Anterior
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Alterações
          </button>
        </div>

        <button
          type="button"
          onClick={handleNextTab}
          disabled={navItems.findIndex(i => i.key === activeTab) === navItems.length - 1}
          className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl disabled:opacity-30 disabled:pointer-events-none transition"
        >
          Próxima Seção →
        </button>
      </div>

      {/* WhatsApp Summary Modal */}
      <WhatsAppSummaryModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        report={report}
      />

    </div>
  );
};
