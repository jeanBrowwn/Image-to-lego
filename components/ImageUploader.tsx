import React, { useState, useCallback, DragEvent, ChangeEvent } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, isLoading }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        alert('Please upload a valid image file (PNG, JPG, WEBP, etc.).');
      }
    }
  }, [onFileSelect]);
  
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setDragOver(true);
    }
  }, [isLoading]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!isLoading) {
      const files = e.dataTransfer.files;
      handleFileChange(files);
    }
  }, [isLoading, handleFileChange]);

  const handleClick = () => {
    if (!isLoading) {
      document.getElementById('file-input')?.click();
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
  };

  return (
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full px-8 py-24 bg-secondary border-2 border-dashed rounded-lg text-center transition-colors
          ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'}
          ${dragOver ? 'border-accent bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={onInputChange}
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          {dragOver ? (
            <p className="text-lg font-semibold text-accent">Drop the image here</p>
          ) : (
            <>
              <p className="text-lg font-semibold text-text-dark">Drag &amp; drop or click to upload</p>
              <p className="text-gray-500 mt-1 text-sm">PNG, JPG, GIF, WEBP</p>
            </>
          )}
        </div>
      </div>
  );
};