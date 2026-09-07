import React, { useState } from 'react';
import { Printer, ArrowLeft, Building2, Calendar, MapPin, CheckCircle, Shield, AlertTriangle, MessageSquare } from 'lucide-react';
import { RDOReport } from '../types/rdo';
import { WhatsAppSummaryModal } from './WhatsAppSummaryModal';

interface RDOPrintViewProps {
  report: RDOReport;
  onBack: () => void;
}

export const RDOPrintView: React.FC<RDOPrintViewProps> = ({ report, onBack }) => {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const totalDirectHH = report.directLabor.reduce((acc, curr) => acc + (curr.quantity * (curr.hoursWorked || 0)), 0);
  const totalIndirectHH = report.indirectLabor.reduce((acc, curr) => acc + (curr.quantity * (curr.hoursWorked || 0)), 0);
  const totalDirectWorkers = report.directLabor.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalIndirectWorkers = report.indirectLabor.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalStoppageHours = report.stoppages.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-2 sm:px-6">
      {/* Non-printable Top Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-xs border border-slate-200 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Aplicativo
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsWhatsAppOpen(true)}
            className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 font-black text-sm px-4 py-2 rounded-xl shadow-sm transition"
            title="Enviar resumo do RDO via WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-slate-950" />
            <span>Enviar no WhatsApp</span>
          </button>

          <span className="text-xs text-slate-500 hidden sm:inline">
            Dica: Selecione "Salvar como PDF" no destino de impressão.
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-sm px-5 py-2 rounded-xl shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 formatting) */}
      <div id="rdo-print-sheet" className="max-w-4xl mx-auto bg-white shadow-xl border border-slate-300 p-6 sm:p-10 font-sans text-slate-900 print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="border-2 border-slate-900 p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-black text-xl rounded">
                RDO
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  Relatório Diário de Obra
                </h1>
                <p className="text-xs font-bold text-slate-600">
                  {report.projectInfo.projectName || 'Empreendimento Civil'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-300">
                RDO Nº {String(report.reportNumber).padStart(4, '0')}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-1">
                Data: {new Date(report.date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] leading-tight text-slate-800">
            <div>
              <span className="font-bold text-slate-900 block">Cliente / Contratante:</span>
              <span>{report.projectInfo.clientName || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Contrato / OS:</span>
              <span>{report.projectInfo.codeOrContract || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">ART / RRT:</span>
              <span>{report.projectInfo.artNumber || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Prazo Contratual:</span>
              <span>Dia {report.projectInfo.elapsedDays} de {report.projectInfo.totalDays}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-900 block">Localização da Obra:</span>
              <span>{report.projectInfo.location || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Resp. Técnico:</span>
              <span>{report.signatures.engineer.signerName || report.projectInfo.engineerName || '-'} ({report.projectInfo.engineerCREA || report.signatures.engineer.signerCrea || 'CREA'})</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Fiscal da Obra:</span>
              <span>{report.signatures.inspector.signerName || report.projectInfo.clientInspector || '-'}</span>
            </div>
          </div>
        </div>

        {/* 1. Weather Table */}
        <div className="mb-4 border border-slate-400">
          <div className="bg-slate-200 text-slate-950 border-b border-slate-400 text-xs font-black px-2.5 py-1 uppercase tracking-wide">
            1. Condições Meteorológicas e Praticabilidade do Canteiro
          </div>
          <table className="w-full text-[11px] text-center">
            <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-900">
              <tr>
                <th className="p-1.5 border-r border-slate-300">Turno</th>
                <th className="p-1.5 border-r border-slate-300">Condição do Tempo</th>
                <th className="p-1.5 border-r border-slate-300">Condição do Terreno</th>
                <th className="p-1.5 border-r border-slate-300">Temp. Aprox.</th>
                <th className="p-1.5">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-1.5 font-bold border-r border-slate-300">Manhã</td>
                <td className="p-1.5 border-r border-slate-300 capitalize">{report.weather.morning.condition.replace('_', ' ')}</td>
                <td className="p-1.5 border-r border-slate-300 font-bold uppercase">{report.weather.morning.groundCondition}</td>
                <td className="p-1.5 border-r border-slate-300">{report.weather.morning.temperature ? `${report.weather.morning.temperature}°C` : '-'}</td>
                <td className="p-1.5 text-left">{report.weather.morning.notes || 'Normalidade'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold border-r border-slate-300">Tarde</td>
                <td className="p-1.5 border-r border-slate-300 capitalize">{report.weather.afternoon.condition.replace('_', ' ')}</td>
                <td className="p-1.5 border-r border-slate-300 font-bold uppercase">{report.weather.afternoon.groundCondition}</td>
                <td className="p-1.5 border-r border-slate-300">{report.weather.afternoon.temperature ? `${report.weather.afternoon.temperature}°C` : '-'}</td>
                <td className="p-1.5 text-left">{report.weather.afternoon.notes || 'Normalidade'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold border-r border-slate-300">Noite</td>
                <td className="p-1.5 border-r border-slate-300 capitalize">{report.weather.night.condition.replace('_', ' ')}</td>
                <td className="p-1.5 border-r border-slate-300 font-bold uppercase">{report.weather.night.groundCondition}</td>
                <td className="p-1.5 border-r border-slate-300">{report.weather.night.temperature ? `${report.weather.night.temperature}°C` : '-'}</td>
                <td className="p-1.5 text-left">{report.weather.night.notes || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Workforce Tables */}
        <div className="mb-4 border border-slate-400">
          <div className="bg-slate-200 text-slate-950 border-b border-slate-400 text-xs font-black px-2.5 py-1 uppercase tracking-wide flex justify-between">
            <span>2. Efetivo de Mão de Obra</span>
            <span>Total: {totalDirectWorkers + totalIndirectWorkers} colaboradores • {(totalDirectHH + totalIndirectHH).toFixed(1)} HH</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-white">
            <div className="border border-slate-200 p-1.5 rounded">
              <div className="font-bold text-[11px] text-slate-950 border-b border-slate-200 pb-1 mb-1 flex justify-between">
                <span>Mão de Obra Direta:</span>
                <span>{totalDirectWorkers} pess. / {totalDirectHH.toFixed(1)} HH</span>
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-slate-700 border-b border-slate-200 font-bold">
                    <th className="text-left py-0.5">Função</th>
                    <th className="text-center py-0.5">Qtd</th>
                    <th className="text-center py-0.5">Horas</th>
                    <th className="text-right py-0.5">Total HH</th>
                  </tr>
                </thead>
                <tbody>
                  {report.directLabor.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-0.5 font-medium">{item.role} <span className="text-[9px] text-slate-500">({item.company})</span></td>
                      <td className="py-0.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-0.5 text-center">{item.hoursWorked}h</td>
                      <td className="py-0.5 text-right font-mono">{(item.quantity * item.hoursWorked).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-slate-200 p-1.5 rounded">
              <div className="font-bold text-[11px] text-slate-950 border-b border-slate-200 pb-1 mb-1 flex justify-between">
                <span>Mão de Obra Indireta:</span>
                <span>{totalIndirectWorkers} pess. / {totalIndirectHH.toFixed(1)} HH</span>
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-slate-700 border-b border-slate-200 font-bold">
                    <th className="text-left py-0.5">Cargo / Apoio</th>
                    <th className="text-center py-0.5">Qtd</th>
                    <th className="text-center py-0.5">Horas</th>
                    <th className="text-right py-0.5">Total HH</th>
                  </tr>
                </thead>
                <tbody>
                  {report.indirectLabor.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-0.5 font-medium">{item.role}</td>
                      <td className="py-0.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-0.5 text-center">{item.hoursWorked}h</td>
                      <td className="py-0.5 text-right font-mono">{(item.quantity * item.hoursWorked).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Machinery Table */}
        <div className="mb-4 border border-slate-400">
          <div className="bg-slate-200 text-slate-950 border-b border-slate-400 text-xs font-black px-2.5 py-1 uppercase tracking-wide">
            3. Efetivo de Equipamentos & Máquinas
          </div>
          <table className="w-full text-[10px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-900">
              <tr>
                <th className="p-1 text-left border-r border-slate-300">Equipamento</th>
                <th className="p-1 text-center border-r border-slate-300">Identificação</th>
                <th className="p-1 text-center border-r border-slate-300">Qtd</th>
                <th className="p-1 text-center border-r border-slate-300">Status</th>
                <th className="p-1 text-center border-r border-slate-300">Horas Operando</th>
                <th className="p-1 text-center border-r border-slate-300">Horas Espera</th>
                <th className="p-1 text-center">Horas Manutenção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.equipment.map((item) => (
                <tr key={item.id}>
                  <td className="p-1 font-semibold border-r border-slate-200">{item.name}</td>
                  <td className="p-1 text-center font-mono border-r border-slate-200">{item.codeOrPlate}</td>
                  <td className="p-1 text-center font-bold border-r border-slate-200">{item.quantity}</td>
                  <td className="p-1 text-center uppercase font-bold text-[9px] border-r border-slate-200">{item.status}</td>
                  <td className="p-1 text-center font-mono border-r border-slate-200">{item.hoursOperated} h</td>
                  <td className="p-1 text-center font-mono border-r border-slate-200">{item.hoursStandby} h</td>
                  <td className="p-1 text-center font-mono">{item.hoursMaintenance} h</td>
                </tr>
              ))}
              {report.equipment.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-2 text-center text-slate-400">Sem maquinário alocado no dia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Stoppages Table (If any) */}
        {report.stoppages.length > 0 && (
          <div className="mb-4 border border-slate-400">
            <div className="bg-slate-200 text-slate-950 border-b border-slate-400 text-xs font-black px-2.5 py-1 uppercase tracking-wide flex justify-between">
              <span>4. Apontamento de Paralisações / Horas Paradas</span>
              <span>Total Parado: {totalStoppageHours.toFixed(2)} horas</span>
            </div>
            <table className="w-full text-[10px]">
              <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-900">
                <tr>
                  <th className="p-1 text-left border-r border-slate-300">Motivo</th>
                  <th className="p-1 text-left border-r border-slate-300">Equipe/Máquina Afetada</th>
                  <th className="p-1 text-center border-r border-slate-300">Período</th>
                  <th className="p-1 text-center border-r border-slate-300">Horas</th>
                  <th className="p-1 text-left">Detalhamento / Justificativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.stoppages.map((item) => (
                  <tr key={item.id}>
                    <td className="p-1 font-bold text-slate-900 uppercase text-[9px] border-r border-slate-200">{item.reason.replace('_', ' ')}</td>
                    <td className="p-1 font-medium border-r border-slate-200">{item.affectedTeamOrEquipment}</td>
                    <td className="p-1 text-center font-mono border-r border-slate-200">{item.startTime} às {item.endTime}</td>
                    <td className="p-1 text-center font-bold border-r border-slate-200">{item.totalHours.toFixed(2)} h</td>
                    <td className="p-1 whitespace-pre-wrap break-words">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Worksite Activities */}
        <div className="mb-4 border border-slate-400">
          <div className="bg-slate-200 text-slate-950 border-b border-slate-400 text-xs font-black px-2.5 py-1 uppercase tracking-wide">
            5. Atividades Executadas & Observações Detalhadas
          </div>
          <table className="w-full text-[10px]">
            <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-900">
              <tr>
                <th className="p-1 text-left w-1/4 border-r border-slate-300">Frente de Obra / Setor</th>
                <th className="p-1 text-left w-1/2 border-r border-slate-300">Descrição Técnica das Atividades</th>
                <th className="p-1 text-center w-16 border-r border-slate-300">Avanço %</th>
                <th className="p-1 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.activities.map((item) => (
                <tr key={item.id} className="print-avoid-break">
                  <td className="p-1.5 font-bold align-top border-r border-slate-200">
                    {item.sector}
                    {item.crew && <span className="block font-normal text-[9px] text-slate-500">Resp: {item.crew}</span>}
                  </td>
                  <td className="p-1.5 align-top border-r border-slate-200">
                    <div className="text-slate-900 leading-snug whitespace-pre-wrap break-words">{item.description}</div>
                    {item.notes && <div className="text-slate-600 italic mt-1 whitespace-pre-wrap break-words text-[9px]">Obs: {item.notes}</div>}
                  </td>
                  <td className="p-1.5 text-center align-top font-bold border-r border-slate-200">{item.progressPercent}%</td>
                  <td className="p-1.5 text-center align-top uppercase font-bold text-[9px]">{item.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 6. Safety, Environment & Notes */}
        <div className="mb-4 border border-slate-400">
          <div className="bg-slate-200 text-slate-950 border-b border-slate-400 text-xs font-black px-2.5 py-1 uppercase tracking-wide">
            6. Segurança do Trabalho (SST), Meio Ambiente & Observações Gerais
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] p-2 bg-white">
            <div className="bg-white p-2 border border-slate-200 rounded">
              <div className="font-bold text-slate-950 border-b border-slate-200 pb-1 mb-1 uppercase text-[11px]">
                Segurança do Trabalho (SST) & Meio Ambiente
              </div>
              <p><strong>DDS Realizado:</strong> {report.safety.ddsRealized ? 'Sim' : 'Não'} — <em>{report.safety.ddsTheme || 'Sem tema registrado'}</em></p>
              <p className="mt-1"><strong>Inspeção de EPIs:</strong> <span className="uppercase font-bold">{report.safety.epiInspectionStatus}</span></p>
              <p className="mt-1"><strong>Acidentes no Canteiro:</strong> {report.safety.incidentsReported ? `Sim (${report.safety.incidentDetails})` : 'Zero Ocorrências / 100% Conforme'}</p>
              {report.safety.wasteManagementNotes && <div className="mt-1 whitespace-pre-wrap break-words"><strong>Gestão de Resíduos:</strong> {report.safety.wasteManagementNotes}</div>}
            </div>

            <div className="bg-white p-2 border border-slate-200 rounded">
              <div className="font-bold text-slate-950 border-b border-slate-200 pb-1 mb-1 uppercase text-[11px]">
                Observações Gerais da Fiscalização
              </div>
              <div className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words text-[10px]">
                {report.generalNotes || 'Atividades concluídas conforme planejamento diário sem desvios relevantes.'}
              </div>
            </div>
          </div>
        </div>

        {/* 7. Photographic Report */}
        {report.photos.length > 0 && (
          <div className="mb-4 border border-slate-400 print-avoid-break">
            <div className="bg-slate-200 text-slate-950 border-b border-slate-400 text-xs font-black px-2.5 py-1 uppercase tracking-wide mb-2">
              7. Relatório Fotográfico de Campo ({report.photos.length} fotos)
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-white">
              {report.photos.map((photo, index) => (
                <div key={photo.id} className="border border-slate-300 rounded p-1.5 flex flex-col justify-between print-avoid-break bg-white">
                  <div className="h-36 sm:h-40 bg-slate-100 flex items-center justify-center overflow-hidden rounded mb-1 border border-slate-200">
                    <img
                      src={photo.base64Data}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[10px] text-slate-800">
                    <div className="font-bold text-slate-950">
                      Foto {index + 1}: {photo.sectorTag || 'Canteiro'}
                    </div>
                    <div className="text-slate-700 whitespace-pre-wrap break-words line-clamp-3 mt-0.5">
                      {photo.caption}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">
                      Registro: {new Date(photo.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Signatures Block */}
        <div className="border-t-2 border-slate-900 pt-4 mt-6">
          <div className="text-center text-[10px] text-slate-500 mb-6 uppercase tracking-wider font-semibold">
            Termo de Encerramento e Autenticação Técnica do Relatório Diário de Obra
          </div>

          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            {/* Engineer Signature */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-48 flex items-center justify-center mb-1">
                {report.signatures.engineer.signatureDataUrl ? (
                  <img
                    src={report.signatures.engineer.signatureDataUrl}
                    alt="Assinatura Resp. Técnico"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-[10px] text-slate-400 italic">Pendente de assinatura</div>
                )}
              </div>
              <div className="w-56 border-t border-slate-900 pt-1">
                <div className="font-bold text-slate-900">{report.signatures.engineer.signerName || report.projectInfo.engineerName || 'A Definir'}</div>
                <div className="text-[10px] text-slate-600">{report.signatures.engineer.signerRole || 'Engenheiro Responsável Técnico'}</div>
                <div className="text-[9px] text-slate-400">{report.signatures.engineer.signerCrea || report.projectInfo.engineerCREA || 'CREA/CAU'}</div>
              </div>
            </div>

            {/* Inspector Signature */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-48 flex items-center justify-center mb-1">
                {report.signatures.inspector.signatureDataUrl ? (
                  <img
                    src={report.signatures.inspector.signatureDataUrl}
                    alt="Assinatura Fiscal"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-[10px] text-slate-400 italic">Pendente de assinatura</div>
                )}
              </div>
              <div className="w-56 border-t border-slate-900 pt-1">
                <div className="font-bold text-slate-900">{report.signatures.inspector.signerName || report.projectInfo.clientInspector || 'A Definir'}</div>
                <div className="text-[10px] text-slate-600">{report.signatures.inspector.signerRole || 'Fiscal da Contratante'}</div>
                <div className="text-[9px] text-slate-400">{report.projectInfo.clientName}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* WhatsApp Summary Modal */}
      <WhatsAppSummaryModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        report={report}
      />
    </div>
  );
};
