import React, { useCallback, useState } from 'react';

interface ReferenceUploaderProps {
  onImageLoaded: (base64: string) => void;
  currentImage: string | null;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ onImageLoaded, currentImage }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [onImageLoaded]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageLoaded(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        1. Estilo de Referencia (Sube tu imagen de emojis)
      </label>
      
      <div 
        className={`relative group border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:border-indigo-400'}
          ${currentImage ? 'h-64' : 'h-40'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {currentImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-100">
            <img 
              src={currentImage} 
              alt="Reference Style" 
              className="max-h-full max-w-full object-contain p-2"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                Cambiar Imagen
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Arrastra tu imagen de referencia o haz clic</span>
            <span className="text-xs text-slate-400 mt-1">PNG, JPG (Max 5MB)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceUploader;