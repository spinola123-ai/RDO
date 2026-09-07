import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  SwitchCamera, 
  X, 
  Check, 
  Image as ImageIcon, 
  MapPin, 
  Tag, 
  Smartphone, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { FieldPhoto } from '../types/rdo';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (photo: FieldPhoto) => void;
  defaultSector?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onSavePhoto,
  defaultSector = 'Canteiro Geral',
}) => {
  // Use a ref for the active MediaStream to prevent re-render cascading loops
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);
  const [useRearCamera, setUseRearCamera] = useState<boolean>(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [sectorTag, setSectorTag] = useState<string>(defaultSector);
  const [addWatermark, setAddWatermark] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Detect if running inside an iframe (like GMD / preview container)
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Play realistic shutter sound via Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Audio not supported or blocked
    }
  }, []);

  // Try fetching current GPS position for photo metadata
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Geolocation optional in field
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    }
  }, [isOpen]);

  // Cleanly stops the camera stream without triggering state loops
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore error on stop
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsLoadingCamera(false);
  }, []);

  // Starts the WebRTC live camera preview safely
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);
    setIsLoadingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Câmera WebRTC direta indisponível neste navegador ou frame. Use o botão de Câmera Nativa do Celular.');
      setIsLoadingCamera(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: useRearCamera ? { ideal: 'environment' } : 'user',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
            setIsStreaming(true);
            setIsLoadingCamera(false);
          }
        };
      } else {
        setIsStreaming(true);
        setIsLoadingCamera(false);
      }
    } catch (err: unknown) {
      setIsLoadingCamera(false);
      const errorMsg = err instanceof Error ? err.message : 'Permissão não concedida';
      setCameraError(`Câmera embutida instável no frame (${errorMsg}). Use a Câmera Nativa do Celular abaixo para foco perfeito.`);
    }
  }, [useRearCamera, stopCameraStream]);

  // Manage camera lifecycle when modal opens or closes
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, capturedImage, startCamera, stopCameraStream]);

  if (!isOpen) return null;

  // Stamp watermark onto any canvas
  const applyWatermarkToCanvas = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, width: number, height: number) => {
    if (!addWatermark) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    const tagStr = sectorTag ? `[${sectorTag.toUpperCase()}] ` : '';
    const geoStr = coords.lat ? ` • GPS: ${coords.lat.toFixed(4)}, ${coords.lng?.toFixed(4)}` : '';
    const bannerText = `${tagStr}RDO CAMPO • ${dateStr}${geoStr}`;

    const bannerHeight = Math.max(38, Math.round(height * 0.055));
    context.fillStyle = 'rgba(15, 23, 42, 0.82)';
    context.fillRect(0, height - bannerHeight, width, bannerHeight);

    context.font = `bold ${Math.round(bannerHeight * 0.44)}px sans-serif`;
    context.fillStyle = '#f8fafc';
    context.fillText(bannerText, Math.max(16, Math.round(width * 0.02)), height - (bannerHeight * 0.32));
  };

  // Capture current frame from the live video stream
  const handleCaptureFromStream = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    playShutterSound();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsCapturing(false);
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    // Draw frame
    context.drawImage(video, 0, 0, width, height);

    // Apply watermark
    applyWatermarkToCanvas(canvas, context, width, height);

    // Generate high quality JPEG
    const base64Data = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(base64Data);
    setIsCapturing(false);
    stopCameraStream();
  };

  // Process an image file from Native Camera (capture="environment") or Gallery
  const handleProcessImageFile = (file: File) => {
    setIsCapturing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setIsCapturing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setCapturedImage(dataUrl);
          setIsCapturing(false);
          stopCameraStream();
          return;
        }

        // Draw the full-resolution photo from the phone's camera
        ctx.drawImage(img, 0, 0);

        // Apply technical watermark
        applyWatermarkToCanvas(canvas, ctx, img.width, img.height);

        // Export sharp JPEG
        const processed = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(processed);
        setIsCapturing(false);
        stopCameraStream();
      };

      img.onerror = () => {
        setCapturedImage(dataUrl);
        setIsCapturing(false);
        stopCameraStream();
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setIsCapturing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleNativeCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
    // reset input value so user can take another picture if needed
    e.target.value = '';
  };

  const handleConfirmPhoto = () => {
    if (!capturedImage) return;

    const newPhoto: FieldPhoto = {
      id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      base64Data: capturedImage,
      caption: caption.trim() || 'Foto de registro de campo da obra',
      sectorTag: sectorTag.trim() || 'Canteiro Geral',
      timestamp: new Date().toISOString(),
      latitude: coords.lat,
      longitude: coords.lng,
      takenOffline: !navigator.onLine,
    };

    onSavePhoto(newPhoto);
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setCapturedImage(null);
    setCaption('');
    setSectorTag(defaultSector);
    setCameraError(null);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[96vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {capturedImage ? 'Confirmar Foto de Campo' : 'Câmera de Campo RDO'}
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sem tremulação • Foco estabilizado • Carimbo técnico automático
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInIframe && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="hidden sm:flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition border border-slate-700"
                title="Abrir aplicativo em tela cheia/nova aba para liberar acesso de câmera nativa"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>Nova Aba</span>
              </button>
            )}

            <button
              onClick={() => {
                stopCameraStream();
                handleResetModal();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[280px] sm:min-h-[380px] overflow-hidden">
          {isCapturing && (
            <div className="absolute inset-0 bg-white z-30 animate-ping opacity-70" />
          )}

          {/* Live Camera Stream View */}
          {!capturedImage && !cameraError && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                className="w-full h-full object-contain max-h-[50vh] bg-black"
              />

              {isLoadingCamera && (
                <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-xs font-semibold">Iniciando câmera estabilizada...</p>
                </div>
              )}

              {/* Camera Switcher (Front/Rear) */}
              <button
                type="button"
                onClick={() => setUseRearCamera(!useRearCamera)}
                className="absolute top-3 right-3 z-20 bg-slate-900/85 hover:bg-slate-800 text-white p-2.5 rounded-full border border-slate-700 shadow-lg active:scale-95 transition"
                title="Alternar Câmera (Traseira / Frontal)"
              >
                <SwitchCamera className="w-5 h-5 text-amber-400" />
              </button>

              {/* Watermark active indicator */}
              <div className="absolute bottom-3 left-3 z-20 bg-slate-950/85 text-[11px] text-slate-300 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5 backdrop-blur-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Carimbo RDO: Data, Hora e {sectorTag || 'Canteiro'}</span>
              </div>
            </>
          )}

          {/* Fallback / Frame limitation message */}
          {!capturedImage && cameraError && (
            <div className="p-6 text-center text-slate-300 max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-amber-300">{cameraError}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Navegadores embutidos em frames restringem o vídeo WebRTC contínuo. Use o botão abaixo para abrir a <strong>Câmera Nativa do Celular</strong> com foco automático de alta qualidade e carimbo técnico.
              </p>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition"
              >
                <Smartphone className="w-5 h-5" />
                Tirar Foto com Câmera do Celular
              </button>
            </div>
          )}

          {/* Image Captured Review */}
          {capturedImage && (
            <div className="relative w-full h-full flex items-center justify-center p-2 bg-slate-950">
              <img
                src={capturedImage}
                alt="Foto Capturada"
                className="max-h-[50vh] w-auto object-contain rounded-lg shadow-2xl border border-slate-800"
              />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Hidden Inputs for Native Camera & Gallery */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleNativeCameraChange}
          className="hidden"
        />

        {/* Action Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          {!capturedImage ? (
            <div className="space-y-3">
              {/* Informative advice if in frame */}
              {isInIframe && (
                <div className="bg-sky-950/40 border border-sky-800/50 rounded-lg px-3 py-2 text-[11px] text-sky-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Dica: Para foco ultra-nítido e evitar qualquer tremulação do frame, use a <strong>Câmera Nativa</strong>.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="text-amber-400 hover:underline shrink-0 text-[10px] font-bold"
                  >
                    Abrir em Nova Aba
                  </button>
                </div>
              )}

              {/* Sector selector and watermark toggle */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-1">
                    <Tag className="w-3 h-3 text-amber-400" />
                    Frente de Obra / Setor:
                  </label>
                  <input
                    type="text"
                    value={sectorTag}
                    onChange={(e) => setSectorTag(e.target.value)}
                    placeholder="Ex: Bloco A - Fundação, Torre 2 - Alvenaria"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 pt-4 text-xs text-slate-300">
                  <input
                    id="watermark-toggle"
                    type="checkbox"
                    checked={addWatermark}
                    onChange={(e) => setAddWatermark(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="watermark-toggle" className="cursor-pointer select-none font-medium">
                    Carimbar Foto
                  </label>
                </div>
              </div>

              {/* Action Buttons: Native Camera (Hero button) + Live Shutter + Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 items-center">
                
                {/* 1. Native Smartphone Camera (100% stable, sharp autofocus, no frame stutter) */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-3 py-2.5 rounded-xl text-xs shadow-md transition"
                  title="Abre o aplicativo nativo de câmera do seu celular com foco automático e flash"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Câmera do Celular (Recomendado)</span>
                </button>

                {/* 2. Stream Capture Button (Fixed & Stabilized) */}
                <div className="flex items-center justify-center">
                  <button
                    id="shutter-btn"
                    type="button"
                    onClick={handleCaptureFromStream}
                    disabled={!isStreaming || isCapturing}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 text-xs font-semibold shadow transition disabled:opacity-50"
                    title="Capturar imagem da tela do vídeo ao vivo"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Capturar da Tela</span>
                  </button>
                </div>

                {/* 3. Gallery / Files Button */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white p-2.5 rounded-xl hover:bg-slate-900 border border-slate-800 transition"
                  title="Selecionar foto já salva na galeria do aparelho"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span>Galeria / Arquivo</span>
                </button>
              </div>
            </div>
          ) : (
            /* Review & Caption View */
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Legenda Técnica da Foto:
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ex: Conferência de armadura da viga V-101 com espaçadores instalados"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition"
                >
                  Tirar Outra
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Salvar no Relatório
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
