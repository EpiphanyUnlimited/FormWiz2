import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, SkipForward, SkipBack, Save, AlertCircle, RotateCcw, Bookmark, CheckCircle, Play, Pause, Square, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { FormField } from '../types';

interface VoiceInterviewerProps {
  fields: FormField[];
  onUpdate: (fields: FormField[]) => void;
  onComplete: (updatedFields: FormField[]) => void;
  onSaveForLater: () => boolean;
}

const VoiceInterviewer: React.FC<VoiceInterviewerProps> = ({ fields, onUpdate, onComplete, onSaveForLater }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localFields, setLocalFields] = useState<FormField[]>(fields);
  
  // Interaction State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [autoRead, setAutoRead] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const silenceTimerRef = useRef<any>(null);
  const autoReadRef = useRef(autoRead);

  // Helper to determine Question Label (e.g., 3A, 3B)
  const getQuestionPrefix = useCallback((index: number) => {
      const field = localFields[index];
      if (!field.groupLabel) return `Question ${index + 1}`;
      
      // Find all fields with this group label
      const groupFields = localFields.filter(f => f.groupLabel === field.groupLabel);
      if (groupFields.length <= 1) return `Question ${index + 1}`;
      
      const subIndex = groupFields.indexOf(field);
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const subLetter = letters[subIndex] || (subIndex + 1).toString();
      
      return `Question ${field.groupLabel}${subLetter}`;
  }, [localFields]);

  // Keep ref in sync
  useEffect(() => {
      autoReadRef.current = autoRead;
  }, [autoRead]);

  // Sync changes to parent
  useEffect(() => {
    onUpdate(localFields);
  }, [localFields, onUpdate]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        // Reset silence timer - Extended to 20 seconds as requested
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
            stopListening();
        }, 20000); 

        let interimTranscript = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
             const res = event.results[i];
             if (res.isFinal) {
                 finalChunk += res[0].transcript;
             } else {
                 interimTranscript += res[0].transcript;
             }
        }

        if (finalChunk) {
            setLocalFields(prev => {
                const updated = [...prev];
                const currentVal = updated[currentIndex].value || '';
                
                // For checkboxes, we might want to interpret "yes" or "check" as true, 
                // but usually voice is for text fields. 
                // If it's a checkbox, we just ignore text input or maybe append to a notes field?
                // For now, assuming voice is primarily for text fields.
                if (updated[currentIndex].type === 'checkbox') return updated;

                const prefix = (currentVal && !currentVal.match(/\s$/) && !finalChunk.match(/^\s/)) ? ' ' : '';
                updated[currentIndex].value = currentVal + prefix + finalChunk;
                return updated;
            });
        }

        setTranscript(interimTranscript);
        setError(null);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        setTranscript(prevTranscript => {
            if (prevTranscript.trim() && localFields[currentIndex].type !== 'checkbox') {
                setLocalFields(prev => {
                    const updated = [...prev];
                    const currentVal = updated[currentIndex].value || '';
                    const prefix = (currentVal && !currentVal.match(/\s$/) && !prevTranscript.match(/^\s/)) ? ' ' : '';
                    updated[currentIndex].value = currentVal + prefix + prevTranscript;
                    return updated;
                });
            }
            return '';
        });
      };
      
      recognitionRef.current.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
              console.error("Speech recognition error", event.error);
              setIsListening(false);
              setTranscript('');
          }
      }
    }
    
    return () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        synthRef.current.cancel();
    }
  }, [currentIndex, localFields]); // Dependencies

  const speakQuestion = useCallback(() => {
    const currentField = localFields[currentIndex];
    const prefix = getQuestionPrefix(currentIndex);
    const text = `${prefix}. ${currentField.label}. ${currentField.required ? "Required." : ""}`;

    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select Female Voice
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [currentIndex, localFields, getQuestionPrefix]);

  // Handle Question Change: Reset state and handle Auto-Read
  // CRITICAL: This effect only depends on currentIndex to prevent re-reading on typing
  useEffect(() => {
    setIsSpeaking(false);
    synthRef.current.cancel();
    setError(null);
    setTranscript('');
    
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    setIsListening(false);
    
    let timer: any;
    if (autoReadRef.current) {
        timer = setTimeout(() => {
            speakQuestion();
        }, 600);
    }

    return () => {
        if (timer) clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]); 
  // removed `speakQuestion` from deps to avoid loop when field updates, 
  // relying on currentIndex change to trigger this.

  const toggleSpeech = () => {
      if (isSpeaking) {
          synthRef.current.cancel();
          setIsSpeaking(false);
      } else {
          speakQuestion();
      }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      if (isSpeaking) {
          synthRef.current.cancel();
          setIsSpeaking(false);
      }
      
      try {
          recognitionRef.current.start();
          setIsListening(true);
          setError(null);
          setTranscript('');
          
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
              stopListening();
          }, 20000); // 20s
          
      } catch (e) {
          console.error("Failed to start recognition", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleManualChange = (text: string) => {
    const updated = [...localFields];
    updated[currentIndex].value = text;
    setLocalFields(updated);
    if (text.trim()) setError(null);
  };

  const toggleCheckbox = () => {
      const updated = [...localFields];
      const currentVal = updated[currentIndex].value;
      updated[currentIndex].value = currentVal === "true" ? "false" : "true";
      setLocalFields(updated);
  };
  
  const handleClear = () => {
      if (localFields[currentIndex].type === 'checkbox') {
        const updated = [...localFields];
        updated[currentIndex].value = "false";
        setLocalFields(updated);
      } else {
        handleManualChange('');
      }
      setTranscript('');
      if (isListening) stopListening();
  };
  
  const handleSave = () => {
      if (isListening) {
         recognitionRef.current.stop();
      }
      const success = onSaveForLater();
      if (success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
      }
  };

  const prevQuestion = () => {
    handleSave();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const nextQuestion = () => {
    // REMOVED required check enforcement as requested.
    handleSave();
    if (currentIndex < localFields.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(localFields);
    }
  };

  const currentField = localFields[currentIndex];
  const questionPrefix = getQuestionPrefix(currentIndex);

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 transition-colors duration-300">
      <div className="w-full mb-8">
        <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col">
                <span className="text-sm text-slate-400 dark:text-slate-500">{questionPrefix} of {localFields.length}</span>
            </div>
            
            <button 
                onClick={() => setAutoRead(!autoRead)}
                className="flex items-center gap-2 text-sm transition-colors group"
            >
                <span className={`text-xs ${autoRead ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>Auto-read</span>
                <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${autoRead ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 shadow-sm ${autoRead ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
            </button>
        </div>
        
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div 
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / localFields.length) * 100}%` }}
            ></div>
        </div>
      </div>

      <div className="mb-4 text-center space-y-4 w-full">
        <div className="flex flex-col items-center justify-center gap-2">
            {currentField.section && (
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    {currentField.section}
                </div>
            )}
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">
                {currentField.label}
                {currentField.required && <span className="text-xs text-red-500 dark:text-red-400 ml-2 font-normal uppercase border border-red-500 dark:border-red-400 px-1 rounded">Required</span>}
                </h2>
                <button
                    onClick={toggleSpeech}
                    className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    title={isSpeaking ? "Pause Reading" : "Read Question"}
                >
                    {isSpeaking ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
            </div>
        </div>
        
        <div className="relative">
            <div className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl min-h-[160px] flex flex-col justify-center items-center text-left relative ${error ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400'}`}>
                
                {currentField.type === 'checkbox' ? (
                   <button 
                      onClick={toggleCheckbox}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all ${currentField.value === "true" ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                   >
                       {currentField.value === "true" ? (
                           <CheckSquare size={64} />
                       ) : (
                           <SquareIcon size={64} />
                       )}
                       <span className="font-semibold text-lg">{currentField.value === "true" ? "Selected" : "Tap to Select"}</span>
                   </button>
                ) : (
                    <>
                        <textarea
                            value={currentField.value}
                            onChange={(e) => handleManualChange(e.target.value)}
                            disabled={isListening} 
                            className="w-full h-full bg-transparent outline-none resize-none text-lg text-slate-700 dark:text-slate-200 disabled:opacity-50 text-center"
                            placeholder={currentField.required ? "Required answer..." : "Your answer will appear here..."}
                        />
                        {isListening && transcript && (
                            <div className="absolute top-4 left-4 right-4 text-lg text-slate-500 dark:text-slate-400 pointer-events-none whitespace-pre-wrap text-center">
                                <span className="opacity-0">{currentField.value}</span>
                                <span>{(currentField.value && !currentField.value.match(/\s$/) && !transcript.match(/^\s/) ? ' ' : '') + transcript}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

             {isListening && (
                <div className="absolute top-2 right-2">
                    <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </div>
             )}
        </div>
        
        <div className="flex justify-end gap-2 text-sm">
             <button 
                onClick={handleClear}
                className="flex items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1"
             >
                 <RotateCcw size={14} /> Clear
             </button>
             <button 
                onClick={handleSave}
                className={`flex items-center gap-1 transition-colors px-2 py-1 ${saveStatus === 'saved' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'}`}
             >
                 {saveStatus === 'saved' ? <CheckCircle size={14} /> : <Bookmark size={14} />} 
                 {saveStatus === 'saved' ? 'Saved' : 'Save for later'}
             </button>
        </div>
      </div>

      <div className="flex gap-4 items-center mt-2">
        <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className={`p-4 rounded-full transition-colors ${currentIndex === 0 ? 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            title="Previous Question"
        >
            <SkipBack size={24} />
        </button>

        {currentField.type !== 'checkbox' && (
            <button
                onClick={isListening ? stopListening : startListening}
                className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-lg ${isListening ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-blue-500/30'}`}
            >
                {isListening ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
            </button>
        )}

        {/* Skip/Next Button Group */}
        <div className="flex items-center gap-2">
            <button
                onClick={nextQuestion}
                className="p-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex flex-col items-center justify-center"
                title="Skip / Next"
            >
                <SkipForward size={24} />
                <span className="text-[10px] uppercase font-bold mt-1">Skip</span>
            </button>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-400 dark:text-slate-500 text-center">
        {currentField.type === 'checkbox' ? "Select the option if applicable, or Skip." : (isListening ? "Listening..." : "Tap the mic to answer.")}
      </p>
    </div>
  );
};

export default VoiceInterviewer;