import React from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, Briefcase } from 'lucide-react';
import { DirectLaborItem, IndirectLaborItem } from '../../types/rdo';

interface LaborSectionProps {
  directLabor: DirectLaborItem[];
  indirectLabor: IndirectLaborItem[];
  onUpdateDirectLabor: (items: DirectLaborItem[]) => void;
  onUpdateIndirectLabor: (items: IndirectLaborItem[]) => void;
}

const COMMON_DIRECT_ROLES = [
  'Pedreiro de Alvenaria',
  'Pedreiro de Acabamento',
  'Servente de Obras',
  'Armador de Ferro',
  'Carpinteiro de Fôrmas',
  'Encarregado de Obras',
  'Eletricista Predial',
  'Encanador Hidráulico',
  'Pintor Civil',
  'Gesseiro / Drywall',
  'Montador de Estruturas',
  'Soldador',
  'Azulejista / Ladrilhista',
  'Operador de Equipamento',
];

const COMMON_INDIRECT_ROLES = [
  'Engenheiro Residente',
  'Engenheiro de Produção',
  'Mestre de Obras',
  'Técnico de Seg. Trabalho (TST)',
  'Almoxarife',
  'Auxiliar de Almoxarifado',
  'Topógrafo',
  'Auxiliar de Topografia',
  'Assistente Administrativo de Obra',
  'Estagiário de Engenharia',
  'Vigia / Porteiro',
];

export const LaborSection: React.FC<LaborSectionProps> = ({
  directLabor,
  indirectLabor,
  onUpdateDirectLabor,
  onUpdateIndirectLabor,
}) => {
  // Add new direct item
  const handleAddDirect = () => {
    const newItem: DirectLaborItem = {
      id: 'dl_' + Date.now(),
      role: 'Servente de Obras',
      company: 'Próprio',
      quantity: 1,
      hoursWorked: 8.8,
    };
    onUpdateDirectLabor([...directLabor, newItem]);
  };

  const handleUpdateDirect = (id: string, updates: Partial<DirectLaborItem>) => {
    onUpdateDirectLabor(
      directLabor.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveDirect = (id: string) => {
    onUpdateDirectLabor(directLabor.filter((item) => item.id !== id));
  };

  // Add new indirect item
  const handleAddIndirect = () => {
    const newItem: IndirectLaborItem = {
      id: 'il_' + Date.now(),
      role: 'Técnico de Seg. Trabalho (TST)',
      quantity: 1,
      hoursWorked: 8.8,
    };
    onUpdateIndirectLabor([...indirectLabor, newItem]);
  };

  const handleUpdateIndirect = (id: string, updates: Partial<IndirectLaborItem>) => {
    onUpdateIndirectLabor(
      indirectLabor.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveIndirect = (id: string) => {
    onUpdateIndirectLabor(indirectLabor.filter((item) => item.id !== id));
  };

  // Calculations
  const totalDirectHeadcount = directLabor.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalDirectHH = directLabor.reduce((acc, curr) => acc + (curr.quantity * (curr.hoursWorked || 0)), 0);

  const totalIndirectHeadcount = indirectLabor.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalIndirectHH = indirectLabor.reduce((acc, curr) => acc + (curr.quantity * (curr.hoursWorked || 0)), 0);

  const grandTotalHeadcount = totalDirectHeadcount + totalIndirectHeadcount;
  const grandTotalHH = totalDirectHH + totalIndirectHH;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Efetivo de Pessoal (Mão de Obra)</h2>
            <p className="text-xs text-slate-500">
              Controle de equipes diretas (produção) e indiretas (gestão) com cálculo automático de Homens-Hora (HH)
            </p>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Efetivo</span>
            <span className="text-lg font-black text-amber-400">{grandTotalHeadcount} colab.</span>
          </div>
          <div className="bg-sky-50 border border-sky-200 text-sky-900 px-3.5 py-1.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-sky-600 block">Total HH</span>
            <span className="text-lg font-black text-sky-800">{grandTotalHH.toFixed(1)} h</span>
          </div>
        </div>
      </div>

      {/* 1. DIRECT LABOR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Mão de Obra Direta (Operacional / Produção)
            </h3>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-semibold">
              {totalDirectHeadcount} trabalhadores • {totalDirectHH.toFixed(1)} HH
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddDirect}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Adicionar Função
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Função / Cargo</th>
                <th className="py-2.5 px-3">Vínculo / Empreiteira</th>
                <th className="py-2.5 px-3 w-24 text-center">Qtde (Pessoas)</th>
                <th className="py-2.5 px-3 w-28 text-center">Horas/Dia</th>
                <th className="py-2.5 px-3 w-28 text-center">Total HH</th>
                <th className="py-2.5 px-3 w-12 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {directLabor.map((item) => {
                const rowHH = (item.quantity || 0) * (item.hoursWorked || 0);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          list="direct-roles"
                          value={item.role}
                          onChange={(e) => handleUpdateDirect(item.id, { role: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium"
                          placeholder="Digite ou selecione a função"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.company}
                        onChange={(e) => handleUpdateDirect(item.id, { company: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
                        placeholder="Ex: Próprio ou Terceirizada X"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => handleUpdateDirect(item.id, { quantity: parseInt(e.target.value) || 0 })}
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-900"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="24"
                        value={item.hoursWorked || ''}
                        onChange={(e) => handleUpdateDirect(item.id, { hoursWorked: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-center text-slate-800"
                      />
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                      {rowHH.toFixed(1)} h
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveDirect(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remover função"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {directLabor.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    Nenhuma função direta cadastrada. Clique em "Adicionar Função".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. INDIRECT LABOR */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Mão de Obra Indireta (Engenharia, Gestão, Segurança e Apoio)
            </h3>
            <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-xs font-semibold">
              {totalIndirectHeadcount} profissionais • {totalIndirectHH.toFixed(1)} HH
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddIndirect}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Adicionar Indireto
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Cargo de Apoio / Técnico</th>
                <th className="py-2.5 px-3 w-28 text-center">Qtde (Pessoas)</th>
                <th className="py-2.5 px-3 w-28 text-center">Horas/Dia</th>
                <th className="py-2.5 px-3 w-28 text-center">Total HH</th>
                <th className="py-2.5 px-3 w-12 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {indirectLabor.map((item) => {
                const rowHH = (item.quantity || 0) * (item.hoursWorked || 0);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        list="indirect-roles"
                        value={item.role}
                        onChange={(e) => handleUpdateIndirect(item.id, { role: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium"
                        placeholder="Ex: Engenheiro Residente"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => handleUpdateIndirect(item.id, { quantity: parseInt(e.target.value) || 0 })}
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-900"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="24"
                        value={item.hoursWorked || ''}
                        onChange={(e) => handleUpdateIndirect(item.id, { hoursWorked: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-center text-slate-800"
                      />
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-sky-700 bg-sky-50/40">
                      {rowHH.toFixed(1)} h
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveIndirect(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remover indireto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {indirectLabor.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    Nenhum membro indireto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Datalists for autocompletion */}
      <datalist id="direct-roles">
        {COMMON_DIRECT_ROLES.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <datalist id="indirect-roles">
        {COMMON_INDIRECT_ROLES.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </div>
  );
};
