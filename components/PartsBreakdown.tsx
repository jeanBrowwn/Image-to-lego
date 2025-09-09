import React, { useState } from 'react';
import type { LegoBlueprint, ValidatedLegoPart } from '../types';

declare global {
  interface Window {
    jspdf: any;
  }
}

const InfoCard: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
  <div className={`flex flex-col bg-secondary p-3 rounded-md text-center ${className}`}>
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-base font-semibold text-text-dark">{value}</span>
  </div>
);

const PartItem: React.FC<{ part: ValidatedLegoPart }> = ({ part }) => {
    return (
        <li className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0">
            <div className="flex-grow">
                 <p className="font-medium text-text-dark">
                    {part.quantity}x {part.pieceName}
                </p>
                <p className="text-xs text-gray-500">
                    ID: <a href={part.brickLinkUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-blue-700">{part.pieceId}</a> ({part.color})
                </p>
                {part.notes && <p className="text-xs text-orange-600 mt-1">{part.notes}</p>}
            </div>
            <div className="text-right ml-4 flex-shrink-0">
                <p className="font-semibold text-text-dark">${part.realPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-400">each</p>
            </div>
        </li>
    );
};


export const PartsBreakdown: React.FC<{ blueprint: LegoBlueprint }> = ({ blueprint }) => {
  const [tooltip, setTooltip] = useState<{ visible: boolean; text: string; x: number; y: number } | null>(null);

  const overallAvailability = blueprint.validatedParts?.some(p => p.availability !== 'Available') 
    ? '⚠️ Some parts rare' 
    : 'All parts in stock';

  const handleDownloadPdf = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // Main Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Image to LEGO', pageW / 2, yPos, { align: 'center' });
    yPos += 8;

    // Blueprint Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(blueprint.title, pageW / 2, yPos, { align: 'center' });
    yPos += 10;

    const img = new Image();
    img.src = blueprint.legoImageData;
    img.onload = () => {
      try {
        const imgW = img.width;
        const imgH = img.height;
        const ratio = imgW / imgH;
        let displayW = pageW - (margin * 2);
        let displayH = displayW / ratio;
        if (displayH > 80) { // Max image height
            displayH = 80;
            displayW = displayH * ratio;
        }

        doc.addImage(blueprint.legoImageData, 'JPEG', (pageW - displayW) / 2, yPos, displayW, displayH);
        yPos += displayH + 10;
        
        // Description
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', margin, yPos);
        yPos += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(blueprint.description, pageW - (margin * 2));
        doc.text(descLines, margin, yPos);
        yPos += (descLines.length * 4) + 5;


        // Specifications
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Specifications', margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Pieces: ${blueprint.totalPieces}`, margin, yPos);
        doc.text(`Real Cost (BrickLink): $${(blueprint.realTotalCost ?? 0).toFixed(2)}`, pageW / 2, yPos);
        yPos += 5;
        doc.text(`Difficulty: ${blueprint.difficultyLevel}`, margin, yPos);
        doc.text(`Build Time: ${blueprint.buildTime}`, pageW / 2, yPos);
        yPos += 10;

        // Parts List Header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Parts List', margin, yPos);
        yPos += 5;
        doc.setLineWidth(0.2);
        doc.line(margin, yPos, pageW - margin, yPos);
        yPos += 5;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Qty', margin, yPos);
        doc.text('Name / Color', margin + 15, yPos);
        doc.text('Part ID', margin + 100, yPos);
        doc.text('Price (ea)', pageW - margin, yPos, { align: 'right' });
        yPos += 2;
        doc.line(margin, yPos, pageW - margin, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        blueprint.validatedParts?.forEach(part => {
          if (yPos > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = margin;
          }

          const nameLines = doc.splitTextToSize(`${part.pieceName} (${part.color})`, 80);
          doc.text(String(part.quantity), margin, yPos);
          doc.text(nameLines, margin + 15, yPos);
          doc.text(part.pieceId, margin + 100, yPos);
          doc.text(`$${part.realPrice.toFixed(2)}`, pageW - margin, yPos, { align: 'right' });
          
          yPos += (nameLines.length * 4) + 3;
        });

        const fileName = `${blueprint.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-blueprint.pdf`;
        doc.save(fileName);
      } catch (e) {
        console.error("Error generating PDF:", e);
        alert("An error occurred while generating the PDF. Please check the console for details.");
      }
    };
    img.onerror = () => {
        alert("Failed to load image for PDF generation. The generated image might be in a format that jsPDF cannot process.");
    };
  };

  const showTooltip = (e: React.MouseEvent, text: string) => {
    setTooltip({ visible: true, text, x: e.clientX, y: e.clientY });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-text-dark mb-2">{blueprint.title}</h2>
      <p className="text-gray-600 mb-6 text-sm">{blueprint.description}</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-6">
        <InfoCard label="Total Pieces" value={blueprint.totalPieces} />
        <InfoCard label="Difficulty" value={blueprint.difficultyLevel} />
        <InfoCard label="Est. AI Cost" value={`$${blueprint.estimatedCost.toFixed(2)}`} className="line-through text-gray-400" />
        <InfoCard label="Real Cost (BL)" value={`$${(blueprint.realTotalCost ?? 0).toFixed(2)}`} className="!bg-green-100" />
        <InfoCard label="Build Time" value={blueprint.buildTime} className="col-span-1 sm:col-span-2" />
        <InfoCard label="Availability" value={overallAvailability} className="col-span-1 sm:col-span-2 !bg-blue-50" />
      </div>

      <div className="flex-grow flex flex-col bg-secondary rounded-lg p-4 min-h-0">
        <h3 className="text-lg font-semibold text-text-dark mb-2">Parts List</h3>
        <div className="flex-grow overflow-y-auto pr-2">
           <ul className="divide-y divide-gray-200">
             {blueprint.validatedParts?.map((part, index) => (
                <PartItem key={`${part.pieceId}-${index}`} part={part} />
             ))}
           </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6">
      <div className="flex gap-3">
          <div className="w-full" onMouseEnter={(e) => showTooltip(e, "Coming soon!")} onMouseLeave={hideTooltip}>
            <button 
                disabled 
                className="w-full py-3 text-sm font-semibold bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
                🛒 Order Parts
            </button>
          </div>
          <div className="w-full" onMouseEnter={(e) => showTooltip(e, "Coming soon!")} onMouseLeave={hideTooltip}>
            <button 
                disabled
                className="w-full py-3 text-sm font-semibold bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
                📄 Print Instructions
            </button>
          </div>
        </div>
        <button
            onClick={handleDownloadPdf}
            className="w-full py-3 text-sm font-semibold bg-success text-white rounded-lg shadow-md hover:bg-green-700 transition-colors"
        >
            Download Blueprint
        </button>
        
      </div>
      
      {tooltip && tooltip.visible && (
        <div 
            style={{ top: `${tooltip.y + 20}px`, left: `${tooltip.x}px`, transform: 'translateX(-50%)' }}
            className="fixed z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm pointer-events-none"
        >
            {tooltip.text}
        </div>
      )}
    </div>
  );
};