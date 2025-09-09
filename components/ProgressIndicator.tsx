
import React from 'react';

interface ProgressIndicatorProps {
  message: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ message }) => {
  return (
    <div className="w-full max-w-lg flex flex-col items-center justify-center p-12 md:p-16 bg-white rounded-lg shadow-lg text-center">
      <div className="flex justify-center items-center space-x-2 mb-6 h-12">
        <div className="w-8 h-8 bg-red-500 rounded-md animate-jump" style={{ animationDelay: '0s' }}></div>
        <div className="w-8 h-8 bg-blue-500 rounded-md animate-jump" style={{ animationDelay: '0.15s' }}></div>
        <div className="w-8 h-8 bg-yellow-400 rounded-md animate-jump" style={{ animationDelay: '0.3s' }}></div>
        <div className="w-8 h-8 bg-green-500 rounded-md animate-jump" style={{ animationDelay: '0.45s' }}></div>
      </div>
      <p className="text-lg font-semibold text-text-dark">Building Blueprint...</p>
      <p className="text-gray-500 mt-1">{message}</p>
    </div>
  );
};