import React, { useState } from 'react';
import type { LegoBlueprint, LegoBuildSize } from '../types';
import { LegoVisualizer } from './LegoVisualizer';
import { PartsBreakdown } from './PartsBreakdown';
import { resizeLegoBlueprint } from '../services/geminiService';
import { validateAndPriceParts } from '../services/bricklinkService';


interface LegoResultProps {
  initialBlueprint: LegoBlueprint;
  originalImage: File | null;
}

const sizeOptions: { size: LegoBuildSize; label: string; image: string }[] = [
    { size: 'Micro', label: 'Micro', image: 'https://y9ewilrk53.ufs.sh/f/EwJ3HKRKLTfdmpSZfRGsDESxzu9TLOrBgHVk3qMdFI16oiCK' },
    { size: 'Medium', label: 'Medium', image: 'https://y9ewilrk53.ufs.sh/f/EwJ3HKRKLTfdcQHDPJsnDL0MEbqdvuJ2Q5PF9cBtNVIWACUY' },
    { size: 'Large', label: 'Large', image: 'https://y9ewilrk53.ufs.sh/f/EwJ3HKRKLTfdr3nbmuZ4jX2zY09EDToLiGcJ3hNvmUyeBkK8' },
];

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const LegoResult: React.FC<LegoResultProps> = ({ initialBlueprint, originalImage }) => {
  const [blueprints, setBlueprints] = useState<LegoBlueprint[]>([initialBlueprint]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeProgress, setResizeProgress] = useState('');
  const [resizeError, setResizeError] = useState<string | null>(null);

  const currentBlueprint = blueprints[currentIndex];

  const handleResize = async (targetSize: LegoBuildSize) => {
    if (isResizing || !originalImage) return;

    setIsResizing(true);
    setResizeError(null);
    try {
      // Prepare image data for the service call
      const originalBase64Image = await fileToBase64(originalImage);
      const originalMimeType = originalImage.type;
      
      const newBlueprint = await resizeLegoBlueprint(
        originalBase64Image,
        originalMimeType,
        targetSize,
        setResizeProgress
      );
      
      setResizeProgress('Validating new parts...');
      const validatedParts = await validateAndPriceParts(newBlueprint.partsList);
      const realTotalCost = validatedParts.reduce((sum, part) => sum + part.realPrice * part.quantity, 0);

      const enhancedBlueprint: LegoBlueprint = {
        ...newBlueprint,
        validatedParts,
        realTotalCost,
      };

      setBlueprints(prev => [...prev, enhancedBlueprint]);
      setCurrentIndex(blueprints.length);

    } catch (err) {
      console.error(err);
      setResizeError(err instanceof Error ? err.message : 'An unknown error occurred during resize.');
    } finally {
      setIsResizing(false);
      setResizeProgress('');
    }
  };


  return (
    <div className="w-full bg-primary p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in">
      <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
           {/* Resizing controls */}
          <div className="mb-6">
            {isResizing ? (
              <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg h-40">
                <div className="w-8 h-8 border-2 border-t-accent border-gray-200 rounded-full animate-spin mb-2"></div>
                <p className="text-sm text-gray-600">{resizeProgress}</p>
              </div>
            ) : (
              <div>
                <p className="text-center text-sm font-semibold text-gray-600 mb-2">Create a new version:</p>
                <div className="flex justify-center gap-4">
                  {sizeOptions.map(({ size, label, image }) => {
                    const isGenerated = blueprints.some(bp => bp.size === size);
                    return (
                        <button
                          key={size}
                          onClick={() => handleResize(size)}
                          disabled={isResizing || isGenerated}
                          className="relative rounded-lg overflow-hidden transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <img src={image} alt={`${label} size preview`} className="w-28 h-28 object-cover transition-transform duration-200 group-hover:scale-105" />
                          <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50">
                            <p className="text-white text-center font-semibold text-xs py-1">{label}</p>
                          </div>
                          {isGenerated && (
                            <div className="absolute inset-0 bg-success bg-opacity-70 flex items-center justify-center" title="Already generated">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                    )
                  })}
                </div>
                 {resizeError && <p className="text-center text-xs text-red-500 mt-2">{resizeError}</p>}
              </div>
            )}
          </div>
          <LegoVisualizer 
            originalImage={originalImage}
            blueprints={blueprints}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        </div>
        <div className="lg:col-span-2">
          <PartsBreakdown blueprint={currentBlueprint} />
        </div>
      </div>
    </div>
  );
};