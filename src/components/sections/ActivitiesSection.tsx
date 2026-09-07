import React from 'react';
import { ClipboardList, Plus, Trash2, CheckCircle2, AlertCircle, HardHat } from 'lucide-react';
import { ActivityItem, ActivityStatus } from '../../types/rdo';

interface ActivitiesSectionProps {
  activities: ActivityItem[];
  onUpdateActivities: (items: ActivityItem[]) => void;
}

const COMMON_SECTORS = [
  'Fundação / Estacas e Blocos',
  'Estrutura / Fôrmas e Armação',
  'Estrutura / Concretagem',
  'Alvenaria de Vedação / Estrutural',
  'Instalações Hidrossanitárias',
  'Instalações Elétricas e SPDA',
  'Revestimento Interno / Reboco / Gesso',
  'Impermeabilização de Lajes e Baldrames',
  'Cobertura / Telhado / Calhas',
  'Pavimentação Externa / Drenagem',
  'Esquadrias / Vidros / Serralheria',
  'Pintura Interna e Fachada',
];

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  activities,
  onUpdateActivities,
}) => {
  const handleAddActivity = () => {
    const newItem: ActivityItem = {
      id: 'act_' + Date.now(),
      sector: 'Estrutura / Fôrmas e Armação',
      description: 'Montagem de armadura de vigas e pilares com espaçadores de cobrimento.',
      progressPercent: 50,
      status: 'em_andamento',
      safetyDDS: true,
      crew: 'Equipe de Armadores',
      notes: 'Inspeção preliminar de armadura realizada sem não-conformidades.',
    };
    onUpdateActivities([...activities, newItem]);
  };

  const handleUpdate = (id: string, updates: Partial<ActivityItem>) => {
    onUpdateActivities(
      activities.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemove = (id: string) => {
    onUpdateActivities(activities.filter((item) => item.id !== id));
  };

  const statusColors: Record<ActivityStatus, { label: string; bg: string; text: string }> = {
    iniciado: { label: 'Iniciado', bg: 'bg-sky-100 border-sky-300', text: 'text-sky-800' },
    em_andamento: { label: 'Em Andamento', bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800' },
    concluido: { label: 'Concluído', bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800' },
    paralisado: { label: 'Paralisado', bg: 'bg-rose-100 border-rose-300', text: 'text-rose-800' },
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Atividades Executadas no Canteiro</h2>
            <p className="text-xs text-slate-500">
              Detalhamento técnico minucioso por frente de obra, avanço percentual e controle de qualidade
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddActivity}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Atividade / Frente de Serviço
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((item, index) => (
          <div
            key={item.id}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative hover:border-slate-300 transition"
          >
            {/* Header of Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="font-bold text-sm text-slate-900">
                  Frente #{index + 1}: {item.sector || 'Geral'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={item.status}
                  onChange={(e) => handleUpdate(item.id, { status: e.target.value as ActivityStatus })}
                  className={`text-xs font-bold rounded-md px-2.5 py-1 border ${statusColors[item.status].bg} ${statusColors[item.status].text}`}
                >
                  <option value="iniciado">Iniciado</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                  <option value="paralisado">Paralisado</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Remover atividade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Sector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Local / Frente de Serviço:
                </label>
                <input
                  type="text"
                  list="sectors-list"
                  value={item.sector}
                  onChange={(e) => handleUpdate(item.id, { sector: e.target.value })}
                  placeholder="Ex: Bloco A - 2º Pavimento"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium"
                />
              </div>

              {/* Crew */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Equipe / Encarregado Responsável:
                </label>
                <input
                  type="text"
                  value={item.crew}
                  onChange={(e) => handleUpdate(item.id, { crew: e.target.value })}
                  placeholder="Ex: Equipe de Formas - Mestre José"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                />
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Progresso da Tarefa:</label>
                  <span className="font-bold text-indigo-700">{item.progressPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={item.progressPercent}
                    onChange={(e) => handleUpdate(item.id, { progressPercent: parseInt(e.target.value) || 0 })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.progressPercent}
                    onChange={(e) => handleUpdate(item.id, { progressPercent: parseInt(e.target.value) || 0 })}
                    className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Technical Description */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 text-xs sm:text-sm">
                    Descrição Técnica dos Serviços Executados:
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Suporta texto longo e quebras de linha
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={item.description}
                  onChange={(e) => handleUpdate(item.id, { description: e.target.value })}
                  placeholder="Descreva detalhes dos serviços realizados nesta frente (ex: lançamento e vibração de concreto, armação de vigas e pilares conforme prancha EST-04, assentamento de blocos cerâmicos, conferência de prumo e nível)..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed shadow-2xs resize-y"
                />
              </div>

              {/* Technical notes & DDS status */}
              <div className="md:col-span-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 text-xs sm:text-sm">
                      Observações Técnicas / Ensaios / Liberações da Frente:
                    </label>
                    <span className="text-[10px] text-slate-500">
                      (Visível detalhadamente no RDO impresso)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={item.notes || ''}
                    onChange={(e) => handleUpdate(item.id, { notes: e.target.value })}
                    placeholder="Ex:
- Amostras de concreto moldadas para ensaio de resistência aos 7, 14 e 28 dias.
- Liberação formal da fiscalização registrada no projeto executivo.
- Verificação de cobrimento de armaduras com espaçadores tipo pastilha plástica."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed shadow-2xs resize-y"
                  />
                </div>

                {/* Safety toggle */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.safetyDDS}
                      onChange={(e) => handleUpdate(item.id, { safetyDDS: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <HardHat className="w-4 h-4 text-amber-500" />
                      DDS Específico desta frente de trabalho ministrado antes do início
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400">
            Nenhuma atividade cadastrada. Clique em "Nova Atividade / Frente de Serviço".
          </div>
        )}
      </div>

      <datalist id="sectors-list">
        {COMMON_SECTORS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
};
