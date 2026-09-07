import React from 'react';
import { Truck, Plus, Trash2, Gauge, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { EquipmentItem, EquipmentStatus } from '../../types/rdo';

interface EquipmentSectionProps {
  equipment: EquipmentItem[];
  onUpdateEquipment: (items: EquipmentItem[]) => void;
}

const COMMON_MACHINES = [
  'Escavadeira Hidráulica 20T',
  'Retroescavadeira 4x4',
  'Caminhão Basculante 14m³',
  'Caminhão Pipa 10.000L',
  'Caminhão Munck / Guindauto',
  'Rolo Compactador Pé-de-Carneiro',
  'Rolo Compactador Liso',
  'Motoniveladora (Patrol)',
  'Trator de Esteiras D6',
  'Betoneira 400L Elétrica',
  'Gerador a Diesel 75kVA',
  'Compressor de Ar de Alta Pressão',
  'Bomba Submersível de Drenagem',
  'Grua / Guindaste Torre',
  'Plataforma Elevatória Tesoura',
  'Martelete Rompedor Pneumático',
];

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  equipment,
  onUpdateEquipment,
}) => {
  const handleAddEquipment = () => {
    const newItem: EquipmentItem = {
      id: 'eq_' + Date.now(),
      name: 'Retroescavadeira 4x4',
      codeOrPlate: 'RET-0' + (equipment.length + 1),
      quantity: 1,
      status: 'operando',
      hoursOperated: 8.0,
      hoursStandby: 0,
      hoursMaintenance: 0,
    };
    onUpdateEquipment([...equipment, newItem]);
  };

  const handleUpdate = (id: string, updates: Partial<EquipmentItem>) => {
    onUpdateEquipment(
      equipment.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemove = (id: string) => {
    onUpdateEquipment(equipment.filter((item) => item.id !== id));
  };

  const totalQuantity = equipment.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalOperatedHours = equipment.reduce((acc, curr) => acc + ((curr.hoursOperated || 0) * (curr.quantity || 1)), 0);
  const totalStandbyHours = equipment.reduce((acc, curr) => acc + ((curr.hoursStandby || 0) * (curr.quantity || 1)), 0);
  const totalMaintenanceHours = equipment.reduce((acc, curr) => acc + ((curr.hoursMaintenance || 0) * (curr.quantity || 1)), 0);

  const statusBadges: Record<EquipmentStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    operando: { label: 'Operando', bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', icon: <CheckCircle className="w-3 h-3 text-emerald-600" /> },
    espera: { label: 'Em Espera', bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', icon: <Clock className="w-3 h-3 text-amber-600" /> },
    manutencao: { label: 'Manutenção', bg: 'bg-rose-100 border-rose-300', text: 'text-rose-800', icon: <AlertTriangle className="w-3 h-3 text-rose-600" /> },
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Efetivo de Máquinas & Equipamentos</h2>
            <p className="text-xs text-slate-500">
              Controle diário de maquinário pesado, equipamentos de apoio, horas produtivas e paradas
            </p>
          </div>
        </div>

        {/* Global Machine Metric Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Máquinas</span>
            <span className="text-base font-black text-amber-400">{totalQuantity} unid.</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Horas Produtivas</span>
            <span className="text-base font-black text-emerald-700">{totalOperatedHours.toFixed(1)} h</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-amber-600 block">Horas Paradas</span>
            <span className="text-base font-black text-amber-700">{(totalStandbyHours + totalMaintenanceHours).toFixed(1)} h</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Informe as horas trabalhadas, em espera (standby) e em reparo mecânico para cada equipamento:
        </span>
        <button
          type="button"
          onClick={handleAddEquipment}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Equipamento
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-2.5 px-3">Equipamento / Modelo</th>
              <th className="py-2.5 px-3 w-28">Prefixo / Placa</th>
              <th className="py-2.5 px-3 w-20 text-center">Qtd</th>
              <th className="py-2.5 px-3 w-32 text-center">Status Operacional</th>
              <th className="py-2.5 px-3 w-24 text-center text-emerald-700">Horas Operando</th>
              <th className="py-2.5 px-3 w-24 text-center text-amber-700">Horas Espera</th>
              <th className="py-2.5 px-3 w-24 text-center text-rose-700">Horas Manut.</th>
              <th className="py-2.5 px-3 w-12 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipment.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition">
                <td className="py-2 px-3">
                  <input
                    type="text"
                    list="machines-list"
                    value={item.name}
                    onChange={(e) => handleUpdate(item.id, { name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium"
                    placeholder="Ex: Escavadeira Hidráulica 20T"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={item.codeOrPlate}
                    onChange={(e) => handleUpdate(item.id, { codeOrPlate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono uppercase text-slate-800"
                    placeholder="Ex: ESC-01"
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) => handleUpdate(item.id, { quantity: parseInt(e.target.value) || 0 })}
                    className="w-14 bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-slate-900"
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdate(item.id, { status: e.target.value as EquipmentStatus })}
                    className={`w-full text-xs font-semibold rounded px-2 py-1 border ${statusBadges[item.status].bg} ${statusBadges[item.status].text}`}
                  >
                    <option value="operando">Operando</option>
                    <option value="espera">Em Espera</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.hoursOperated || ''}
                    onChange={(e) => handleUpdate(item.id, { hoursOperated: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-semibold text-emerald-700"
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.hoursStandby || ''}
                    onChange={(e) => handleUpdate(item.id, { hoursStandby: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-semibold text-amber-700"
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.hoursMaintenance || ''}
                    onChange={(e) => handleUpdate(item.id, { hoursMaintenance: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-semibold text-rose-700"
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remover máquina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {equipment.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-slate-400">
                  Nenhum equipamento registrado hoje. Clique em "Adicionar Equipamento".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <datalist id="machines-list">
        {COMMON_MACHINES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
};
