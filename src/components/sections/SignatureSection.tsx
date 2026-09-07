import React, { useState } from 'react';
import { PenTool, CheckCircle2, ShieldCheck, XCircle, UserCheck, Search, Edit3 } from 'lucide-react';
import { SignatureBlock } from '../../types/rdo';
import { SignatureCanvasModal } from '../SignatureCanvasModal';

interface SignatureSectionProps {
  signatures: {
    engineer: SignatureBlock;
    inspector: SignatureBlock;
  };
  engineerName: string;
  engineerCREA?: string;
  inspectorName: string;
  onUpdateSignaturesAndPersonnel: (
    updatedSignatures: { engineer: SignatureBlock; inspector: SignatureBlock },
    updatedPersonnel: { engineerName: string; engineerCREA: string; clientInspector: string }
  ) => void;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({
  signatures,
  engineerName,
  engineerCREA = '',
  inspectorName,
  onUpdateSignaturesAndPersonnel,
}) => {
  const [modalType, setModalType] = useState<'engineer' | 'inspector' | null>(null);

  // Editable local values with strict binding: respects empty strings if user clears
  const currentEngineerName = signatures.engineer.signerName !== undefined
    ? signatures.engineer.signerName
    : (engineerName || '');
  const currentEngineerRole = signatures.engineer.signerRole || 'Engenheiro Responsável Técnico';
  const currentEngineerCREA = engineerCREA || '';
  const currentInspectorName = signatures.inspector.signerName !== undefined
    ? signatures.inspector.signerName
    : (inspectorName || '');
  const currentInspectorRole = signatures.inspector.signerRole || 'Fiscal da Obra / Contratante';

  // Handlers for name & role changes
  const handleEngineerNameChange = (newName: string) => {
    const updatedSignatures = {
      ...signatures,
      engineer: {
        ...signatures.engineer,
        signerName: newName,
      },
    };
    const updatedPersonnel = {
      engineerName: newName,
      engineerCREA: currentEngineerCREA,
      clientInspector: currentInspectorName,
    };
    onUpdateSignaturesAndPersonnel(updatedSignatures, updatedPersonnel);
  };

  const handleEngineerRoleChange = (newRole: string) => {
    const updatedSignatures = {
      ...signatures,
      engineer: {
        ...signatures.engineer,
        signerRole: newRole,
      },
    };
    const updatedPersonnel = {
      engineerName: currentEngineerName,
      engineerCREA: currentEngineerCREA,
      clientInspector: currentInspectorName,
    };
    onUpdateSignaturesAndPersonnel(updatedSignatures, updatedPersonnel);
  };

  const handleEngineerCREAChange = (newCREA: string) => {
    const updatedPersonnel = {
      engineerName: currentEngineerName,
      engineerCREA: newCREA,
      clientInspector: currentInspectorName,
    };
    onUpdateSignaturesAndPersonnel(signatures, updatedPersonnel);
  };

  const handleInspectorNameChange = (newName: string) => {
    const updatedSignatures = {
      ...signatures,
      inspector: {
        ...signatures.inspector,
        signerName: newName,
      },
    };
    const updatedPersonnel = {
      engineerName: currentEngineerName,
      engineerCREA: currentEngineerCREA,
      clientInspector: newName,
    };
    onUpdateSignaturesAndPersonnel(updatedSignatures, updatedPersonnel);
  };

  const handleInspectorRoleChange = (newRole: string) => {
    const updatedSignatures = {
      ...signatures,
      inspector: {
        ...signatures.inspector,
        signerRole: newRole,
      },
    };
    const updatedPersonnel = {
      engineerName: currentEngineerName,
      engineerCREA: currentEngineerCREA,
      clientInspector: currentInspectorName,
    };
    onUpdateSignaturesAndPersonnel(updatedSignatures, updatedPersonnel);
  };

  const handleOpenSignatureModal = (type: 'engineer' | 'inspector') => {
    setModalType(type);
  };

  const handleSaveSignature = (signerName: string, signatureDataUrl: string) => {
    if (modalType === 'engineer') {
      const finalName = signerName.trim() || currentEngineerName;
      const updatedSignatures = {
        ...signatures,
        engineer: {
          signed: true,
          signerName: finalName,
          signerRole: currentEngineerRole,
          signatureDataUrl,
          signedAt: new Date().toISOString(),
        },
      };
      const updatedPersonnel = {
        engineerName: finalName,
        engineerCREA: currentEngineerCREA,
        clientInspector: currentInspectorName,
      };
      onUpdateSignaturesAndPersonnel(updatedSignatures, updatedPersonnel);
    } else if (modalType === 'inspector') {
      const finalName = signerName.trim() || currentInspectorName;
      const updatedSignatures = {
        ...signatures,
        inspector: {
          signed: true,
          signerName: finalName,
          signerRole: currentInspectorRole,
          signatureDataUrl,
          signedAt: new Date().toISOString(),
        },
      };
      const updatedPersonnel = {
        engineerName: currentEngineerName,
        engineerCREA: currentEngineerCREA,
        clientInspector: finalName,
      };
      onUpdateSignaturesAndPersonnel(updatedSignatures, updatedPersonnel);
    }
  };

  const handleClearSignature = (type: 'engineer' | 'inspector') => {
    const updatedSignatures = {
      ...signatures,
      [type]: {
        signed: false,
        signerName: type === 'engineer' ? currentEngineerName : currentInspectorName,
        signerRole: type === 'engineer' ? currentEngineerRole : currentInspectorRole,
        signatureDataUrl: undefined,
        signedAt: undefined,
      },
    };
    const updatedPersonnel = {
      engineerName: currentEngineerName,
      engineerCREA: currentEngineerCREA,
      clientInspector: currentInspectorName,
    };
    onUpdateSignaturesAndPersonnel(updatedSignatures, updatedPersonnel);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
      {/* Section Title */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Autenticação & Assinaturas Digitais do RDO</h2>
            <p className="text-xs text-slate-500">
              Personalize livremente os nomes e cargos dos signatários e valide com rubrica digital em tela.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-sky-50 text-sky-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-sky-200/60">
          <Edit3 className="w-3.5 h-3.5 text-sky-600" />
          <span>Nomes 100% Editáveis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ======================================================== */}
        {/* 1. Responsável Técnico (Engenheiro) Box */}
        {/* ======================================================== */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          
          {/* Header row */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-600" />
                Engenheiro Responsável Técnico
              </span>
              {signatures.engineer.signed ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Assinado
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Pendente
                </span>
              )}
            </div>

            {/* Editable Name & Role Inputs */}
            <div className="space-y-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nome do Engenheiro Responsável:
                </label>
                <input
                  type="text"
                  value={currentEngineerName}
                  onChange={(e) => handleEngineerNameChange(e.target.value)}
                  placeholder="Ex: Eng. Seu Nome Completo"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Cargo / Função:
                  </label>
                  <input
                    type="text"
                    value={currentEngineerRole}
                    onChange={(e) => handleEngineerRoleChange(e.target.value)}
                    placeholder="Ex: Responsável Técnico"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Registro CREA / CAU:
                  </label>
                  <input
                    type="text"
                    value={currentEngineerCREA}
                    onChange={(e) => handleEngineerCREAChange(e.target.value)}
                    placeholder="Ex: CREA-SP 506.912/D"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              {signatures.engineer.signedAt && (
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Assinado em: {new Date(signatures.engineer.signedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Signature Preview or Canvas Trigger */}
          <div>
            <div className="border border-slate-300 rounded-lg bg-white h-28 flex items-center justify-center overflow-hidden p-2 relative">
              {signatures.engineer.signatureDataUrl ? (
                <img
                  src={signatures.engineer.signatureDataUrl}
                  alt="Assinatura Engenheiro"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <span>Toque no botão abaixo para assinar digitalmente</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenSignatureModal('engineer')}
                className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition"
              >
                <PenTool className="w-3.5 h-3.5" />
                {signatures.engineer.signed ? 'Alterar Assinatura' : 'Assinar na Tela (Touch)'}
              </button>
              {signatures.engineer.signed && (
                <button
                  type="button"
                  onClick={() => handleClearSignature('engineer')}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Limpar assinatura"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. Fiscal da Obra / Contratante Box */}
        {/* ======================================================== */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          
          {/* Header row */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Fiscalização da Obra / Contratante
              </span>
              {signatures.inspector.signed ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Assinado
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Pendente
                </span>
              )}
            </div>

            {/* Editable Name & Role Inputs */}
            <div className="space-y-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nome do Fiscal da Obra:
                </label>
                <input
                  type="text"
                  value={currentInspectorName}
                  onChange={(e) => handleInspectorNameChange(e.target.value)}
                  placeholder="Ex: A definir / Arq. Fiscal / Nome do Fiscal"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                  Cargo / Entidade Fiscalizadora:
                </label>
                <input
                  type="text"
                  value={currentInspectorRole}
                  onChange={(e) => handleInspectorRoleChange(e.target.value)}
                  placeholder="Ex: Fiscal da Contratante / Gerenciadora"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {signatures.inspector.signedAt && (
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Assinado em: {new Date(signatures.inspector.signedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Signature Preview or Canvas Trigger */}
          <div>
            <div className="border border-slate-300 rounded-lg bg-white h-28 flex items-center justify-center overflow-hidden p-2 relative">
              {signatures.inspector.signatureDataUrl ? (
                <img
                  src={signatures.inspector.signatureDataUrl}
                  alt="Assinatura Fiscal"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <span>Toque no botão abaixo para assinar digitalmente</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenSignatureModal('inspector')}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition"
              >
                <PenTool className="w-3.5 h-3.5" />
                {signatures.inspector.signed ? 'Alterar Assinatura' : 'Assinar na Tela (Touch)'}
              </button>
              {signatures.inspector.signed && (
                <button
                  type="button"
                  onClick={() => handleClearSignature('inspector')}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Limpar assinatura"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Signature Modal */}
      {modalType && (
        <SignatureCanvasModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType === 'engineer' ? 'Assinatura do Engenheiro Responsável' : 'Assinatura do Fiscal da Obra'}
          signerRole={modalType === 'engineer' ? currentEngineerRole : currentInspectorRole}
          defaultName={modalType === 'engineer' ? currentEngineerName : currentInspectorName}
          onSaveSignature={handleSaveSignature}
        />
      )}
    </div>
  );
};
