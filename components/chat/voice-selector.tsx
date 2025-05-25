// components/chat/voice-selector.tsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, User, Users } from 'lucide-react';
import { getTTSService } from '@/lib/services/ttsService';

interface VoiceSelectorProps {
  onVoiceSelect: (voice: SpeechSynthesisVoice) => void;
  selectedVoice?: SpeechSynthesisVoice | null;
}

export default function VoiceSelector({ onVoiceSelect, selectedVoice }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<{ female: SpeechSynthesisVoice[], male: SpeechSynthesisVoice[] }>({ 
    female: [], 
    male: [] 
  });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  useEffect(() => {
    const tts = getTTSService();
    if (!tts) return;

    const loadVoices = () => {
      // Use the TTS service's categorization
      const categorizedVoices = tts.getCategorizedVoices();
      setVoices(categorizedVoices);
      
      // Debug log to see what voices are available
      console.log('Available voices:', {
        female: categorizedVoices.female.map(v => v.name),
        male: categorizedVoices.male.map(v => v.name)
      });
    };

    // Load voices immediately
    loadVoices();

    // Also load on voices changed event (some browsers load voices asynchronously)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      // Force load voices after a delay if none loaded
      setTimeout(() => {
        if (voices.female.length === 0 && voices.male.length === 0) {
          loadVoices();
        }
      }, 100);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Load saved preferences
  useEffect(() => {
    const savedGender = localStorage.getItem('preferredVoiceGender');
    if (savedGender === 'male' || savedGender === 'female') {
      setSelectedGender(savedGender);
    }
  }, []);

  const handlePreviewVoice = (voice: SpeechSynthesisVoice) => {
    const tts = getTTSService();
    if (!tts) return;

    // Stop any ongoing speech
    tts.stop();
    setIsPreviewPlaying(true);

    // Preview with a caring message
    const previewText = selectedGender === 'female' 
      ? "Hello, I'm here to help you. How are you feeling today?"
      : "Hi there, I'm here to support you. What's on your mind?";
    
    tts.speak(previewText, {
      voice,
      rate: 0.9, // Slightly slower for a caring tone
      onEnd: () => setIsPreviewPlaying(false),
      onError: () => setIsPreviewPlaying(false),
    });
  };

  const handleSelectVoice = (voice: SpeechSynthesisVoice) => {
    onVoiceSelect(voice);
    setIsOpen(false);
    
    // Save preferences
    localStorage.setItem('preferredVoice', voice.name);
    localStorage.setItem('preferredVoiceGender', selectedGender);
  };

  const currentVoices = voices[selectedGender];
  const displayName = selectedVoice ? selectedVoice.name.split(' ')[0] : 'Select Voice';

  // Get voice info from TTS service
  const getVoiceInfo = (voice: SpeechSynthesisVoice) => {
    const tts = getTTSService();
    if (!tts) return { isRecommended: false, quality: 'standard' };
    
    const category = tts.categorizeVoice(voice);
    return {
      isRecommended: category.isRecommended,
      quality: category.quality
    };
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-all duration-200 group"
      >
        <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span className="font-light">{displayName}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Voice selector panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-full mb-3 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
            >
              {/* Header with gender toggle */}
              <div className="p-4 border-b border-gray-50">
                <h3 className="text-sm font-light text-gray-800 mb-3">Voice Assistant</h3>
                
                {/* Minimal gender toggle */}
                <div className="flex rounded-full bg-gray-50 p-0.5">
                  <button
                    onClick={() => setSelectedGender('female')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs transition-all duration-200 ${
                      selectedGender === 'female'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    Female
                  </button>
                  <button
                    onClick={() => setSelectedGender('male')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs transition-all duration-200 ${
                      selectedGender === 'male'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    Male
                  </button>
                </div>
              </div>

              {/* Voice list */}
              <div className="max-h-64 overflow-y-auto py-2">
                {currentVoices.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    No {selectedGender} voices available
                  </div>
                ) : (
                  currentVoices.slice(0, 10).map((voice, index) => {
                    const isSelected = selectedVoice?.name === voice.name;
                    const voiceInfo = getVoiceInfo(voice);
                    
                    return (
                      <motion.button
                        key={voice.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          if (isSelected) {
                            handlePreviewVoice(voice);
                          } else {
                            handleSelectVoice(voice);
                          }
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between group transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-400 to-purple-400'
                              : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <Volume2 className={`w-4 h-4 ${
                              isSelected ? 'text-white' : 'text-gray-500'
                            }`} />
                          </div>
                          
                          <div className="text-left">
                            <div className="text-sm text-gray-800 font-light">
                              {voice.name.split(' - ')[0].split(' (')[0]}
                              {voiceInfo.isRecommended && (
                                <span className="ml-2 text-xs text-indigo-500">Recommended</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {voiceInfo.quality === 'premium' ? 'Premium' : 'Standard'}
                              {voice.localService && ' • Offline'}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs text-indigo-600 font-light"
                          >
                            {isPreviewPlaying ? 'Playing...' : 'Selected'}
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Footer tip */}
              <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                <p className="text-xs text-gray-500 text-center font-light">
                  Click on selected voice to preview
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}