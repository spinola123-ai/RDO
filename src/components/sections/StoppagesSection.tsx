import React from 'react';
import { Clock, AlertOctagon, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { StoppageReason, WorkStoppageItem } from '../../types/rdo';

interface StoppagesSectionProps {
  stoppages: WorkStoppageItem[];
  onUpdateStoppages: (items: WorkStoppageItem[]) => void;
}

const REASONS_MAP: Record<StoppageReason, { label: string; badgeColor: string }> = {
  clima_chuva: { label: 'Chuva / Condições Climáticas', badgeColor: 'bg-blue-100 text-blue-800' },
  falta_material: { label: 'Falta / Atraso de Materiais', badgeColor: 'bg-amber-100 text-amber-800' },
  quebra_equipamento: { label: 'Quebra / Defeito de Equipamento', badgeColor: 'bg-orange-100 text-orange-800' },
  seguranca_acidente: { label: 'Segurança / Quase-Acidente / DDS Extra', badgeColor: 'bg-rose-100 text-rose-800' },
  falta_energia_agua: { label: 'Interrupção de Energia / Água', badgeColor: 'bg-purple-100 text-purple-800' },
  liberacao_projeto: { label: 'Atraso de Projeto / Fiscalização', badgeColor: 'bg-indigo-100 text-indigo-800' },
  greve_fiscalizacao: { label: 'Greve / Paralisação Externa', badgeColor: 'bg-slate-100 text-slate-800' },
  outros: { label: 'Outros Motivos de Paralisação', badgeColor: 'bg-slate-100 text-slate-800' },
};

function calculateDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

  const totalMin1 = h1 * 60 + m1;
  const totalMin2 = h2 * 60 + m2;
  if (totalMin2 <= totalMin1) return 0;

  return Math.round(((totalMin2 - totalMin1) / 60) * 100) / 100;
}

export const StoppagesSection: React.FC<StoppagesSectionProps> = ({
  stoppages,
  onUpdateStoppages,
}) => {
  const handleAdd = () => {
    const newItem: WorkStoppageItem = {
      id: 'stp_' + Date.now(),
      reason: 'clima_chuva',
      affectedTeamOrEquipment: 'Equipe de Alvenaria e Fôrmas',
      startTime: '14:00',
      endTime: '15:30',
      totalHours: 1.5,
      impactLevel: 'medio',
      description: 'Pancada forte de chuva que inviabilizou trabalhos em altura e terraplanagem.',
    };
    onUpdateStoppages([...stoppages, newItem]);
  };

  const handleUpdate = (id: string, updates: Partial<WorkStoppageItem>) => {
    onUpdateStoppages(
      stoppages.map((item) => {
        if (item.id === id) {
          const merged = { ...item, ...updates };
          if (updates.startTime || updates.endTime) {
            merged.totalHours = calculateDuration(merged.startTime, merged.endTime);
          }
          return merged;
        }
        return item;
      })
    );
  };

  const handleRemove = (id: string) => {
    onUpdateStoppages(stoppages.filter((item) => item.id !== id));
  };

  const totalStoppageHours = stoppages.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Apontamento de Horas Paradas & Paralisações</h2>
            <p className="text-xs text-slate-500">
              Registro formal de paradas por equipe ou equipamento (suporte técnico para pleitos e medições)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-1.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-rose-600 block">Total Horas Paradas</span>
            <span className="text-base font-black text-rose-700">{totalStoppageHours.toFixed(2)} h</span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold px-3 py-2 rounded-lg text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar Paralisação
          </button>
        </div>
      </div>

      {stoppages.length === 0 ? (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-6 text-center text-emerald-800 space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold">Nenhuma paralisação registrada no canteiro hoje</p>
          <p className="text-xs text-emerald-600 max-w-md mx-auto">
            A obra operou com fluxo produtivo contínuo. Caso haja ocorrência climática, falta de materiais ou quebra de maquinário, clique em "Registrar Paralisação".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stoppages.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    Ocorrência #{index + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${REASONS_MAP[item.reason].badgeColor}`}>
                    {REASONS_MAP[item.reason].label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Duração: <strong className="text-rose-600 font-bold">{item.totalHours.toFixed(2)} horas</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Excluir apontamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                {/* Reason dropdown */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Motivo da Paralisação:</label>
                  <select
                    value={item.reason}
                    onChange={(e) => handleUpdate(item.id, { reason: e.target.value as StoppageReason })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-sky-500"
                  >
                    {Object.entries(REASONS_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Affected team or equipment */}
                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Equipe ou Equipamento Afetado:
                  </label>
                  <input
                    type="text"
                    value={item.affectedTeamOrEquipment}
                    onChange={(e) => handleUpdate(item.id, { affectedTeamOrEquipment: e.target.value })}
                    placeholder="Ex: Equipe de Concretagem - Viga V-102 ou Escavadeira ESC-01"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                {/* Impact */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gravidade / Impacto:</label>
                  <select
                    value={item.impactLevel}
                    onChange={(e) => handleUpdate(item.id, { impactLevel: e.target.value as 'baixo' | 'medio' | 'critico' })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="baixo">Baixo (Remanejamento fácil)</option>
                    <option value="medio">Médio (Atraso parcial na frente)</option>
                    <option value="critico">Crítico (Impacto no caminho crítico)</option>
                  </select>
                </div>

                {/* Start & End Times */}
                <div className="md:col-span-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Horário Início:</label>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleUpdate(item.id, { startTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Horário Término:</label>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleUpdate(item.id, { endTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 text-xs sm:text-sm">
                      Detalhamento da Ocorrência, Causa Raiz & Providências Tomadas:
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      (Justificativa técnica para pleitos de prazo e medição)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={item.description}
                    onChange={(e) => handleUpdate(item.id, { description: e.target.value })}
                    placeholder="Descreva detalhadamente: o que motivou a paralisação, quais frentes e operários foram impactados, medidas tomadas no momento (remanejamento de equipes, comunicação à concessionária, ordem de serviço para mecânica, etc.)..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 leading-relaxed shadow-2xs resize-y"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
