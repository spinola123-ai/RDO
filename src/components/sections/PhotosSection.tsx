import React, { useState } from 'react';
import { Camera, Trash2, Maximize2, Tag, Calendar, MapPin, X, Smartphone } from 'lucide-react';
import { FieldPhoto } from '../../types/rdo';
import { CameraCaptureModal } from '../CameraCaptureModal';

interface PhotosSectionProps {
  photos: FieldPhoto[];
  onUpdatePhotos: (photos: FieldPhoto[]) => void;
}

export const PhotosSection: React.FC<PhotosSectionProps> = ({ photos, onUpdatePhotos }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedPhotoForPreview, setSelectedPhotoForPreview] = useState<FieldPhoto | null>(null);

  const handleAddPhoto = (newPhoto: FieldPhoto) => {
    onUpdatePhotos([...photos, newPhoto]);
  };

  const handleRemovePhoto = (id: string) => {
    onUpdatePhotos(photos.filter((p) => p.id !== id));
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    onUpdatePhotos(
      photos.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Relatório Fotográfico de Campo (Offline)</h2>
            <p className="text-xs text-slate-500">
              Fotos tiradas no canteiro com foco nítido e carimbo técnico automático (Data, Hora e GPS)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline mr-2">
            Total: <strong>{photos.length} fotos</strong>
          </span>

          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Tirar Foto de Campo</span>
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div
          onClick={() => setIsCameraOpen(true)}
          className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 rounded-2xl p-8 text-center cursor-pointer transition space-y-3"
        >
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Nenhuma foto registrada neste RDO ainda
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Clique aqui para tirar fotos usando a câmera do seu celular com foco estabilizado ou carregar imagens da galeria. Funciona 100% offline!
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-amber-400">
            <Smartphone className="w-4 h-4" />
            Abrir Câmera de Campo
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              {/* Image Preview with hover overlay */}
              <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                <img
                  src={photo.base64Data}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Number Badge */}
                <div className="absolute top-2 left-2 bg-slate-950/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Foto #{index + 1}
                </div>

                {/* Offline Badge */}
                {photo.takenOffline && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    Offline
                  </div>
                )}

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoForPreview(photo)}
                    className="p-2 rounded-full bg-white text-slate-900 hover:bg-sky-50 shadow-md"
                    title="Ampliar Foto"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md"
                    title="Remover Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photo Metadata & Caption */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-sky-700 font-semibold mb-1">
                    <Tag className="w-3 h-3 text-sky-500" />
                    <span>{photo.sectorTag || 'Canteiro Geral'}</span>
                  </div>

                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Legenda Técnica / Descrição da Foto:</label>
                  <textarea
                    rows={2}
                    value={photo.caption}
                    onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                    placeholder="Descreva a evidência técnica fotográfica (ex: conferência de ferragem de laje, posicionamento de eletrodutos, ensaio de abatimento)..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium resize-y"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(photo.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {photo.latitude && (
                    <span className="flex items-center gap-0.5 text-emerald-700 font-mono">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      GPS
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onSavePhoto={handleAddPhoto}
        defaultSector="Canteiro Geral"
      />

      {/* Zoom / Full Preview Modal */}
      {selectedPhotoForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <div>
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {selectedPhotoForPreview.sectorTag || 'Registro de Obra'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedPhotoForPreview.caption}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhotoForPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-2 bg-black flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={selectedPhotoForPreview.base64Data}
                alt={selectedPhotoForPreview.caption}
                className="max-h-[68vh] w-auto object-contain rounded"
              />
            </div>

            <div className="p-3 bg-slate-950 text-slate-400 text-xs flex items-center justify-between border-t border-slate-800">
              <span>Data/Hora: {new Date(selectedPhotoForPreview.timestamp).toLocaleString('pt-BR')}</span>
              {selectedPhotoForPreview.latitude && (
                <span>GPS: {selectedPhotoForPreview.latitude.toFixed(5)}, {selectedPhotoForPreview.longitude?.toFixed(5)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
