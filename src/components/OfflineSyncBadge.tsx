import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload, ArrowDownCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineSyncBadgeProps {
  pendingCount: number;
  isSyncing: boolean;
  onManualSync?: () => void;
  onTriggerSync?: () => void;
  onRefreshFromServer?: () => void;
  lastSyncTime?: string;
}

export const OfflineSyncBadge: React.FC<OfflineSyncBadgeProps> = ({
  pendingCount,
  isSyncing,
  onManualSync,
  onTriggerSync,
  onRefreshFromServer,
  lastSyncTime,
}) => {
  const isOnline = useOnlineStatus();
  const handleSync = onManualSync || onTriggerSync || (() => {});

  return (
    <div className="w-full">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div id="offline-alert-banner" className="bg-amber-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>
              <strong>Modo Campo Offline:</strong> Sem sinal de internet no canteiro. Fotos, efetivo e relatórios estão sendo gravados com segurança na memória interna do seu aparelho.
            </span>
          </div>
          <span className="hidden md:inline-block bg-amber-700/80 px-2.5 py-0.5 rounded text-xs font-semibold">
            Upload automático ao reconectar
          </span>
        </div>
      )}

      {/* Online notification with pending items */}
      {isOnline && pendingCount > 0 && (
        <div id="pending-sync-banner" className="bg-sky-700 text-white px-4 py-2.5 text-xs md:text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
            <span>
              Conexão ativa! Há <strong>{pendingCount} {pendingCount === 1 ? 'relatório com fotos pendente' : 'relatórios com fotos pendentes'}</strong> para enviar para o servidor da publicação.
            </span>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-75"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Enviando para o Servidor...' : 'Sincronizar Agora na Nuvem'}
          </button>
        </div>
      )}

      {/* Fast status strip below header */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500 ring-2 ring-amber-200'}`} />
            <span className="font-semibold text-slate-700">
              {isOnline ? 'Conexão Online' : 'Sem Conexão (Offline)'}
            </span>
          </span>

          <span className="text-slate-300">|</span>

          <span className="flex items-center gap-1 text-slate-500">
            Armazenamento: <strong className="text-slate-700 font-medium">IndexedDB Local Ativo</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onRefreshFromServer && isOnline && (
            <button
              onClick={onRefreshFromServer}
              className="text-sky-700 hover:text-sky-900 text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/70 transition"
              title="Puxar os últimos dados atualizados do servidor"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Atualizar do Servidor</span>
            </button>
          )}

          {pendingCount > 0 ? (
            <button
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              className="text-amber-800 font-bold hover:underline flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded text-xs"
              title="Clique para sincronizar fotos e dados salvos no celular com a publicação"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
              {pendingCount} pendente(s) na nuvem
            </button>
          ) : (
            <span className="text-emerald-700 flex items-center gap-1 font-semibold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tudo sincronizado na nuvem
            </span>
          )}

          {lastSyncTime && (
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              ({new Date(lastSyncTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
