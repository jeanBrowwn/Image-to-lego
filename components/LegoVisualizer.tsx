import React, { useState, useEffect } from 'react';
import type { LegoBlueprint } from '../types';

interface LegoVisualizerProps {
  originalImage: File | null;
  blueprints: LegoBlueprint[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

export const LegoVisualizer: React.FC<LegoVisualizerProps> = ({ originalImage, blueprints, currentIndex, setCurrentIndex }) => {
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const imageData = blueprints[currentIndex]?.legoImageData;
  const currentBlueprint = blueprints[currentIndex];

  useEffect(() => {
    let objectUrl: string | null = null;
    if (originalImage) {
      objectUrl = URL.createObjectURL(originalImage);
      setOriginalImageUrl(objectUrl);
    }
    
    // Clean up the object URL on component unmount or when image changes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [originalImage]);

  const activeImage = showOriginal ? originalImageUrl : imageData;
  const activeLabel = showOriginal ? 'Original Image' : `LEGO Version (V${currentIndex + 1}: ${currentBlueprint?.size})`;
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-inner mb-4 cursor-pointer group"
        onClick={() => activeImage && setIsModalOpen(true)}
      >
        {activeImage ? (
          <>
            <img src={activeImage} alt={activeLabel} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">Loading image...</div>
        )}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {activeLabel}
        </div>
      </div>

      {originalImageUrl && (
        <div className="flex items-center justify-center gap-2 p-2 bg-secondary rounded-full flex-wrap">
          <button
            onClick={() => setShowOriginal(false)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors
              ${!showOriginal ? 'bg-accent text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
          >
            LEGO
          </button>
          
          {blueprints.length > 1 && (
            <div className="flex items-center gap-1 border-x border-gray-300 px-2">
              {blueprints.map((bp, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setShowOriginal(false);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors
                    ${currentIndex === index && !showOriginal 
                      ? 'bg-accent/20 text-accent' 
                      : 'text-gray-500 hover:bg-gray-300'
                    }`}
                  aria-label={`Select version ${index + 1}: ${bp.size}`}
                  title={`V${index + 1}: ${bp.size}`}
                >
                  V{index + 1}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowOriginal(true)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors
              ${showOriginal ? 'bg-accent text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
          >
            Original
          </button>
        </div>
      )}

      {isModalOpen && activeImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 animate-fade-in p-4"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div 
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="image-modal-title" className="sr-only">{activeLabel} - Full screen view</h2>
            <img 
              src={activeImage} 
              alt={activeLabel} 
              className="block max-w-full max-h-full object-contain rounded-lg"
            />
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black bg-opacity-50 text-2xl leading-none text-white transition hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
              aria-label="Close image viewer"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};