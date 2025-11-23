import React from 'react';
import { ImageItem, ImageStatus } from '../types';
import { Icons } from '../constants';

interface ImageGridProps {
  images: ImageItem[];
  onSelect: (image: ImageItem) => void;
  onRemove: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onSelect, onRemove }) => {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl mx-4 mt-8 bg-zinc-900/50">
        <Icons.Photo />
        <p className="mt-2 text-sm">Nenhuma foto selecionada</p>
        <p className="text-xs text-zinc-600">Importe fotos ou use a câmera para começar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 pb-24">
      {images.map((img) => (
        <div 
          key={img.id} 
          className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-sm cursor-pointer"
          onClick={() => onSelect(img)}
        >
          <img 
            src={img.processedUrl || img.previewUrl} 
            alt="Preview" 
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${img.status === ImageStatus.PROCESSING ? 'opacity-50 blur-sm' : ''}`}
          />
          
          {/* Status Indicators */}
          <div className="absolute top-2 left-2 z-10">
             {img.status === ImageStatus.PROCESSING && (
                <div className="bg-black/60 p-1.5 rounded-full backdrop-blur-md">
                   <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
             )}
             {img.status === ImageStatus.COMPLETED && (
                <div className="bg-green-500 p-1 rounded-full text-black shadow-lg">
                   <Icons.Check />
                </div>
             )}
             {img.status === ImageStatus.FAILED && (
                <div className="bg-red-500 p-1 rounded-full text-white shadow-lg text-xs font-bold w-5 h-5 flex items-center justify-center" title="Falha ao processar">
                   !
                </div>
             )}
          </div>

          {/* Remove Button - Always visible on touch devices via media query logic in logic or just styling override */}
          <button 
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-500 z-20 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(img.id);
            }}
            aria-label="Remover imagem"
          >
            <Icons.Trash />
          </button>

          {/* Label for Edited vs Original */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6">
             <span className={`text-[10px] uppercase font-bold tracking-wider ${img.processedUrl ? 'text-yellow-400' : 'text-zinc-400'}`}>
                {img.processedUrl ? 'Editado' : 'Original'}
             </span>
          </div>
        </div>
      ))}
    </div>
  );
};