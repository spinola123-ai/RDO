import React, { useEffect, useMemo } from 'react';
import { Building2, Calendar, FileText, UserCheck, MapPin, Clock, Hash, CheckCircle2, RotateCcw, CalendarClock } from 'lucide-react';
import { ProjectInfo } from '../../types/rdo';
import { calculateElapsedDays, calculateEndDate, formatDateBR } from '../../utils/dateUtils';

interface GeneralInfoSectionProps {
  reportNumber: number;
  date?: string;
  reportDate?: string;
  projectInfo: ProjectInfo;
  onUpdateProjectInfo: (info: ProjectInfo) => void;
  onUpdateDate?: (date: string) => void;
  onUpdateReportDate?: (date: string) => void;
  onUpdateNumber?: (num: number) => void;
  onUpdateReportNumber?: (num: number) => void;
}

export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  reportNumber,
  date,
  reportDate,
  projectInfo,
  onUpdateProjectInfo,
  onUpdateDate,
  onUpdateReportDate,
  onUpdateNumber,
  onUpdateReportNumber,
}) => {
  const actualDate = date || reportDate || '';
  const updateDateHandler = onUpdateDate || onUpdateReportDate || (() => {});
  const updateNumberHandler = onUpdateNumber || onUpdateReportNumber || (() => {});

  // Compute automatic elapsed days based on contract start date and RDO report date
  const autoElapsedDays = useMemo(() => {
    return calculateElapsedDays(projectInfo.startDate, actualDate);
  }, [projectInfo.startDate, actualDate]);

  // Projected contract completion date
  const projectedEndDate = useMemo(() => {
    return calculateEndDate(projectInfo.startDate, projectInfo.totalDays);
  }, [projectInfo.startDate, projectInfo.totalDays]);

  // Automatically synchronize elapsedDays whenever startDate or actualDate is provided
  useEffect(() => {
    if (projectInfo.startDate && actualDate && autoElapsedDays > 0) {
      if (projectInfo.elapsedDays !== autoElapsedDays) {
        onUpdateProjectInfo({
          ...projectInfo,
          elapsedDays: autoElapsedDays,
        });
      }
    }
  }, [projectInfo.startDate, actualDate, autoElapsedDays]);

  const handleChange = (field: keyof ProjectInfo, value: string | number) => {
    onUpdateProjectInfo({
      ...projectInfo,
      [field]: value,
    });
  };

  const handleStartDateChange = (newStartDate: string) => {
    const computedDays = actualDate ? calculateElapsedDays(newStartDate, actualDate) : projectInfo.elapsedDays;
    onUpdateProjectInfo({
      ...projectInfo,
      startDate: newStartDate,
      elapsedDays: computedDays > 0 ? computedDays : projectInfo.elapsedDays,
    });
  };

  const handleDateChange = (newDate: string) => {
    updateDateHandler(newDate);
    if (projectInfo.startDate && newDate) {
      const computedDays = calculateElapsedDays(projectInfo.startDate, newDate);
      if (computedDays > 0) {
        onUpdateProjectInfo({
          ...projectInfo,
          elapsedDays: computedDays,
        });
      }
    }
  };

  const handleRecalculateDays = () => {
    if (projectInfo.startDate && actualDate) {
      const computed = calculateElapsedDays(projectInfo.startDate, actualDate);
      if (computed > 0) {
        onUpdateProjectInfo({
          ...projectInfo,
          elapsedDays: computed,
        });
      }
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      updateNumberHandler(0);
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      updateNumberHandler(val);
    }
  };

  const handleNumberBlur = () => {
    if (!reportNumber || reportNumber < 1) {
      updateNumberHandler(1);
    }
  };

  const percentElapsed = projectInfo.totalDays > 0 
    ? Math.min(100, Math.round((projectInfo.elapsedDays / projectInfo.totalDays) * 100))
    : 0;

  const remainingDays = Math.max(0, (projectInfo.totalDays || 0) - (projectInfo.elapsedDays || 0));

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Identificação da Obra e Contrato</h2>
            <p className="text-xs text-slate-500">Dados cadastrais do canteiro de obras, numeração do diário e prazos contratuais</p>
          </div>
        </div>

        {/* Highlighted RDO Number and Date Badge */}
        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xs">
          <div className="text-right">
            <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Número do RDO</div>
            <div className="flex items-center gap-1 font-mono text-lg font-black text-white">
              <span>#</span>
              <input
                type="number"
                min="1"
                value={reportNumber === 0 ? '' : reportNumber}
                onChange={handleNumberChange}
                onBlur={handleNumberBlur}
                title="Clique para alterar a numeração do RDO (ex: 1, 2, 3...)"
                className="w-20 bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded-md text-center border border-slate-700 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
          </div>
          <div className="h-8 w-px bg-slate-700 mx-1" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Data do Relatório</div>
            <input
              type="date"
              value={actualDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        
        {/* Dedicated Number of RDO Field in Form Grid */}
        <div className="bg-amber-500/10 border border-amber-300/80 p-3 rounded-xl">
          <label className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-amber-700" />
            Número do Diário de Obra (RDO):
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-amber-900 text-sm">RDO Nº</span>
            <input
              type="number"
              min="1"
              value={reportNumber === 0 ? '' : reportNumber}
              onChange={handleNumberChange}
              onBlur={handleNumberBlur}
              placeholder="Ex: 1"
              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
            />
          </div>
          <p className="text-[10px] text-amber-900/80 mt-1">
            Você pode definir livremente como 1, 2, 3 ou qualquer número desejado.
          </p>
        </div>

        {/* Date Field in Form Grid */}
        <div>
          <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Data de Execução do Diário:
          </label>
          <input
            type="date"
            value={actualDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Client Name */}
        <div>
          <label className="font-semibold text-slate-700 mb-1 block">
            Cliente / Contratante:
          </label>
          <input
            type="text"
            value={projectInfo.clientName}
            onChange={(e) => handleChange('clientName', e.target.value)}
            placeholder="Ex: Vanguarda Incorporadora"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Project Name */}
        <div className="lg:col-span-2">
          <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            Nome da Obra / Empreendimento:
          </label>
          <input
            type="text"
            value={projectInfo.projectName}
            onChange={(e) => handleChange('projectName', e.target.value)}
            placeholder="Ex: Residencial Horizonte Park - Torre A e B"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Contract Code */}
        <div>
          <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Contrato / Ordem de Serviço (OS):
          </label>
          <input
            type="text"
            value={projectInfo.codeOrContract}
            onChange={(e) => handleChange('codeOrContract', e.target.value)}
            placeholder="Ex: CTR-2026/04"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* ART / RRT */}
        <div>
          <label className="font-semibold text-slate-700 mb-1 block">
            Número da ART / RRT:
          </label>
          <input
            type="text"
            value={projectInfo.artNumber}
            onChange={(e) => handleChange('artNumber', e.target.value)}
            placeholder="Ex: ART-SP 28941042-8"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Location */}
        <div className="lg:col-span-2">
          <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            Endereço / Local da Obra:
          </label>
          <input
            type="text"
            value={projectInfo.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Ex: Av. Paulista, 1420 - São Paulo, SP"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Engineer Name & CREA */}
        <div>
          <label className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              Engenheiro(a) Responsável Técnico:
            </span>
            <span className="text-[10px] text-sky-600 font-medium">Vinculado às assinaturas</span>
          </label>
          <input
            type="text"
            value={projectInfo.engineerName}
            onChange={(e) => handleChange('engineerName', e.target.value)}
            placeholder="Ex: Eng. Nome do Responsável Técnico"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 mb-1 block">
            CREA / CAU do Responsável:
          </label>
          <input
            type="text"
            value={projectInfo.engineerCREA}
            onChange={(e) => handleChange('engineerCREA', e.target.value)}
            placeholder="Ex: CREA-SP 506.912.441-0"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Client Inspector */}
        <div>
          <label className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span>Fiscal da Obra (Cliente / Fiscalização):</span>
            <span className="text-[10px] text-emerald-600 font-medium">Vinculado às assinaturas</span>
          </label>
          <input
            type="text"
            value={projectInfo.clientInspector}
            onChange={(e) => handleChange('clientInspector', e.target.value)}
            placeholder="Ex: Nome do Fiscal da Obra (ou a definir)"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Contract Timeline Strip */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              Controle de Prazo do Contrato:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Automático
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
            <span>
              {projectInfo.elapsedDays} de {projectInfo.totalDays} dias ({percentElapsed}%)
            </span>
            <button
              type="button"
              onClick={handleRecalculateDays}
              title="Forçar recálculo automático com base na data de início e na data do diário"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-sky-700 bg-white border border-slate-300 hover:border-sky-400 px-2 py-0.5 rounded transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-sky-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentElapsed}%` }}
          />
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-600 font-semibold block mb-1 flex items-center justify-between">
              <span>Início das Obras:</span>
              <span className="text-[10px] text-sky-600">Altera contagem</span>
            </label>
            <input
              type="date"
              value={projectInfo.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1 flex items-center justify-between">
              <span>Dias Decorridos:</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Calculado
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={projectInfo.elapsedDays}
                onChange={(e) => handleChange('elapsedDays', parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:border-sky-500 focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                dias
              </span>
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1 flex items-center justify-between">
              <span>Prazo Total Contratual:</span>
              <span className="text-[10px] text-slate-400">Total previsto</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={projectInfo.totalDays}
                onChange={(e) => handleChange('totalDays', parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:border-sky-500 focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                dias
              </span>
            </div>
          </div>
        </div>

        {/* Calculated Timeline Indicators */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 text-slate-700">
            <CalendarClock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            {projectInfo.startDate && actualDate ? (
              <span>
                Contagem automática: do início (<strong>{formatDateBR(projectInfo.startDate)}</strong>) até este diário (<strong>{formatDateBR(actualDate)}</strong>) = <strong>{projectInfo.elapsedDays}º dia</strong> de obra.
              </span>
            ) : (
              <span>Informe o início das obras para contagem automática dos dias.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              Saldo de Prazo: <strong className="text-slate-900">{remainingDays} dias</strong>
            </span>
            {projectedEndDate && (
              <span>
                Término Contratual Previsto: <strong className="text-slate-900">{projectedEndDate}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
