import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Icons, MAX_IMAGES } from './constants';
import { ImageItem, ImageStatus, EditingStyle } from './types';
import { ImageGrid } from './components/ImageGrid';
import { Button } from './components/Button';
import { EditorModal } from './components/EditorModal';
import { InstallPrompt } from './components/InstallPrompt';
import { PrivacyDisclaimer } from './components/PrivacyDisclaimer';
import { editImageWithGemini } from './services/geminiService';

const generateId = () => Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [savedStyles, setSavedStyles] = useState<EditingStyle[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  // Batch Processing State
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const stopProcessingRef = useRef(false);

  // Download State
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('banana_styles');
    if (stored) {
      try {
        setSavedStyles(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved styles");
      }
    }
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageItem[] = [];
    const remainingSlots = MAX_IMAGES - images.length;
    const count = Math.min(files.length, remainingSlots);

    if (files.length > remainingSlots) {
       alert(`Limite de ${MAX_IMAGES} imagens. Apenas as primeiras ${count} foram adicionadas.`);
    }

    for (let i = 0; i < count; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      newImages.push({
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: ImageStatus.PENDING
      });
    }

    setImages(prev => [...prev, ...newImages]);
    
    // Reset file input so selecting same file works again
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
    if (selectedImageId === id) setSelectedImageId(null);
  };

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja remover todas as imagens?')) {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setSelectedImageId(null);
    }
  };

  const handleSaveStyle = (name: string, prompt: string) => {
    const newStyle: EditingStyle = { id: generateId(), name, prompt };
    const updated = [...savedStyles, newStyle];
    setSavedStyles(updated);
    localStorage.setItem('banana_styles', JSON.stringify(updated));
  };

  const stopBatchProcessing = () => {
    stopProcessingRef.current = true;
  };

  const processBatch = async (prompt: string) => {
    if (!prompt) return;
    
    setSelectedImageId(null);
    setIsProcessingBatch(true);
    stopProcessingRef.current = false;
    
    const itemsToProcess = images.filter(img => img.status !== ImageStatus.COMPLETED);
    setProcessingProgress({ current: 0, total: itemsToProcess.length });
    
    let completedCount = 0;

    const updateStatus = (id: string, status: ImageStatus, processedUrl?: string) => {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status, processedUrl } : img
      ));
    };

    for (const img of itemsToProcess) {
      // Check stop flag
      if (stopProcessingRef.current) {
        break;
      }

      updateStatus(img.id, ImageStatus.PROCESSING);
      
      try {
        const resultUrl = await editImageWithGemini(img.file, prompt);
        updateStatus(img.id, ImageStatus.COMPLETED, resultUrl);
      } catch (error) {
        console.error(`Failed to process ${img.id}`, error);
        updateStatus(img.id, ImageStatus.FAILED);
      }

      completedCount++;
      setProcessingProgress(prev => ({ ...prev, current: completedCount }));
    }

    setIsProcessingBatch(false);
    stopProcessingRef.current = false;
  };

  const handleDownloadAll = async () => {
    const completedImages = images.filter(img => img.status === ImageStatus.COMPLETED && img.processedUrl);
    
    if (completedImages.length === 0) {
      alert("Nenhuma imagem processada para baixar.");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      
      completedImages.forEach((img, i) => {
        if (img.processedUrl) {
           const base64 = img.processedUrl.split(',')[1];
           const originalName = img.file.name.replace(/\.[^/.]+$/, "");
           zip.file(`${originalName}_edited_${i+1}.png`, base64, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
          setDownloadProgress(metadata.percent);
      });

      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BananaBatch_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error(e);
      alert("Erro ao gerar arquivo ZIP. Verifique se o navegador suporta esta função.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const selectedImage = images.find(img => img.id === selectedImageId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      
      <PrivacyDisclaimer />
      <InstallPrompt />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍌</span>
            <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">BananaBatch</h1>
          </div>
          <div className="flex items-center gap-4">
             {images.length > 0 && (
               <button 
                 onClick={handleClearAll} 
                 className="text-xs text-red-400 hover:text-red-300 transition-colors"
                 disabled={isProcessingBatch}
               >
                 Limpar Tudo
               </button>
             )}
             <div className="text-sm font-medium text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              {images.length} / {MAX_IMAGES}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full relative">
        <ImageGrid 
          images={images} 
          onSelect={(img) => !isProcessingBatch && setSelectedImageId(img.id)}
          onRemove={handleRemoveImage}
        />
      </main>

      {/* Loading Overlay */}
      {isProcessingBatch && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
           <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <h3 className="text-xl font-bold text-white mb-2">Processando Imagens...</h3>
           <p className="text-zinc-400 mb-6 text-center max-w-md">
             A IA está trabalhando. Mantenha esta aba aberta para garantir que todas as fotos sejam processadas.
           </p>
           
           <div className="w-full max-w-xs bg-zinc-800 rounded-full h-2.5 mb-2 overflow-hidden border border-zinc-700">
             <div 
               className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300" 
               style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
             ></div>
           </div>
           <p className="text-sm text-zinc-500 mb-8">{processingProgress.current} de {processingProgress.total}</p>

           <Button variant="danger" onClick={stopBatchProcessing}>
             Parar Processamento
           </Button>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800 pb-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex gap-2">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={cameraInputRef}
              onChange={(e) => handleFiles(e.target.files)}
            />

            <Button 
              variant="secondary" 
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessingBatch || images.length >= MAX_IMAGES}
              title="Tirar foto"
            >
              <Icons.Camera />
              <span className="hidden md:inline ml-2">Câmera</span>
            </Button>
            
            <Button 
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingBatch || images.length >= MAX_IMAGES}
              title="Importar da galeria"
            >
              <Icons.Plus />
              <span className="hidden md:inline ml-2">Importar</span>
            </Button>
          </div>

          <div className="flex gap-2">
             {images.some(img => img.status === ImageStatus.COMPLETED) && (
                <Button 
                  variant="primary" 
                  onClick={handleDownloadAll}
                  isLoading={isDownloading}
                  disabled={isDownloading}
                >
                  <Icons.Download />
                  <span className="ml-2">
                    {isDownloading ? `${Math.floor(downloadProgress)}%` : 'Baixar ZIP'}
                  </span>
                </Button>
             )}
          </div>
        </div>
      </div>

      <EditorModal 
        isOpen={!!selectedImageId}
        image={selectedImage}
        onClose={() => setSelectedImageId(null)}
        onApplyToAll={processBatch}
        onSaveStyle={handleSaveStyle}
        savedStyles={savedStyles}
      />

    </div>
  );
};

export default App;