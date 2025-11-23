import React, { useState, useEffect } from 'react';
import { ImageItem, EditingStyle } from '../types';
import { Button } from './Button';
import { Icons } from '../constants';
import { editImageWithGemini } from '../services/geminiService';

interface EditorModalProps {
  image: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyToAll: (prompt: string) => void;
  onSaveStyle: (name: string, prompt: string) => void;
  savedStyles: EditingStyle[];
}

export const EditorModal: React.FC<EditorModalProps> = ({ 
  image, 
  isOpen, 
  onClose, 
  onApplyToAll,
  onSaveStyle,
  savedStyles
}) => {
  const [prompt, setPrompt] = useState('');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [newStyleName, setNewStyleName] = useState('');
  const [showSaveStyle, setShowSaveStyle] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreviewResult(null);
      // Don't reset prompt/watermark automatically so users can keep settings between images if they want,
      // or we can reset. Let's reset for a fresh start on a specific image.
      setPrompt('');
      setWatermarkText('');
      setWatermarkPosition('bottom-right');
      setShowSaveStyle(false);
    }
  }, [isOpen, image]);

  if (!isOpen || !image) return null;

  const getFullPrompt = () => {
    let p = prompt.trim();
    if (watermarkText.trim()) {
      // Improve prompt engineering for text rendering
      const positionText = watermarkPosition.replace('-', ' ');
      const wmInstruction = ` Add a clearly visible text watermark saying "${watermarkText}" in the ${positionText} corner of the image. Ensure the text is legible and contrasts with the background.`;
      p = p ? `${p}.${wmInstruction}` : wmInstruction;
    }
    return p;
  };

  const handleTestEdit = async () => {
    const finalPrompt = getFullPrompt();
    if (!finalPrompt.trim()) return;

    setIsProcessing(true);
    try {
      const result = await editImageWithGemini(image.file, finalPrompt);
      setPreviewResult(result);
    } catch (err) {
      alert("Erro ao editar imagem. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveStyle = () => {
    const finalPrompt = getFullPrompt();
    if (newStyleName.trim() && finalPrompt.trim()) {
      onSaveStyle(newStyleName, finalPrompt);
      setNewStyleName('');
      setShowSaveStyle(false);
    }
  };

  const handleApplyToAll = () => {
    const finalPrompt = getFullPrompt();
    if (finalPrompt.trim()) {
      onApplyToAll(finalPrompt);
    }
  };

  const selectStyle = (stylePrompt: string) => {
    setPrompt(stylePrompt);
    // Note: Saved styles are just strings, so they might include previous watermark instructions.
    // We leave the watermark inputs clear to avoid double watermarking if the user re-adds one.
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 md:flex-row">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 md:hidden">
        <h2 className="text-lg font-semibold">Editar Imagem</h2>
        <Button variant="ghost" onClick={onClose} className="!p-1">
          <span className="text-2xl">&times;</span>
        </Button>
      </div>

      {/* Image Preview Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4 overflow-hidden">
        <div className="relative max-w-full max-h-full aspect-auto shadow-2xl">
          <img 
            src={previewResult || image.processedUrl || image.previewUrl} 
            alt="Editing" 
            className="max-h-[70vh] md:max-h-[85vh] object-contain rounded-lg"
          />
          {previewResult && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg">
              PREVIEW
            </div>
          )}
        </div>
        
        {/* Desktop Close Button */}
        <button 
          onClick={onClose}
          className="hidden md:flex absolute top-4 left-4 w-10 h-10 bg-black/50 hover:bg-zinc-800 text-white rounded-full items-center justify-center transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Controls Area */}
      <div className="flex flex-col w-full md:w-96 bg-zinc-900 border-l border-zinc-800 h-[50vh] md:h-full shadow-2xl">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Instrução de Edição (Prompt)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Melhorar iluminação, estilo vintage..."
              className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none"
            />
          </div>

          {/* Watermark Section */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 mb-3 text-zinc-300">
              <span className="text-lg">©</span>
              <span className="text-sm font-medium">Marca d'água</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Texto (Ex: @MeuInsta)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder-zinc-600 focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={watermarkPosition}
                  onChange={(e) => setWatermarkPosition(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-2 text-sm text-zinc-300 focus:ring-1 focus:ring-yellow-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="top-left">Superior Esq.</option>
                  <option value="top-right">Superior Dir.</option>
                  <option value="bottom-left">Inferior Esq.</option>
                  <option value="bottom-right">Inferior Dir.</option>
                  <option value="center">Centro</option>
                </select>
                <div className="flex items-center justify-center text-xs text-zinc-500 bg-zinc-900 rounded border border-zinc-800">
                  Posição
                </div>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex justify-end">
              <Button 
                onClick={handleTestEdit} 
                isLoading={isProcessing}
                disabled={!prompt.trim() && !watermarkText.trim()}
                className="w-full md:w-auto"
                variant="secondary"
              >
                <Icons.Sparkles /> <span className="ml-2">Gerar Teste</span>
              </Button>
          </div>

          <hr className="border-zinc-800" />

          {/* Saved Styles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">Estilos Salvos</span>
              {!showSaveStyle && (prompt.trim() || watermarkText.trim()) && (
                 <button onClick={() => setShowSaveStyle(true)} className="text-xs text-yellow-500 hover:text-yellow-400">
                    + Salvar Atual
                 </button>
              )}
            </div>

            {showSaveStyle && (
              <div className="mb-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <input 
                  type="text" 
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  placeholder="Nome do estilo"
                  className="w-full bg-zinc-800 border-none rounded px-2 py-1 text-sm mb-2 text-white"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveStyle} className="text-xs py-1 h-8 w-full">Salvar</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowSaveStyle(false)} className="text-xs py-1 h-8 w-full">Cancelar</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {savedStyles.map(style => (
                <button
                  key={style.id}
                  onClick={() => selectStyle(style.prompt)}
                  className="text-left px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs truncate transition-colors border border-transparent focus:border-yellow-500 text-zinc-300"
                >
                  {style.name}
                </button>
              ))}
              {savedStyles.length === 0 && (
                <p className="text-xs text-zinc-600 col-span-2 text-center py-2">Nenhum estilo salvo.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 pb-safe">
          <Button 
            className="w-full text-lg font-bold shadow-yellow-500/20 shadow-lg" 
            onClick={handleApplyToAll}
            disabled={!prompt.trim() && !watermarkText.trim()}
          >
             Replicar em Todas
          </Button>
          <p className="text-center text-[10px] text-zinc-500 mt-2">
            Aplica a instrução em todas as fotos importadas.
          </p>
        </div>
      </div>
    </div>
  );
};