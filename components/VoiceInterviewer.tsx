import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, SkipForward, SkipBack, Save, AlertCircle, RotateCcw, Bookmark, CheckCircle, Play, Pause, Square, Volume2 } from 'lucide-react';
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

  // Keep ref in sync for useEffect usage without dependency issues
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
        // CRITICAL: Reset silence timer on EVERY result to prevent cutting off the user
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
            stopListening();
        }, 5000); // 5 seconds of absolute silence required to stop

        let currentSessionTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
             currentSessionTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentSessionTranscript);
        setError(null);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        // Commit logic
        setTranscript(prevTranscript => {
            if (prevTranscript.trim()) {
                setLocalFields(prev => {
                    const updated = [...prev];
                    const currentVal = updated[currentIndex].value || '';
                    const prefix = (currentVal && !currentVal.match(/\s$/)) ? ' ' : '';
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
  }, [currentIndex]); // Re-bind if index changes

  const speakQuestion = useCallback(() => {
    const currentField = localFields[currentIndex];
    const text = `Question ${currentIndex + 1}. ${currentField.label}. ${currentField.required ? "This question is required." : ""}`;

    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [currentIndex, localFields]);

  // Handle Question Change: Reset state and handle Auto-Read
  useEffect(() => {
    setIsSpeaking(false);
    synthRef.current.cancel();
    setError(null);
    setTranscript('');
    
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    setIsListening(false);
    
    // Auto-read logic if enabled
    let timer: any;
    if (autoReadRef.current) {
        timer = setTimeout(() => {
            speakQuestion();
        }, 600);
    }

    return () => {
        if (timer) clearTimeout(timer);
    };
  }, [currentIndex, speakQuestion]);

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
          }, 5000);
          
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
  
  const handleClear = () => {
      handleManualChange('');
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
    const currentField = localFields[currentIndex];
    if (currentField.required && !currentField.value.trim() && !transcript.trim()) {
      const errorMsg = "This field is required. Please provide an answer.";
      setError(errorMsg);
      const u = new SpeechSynthesisUtterance(errorMsg);
      synthRef.current.speak(u);
      return;
    }
    
    handleSave();

    if (currentIndex < localFields.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(localFields);
    }
  };

  const currentField = localFields[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 transition-colors duration-300">
      <div className="w-full mb-8">
        <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col">
                <span className="text-sm text-slate-400 dark:text-slate-500">Question {currentIndex + 1} of {localFields.length}</span>
            </div>
            
            <button 
                onClick={() => setAutoRead(!autoRead)}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
                <span className={`text-xs font-medium ${autoRead ? 'text-blue-600 dark:text-blue-400' : ''}`}>Auto-read</span>
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
        <div className="text-right mt-1">
            <span className="text-xs text-slate-400 dark:text-slate-500">{Math.round(((currentIndex + 1) / localFields.length) * 100)}% Complete</span>
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
                {currentField.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
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
            <div className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl min-h-[120px] text-left relative ${error ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400'}`}>
                <textarea
                    value={currentField.value}
                    onChange={(e) => handleManualChange(e.target.value)}
                    disabled={isListening} 
                    className="w-full h-full bg-transparent outline-none resize-none text-lg text-slate-700 dark:text-slate-200 disabled:opacity-50"
                    placeholder={currentField.required ? "Required answer..." : "Your answer will appear here..."}
                />
                {isListening && transcript && (
                    <div className="absolute top-4 left-4 right-4 text-lg text-slate-500 dark:text-slate-400 pointer-events-none whitespace-pre-wrap">
                        <span className="opacity-0">{currentField.value}</span>
                        <span>{(currentField.value && !currentField.value.match(/\s$/) ? ' ' : '') + transcript}</span>
                    </div>
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
             
             {error && (
               <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center text-red-500 dark:text-red-400 text-sm gap-1 animate-pulse">
                 <AlertCircle size={14} />
                 <span>{error}</span>
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

        <button
            onClick={isListening ? stopListening : startListening}
            className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-lg ${isListening ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-blue-500/30'}`}
        >
            {isListening ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
        </button>

        <button
            onClick={nextQuestion}
            className="p-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title={currentIndex === localFields.length - 1 ? "Finish" : "Next"}
        >
            {currentIndex === localFields.length - 1 ? <Save size={24} /> : <SkipForward size={24} />}
        </button>
      </div>

      <p className="mt-8 text-sm text-slate-400 dark:text-slate-500 text-center">
        {isListening ? "Listening... Speak naturally." : "Tap the mic to start answering."}
      </p>
    </div>
  );
};

export default VoiceInterviewer;