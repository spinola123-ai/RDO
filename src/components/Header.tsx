import React from 'react';
import { HardHat, Plus, FileText, Printer, CloudUpload, RefreshCw } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  activeView: 'list' | 'editor' | 'print';
  onNavigate: (view: 'list' | 'editor' | 'print') => void;
  onNewRDO: () => void;
  pendingSyncCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
  activeRDONumber?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onNewRDO,
  pendingSyncCount,
  isSyncing,
  onManualSync,
  activeRDONumber,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Title */}
          <div
            onClick={() => onNavigate('list')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md group-hover:bg-amber-400 transition">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">RDO Obras</span>
                <span className="bg-sky-500/20 text-sky-400 border border-sky-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Offline-First
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Gerenciador Profissional de Diário de Obra
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onNavigate('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeView === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Diários Cadastrados
            </button>

            <button
              onClick={() => onNavigate('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeView === 'editor'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>Editor {activeRDONumber ? `(#${activeRDONumber})` : ''}</span>
            </button>

            <button
              onClick={() => onNavigate('print')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeView === 'print'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install PWA Button */}
            <PWAInstallButton />

            {/* Sync Cloud Trigger if online */}
            {isOnline && pendingSyncCount > 0 && (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
                title="Sincronizar dados com a nuvem"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando' : `Sync (${pendingSyncCount})`}</span>
              </button>
            )}

            {/* New RDO Button */}
            <button
              onClick={onNewRDO}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo RDO</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
