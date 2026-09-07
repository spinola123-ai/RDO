import React, { useState } from 'react';
import { Download, CheckCircle2, HardHat, Smartphone, Apple, X, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstalled, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAndroidInstall = async () => {
    if (loading) return;
    setLoading(true);
    setShowMenu(false);
    try {
      setFeedback('Abrindo instalador para Android / PC...');
      setTimeout(() => setFeedback(null), 4000);
      await install();
    } catch (err) {
      console.error('Install error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIOSClick = () => {
    setShowMenu(false);
    setShowIOSModal(true);
  };

  // If already installed
  if (isInstalled) {
    if (variant === 'banner') {
      return (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                <span>Aplicativo Instalado no Dispositivo</span>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Offline Ativo
                </span>
              </h4>
              <p className="text-[11px] text-emerald-800">
                Você já está usando a versão autônoma do RDO Obras com salvamento local.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs"
        title="Aplicativo instalado e pronto para uso offline"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">App Instalado</span>
        <span className="sm:hidden">Instalado</span>
      </div>
    );
  }

  // IOS Instructions Modal
  const iosModalElement = showIOSModal && (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-slate-900">
        <button
          type="button"
          onClick={() => setShowIOSModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900">Instalar no iPhone / iPad (iOS)</h3>
            <p className="text-xs text-slate-500">Passo a passo rápido via Safari</p>
          </div>
        </div>

        <ol className="space-y-3 text-xs sm:text-sm text-slate-700 list-decimal pl-4 mb-6">
          <li>Abra este aplicativo no navegador <strong>Safari</strong> do seu iPhone ou iPad.</li>
          <li>Toque no ícone de <strong>Compartilhar</strong> (o quadrado com a seta para cima <span className="inline-block px-1.5 py-0.5 bg-slate-100 border rounded font-bold">⎋</span>) na barra inferior do Safari.</li>
          <li>Role o menu de opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
          <li>Confirme tocando em <strong>Adicionar</strong> no canto superior direito. O ícone do RDO aparecerá na sua tela inicial!</li>
        </ol>

        <button
          type="button"
          onClick={() => setShowIOSModal(false)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm shadow transition"
        >
          Entendido
        </button>
      </div>
    </div>
  );

  // Banner layout
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/20 border border-amber-500/35 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs relative overflow-hidden">
        {iosModalElement}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <span>Baixar Aplicativo no Celular ou Computador</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Uso Offline
              </span>
            </h4>
            <p className="text-[11px] text-slate-600">
              Escolha seu sistema para instalar e usar no canteiro mesmo sem internet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {feedback && (
            <span className="text-[11px] text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg font-medium">
              {feedback}
            </span>
          )}

          <button
            type="button"
            onClick={handleAndroidInstall}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android / PC</span>
          </button>

          <button
            type="button"
            onClick={handleIOSClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iOS</span>
          </button>
        </div>
      </div>
    );
  }

  // Header button layout
  return (
    <div className="relative flex items-center">
      {iosModalElement}
      <button
        id="pwa-install-header-btn"
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shadow-sm transition border border-amber-400/40 cursor-pointer"
        title="Baixar e instalar aplicativo direto no Android ou iOS"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Baixar App</span>
        <span className="sm:hidden">Baixar</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
          <div className="absolute top-full mt-2 right-0 bg-slate-900 text-white text-xs py-2 px-2 rounded-xl shadow-2xl z-50 w-56 border border-slate-700 space-y-1 animate-fadeIn">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              Escolha seu dispositivo:
            </div>
            <button
              type="button"
              onClick={handleAndroidInstall}
              className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition font-semibold text-amber-400"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <div>
                <div>Android / PC</div>
                <div className="text-[10px] font-normal text-slate-400">Instalação direta</div>
              </div>
            </button>
            <button
              type="button"
              onClick={handleIOSClick}
              className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition font-semibold text-sky-400"
            >
              <Apple className="w-4 h-4 shrink-0" />
              <div>
                <div>iPhone / iPad (iOS)</div>
                <div className="text-[10px] font-normal text-slate-400">Passo a passo no Safari</div>
              </div>
            </button>
          </div>
        </>
      )}

      {feedback && (
        <div className="absolute top-full mt-2 right-0 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl z-50 whitespace-nowrap border border-slate-700 animate-fadeIn">
          {feedback}
        </div>
      )}
    </div>
  );
};
