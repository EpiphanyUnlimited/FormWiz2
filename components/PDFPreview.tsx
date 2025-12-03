import React, { useRef, useState, useEffect } from 'react';
import { FormField } from '../types';
import { ArrowUpRight, Move } from 'lucide-react';

interface PDFPreviewProps {
  images: string[];
  fields: FormField[];
  onUpdateField: (id: string, newRect: [number, number, number, number]) => void;
  onUpdateValue: (id: string, value: string) => void;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ images, fields, onUpdateField, onUpdateValue }) => {
  const [activePage, setActivePage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction states
  const [interactionMode, setInteractionMode] = useState<'none' | 'moving' | 'resizing'>('none');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 }); 
  const [initialRect, setInitialRect] = useState<[number, number, number, number]>([0,0,0,0]);

  const pageFields = fields.filter(f => f.pageIndex === activePage);

  // --- Pointer Event Logic (Unified Mouse/Touch) ---

  const handlePointerDownMove = (e: React.PointerEvent, field: FormField) => {
    // Allow interacting with the textarea (e.g., clicking to type)
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'textarea') {
        return; 
    }

    e.preventDefault();
    e.stopPropagation();

    // Capture pointer to track movement even outside the element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setInteractionMode('moving');
    setActiveFieldId(field.id);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialRect([...field.rect]);
  };

  const handlePointerDownResize = (e: React.PointerEvent, field: FormField) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capture pointer
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setInteractionMode('resizing');
    setActiveFieldId(field.id);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialRect([...field.rect]);
  };

  const handlePointerMove = (e: React.PointerEvent, isResizeHandle = false) => {
    if (interactionMode === 'none' || !activeFieldId || !containerRef.current) return;
    
    // Only process events for the active pointer
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    e.preventDefault();

    const dxPixels = e.clientX - startPos.x;
    const dyPixels = e.clientY - startPos.y;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Convert pixels to normalized units (0-1000)
    const dXNorm = (dxPixels / containerWidth) * 1000;
    const dYNorm = (dyPixels / containerHeight) * 1000;

    const [ymin, xmin, ymax, xmax] = initialRect;

    if (interactionMode === 'moving' && !isResizeHandle) {
        const h = ymax - ymin;
        const w = xmax - xmin;
        
        let newY = ymin + dYNorm;
        let newX = xmin + dXNorm;
        
        // Clamp to page bounds
        newY = Math.max(0, Math.min(1000 - h, newY));
        newX = Math.max(0, Math.min(1000 - w, newX));

        onUpdateField(activeFieldId, [newY, newX, newY + h, newX + w]);

    } else if (interactionMode === 'resizing' && isResizeHandle) {
        // TOP-RIGHT RESIZE LOGIC
        // Fixed Point: Bottom-Left (ymax, xmin)
        // Adjusting: Top (ymin) and Right (xmax)

        let newYMin = ymin + dYNorm;
        let newXMax = xmax + dXNorm;
        
        // Constrain min size (20 units)
        // ymin cannot go below 0 or above ymax - 20 (min height)
        newYMin = Math.max(0, Math.min(ymax - 20, newYMin));
        
        // xmax cannot go below xmin + 20 or above 1000
        newXMax = Math.max(xmin + 20, Math.min(1000, newXMax));
        
        onUpdateField(activeFieldId, [newYMin, xmin, ymax, newXMax]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setInteractionMode('none');
    setActiveFieldId(null);
    try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (e) {
        // Ignore if pointer capture was already lost
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-2 mb-4 overflow-x-auto w-full justify-center p-2">
        {images.map((_, idx) => (
            <button
                key={idx}
                onClick={() => setActivePage(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activePage === idx ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
            >
                Page {idx + 1}
            </button>
        ))}
      </div>

      <div 
        className="relative shadow-2xl border border-slate-200 dark:border-slate-600 bg-slate-500 overflow-hidden"
        style={{ width: '100%', maxWidth: '800px', aspectRatio: 'auto' }}
        ref={containerRef}
      >
        <img 
            src={images[activePage]} 
            alt={`Page ${activePage + 1}`} 
            className="w-full h-auto block select-none pointer-events-none"
        />
        
        {pageFields.map((field) => {
            const [ymin, xmin, ymax, xmax] = field.rect;
            const top = (ymin / 1000) * 100;
            const left = (xmin / 1000) * 100;
            const width = ((xmax - xmin) / 1000) * 100;
            const height = ((ymax - ymin) / 1000) * 100;

            const isActive = activeFieldId === field.id;
            const isMoving = isActive && interactionMode === 'moving';
            const isResizing = isActive && interactionMode === 'resizing';

            return (
                <div
                    key={field.id}
                    onPointerDown={(e) => handlePointerDownMove(e, field)}
                    onPointerMove={(e) => handlePointerMove(e, false)}
                    onPointerUp={handlePointerUp}
                    className={`absolute border-2 rounded flex items-start justify-start touch-none ${isActive ? 'z-50 border-blue-600 bg-blue-100/30' : 'z-10 border-blue-500/50 bg-blue-100/20 hover:border-blue-600 hover:bg-blue-100/40'} group`}
                    style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${Math.max(width, 2)}%`,
                        height: `${Math.max(height, 2)}%`,
                        touchAction: 'none' // Critical: prevent scroll ONLY when dragging the box
                    }}
                >
                    <textarea 
                        value={field.value}
                        onChange={(e) => onUpdateValue(field.id, e.target.value)}
                        className="w-full h-full bg-transparent text-xs text-blue-900 font-semibold px-1 py-1 outline-none resize-none overflow-hidden cursor-text"
                        style={{ lineHeight: '1.2' }}
                    />
                    
                    {/* Floating Label */}
                    <div className={`absolute -top-6 left-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap pointer-events-none shadow-lg ${isActive || isMoving ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {field.label}
                    </div>

                    {/* Resize Handle - Top Right */}
                    <div 
                        onPointerDown={(e) => handlePointerDownResize(e, field)}
                        onPointerMove={(e) => handlePointerMove(e, true)}
                        onPointerUp={handlePointerUp}
                        className="absolute top-[-8px] right-[-8px] w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-md touch-none z-50 opacity-80 hover:opacity-100 hover:scale-110 transition-all"
                        title="Resize Box"
                        style={{ 
                            touchAction: 'none',
                            cursor: 'nesw-resize'
                        }}
                    >
                         <ArrowUpRight size={16} strokeWidth={3} />
                    </div>
                </div>
            );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center px-4">
        <span className="font-semibold">Drag</span> the box border to move. <span className="font-semibold">Drag</span> the blue circle (Top Right) to resize.
      </p>
    </div>
  );
};

export default PDFPreview;