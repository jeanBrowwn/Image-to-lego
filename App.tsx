import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LegoResult } from './components/LegoResult';
import { ProgressIndicator } from './components/ProgressIndicator';
import { generateLegoBlueprint } from './services/geminiService';
import { validateAndPriceParts } from './services/bricklinkService';
import type { LegoBlueprint, LegoBuildSize } from './types';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [legoBlueprint, setLegoBlueprint] = useState<LegoBlueprint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<LegoBuildSize>('Medium');

  const sizeOptions: { size: LegoBuildSize; label: string; image: string }[] = [
    { size: 'Micro', label: 'Micro', image: 'https://y9ewilrk53.ufs.sh/f/EwJ3HKRKLTfdmpSZfRGsDESxzu9TLOrBgHVk3qMdFI16oiCK' },
    { size: 'Medium', label: 'Medium', image: 'https://y9ewilrk53.ufs.sh/f/EwJ3HKRKLTfdcQHDPJsnDL0MEbqdvuJ2Q5PF9cBtNVIWACUY' },
    { size: 'Large', label: 'Large', image: 'https://y9ewilrk53.ufs.sh/f/EwJ3HKRKLTfdr3nbmuZ4jX2zY09EDToLiGcJ3hNvmUyeBkK8' },
  ];

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Free memory when the component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setLegoBlueprint(null);
    setError(null);
  };

  const handleConvertClick = useCallback(async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setLegoBlueprint(null);

    try {
      setProgressMessage('Preparing image...');
      const base64Image = await fileToBase64(selectedFile);
      const mimeType = selectedFile.type;

      setProgressMessage(`Generating ${selectedSize} LEGO version...`);
      const initialBlueprint = await generateLegoBlueprint(base64Image, mimeType, selectedSize, setProgressMessage);
      
      setProgressMessage('Validating parts with BrickLink...');
      const validatedParts = await validateAndPriceParts(initialBlueprint.partsList);
      const realTotalCost = validatedParts.reduce((sum, part) => sum + part.realPrice * part.quantity, 0);

      const enhancedBlueprint: LegoBlueprint = {
        ...initialBlueprint,
        validatedParts,
        realTotalCost,
      };
      
      setProgressMessage('Complete!');
      setLegoBlueprint(enhancedBlueprint);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  }, [selectedFile, selectedSize]);
  
  const handleDemoClick = async () => {
    if (isLoading || isDemoLoading) return;
    setIsDemoLoading(true);
    setError(null);
    try {
        const response = await fetch('https://imgs.search.brave.com/yhrnFkiWpCUvftRgqs8YfxOY8t9s8dHnUn0vb-P7bAo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2U1LzYw/L2MyL2U1NjBjMmNk/YTFmMzcwMTI0NjAx/Y2Q4Zjg3ZTU4OWJj/LmpwZw');
        const blob = await response.blob();
        const file = new File([blob], "house-demo.jpg", { type: "image/jpeg" });
        handleFileSelect(file);
    } catch (err) {
        console.error("Failed to load demo image:", err);
        setError("Could not load the demo image. Please check your network connection.");
    }
    setIsDemoLoading(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setLegoBlueprint(null);
    setIsLoading(false);
    setIsDemoLoading(false);
    setError(null);
    setProgressMessage('');
    setSelectedSize('Medium');
  };

  const clearSelection = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">Image to <span className="text-accent">LEGO</span></h1>
        <p className="text-lg text-gray-500 mt-2">Upload any image to convert it into a LEGO masterpiece.</p>
      </header>

      <main className="w-full max-w-7xl flex-grow flex flex-col items-center justify-center">
        {!legoBlueprint && !isLoading && !error && (
            <div className="w-full max-w-2xl bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex flex-col gap-6">
              
              <div className="mb-2">
                <p className="text-center text-lg font-semibold text-gray-700 mb-4">1. Select Initial Size</p>
                <div className="flex justify-center gap-6">
                  {sizeOptions.map(({ size, label, image }) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={isLoading}
                      className={`relative rounded-lg overflow-hidden transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-wait
                        ${selectedSize === size ? 'ring-2 ring-accent shadow-lg' : 'ring-1 ring-gray-300 hover:ring-gray-400'}`}
                    >
                      <img src={image} alt={`${label} size preview`} className="w-40 h-40 object-cover transition-transform duration-200 group-hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50">
                        <p className="text-white text-center font-semibold text-sm py-1">{label}</p>
                      </div>
                      {selectedSize === size && (
                        <div className="absolute inset-0 bg-accent bg-opacity-30 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {!selectedFile ? (
                <div>
                  <label className="block text-lg font-semibold mb-3 text-gray-700">2. Upload an Image</label>
                  <ImageUploader onFileSelect={handleFileSelect} isLoading={isLoading || isDemoLoading} />
                   <div className="text-center mt-3">
                    <button
                        onClick={handleDemoClick}
                        disabled={isLoading || isDemoLoading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-wait transition"
                    >
                        {isDemoLoading ? 'Loading Demo...' : 'Or try a demo image'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in flex flex-col gap-4">
                    <div>
                        <label className="block text-xl font-semibold mb-3 text-gray-700">Image Preview</label>
                        <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden relative shadow-inner">
                            <img src={previewUrl || ''} alt="Selected preview" className="w-full h-full object-contain" />
                            <button
                                onClick={clearSelection}
                                disabled={isLoading}
                                className="absolute top-2 right-2 z-10 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-opacity disabled:opacity-50"
                                aria-label="Clear selection"
                            >
                                &#x2715;
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col">
                        <button
                            onClick={handleConvertClick}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-700 transition-colors disabled:bg-gray-400 disabled:cursor-wait"
                        >
                            Convert to LEGO
                        </button>
                    </div>
                </div>
              )}
            </div>
        )}

        {isLoading && (
          <ProgressIndicator message={progressMessage} />
        )}

        {error && (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-red-500">Generation Failed</h3>
            <p className="text-gray-600 mt-2 mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {legoBlueprint && !isLoading && (
          <div className="w-full">
            <LegoResult initialBlueprint={legoBlueprint} originalImage={selectedFile} />
             <div className="text-center mt-8">
                <button
                onClick={handleReset}
                className="px-8 py-3 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-accent-700 transition-colors"
                >
                Convert Another Image
                </button>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-7xl text-center text-gray-400 text-sm py-4 mt-8">
        <p> Built with <a href="https://aistudio.google.com "target="_blank" rel="noopener noreferrer" className="underline hover:text-accent transition-colors">aistudio.google.com</a> Idea by <a href="https://x.com/EricStrohmaier" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent transition-colors">Eric Strohmaier</a></p>
      </footer>
    </div>
  );
};

export default App;