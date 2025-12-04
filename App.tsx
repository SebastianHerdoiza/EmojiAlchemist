import React, { useState } from 'react';
import ReferenceUploader from './components/ReferenceUploader';
import ResultsGrid from './components/ResultsGrid';
import { generateStyledEmoji } from './services/geminiService';
import { GeneratedImage, AppState } from './types';

// Simple ID generator utility
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);

  const handleGenerate = async () => {
    if (!referenceImage) {
      alert("Por favor sube una imagen de referencia primero.");
      return;
    }
    if (!promptInput.trim()) {
      alert("Por favor ingresa al menos un objeto para generar.");
      return;
    }

    // Split input by commas or newlines to support batch processing
    const prompts = promptInput.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (prompts.length === 0) return;

    setAppState(AppState.GENERATING);

    // Initialize placeholders
    const newPlaceholders: GeneratedImage[] = prompts.map(prompt => ({
      id: generateId(),
      prompt,
      imageUrl: '',
      status: 'pending',
      timestamp: Date.now()
    }));

    // Add new placeholders to the TOP of the list
    setGeneratedImages(prev => [...newPlaceholders, ...prev]);

    // Process each prompt
    // We process them in parallel but independent promises so the UI updates as they finish
    prompts.forEach(async (prompt, index) => {
      const imageId = newPlaceholders[index].id;

      try {
        const generatedBase64 = await generateStyledEmoji(prompt, referenceImage);
        
        setGeneratedImages(prev => prev.map(img => {
          if (img.id === imageId) {
            return {
              ...img,
              imageUrl: generatedBase64,
              status: 'success'
            };
          }
          return img;
        }));
      } catch (error) {
        console.error(`Failed to generate ${prompt}`, error);
        setGeneratedImages(prev => prev.map(img => {
          if (img.id === imageId) {
            return {
              ...img,
              status: 'error'
            };
          }
          return img;
        }));
      }
    });

    setAppState(AppState.IDLE);
    setPromptInput('');
  };

  const handleRegenerate = async (id: string, newPrompt: string) => {
    if (!referenceImage) {
      alert("Se necesita la imagen de referencia original.");
      return;
    }

    // Update state to pending for this specific item and update its prompt text
    setGeneratedImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, status: 'pending', prompt: newPrompt };
      }
      return img;
    }));

    try {
      const generatedBase64 = await generateStyledEmoji(newPrompt, referenceImage);
      
      setGeneratedImages(prev => prev.map(img => {
        if (img.id === id) {
          return {
            ...img,
            imageUrl: generatedBase64,
            status: 'success'
          };
        }
        return img;
      }));
    } catch (error) {
      console.error(`Failed to regenerate ${newPrompt}`, error);
      setGeneratedImages(prev => prev.map(img => {
        if (img.id === id) {
          return {
            ...img,
            status: 'error'
          };
        }
        return img;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg p-1.5 shadow-md shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600">
              EmojiAlchemist
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md border border-red-200 hidden sm:block">
              Modo Map Pin (Zoom Max)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Generador de Emojis para Mapas
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Crea íconos optimizados para pines. 
            <span className="block font-medium text-indigo-600 mt-1">Activa "Visualizar en Pin" para descargar la imagen completa.</span>
          </p>
        </div>

        {/* Workspace */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-white p-6 md:p-8">
          <div className="grid md:grid-cols-12 gap-8">
            
            {/* Left Col: Reference */}
            <div className="md:col-span-5 space-y-6">
              <ReferenceUploader 
                onImageLoaded={setReferenceImage} 
                currentImage={referenceImage} 
              />
              {referenceImage ? (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <div className="bg-white p-1.5 rounded-full shadow-sm">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Estilo Detectado</h4>
                    <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                      Se generarán objetos grandes, ocupando todo el espacio, ideales para verse bien dentro de un círculo rojo pequeño.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-center">
                  <p className="text-xs text-slate-500">Sube una imagen para activar el estilo personalizado</p>
                </div>
              )}
            </div>

            {/* Right Col: Prompt */}
            <div className="md:col-span-7 flex flex-col h-full">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                <span>2. Lista de Objetos (1 por línea)</span>
              </label>
              <div className="relative flex-grow min-h-[180px]">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={`Ejemplos (Simples y Claros):
- Fiesta
- Cocktail
- Moto
- Montaña

Nota: La IA dibujará el objeto lo más grande posible para que encaje en el pin.`}
                  className="w-full h-full resize-none p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white text-base leading-relaxed"
                />
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={!referenceImage || !promptInput.trim() || appState === AppState.GENERATING}
                className={`mt-4 w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                  ${(!referenceImage || !promptInput.trim()) 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40'
                  }
                `}
              >
                {appState === AppState.GENERATING ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando Emojis...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Generar Emojis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <ResultsGrid images={generatedImages} onRegenerate={handleRegenerate} />

      </main>
    </div>
  );
}

export default App;