// lib/services/ttsService.ts

export interface VoiceCategory {
  name: string;
  gender: 'female' | 'male';
  quality: 'premium' | 'standard';
  isRecommended: boolean;
}

export class TTSService {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPaused: boolean = false;

  // Comprehensive voice categorization
  private voiceProfiles: { [key: string]: { gender: 'female' | 'male', quality: 'premium' | 'standard' } } = {
    // Female voices
    'Microsoft Zira': { gender: 'female', quality: 'standard' },
    'Microsoft Zira Desktop': { gender: 'female', quality: 'standard' },
    'Microsoft Aria': { gender: 'female', quality: 'premium' },
    'Microsoft Aria Online': { gender: 'female', quality: 'premium' },
    'Microsoft Clara Online': { gender: 'female', quality: 'premium' },
    'Google UK English Female': { gender: 'female', quality: 'premium' },
    'Google US English Female': { gender: 'female', quality: 'premium' },
    'Samantha': { gender: 'female', quality: 'premium' },
    'Karen': { gender: 'female', quality: 'premium' },
    'Victoria': { gender: 'female', quality: 'premium' },
    'Kate': { gender: 'female', quality: 'premium' },
    'Serena': { gender: 'female', quality: 'premium' },
    'Moira': { gender: 'female', quality: 'standard' },
    'Fiona': { gender: 'female', quality: 'standard' },
    'Tessa': { gender: 'female', quality: 'standard' },
    'Susan': { gender: 'female', quality: 'standard' },
    'en-US-AriaNeural': { gender: 'female', quality: 'premium' },
    'en-GB-SoniaNeural': { gender: 'female', quality: 'premium' },
    'en-US-JennyNeural': { gender: 'female', quality: 'premium' },
    'en-AU-NatashaNeural': { gender: 'female', quality: 'premium' },
    
    // Male voices
    'Microsoft David': { gender: 'male', quality: 'standard' },
    'Microsoft David Desktop': { gender: 'male', quality: 'standard' },
    'Microsoft Mark': { gender: 'male', quality: 'standard' },
    'Microsoft Guy Online': { gender: 'male', quality: 'premium' },
    'Microsoft Eric Online': { gender: 'male', quality: 'premium' },
    'Google UK English Male': { gender: 'male', quality: 'premium' },
    'Google US English Male': { gender: 'male', quality: 'premium' },
    'Alex': { gender: 'male', quality: 'premium' },
    'Daniel': { gender: 'male', quality: 'premium' },
    'Oliver': { gender: 'male', quality: 'premium' },
    'Fred': { gender: 'male', quality: 'standard' },
    'Bruce': { gender: 'male', quality: 'standard' },
    'Tom': { gender: 'male', quality: 'standard' },
    'en-US-GuyNeural': { gender: 'male', quality: 'premium' },
    'en-GB-RyanNeural': { gender: 'male', quality: 'premium' },
    'en-US-ChristopherNeural': { gender: 'male', quality: 'premium' },
    'en-AU-WilliamNeural': { gender: 'male', quality: 'premium' },
  };

  // Recommended soft, caring voices
  private recommendedVoices = {
    female: [
      'Google UK English Female',
      'Microsoft Aria Online',
      'Samantha',
      'Karen',
      'en-US-AriaNeural',
      'en-GB-SoniaNeural',
    ],
    male: [
      'Google UK English Male',
      'Alex',
      'Daniel',
      'en-US-GuyNeural',
      'en-GB-RyanNeural',
    ]
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      throw new Error('Speech synthesis not supported in this browser');
    }
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  // Categorize a voice
  categorizeVoice(voice: SpeechSynthesisVoice): VoiceCategory {
    const voiceName = voice.name;
    
    // Check predefined profiles first
    for (const [profileName, profile] of Object.entries(this.voiceProfiles)) {
      if (voiceName.includes(profileName)) {
        const isRecommended = this.recommendedVoices[profile.gender].some(
          recommended => voiceName.includes(recommended)
        );
        return {
          name: voiceName,
          gender: profile.gender,
          quality: profile.quality,
          isRecommended
        };
      }
    }
    
    // Fallback categorization based on common patterns
    const lowerName = voiceName.toLowerCase();
    
    // Gender detection
    let gender: 'female' | 'male' = 'female'; // Default to female
    
    if (lowerName.includes('male') || 
        lowerName.includes('guy') || 
        lowerName.includes('man') ||
        lowerName.includes('christopher') ||
        lowerName.includes('eric') ||
        lowerName.includes('ryan') ||
        lowerName.includes('william')) {
      gender = 'male';
    }
    
    // Quality detection
    const quality = (lowerName.includes('neural') || 
                    lowerName.includes('online') ||
                    lowerName.includes('premium')) ? 'premium' : 'standard';
    
    return {
      name: voiceName,
      gender,
      quality,
      isRecommended: false
    };
  }

  // Get categorized voices
  getCategorizedVoices(): { female: SpeechSynthesisVoice[], male: SpeechSynthesisVoice[] } {
    const voices = this.getVoices();
    const categorized: { female: SpeechSynthesisVoice[], male: SpeechSynthesisVoice[] } = {
      female: [],
      male: []
    };
    
    voices.forEach(voice => {
      // Only include English voices
      if (!voice.lang.startsWith('en')) return;
      
      const category = this.categorizeVoice(voice);
      categorized[category.gender].push(voice);
    });
    
    // Sort by quality and recommendation
    const sortVoices = (voiceList: SpeechSynthesisVoice[], gender: 'female' | 'male') => {
      return voiceList.sort((a, b) => {
        const aCategory = this.categorizeVoice(a);
        const bCategory = this.categorizeVoice(b);
        
        // Recommended voices first
        if (aCategory.isRecommended && !bCategory.isRecommended) return -1;
        if (!aCategory.isRecommended && bCategory.isRecommended) return 1;
        
        // Premium voices next
        if (aCategory.quality === 'premium' && bCategory.quality !== 'premium') return -1;
        if (aCategory.quality !== 'premium' && bCategory.quality === 'premium') return 1;
        
        return a.name.localeCompare(b.name);
      });
    };
    
    categorized.female = sortVoices(categorized.female, 'female');
    categorized.male = sortVoices(categorized.male, 'male');
    
    return categorized;
  }

  // Get the best voice for a gender
  getBestVoice(gender?: 'female' | 'male'): SpeechSynthesisVoice | null {
    const categorized = this.getCategorizedVoices();
    const targetGender = gender || 'female';
    const voices = categorized[targetGender];
    
    if (voices.length === 0) {
      // Fallback to any available voice
      const allVoices = this.getVoices();
      return allVoices.find(v => v.lang.startsWith('en')) || allVoices[0] || null;
    }
    
    // Return the first (best) voice
    return voices[0];
  }

  // Speak text with options
  speak(text: string, options?: {
    voice?: SpeechSynthesisVoice | null;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onError?: (error: any) => void;
    onPause?: () => void;
    onResume?: () => void;
  }): void {
    // Cancel any ongoing speech
    this.stop();

    // Create new utterance
    this.currentUtterance = new SpeechSynthesisUtterance(text);

    // Set voice (use best voice if not specified)
    this.currentUtterance.voice = options?.voice || this.getBestVoice();

    // Set speech parameters for natural sound
    this.currentUtterance.rate = options?.rate || 0.9; // Slower for caring tone
    this.currentUtterance.pitch = options?.pitch || 1.0;
    this.currentUtterance.volume = options?.volume || 1.0;

    // Set event handlers
    if (options?.onEnd) {
      this.currentUtterance.onend = options.onEnd;
    }

    if (options?.onError) {
      this.currentUtterance.onerror = options.onError;
    }

    if (options?.onPause) {
      this.currentUtterance.onpause = options.onPause;
    }

    if (options?.onResume) {
      this.currentUtterance.onresume = options.onResume;
    }

    // Start speaking
    this.synthesis.speak(this.currentUtterance);
    this.isPaused = false;
  }

  // Pause speech
  pause(): void {
    if (this.synthesis.speaking && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
    }
  }

  // Resume speech
  resume(): void {
    if (this.isPaused) {
      this.synthesis.resume();
      this.isPaused = false;
    }
  }

  // Stop speech
  stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.currentUtterance = null;
      this.isPaused = false;
    }
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  // Check if paused
  isPausedState(): boolean {
    return this.isPaused;
  }

  // Clean markdown and prepare text for speech
  prepareTextForSpeech(markdownText: string): string {
    let text = markdownText;

    // Remove markdown syntax
    text = text.replace(/#{1,6}\s/g, ''); // Headers
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold
    text = text.replace(/\*([^*]+)\*/g, '$1'); // Italic
    text = text.replace(/__([^_]+)__/g, '$1'); // Bold
    text = text.replace(/_([^_]+)_/g, '$1'); // Italic
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
    text = text.replace(/`([^`]+)`/g, '$1'); // Inline code
    text = text.replace(/```[^`]*```/g, ''); // Code blocks
    text = text.replace(/^\s*[-*+]\s/gm, ''); // List items
    text = text.replace(/^\s*\d+\.\s/gm, ''); // Numbered lists
    text = text.replace(/^\s*>\s/gm, ''); // Blockquotes
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // Images

    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
  }
}

// Singleton instance
let ttsInstance: TTSService | null = null;

export const getTTSService = (): TTSService | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    if (!ttsInstance) {
      ttsInstance = new TTSService();
    }
    return ttsInstance;
  } catch (error) {
    console.warn('TTS not supported:', error);
    return null;
  }
};