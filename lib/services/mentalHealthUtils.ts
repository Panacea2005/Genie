// lib/services/mentalHealthUtils.ts
import { Message } from '@/lib/services/chatService';
import { MentalHealthContext } from '@/lib/services/chatStore';

// Keywords for different mental health categories
const KEYWORDS = {
  anxiety: [
    'anxiety', 'anxious', 'panic', 'worry', 'worried', 'nervous', 
    'stress', 'stressed', 'overwhelm', 'overwhelmed', 'fear', 'afraid',
    'racing thoughts', 'overthinking', 'on edge', 'uneasy'
  ],
  depression: [
    'depression', 'depressed', 'sad', 'sadness', 'hopeless', 'helpless',
    'worthless', 'empty', 'numb', 'tired', 'exhausted', 'unmotivated',
    'no energy', 'no interest', 'can\'t enjoy', 'don\'t enjoy'
  ],
  crisis: [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'die', 'death',
    'self-harm', 'hurt myself', 'cutting', 'cut myself', 'overdose',
    'can\'t go on', 'giving up', 'end it all', 'no reason to live'
  ],
  trauma: [
    'trauma', 'traumatic', 'ptsd', 'flashback', 'nightmare', 'abuse',
    'assault', 'violence', 'accident', 'disaster', 'war', 'combat'
  ],
  sleep: [
    'insomnia', 'can\'t sleep', 'trouble sleeping', 'sleep problem',
    'nightmares', 'tired', 'exhausted', 'fatigue', 'drowsy'
  ],
  substance: [
    'alcohol', 'drinking', 'drunk', 'drug', 'substance', 'addiction',
    'addicted', 'smoking', 'cigarettes', 'weed', 'marijuana', 'cocaine'
  ],
  positive: [
    'happy', 'happiness', 'joy', 'grateful', 'thankful', 'peace', 'calm',
    'relaxed', 'hopeful', 'optimistic', 'confident', 'proud', 'accomplished'
  ]
};

// Analysis functions

/**
 * Analyze a message for mental health keywords
 */
export function analyzeMessage(message: string): { 
  categories: string[], 
  severity: number 
} {
  const lowerMessage = message.toLowerCase();
  const categories: string[] = [];
  let severityScore = 0;
  
  // Check each category
  Object.entries(KEYWORDS).forEach(([category, keywords]) => {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
    if (matches.length > 0) {
      categories.push(category);
      // Increase severity based on number of matches and specific categories
      const categoryWeight = category === 'crisis' ? 3 : category === 'depression' ? 2 : 1;
      severityScore += matches.length * categoryWeight;
    }
  });
  
  // Normalize severity on a 1-10 scale
  let severity = Math.min(Math.round(severityScore / 2), 10);
  
  // If crisis keywords are present, minimum severity is 7
  if (categories.includes('crisis')) {
    severity = Math.max(severity, 7);
  }
  
  return { categories, severity };
}

/**
 * Generate appropriate resources based on message analysis
 */
export function suggestResources(analysisResult: { categories: string[], severity: number }): string[] {
  const { categories, severity } = analysisResult;
  const resources: string[] = [];
  
  // Crisis resources always included if crisis detected or severity high
  if (categories.includes('crisis') || severity >= 7) {
    resources.push('National Suicide Prevention Lifeline: 988 or 1-800-273-8255');
    resources.push('Crisis Text Line: Text HOME to 741741');
  }
  
  // Category-specific resources
  if (categories.includes('anxiety')) {
    resources.push('Anxiety and Depression Association of America: adaa.org');
  }
  
  if (categories.includes('depression')) {
    resources.push('Depression resources: nimh.nih.gov/health/topics/depression');
  }
  
  if (categories.includes('trauma')) {
    resources.push('National Center for PTSD: ptsd.va.gov');
  }
  
  if (categories.includes('substance')) {
    resources.push('SAMHSA Helpline: 1-800-662-4357');
  }
  
  // General resources for moderate severity
  if (severity >= 4 && severity < 7) {
    resources.push('Consider discussing these feelings with a mental health professional');
  }
  
  return resources;
}

/**
 * Recommend appropriate techniques based on message analysis
 */
export function suggestTechniques(analysisResult: { categories: string[], severity: number }): string[] {
  const { categories } = analysisResult;
  const techniques: string[] = [];
  
  if (categories.includes('anxiety')) {
    techniques.push('box-breathing');
    techniques.push('5-4-3-2-1');
    techniques.push('progressive-muscle');
  }
  
  if (categories.includes('depression')) {
    techniques.push('activity-scheduling');
    techniques.push('thought-challenging');
  }
  
  if (categories.includes('sleep')) {
    techniques.push('body-scan');
    techniques.push('4-7-8-breathing');
  }
  
  // General mindfulness for all
  techniques.push('mindful-minute');
  
  return techniques;
}

/**
 * Track symptoms mentioned over time to identify patterns
 */
export function trackSymptoms(
  context: MentalHealthContext,
  message: string
): string[] {
  const lowerMessage = message.toLowerCase();
  const newSymptoms: string[] = [];
  
  // Common symptoms to track
  const symptoms = [
    'headache', 'fatigue', 'insomnia', 'racing heart', 'chest pain',
    'nausea', 'dizziness', 'shortness of breath', 'muscle tension',
    'irritability', 'crying', 'appetite change', 'concentration',
    'memory issues', 'mood swings', 'nightmares', 'intrusive thoughts'
  ];
  
  symptoms.forEach(symptom => {
    if (lowerMessage.includes(symptom) && !context.mentionedSymptoms.includes(symptom)) {
      newSymptoms.push(symptom);
    }
  });
  
  return newSymptoms;
}

/**
 * Determine if a mental health referral is needed based on conversation history
 */
export function needsMentalHealthReferral(
  messages: Message[],
  context: MentalHealthContext
): { needed: boolean, reason: string } {
  // Check for crisis indicators in recent messages
  const recentMessages = messages.slice(-5);
  const hasCrisisIndicator = recentMessages.some(message => 
    message.role === 'user' && analyzeMessage(message.content).categories.includes('crisis')
  );
  
  if (hasCrisisIndicator) {
    return { needed: true, reason: 'Crisis indicators detected' };
  }
  
  // Check for consistent symptom patterns
  if (context.mentionedSymptoms.length >= 3) {
    return { 
      needed: true, 
      reason: 'Multiple symptoms mentioned that would benefit from professional assessment' 
    };
  }
  
  // Check for mood patterns
  if (context.reportedMoods.length >= 3) {
    const recentMoods = context.reportedMoods.slice(-3);
    const allNegative = recentMoods.every(mood => 
      ['Sad', 'Anxious', 'Angry', 'Overwhelmed', 'Tired'].includes(mood.mood)
    );
    
    const allHighIntensity = recentMoods.every(mood => mood.intensity >= 7);
    
    if (allNegative && allHighIntensity) {
      return { 
        needed: true, 
        reason: 'Consistent pattern of intense negative emotions' 
      };
    }
  }
  
  return { needed: false, reason: '' };
}

/**
 * Generate initial safety plan based on conversation
 */
export function generateInitialSafetyPlan(
  messages: Message[]
): MentalHealthContext['safetyPlan'] {
  // This would be a simple starting point that could be refined with the user
  return {
    warningSigns: [
      'Feeling overwhelmed',
      'Increased social isolation',
      'Thoughts of hopelessness'
    ],
    copingStrategies: [
      'Deep breathing exercises',
      'Calling a supportive friend',
      'Going for a walk'
    ],
    contacts: [
      { name: 'Crisis Text Line', relationship: 'Support Service', phone: '741741' },
      { name: 'National Suicide Prevention Lifeline', relationship: 'Support Service', phone: '988' }
    ],
    resources: [
      'Local emergency room',
      'Primary care doctor',
      'Therapist (if applicable)'
    ],
    safeEnvironment: [
      'Remove any potentially harmful items',
      'Stay with supportive people when distressed',
      'Have emergency contacts easily accessible'
    ]
  };
}

/**
 * Detect if the current conversation may be triggering for the user
 */
export function detectTriggeringContent(
  message: string,
  context: MentalHealthContext
): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check against user's known sensitive topics
  for (const [topic, sensitivity] of Object.entries(context.topicSensitivity)) {
    if (sensitivity >= 4 && lowerMessage.includes(topic.toLowerCase())) {
      return true;
    }
  }
  
  // Check for potentially triggering content in general
  const triggeringTopics = [
    'abuse', 'assault', 'violence', 'death', 'suicide', 'self-harm',
    'trauma', 'war', 'accident', 'shooting', 'attack'
  ];
  
  return triggeringTopics.some(topic => lowerMessage.includes(topic));
}

/**
 * Track emotional changes over time
 */
export function trackEmotionalChanges(
  context: MentalHealthContext
): {
  trend: 'improving' | 'worsening' | 'fluctuating' | 'stable',
  details: string
} {
  if (context.reportedMoods.length < 3) {
    return { trend: 'stable', details: 'Not enough data to determine trends' };
  }
  
  // Map moods to numeric values for analysis
  const moodValues: {[key: string]: number} = {
    'Happy': 5,
    'Calm': 4,
    'Hopeful': 3,
    'Tired': 1,
    'Sad': -1,
    'Anxious': -3,
    'Overwhelmed': -4,
    'Angry': -5
  };
  
  // Calculate trend
  const recentMoods = context.reportedMoods.slice(-5);
  const moodScores = recentMoods.map(mood => {
    // Consider both the type of mood and its intensity
    const baseScore = moodValues[mood.mood] || 0;
    // Normalize intensity to -5 to +5 scale
    const adjustedIntensity = (mood.intensity - 5) / 2;
    
    // For positive moods, higher intensity is better
    // For negative moods, higher intensity is worse
    return baseScore > 0 
      ? baseScore + adjustedIntensity
      : baseScore - adjustedIntensity;
  });
  
  // Check for trend direction
  let improving = true;
  let worsening = true;
  let stable = true;
  
  for (let i = 1; i < moodScores.length; i++) {
    if (Math.abs(moodScores[i] - moodScores[i-1]) > 2) {
      stable = false;
    }
    if (moodScores[i] <= moodScores[i-1]) {
      improving = false;
    }
    if (moodScores[i] >= moodScores[i-1]) {
      worsening = false;
    }
  }
  
  if (improving) {
    return { trend: 'improving', details: 'Mood appears to be gradually improving' };
  } else if (worsening) {
    return { trend: 'worsening', details: 'Mood appears to be gradually declining' };
  } else if (stable) {
    return { trend: 'stable', details: 'Mood appears relatively stable' };
  } else {
    return { trend: 'fluctuating', details: 'Mood appears to be fluctuating significantly' };
  }
}

/**
 * Generate appropriate chat title based on mental health content
 */
export function generateMentalHealthChatTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  
  if (!firstUserMessage) {
    return `Support Chat ${new Date().toLocaleString()}`;
  }
  
  const analysis = analyzeMessage(firstUserMessage.content);
  
  // Create category-based title
  if (analysis.categories.includes('anxiety')) {
    return 'Anxiety Support';
  } else if (analysis.categories.includes('depression')) {
    return 'Depression Support';
  } else if (analysis.categories.includes('trauma')) {
    return 'Trauma Support';
  } else if (analysis.categories.includes('sleep')) {
    return 'Sleep Support';
  } else if (analysis.categories.includes('substance')) {
    return 'Substance Use Support';
  } else if (analysis.categories.includes('positive')) {
    return 'Wellness Check-in';
  }
  
  // Generic mental health title
  return 'Mental Health Support';
}