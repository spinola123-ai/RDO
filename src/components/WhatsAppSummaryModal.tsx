import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Copy, Check, Share2, MessageSquare, Send, 
  Sliders, Camera, CheckSquare, Square, Download, 
  Sparkles, Image as ImageIcon, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import { RDOReport } from '../types/rdo';
import { 
  generateWhatsAppSummary, 
  openWhatsAppWithMessage,
  dataUrlToFile,
  downloadPhoto,
  copyImageToClipboard
} from '../utils/whatsappFormatter';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: RDOReport;
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [formatType, setFormatType] = useState<'complete' | 'brief'>('complete');
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null);
  const [isSharingFiles, setIsSharingFiles] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Selected photo IDs (default to all photos in the report)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(() => 
    report.photos.map(p => p.id)
  );

  // Synchronize if report changes
  useEffect(() => {
    setSelectedPhotoIds(report.photos.map(p => p.id));
  }, [report.photos]);

  const toggleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) => 
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSelectAllPhotos = () => {
    setSelectedPhotoIds(report.photos.map(p => p.id));
  };

  const handleDeselectAllPhotos = () => {
    setSelectedPhotoIds([]);
  };

  // Generate formatted message text
  const messageText = useMemo(() => {
    return generateWhatsAppSummary(report, {
      customNote,
      formatType,
      includePhotos,
      selectedPhotoIds: includePhotos ? selectedPhotoIds : [],
    });
  }, [report, customNote, formatType, includePhotos, selectedPhotoIds]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = messageText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleSendWhatsAppWebText = () => {
    openWhatsAppWithMessage(messageText);
  };

  // Selected photos objects
  const selectedPhotos = report.photos.filter(p => selectedPhotoIds.includes(p.id));

  // Native share with files attached (for mobile devices and supported browsers)
  const handleShareWithPhotos = async () => {
    if (isSharingFiles) return;
    setIsSharingFiles(true);
    setShareFeedback(null);

    try {
      // Check if Web Share API with files is available
      if (typeof navigator !== 'undefined' && navigator.share) {
        let filesToShare: File[] = [];

        if (includePhotos && selectedPhotos.length > 0) {
          // Convert selected dataUrls into File objects
          const filePromises = selectedPhotos.map(async (photo, index) => {
            const fileName = `RDO_${report.reportNumber}_foto_${index + 1}.jpg`;
            const imageSrc = photo.base64Data || (photo as any).dataUrl;
            return await dataUrlToFile(imageSrc, fileName);
          });
          filesToShare = await Promise.all(filePromises);
        }

        // Test if navigator can share these files
        const shareData: ShareData = {
          title: `RDO #${report.reportNumber} - ${report.projectInfo.projectName || 'Obra'}`,
          text: messageText,
        };

        if (filesToShare.length > 0 && navigator.canShare && navigator.canShare({ files: filesToShare })) {
          shareData.files = filesToShare;
        }

        await navigator.share(shareData);
        setShareFeedback('Compartilhado com sucesso!');
        setTimeout(() => setShareFeedback(null), 3000);
      } else {
        // Fallback: open WhatsApp with text and notify about photos
        handleSendWhatsAppWebText();
        setShareFeedback('WhatsApp aberto! Para anexar as fotos no computador, use o botão "Baixar Fotos".');
        setTimeout(() => setShareFeedback(null), 5000);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Share error:', err);
        // Fallback to text link
        handleSendWhatsAppWebText();
      }
    } finally {
      setIsSharingFiles(false);
    }
  };

  // Download all selected photos for drag-and-drop into WhatsApp Web
  const handleDownloadSelectedPhotos = () => {
    if (selectedPhotos.length === 0) return;
    selectedPhotos.forEach((photo, idx) => {
      setTimeout(() => {
        const imageSrc = photo.base64Data || (photo as any).dataUrl;
        downloadPhoto(imageSrc, `RDO_${report.reportNumber}_foto_${idx + 1}.jpg`);
      }, idx * 250);
    });
    setShareFeedback(`${selectedPhotos.length} foto(s) baixada(s)! Agora arraste para a conversa do WhatsApp.`);
    setTimeout(() => setShareFeedback(null), 5000);
  };

  // Copy single photo to clipboard (for Ctrl+V into WhatsApp Web)
  const handleCopyPhoto = async (photoId: string, dataUrl: string) => {
    const success = await copyImageToClipboard(dataUrl);
    if (success) {
      setCopiedImageId(photoId);
      setShareFeedback('Foto copiada para a área de transferência! Cole com Ctrl+V no WhatsApp.');
      setTimeout(() => {
        setCopiedImageId(null);
        setShareFeedback(null);
      }, 3500);
    } else {
      setShareFeedback('Não foi possível copiar a imagem direto. Use o botão Baixar Foto.');
      setTimeout(() => setShareFeedback(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        
        {/* Header - WhatsApp Themed */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-white shadow-xs">
              <MessageSquare className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  Resumo do RDO para WhatsApp
                </h3>
                <span className="bg-emerald-800/80 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-600">
                  Grupo da Obra
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90">
                Relatório #{report.reportNumber} • {new Date(report.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {report.projectInfo.projectName || 'Canteiro'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-600/70 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50 text-slate-800">
          
          {/* Format selection and photo toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Format selection: Completo vs Sintético */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Tipo de Resumo:</span>
                  <span className="text-[10px] text-slate-400">
                    {formatType === 'complete' ? 'Todos os dados e detalhes' : 'Direto e enxuto'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setFormatType('complete')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] cursor-pointer ${
                    formatType === 'complete'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Detalhamento completo de efetivo, equipamentos, DDS e fotos"
                >
                  Completo
                </button>
                <button
                  type="button"
                  onClick={() => setFormatType('brief')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] cursor-pointer ${
                    formatType === 'brief'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Resumo executivo sintético em poucas linhas"
                >
                  Resumido
                </button>
              </div>
            </div>

            {/* Include Photos Toggle: Sim vs Não */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Camera className={`w-4 h-4 shrink-0 ${includePhotos ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Incluir Fotos:</span>
                  <span className="text-[10px] text-slate-400">
                    {report.photos.length > 0 
                      ? `${selectedPhotos.length} de ${report.photos.length} foto(s)` 
                      : 'Sem fotos neste RDO'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setIncludePhotos(true)}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] cursor-pointer flex items-center gap-1 ${
                    includePhotos
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Sim</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncludePhotos(false)}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] cursor-pointer flex items-center gap-1 ${
                    !includePhotos
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Não</span>
                </button>
              </div>
            </div>
          </div>

          {/* If includePhotos is TRUE: Interactive Photo Selector Gallery */}
          {includePhotos && (
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Fotos Selecionadas para o WhatsApp</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {selectedPhotos.length} / {report.photos.length}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Marque ou desmarque as fotos que deseja anexar/enviar
                    </p>
                  </div>
                </div>

                {report.photos.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllPhotos}
                      className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllPhotos}
                      className="text-slate-500 hover:text-slate-700 font-medium hover:underline cursor-pointer"
                    >
                      Desmarcar Todas
                    </button>
                  </div>
                )}
              </div>

              {report.photos.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <p className="font-semibold text-slate-700">Nenhuma foto anexada neste relatório</p>
                  <p className="text-[11px] text-slate-400">
                    Você pode adicionar fotos com câmera ou galeria na aba "Fotos & Vistorias" do editor do RDO.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {report.photos.map((photo, idx) => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    const imageSrc = photo.base64Data || (photo as any).dataUrl;
                    return (
                      <div
                        key={photo.id}
                        onClick={() => toggleSelectPhoto(photo.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-emerald-50/50 border-emerald-400 ring-1 ring-emerald-400'
                            : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="shrink-0 text-emerald-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 fill-emerald-600 text-white" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {/* Thumbnail */}
                        <img
                          src={imageSrc}
                          alt={photo.caption || `Foto ${idx + 1}`}
                          className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-200 shadow-2xs"
                        />

                        {/* Details */}
                        <div className="min-w-0 flex-1 text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                            <span>Foto #{idx + 1}</span>
                            {photo.sectorTag && (
                              <span className="bg-slate-200 text-slate-700 text-[9px] font-semibold px-1 rounded">
                                {photo.sectorTag}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 truncate text-[10px]">
                            {photo.caption || 'Sem legenda'}
                          </p>
                        </div>

                        {/* Quick actions: copy image or download single */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleCopyPhoto(photo.id, imageSrc)}
                            title="Copiar foto para colar com Ctrl+V no WhatsApp Web"
                            className={`p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 transition cursor-pointer ${
                              copiedImageId === photo.id ? 'bg-emerald-200 text-emerald-800' : ''
                            }`}
                          >
                            {copiedImageId === photo.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadPhoto(imageSrc, `RDO_${report.reportNumber}_foto_${idx + 1}.jpg`)}
                            title="Baixar esta foto"
                            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Photo Actions Toolbar */}
              {selectedPhotos.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedPhotos.length} foto(s) pronta(s) para o WhatsApp
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDownloadSelectedPhotos}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      title="Baixar todas as fotos selecionadas para arrastar no WhatsApp Web"
                    >
                      <Download className="w-3 h-3" />
                      <span>Baixar Fotos</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback banner if action occurred */}
          {shareFeedback && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-fadeIn shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}

          {/* Optional Note field */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Recado / Aviso Adicional para o Grupo (Opcional):</span>
              <span className="text-[10px] text-slate-400 font-normal">Ex: concretagem amanhã, visitas, entregas</span>
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Atenção equipe: amanhã liberação do concreto às 08:00 com caminhão-bomba."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Preview of the WhatsApp message in WhatsApp green balloon style */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                Prévia da Mensagem ({formatType === 'complete' ? 'Completa' : 'Resumida'} • {includePhotos ? 'Com Fotos' : 'Sem Fotos'}):
              </span>
              <span className="text-[11px] text-slate-400">
                {messageText.length} caracteres • {messageText.split('\n').length} linhas
              </span>
            </div>

            {/* WhatsApp Bubble View */}
            <div className="bg-[#EFEAE2] p-3 sm:p-4 rounded-xl border border-slate-300 shadow-inner relative max-h-60 overflow-y-auto font-sans">
              <div className="bg-[#D9FDD3] text-slate-900 rounded-lg p-3 sm:p-4 shadow-xs text-xs whitespace-pre-wrap leading-relaxed select-text border border-emerald-200">
                {messageText}
              </div>
            </div>
          </div>

          {/* Tips for WhatsApp Mobile vs Web */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-900">
              <Info className="w-3.5 h-3.5 text-sky-700" />
              <span>Instruções de Envio:</span>
            </div>
            <p className="text-sky-800">
              • <strong>No Celular (Android / iPhone):</strong> Clique em <strong>"Compartilhar com Fotos"</strong> para abrir o WhatsApp com as fotos anexadas à mensagem.
            </p>
            <p className="text-sky-800">
              • <strong>No Computador (WhatsApp Web):</strong> Clique em <strong>"Abrir no WhatsApp"</strong> para carregar o texto e use o botão <strong>"Baixar Fotos"</strong> para arrastar as imagens para a conversa.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Text Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 border cursor-pointer ${
                copiedText
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs'
              }`}
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {/* Share with photos attached (Web Share API) */}
            <button
              type="button"
              onClick={handleShareWithPhotos}
              disabled={isSharingFiles}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer"
              title="Compartilhar no WhatsApp com as fotos anexadas diretamente"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{includePhotos && selectedPhotos.length > 0 ? 'Compartilhar c/ Fotos' : 'Compartilhar'}</span>
            </button>

            {/* Open WhatsApp Web Direct */}
            <button
              type="button"
              onClick={handleSendWhatsAppWebText}
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              title="Abrir diretamente no WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
