import React from 'react';
import { Shield, HardHat, AlertTriangle, Recycle, CheckCircle2 } from 'lucide-react';
import { SafetyAndEnvironment } from '../../types/rdo';

interface SafetySectionProps {
  safety: SafetyAndEnvironment;
  generalNotes: string;
  onUpdateSafety: (safety: SafetyAndEnvironment) => void;
  onUpdateGeneralNotes: (notes: string) => void;
}

const COMMON_DDS_THEMES = [
  'NR-35: Trabalho em Altura - Uso do cinto tipo paraquedista e linha de vida',
  'NR-18: Ordem e Limpeza no Canteiro - Prevenção contra quedas de mesmo nível',
  'NR-10: Segurança em Instalações Elétricas Provisórias e Extensões',
  'Uso e Conservação dos EPIs (Capacete com jugular, óculos, bota com biqueira)',
  'NR-12: Operação e Manutenção Segura de Máquinas e Equipamentos Pesados',
  'Proteção de Periferia, Guarda-corpos e Aberturas de Piso',
  'Movimentação e Içamento de Cargas com Caminhão Munck e Grua',
  'Hidratação, Exposição Solar e Prevenção de Fadiga Térmica',
];

export const SafetySection: React.FC<SafetySectionProps> = ({
  safety,
  generalNotes,
  onUpdateSafety,
  onUpdateGeneralNotes,
}) => {
  const handleSafetyChange = (field: keyof SafetyAndEnvironment, value: any) => {
    onUpdateSafety({
      ...safety,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Segurança do Trabalho (SST) & Meio Ambiente</h2>
          <p className="text-xs text-slate-500">
            Registro do DDS diário, fiscalização de EPIs, ocorrências de segurança e controle ambiental
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* DDS Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <HardHat className="w-4 h-4 text-amber-500" />
              Diálogo Diário de Segurança (DDS)
            </span>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
              <input
                type="checkbox"
                checked={safety.ddsRealized}
                onChange={(e) => handleSafetyChange('ddsRealized', e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              DDS Realizado Hoje
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tema / Conteúdo Abordado no DDS:
            </label>
            <input
              type="text"
              list="dds-themes"
              value={safety.ddsTheme}
              onChange={(e) => handleSafetyChange('ddsTheme', e.target.value)}
              placeholder="Digite ou selecione o tema abordado com os operários"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Inspeção de EPIs e Condições de Risco:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'conforme', label: '100% Conforme', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                { key: 'atencao', label: 'Atenção / Advertência', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                { key: 'irregular', label: 'Não Conforme', color: 'bg-rose-100 text-rose-800 border-rose-300' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSafetyChange('epiInspectionStatus', item.key)}
                  className={`py-1.5 px-2 rounded-lg font-bold border text-center transition ${
                    safety.epiInspectionStatus === item.key
                      ? item.color + ' ring-1 ring-slate-400 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Incidents & Environmental Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Ocorrências / Acidentes de Trabalho
            </span>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-rose-700">
              <input
                type="checkbox"
                checked={safety.incidentsReported}
                onChange={(e) => handleSafetyChange('incidentsReported', e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              Houve Ocorrência / Acidente
            </label>
          </div>

          {safety.incidentsReported ? (
            <div>
              <label className="font-semibold text-rose-800 block mb-1">
                Detalhamento do Incidente, Vítimas e Providências Imediatas:
              </label>
              <textarea
                rows={2}
                value={safety.incidentDetails || ''}
                onChange={(e) => handleSafetyChange('incidentDetails', e.target.value)}
                placeholder="Descreva a dinâmica do ocorrido, atendimento médico, abertura de CAT e ações corretivas..."
                className="w-full bg-white border border-rose-300 rounded-lg p-2 text-rose-900 text-xs focus:outline-hidden"
              />
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero acidentes no canteiro hoje. Normas de segurança cumpridas integralmente.</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-emerald-600" />
              Meio Ambiente e Gestão de Resíduos:
            </label>
            <textarea
              rows={3}
              value={safety.wasteManagementNotes || ''}
              onChange={(e) => handleSafetyChange('wasteManagementNotes', e.target.value)}
              placeholder="Ex: Caçambas de entulho recolhidas pela empresa licenciada; destinação de sucata metálica e limpeza das baias de agregados..."
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
            />
          </div>
        </div>
      </div>

      {/* General Notes Section */}
      <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="font-black text-slate-900 block text-sm sm:text-base">
            Observações Gerais da Fiscalização e Resumo Executivo do Dia:
          </label>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full self-start">
            Texto Livre • Suporta quebras de linha e parágrafos
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Utilize este campo amplo para detalhar visitas técnicas, entregas de caminhões de materiais, resultados de ensaios tecnológicos (slump/corpos de prova), recados contratuais e orientações para o próximo turno.
        </p>
        <textarea
          rows={7}
          value={generalNotes}
          onChange={(e) => onUpdateGeneralNotes(e.target.value)}
          placeholder="Ex:
- Recebimento de 2 caminhões de brita nº 1 e 1 caminhão de areia média (NF 45892).
- Visita técnica do projetista de estruturas Eng. Roberto às 10h para liberação das armaduras da laje L-04.
- Concretagem programada para amanhã às 08:00 com previsão de 32m³ de fck 30 MPa.
- Reunião de alinhamento com encarregados sobre o cumprimento rigoroso dos prazos contratuais."
          className="w-full bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/40 rounded-xl p-4 text-sm font-medium text-slate-900 leading-relaxed shadow-2xs resize-y min-h-[160px]"
        />
        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
          <span>O texto digitado aqui será impresso exatamente com as quebras de linha e formatação que você definir.</span>
          <span>{generalNotes.length} caracteres</span>
        </div>
      </div>

      <datalist id="dds-themes">
        {COMMON_DDS_THEMES.map((theme) => (
          <option key={theme} value={theme} />
        ))}
      </datalist>
    </div>
  );
};
