import React, { useRef, useState, useEffect } from 'react';
import { FormField } from '../types';
import { ArrowUpRight, Move, Trash2, PlusSquare } from 'lucide-react';

interface PDFPreviewProps {
  images: string[];
  fields: FormField[];
  onUpdateField: (id: string, newRect: [number, number, number, number]) => void;
  onUpdateValue?: (id: string, value: string) => void;
  onDeleteField?: (id: string) => void;
  onAddField?: (rect: [number, number, number, number], pageIndex: number, label: string) => void;
  mode?: 'setup' | 'review';
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ images, fields, onUpdateField, onUpdateValue, onDeleteField, onAddField, mode = 'review' }) => {
  const [activePage, setActivePage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction states
  const [interactionMode, setInteractionMode] = useState<'none' | 'moving' | 'resizing' | 'drawing'>('none');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 }); 
  const [initialRect, setInitialRect] = useState<[number, number, number, number]>([0,0,0,0]);
  
  // Drawing State
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawRect, setDrawRect] = useState<[number, number, number, number] | null>(null);

  const pageFields = fields.filter(f => f.pageIndex === activePage);

  // Toggle Draw Mode
  const toggleDrawMode = () => {
      setIsDrawMode(!isDrawMode);
      setInteractionMode('none');
      setActiveFieldId(null);
      setDrawRect(null);
  };

  // --- Pointer Event Logic (Unified Mouse/Touch) ---

  const handlePointerDownMove = (e: React.PointerEvent, field: FormField) => {
    if (isDrawMode) return; // Don't move if drawing
    if (mode === 'review' && (e.target as HTMLElement).tagName.toLowerCase() === 'textarea') {
        return; 
    }

    e.preventDefault();
    e.stopPropagation();

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setInteractionMode('moving');
    setActiveFieldId(field.id);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialRect([...field.rect]);
  };

  const handlePointerDownResize = (e: React.PointerEvent, field: FormField) => {
    if (isDrawMode) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setInteractionMode('resizing');
    setActiveFieldId(field.id);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialRect([...field.rect]);
  };

  const handlePointerDownBackground = (e: React.PointerEvent) => {
      if (!isDrawMode || !containerRef.current) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xNorm = (x / rect.width) * 1000;
      const yNorm = (y / rect.height) * 1000;

      setInteractionMode('drawing');
      setStartPos({ x: e.clientX, y: e.clientY }); // For delta calc if needed, but we use raw coords
      // Initial draw rect is just a point
      setDrawRect([yNorm, xNorm, yNorm, xNorm]);
  };

  const handlePointerMove = (e: React.PointerEvent, isResizeHandle = false) => {
    if (!containerRef.current) return;
    
    // Check if we are drawing on background
    if (interactionMode === 'drawing' && isDrawMode && drawRect) {
         e.preventDefault();
         const rect = containerRef.current.getBoundingClientRect();
         const clientX = e.clientX;
         const clientY = e.clientY;
         
         const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
         const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

         const xNorm = (x / rect.width) * 1000;
         const yNorm = (y / rect.height) * 1000;

         // drawRect is [ymin, xmin, ymax, xmax]
         // The start point was set in handlePointerDownBackground
         // We need to determine new min/max based on current mouse pos vs start point
         // Actually, let's simplify: Start point is fixed. We update the 2nd point.
         // Wait, to do this correctly without extra state, let's assume drawRect[0]/[1] are startY/startX
         // and we update [2]/[3] as endY/endX.
         // But we need to handle dragging up/left (negative width/height).
         // So let's store Anchor point in drawRect for now and normalize on Up?
         // Simpler: Store anchor in a Ref or just use drawRect[0], drawRect[1] as anchor if we don't swap them yet.
         // Let's rely on StartPos being the anchor in pixel coords? No, StartPos is screen coords.
         
         // Let's just update based on current mouse.
         // We'll treat drawRect as [startY, startX, currentY, currentX] during draw, then normalize on release.
         setDrawRect([drawRect[0], drawRect[1], yNorm, xNorm]);
         return;
    }

    if (interactionMode === 'none' || !activeFieldId) return;
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
        let newYMin = ymin + dYNorm;
        let newXMax = xmax + dXNorm;
        
        // Constrain min size (20 units)
        newYMin = Math.max(0, Math.min(ymax - 20, newYMin));
        newXMax = Math.max(xmin + 20, Math.min(1000, newXMax));
        
        onUpdateField(activeFieldId, [newYMin, xmin, ymax, newXMax]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (interactionMode === 'drawing' && drawRect && onAddField) {
        // Normalize rect
        let [y1, x1, y2, x2] = drawRect;
        const finalRect: [number, number, number, number] = [
            Math.min(y1, y2),
            Math.min(x1, x2),
            Math.max(y1, y2),
            Math.max(x1, x2)
        ];

        // Only add if it has some size
        if ((finalRect[2] - finalRect[0]) > 10 && (finalRect[3] - finalRect[1]) > 10) {
            const label = window.prompt("Enter the question or label for this new field:");
            if (label && label.trim().length > 0) {
                onAddField(finalRect, activePage, label);
            }
        }
        setDrawRect(null);
        setIsDrawMode(false); // Turn off after one draw? User preference. Let's keep it off for safety.
    }

    setInteractionMode('none');
    try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (e) {}
  };
  
  const handleBackgroundClick = (e: React.MouseEvent) => {
      // If we are in draw mode, click might be handled by pointer events, but just in case
      if (!isDrawMode && (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG')) {
          setActiveFieldId(null);
      }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-2 mb-4 overflow-x-auto w-full justify-center p-2 items-center">
        {images.map((_, idx) => (
            <button
                key={idx}
                onClick={() => setActivePage(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activePage === idx ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
            >
                Page {idx + 1}
            </button>
        ))}
        {mode === 'setup' && (
            <div className="ml-4 pl-4 border-l border-slate-300 dark:border-slate-600">
                <button
                    onClick={toggleDrawMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDrawMode ? 'bg-amber-100 text-amber-700 border-2 border-amber-500 shadow-inner' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'}`}
                >
                    <PlusSquare size={16} />
                    {isDrawMode ? 'Drawing...' : 'Add Missing Field'}
                </button>
            </div>
        )}
      </div>

      <div 
        className={`relative shadow-2xl border border-slate-200 dark:border-slate-600 bg-slate-500 overflow-hidden select-none ${isDrawMode ? 'cursor-crosshair' : ''}`}
        style={{ width: '100%', maxWidth: '800px', aspectRatio: 'auto' }}
        ref={containerRef}
        onPointerDown={handlePointerDownBackground}
        onPointerMove={(e) => handlePointerMove(e)}
        onPointerUp={handlePointerUp}
        onClick={handleBackgroundClick}
      >
        <img 
            src={images[activePage]} 
            alt={`Page ${activePage + 1}`} 
            className="w-full h-auto block select-none pointer-events-none"
        />
        
        {/* Render the field being drawn */}
        {drawRect && isDrawMode && (
             <div 
                className="absolute border-2 border-amber-500 bg-amber-200/40 z-50 pointer-events-none"
                style={{
                    top: `${Math.min(drawRect[0], drawRect[2]) / 10}%`,
                    left: `${Math.min(drawRect[1], drawRect[3]) / 10}%`,
                    height: `${Math.abs(drawRect[2] - drawRect[0]) / 10}%`,
                    width: `${Math.abs(drawRect[3] - drawRect[1]) / 10}%`
                }}
             >
                 <span className="absolute -top-6 left-0 bg-amber-600 text-white text-xs px-2 py-0.5 rounded shadow">New Field</span>
             </div>
        )}

        {pageFields.map((field) => {
            const [ymin, xmin, ymax, xmax] = field.rect;
            const top = (ymin / 1000) * 100;
            const left = (xmin / 1000) * 100;
            const width = ((xmax - xmin) / 1000) * 100;
            const height = ((ymax - ymin) / 1000) * 100;

            const isActive = activeFieldId === field.id;
            const isMoving = isActive && interactionMode === 'moving';

            return (
                <div
                    key={field.id}
                    onPointerDown={(e) => handlePointerDownMove(e, field)}
                    // onPointerMove handled by container for smooth capture
                    // onPointerUp handled by container
                    className={`absolute border-2 rounded flex items-start justify-start touch-none ${isActive ? 'z-50 border-blue-600 bg-blue-100/30' : 'z-10 border-blue-500/50 bg-blue-100/20 hover:border-blue-600 hover:bg-blue-100/40'} group`}
                    style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${Math.max(width, 2)}%`,
                        height: `${Math.max(height, 2)}%`,
                        touchAction: 'none',
                        cursor: mode === 'setup' ? (isDrawMode ? 'crosshair' : 'move') : 'default',
                        pointerEvents: isDrawMode ? 'none' : 'auto' // Let clicks pass through to background when drawing
                    }}
                >
                    {mode === 'review' ? (
                        <textarea 
                            value={field.value}
                            onChange={(e) => onUpdateValue && onUpdateValue(field.id, e.target.value)}
                            className="w-full h-full bg-transparent text-xs text-blue-900 font-semibold px-1 py-1 outline-none resize-none overflow-hidden cursor-text"
                            style={{ lineHeight: '1.2' }}
                            readOnly={field.type === 'checkbox'}
                        />
                    ) : (
                        // Setup mode
                        <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-50">
                             <Move size={16} className="text-blue-800" />
                        </div>
                    )}
                    
                    {/* Floating Label */}
                    <div className={`absolute -top-6 left-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap pointer-events-none shadow-lg ${isActive || isMoving ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {field.label} {field.type === 'checkbox' ? '(Checkbox)' : ''}
                        {field.commonType ? ` • ${field.commonType.toUpperCase()}` : ''}
                    </div>

                    {/* Resize Handle - Top Right */}
                    <div 
                        onPointerDown={(e) => handlePointerDownResize(e, field)}
                        // onPointerMove handled by container
                        className="absolute top-[-8px] right-[-8px] w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-md touch-none z-50 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                        title="Resize Box"
                        style={{ 
                            touchAction: 'none',
                            cursor: 'nesw-resize',
                            display: isDrawMode ? 'none' : 'flex'
                        }}
                    >
                         <ArrowUpRight size={14} strokeWidth={3} />
                    </div>

                    {/* Delete Handle - Bottom Right (Only in Setup Mode) */}
                    {mode === 'setup' && onDeleteField && (
                        <div 
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDeleteField(field.id);
                            }}
                            className="absolute bottom-[-8px] right-[-8px] w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md z-50 opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-red-600 transition-all cursor-pointer"
                            title="Delete Field"
                            style={{ display: isDrawMode ? 'none' : 'flex' }}
                        >
                            <Trash2 size={12} />
                        </div>
                    )}
                </div>
            );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center px-4">
        {mode === 'setup' 
           ? <span><span className="font-semibold">Tap & Drag</span> to move. Use <span className="font-semibold text-red-500">Trash</span> icon to delete. Click <strong>"Add Missing Field"</strong> to draw new boxes.</span>
           : <span>Review your answers.</span>
        }
      </p>
    </div>
  );
};

export default PDFPreview;