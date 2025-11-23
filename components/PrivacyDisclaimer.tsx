import React, { useState } from 'react';

export const PrivacyDisclaimer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-40 max-w-xs animate-fade-in">
      <div className="bg-zinc-900/90 border border-zinc-700 p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wide">Privacidade & Segurança</h4>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-zinc-500 hover:text-white -mt-1 -mr-1"
          >
            &times;
          </button>
        </div>
        <p className="text-[10px] text-zinc-300 leading-relaxed">
          Suas fotos são processadas temporariamente pela IA do Google e <span className="font-bold text-white">não são armazenadas</span> em nossos servidores. Todos os dados permanecem no seu dispositivo.
        </p>
      </div>
    </div>
  );
};
