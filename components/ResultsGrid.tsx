import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface ResultsGridProps {
  images: GeneratedImage[];
  onRegenerate: (id: string, newPrompt: string) => void;
}

// Custom Red Pin SVG Template
// ViewBox 0 0 100 130. Center of white circle is exactly at 50, 52. Radius is 34.
const PIN_SVG = `
<svg width="100" height="130" viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  <filter id="shadow">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.2"/>
  </filter>
  <g filter="url(#shadow)">
    <!-- Main Red Shape -->
    <path d="M50 2 C77.6 2 100 24.4 100 52 C100 80 50 128 50 128 C50 128 0 80 0 52 C0 24.4 22.4 2 50 2 Z" fill="#FF1F1F"/>
    <!-- Folded Shadow Effect (Right Side) -->
    <path d="M50 2 C77.6 2 100 24.4 100 52 C100 80 50 128 50 128 L 50 2 Z" fill="black" fill-opacity="0.15"/>
    <!-- White Inner Circle -->
    <circle cx="50" cy="52" r="34" fill="white"/>
  </g>
</svg>
`;

const ResultCard: React.FC<{ 
  img: GeneratedImage; 
  onRegenerate: (id: string, newPrompt: string) => void;
  showPinPreview: boolean;
}> = ({ img, onRegenerate, showPinPreview }) => {
  const [editedPrompt, setEditedPrompt] = useState(img.prompt);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async () => {
    if (!img.imageUrl) return;
    setIsDownloading(true);

    try {
      const filename = `pin-${img.prompt.replace(/\s+/g, '-')}`;

      if (!showPinPreview) {
        // Download just the emoji (raw PNG)
        const link = document.createElement('a');
        link.href = img.imageUrl;
        link.download = `${filename}-emoji.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Download Composite (Pin + Emoji)
        await downloadComposite(img.imageUrl, filename);
      }
    } catch (e) {
      console.error("Download failed", e);
      alert("Error al descargar la imagen. Por favor intenta de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadComposite = (emojiUrl: string, filename: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      // Set high resolution for the output (4x scale of the 100x130 SVG)
      const SCALE = 4;
      canvas.width = 100 * SCALE;  // 400px
      canvas.height = 130 * SCALE; // 520px
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context not available");

      // Geometry Constants based on SVG
      // Center (50, 52), Radius 34
      const CX = 50 * SCALE;
      const CY = 52 * SCALE;
      const RADIUS = 34 * SCALE; 
      const DIAMETER = RADIUS * 2;

      // 1. Load Pin Template
      const pinImg = new Image();
      // Base64 encode the SVG to ensure it loads cleanly
      pinImg.src = 'data:image/svg+xml;base64,' + btoa(PIN_SVG);
      
      pinImg.onload = () => {
        // Draw Pin Background
        ctx.drawImage(pinImg, 0, 0, canvas.width, canvas.height);

        // 2. Load Emoji Image
        const emojiImg = new Image();
        emojiImg.crossOrigin = "anonymous"; // Handle potential CORS if url is external (though usually base64 here)
        emojiImg.src = emojiUrl;

        emojiImg.onload = () => {
          // SURGICAL COMPOSITION:
          // We want to clip the emoji to exactly the white circle of the pin.
          
          ctx.save(); // Save state before clipping
          
          // Define Circular Clipping Path
          ctx.beginPath();
          ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2, true); 
          ctx.closePath();
          ctx.clip(); // <--- This forces the image to be circular

          // Draw Emoji
          // We draw it slightly larger than the radius to ensure full bleed if needed,
          // but "Zoom Max" prompt should handle it.
          // Drawing it exactly at diameter size centered.
          const DRAW_SIZE = DIAMETER; // 100% fill of the circle
          const drawX = CX - RADIUS;
          const drawY = CY - RADIUS;

          ctx.drawImage(emojiImg, drawX, drawY, DRAW_SIZE, DRAW_SIZE);
          
          ctx.restore(); // Restore context (remove clip)

          // 3. Trigger Download
          try {
            const finalDataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${filename}-full.png`;
            link.href = finalDataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        emojiImg.onerror = (e) => {
          console.error("Failed to load emoji image for composition", e);
          reject("Emoji load failed");
        };
      };
      
      pinImg.onerror = (e) => {
        console.error("Failed to load pin template", e);
        reject("Pin template load failed");
      };
    });
  };

  const handleRegenerateClick = () => {
    if (editedPrompt.trim()) {
      onRegenerate(img.id, editedPrompt);
    }
  };

  const hasPromptChanged = editedPrompt.trim() !== img.prompt;

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md hover:border-indigo-200 flex flex-col">
      {/* Status Indicators */}
      {img.status === 'pending' && (
        <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs font-medium text-indigo-600 animate-pulse">Diseñando...</span>
        </div>
      )}
      
      {img.status === 'error' && (
        <div className="absolute inset-0 z-10 bg-red-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-xs text-red-700 font-bold">Error</span>
          <p className="text-[10px] text-red-500 mt-2 leading-tight">
            Prueba simplificando el nombre.
          </p>
        </div>
      )}

      {/* Image Display */}
      <div className={`aspect-[3/4] w-full flex items-center justify-center p-4 relative transition-colors duration-500
        ${showPinPreview 
          ? 'bg-slate-50' 
          : "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZjhmYWZjIi8+CjxwYXRoIGQ9Ik0wIDBMMCA0TDQgNEw0IDBZMCAwIiBmaWxsPSIjZjFmMjZjIi8+Cjwvc3ZnPg==')]"}
      `}>
         {img.imageUrl ? (
           <div className="relative w-full h-full flex items-center justify-center">
             
             {/* Render Pin Template if Toggle is ON */}
             {showPinPreview && (
                <img 
                  src={`data:image/svg+xml;base64,${btoa(PIN_SVG)}`}
                  alt="Pin Template"
                  className="absolute w-full h-full object-contain drop-shadow-xl z-0"
                />
             )}

             {/* The Emoji Itself */}
             {/* 
                Visual Positioning CSS:
                - The SVG Viewbox is 100x130.
                - The Circle is centered at 50, 52 with radius 34.
                - Diameter is 68. 
                - Width ratio: 68/100 = 68%
                - Top offset: (52 - 34) = 18. 18/130 = ~13.8%
                
                We use strict % positioning to match the SVG geometry visually in HTML.
             */}
             <div 
               className={`relative z-10 transition-all duration-300 flex items-center justify-center
                 ${showPinPreview 
                   ? 'w-[68%] aspect-square rounded-full overflow-hidden' // Circular mask for preview
                   : 'w-[85%] max-h-[85%]'
                 }
               `}
               style={showPinPreview ? { 
                 marginBottom: '26%', // Adjust vertical center relative to pin tail
               } : {}}
             >
                <img 
                  src={img.imageUrl} 
                  alt={img.prompt} 
                  className={`object-contain w-full h-full ${!showPinPreview && 'drop-shadow-lg'}`}
                />
             </div>
           </div>
         ) : (
           <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse" />
         )}
      </div>

      {/* Footer / Actions */}
      <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-3 flex-grow">
        
        {/* Prompt Input */}
        <input 
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          className="w-full text-sm font-semibold text-center text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-300 focus:bg-slate-50 rounded-sm py-1 outline-none transition-all placeholder-slate-300"
          placeholder="Nombre del emoji"
        />
        
        <div className="mt-auto grid grid-cols-2 gap-2">
          {img.status === 'success' && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 py-2.5 rounded-lg transition-colors border border-slate-200 ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isDownloading ? (
                 <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {showPinPreview ? 'Pin' : 'PNG'}
            </button>
          )}

          <button
            onClick={handleRegenerateClick}
            disabled={img.status === 'pending'}
            className={`flex items-center justify-center gap-1.5 text-xs font-bold text-white py-2.5 rounded-lg transition-all 
              ${img.status === 'success' ? 'col-span-1' : 'col-span-2'}
              ${img.status === 'pending' ? 'bg-slate-400 cursor-not-allowed' : 
                img.status === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-200' :
                hasPromptChanged ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200' : 
                'bg-slate-700 hover:bg-slate-800'
              }
            `}
          >
            <svg className={`w-3.5 h-3.5 ${img.status === 'pending' ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {img.status === 'error' ? 'Reintentar' : (hasPromptChanged ? 'Actualizar' : 'Rehacer')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultsGrid: React.FC<ResultsGridProps> = ({ images, onRegenerate }) => {
  const [showPinPreview, setShowPinPreview] = useState(true); // Default to ON for context

  if (images.length === 0) return null;

  return (
    <div className="w-full mt-12 border-t border-slate-200 pt-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          Resultados ({images.filter(i => i.status === 'success').length})
        </h3>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer select-none bg-white py-2 px-4 rounded-full shadow-sm border border-slate-200 hover:border-indigo-200 transition-all">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={showPinPreview}
                onChange={() => setShowPinPreview(!showPinPreview)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showPinPreview ? 'bg-red-500' : 'bg-slate-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showPinPreview ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-slate-700">
              Visualizar en Pin
            </div>
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img) => (
          <ResultCard 
            key={img.id} 
            img={img} 
            onRegenerate={onRegenerate} 
            showPinPreview={showPinPreview}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsGrid;