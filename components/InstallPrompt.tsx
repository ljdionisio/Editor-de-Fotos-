import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { BeforeInstallPromptEvent } from '../types';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Listen for install prompt on Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect iOS to show specific instructions
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    if (isIOS) {
      setShowIOSPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  // Android / Desktop Chrome Prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in-up">
        <div className="bg-zinc-800 border border-yellow-500/30 p-4 rounded-xl shadow-2xl flex items-center justify-between backdrop-blur-md">
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm">Instalar Aplicativo</span>
            <span className="text-xs text-zinc-400">Para uma melhor experiência</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setDeferredPrompt(null)}>Agora não</Button>
            <Button size="sm" variant="primary" onClick={handleInstallClick}>Instalar</Button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Custom Prompt (Dismissible)
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in-up">
         <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl shadow-2xl relative">
            <button 
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-white"
            >
              &times;
            </button>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📲</span>
              <div>
                <p className="font-bold text-sm text-white mb-1">Instalar no iPhone</p>
                <p className="text-xs text-zinc-400">
                  Toque no botão <span className="font-bold text-blue-400">Compartilhar</span> abaixo e selecione <span className="font-bold text-white">"Adicionar à Tela de Início"</span>.
                </p>
              </div>
            </div>
         </div>
      </div>
    );
  }

  return null;
};
