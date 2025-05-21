// services/mentalHealthResources.ts

export interface Resource {
  name: string;
  description: string;
  url: string;
  phone?: string;
  category: 'crisis' | 'anxiety' | 'depression' | 'general' | 'wellness' | 'community';
  isPriority?: boolean;
  regions?: string[]; // Countries/regions where this resource is available
}

export const mentalHealthResources: Resource[] = [
  // Crisis Resources
  {
    name: "National Suicide Prevention Lifeline",
    description: "24/7, free and confidential support for people in distress",
    url: "https://988lifeline.org/",
    phone: "988 or 1-800-273-8255",
    category: "crisis",
    isPriority: true,
    regions: ["US"]
  },
  {
    name: "Crisis Text Line",
    description: "Free 24/7 text line for people in crisis",
    url: "https://www.crisistextline.org/",
    phone: "Text HOME to 741741",
    category: "crisis",
    isPriority: true,
    regions: ["US", "UK", "Canada", "Ireland"]
  },
  {
    name: "International Association for Suicide Prevention",
    description: "Resources for crisis support worldwide",
    url: "https://www.iasp.info/resources/Crisis_Centres/",
    category: "crisis",
    isPriority: true
  },
  
  // Anxiety Resources
  {
    name: "Anxiety and Depression Association of America",
    description: "Information, resources, and support for anxiety disorders",
    url: "https://adaa.org/",
    category: "anxiety",
    regions: ["US"]
  },
  {
    name: "Calm",
    description: "App for meditation, sleep, and relaxation",
    url: "https://www.calm.com/",
    category: "anxiety"
  },
  {
    name: "AnxietyBC",
    description: "Self-help strategies and resources for anxiety",
    url: "https://www.anxietycanada.com/",
    category: "anxiety",
    regions: ["Canada"]
  },
  
  // Depression Resources
  {
    name: "Depression and Bipolar Support Alliance",
    description: "Peer support and educational resources",
    url: "https://www.dbsalliance.org/",
    category: "depression",
    regions: ["US"]
  },
  {
    name: "Mental Health America",
    description: "Tools, screening, and resources for depression",
    url: "https://www.mhanational.org/depression",
    category: "depression",
    regions: ["US"]
  },
  {
    name: "Black Emotional and Mental Health (BEAM)",
    description: "Resources for Black communities",
    url: "https://www.beam.community/",
    category: "depression",
    regions: ["US"]
  },
  
  // General Mental Health Resources
  {
    name: "National Alliance on Mental Illness (NAMI)",
    description: "Education, support, and advocacy",
    url: "https://www.nami.org/",
    phone: "NAMI HelpLine: 1-800-950-6264",
    category: "general",
    regions: ["US"]
  },
  {
    name: "Mental Health America",
    description: "Screening tools and resources",
    url: "https://www.mhanational.org/",
    category: "general",
    regions: ["US"]
  },
  {
    name: "Psychology Today Therapist Directory",
    description: "Find therapists and counselors in your area",
    url: "https://www.psychologytoday.com/us/therapists",
    category: "general"
  },
  
  // Wellness Resources
  {
    name: "Headspace",
    description: "Mindfulness and meditation app",
    url: "https://www.headspace.com/",
    category: "wellness"
  },
  {
    name: "Greater Good in Action",
    description: "Science-based exercises for a meaningful life",
    url: "https://ggia.berkeley.edu/",
    category: "wellness"
  },
  {
    name: "VeryWellMind",
    description: "Mental health information and resources",
    url: "https://www.verywellmind.com/",
    category: "wellness"
  },
  
  // Community Support
  {
    name: "7 Cups",
    description: "Online therapy and free counseling",
    url: "https://www.7cups.com/",
    category: "community"
  },
  {
    name: "Mental Health America",
    description: "Find an affiliate in your area",
    url: "https://www.mhanational.org/find-affiliate",
    category: "community",
    regions: ["US"]
  },
  {
    name: "NAMI Connection",
    description: "Recovery support groups",
    url: "https://www.nami.org/Support-Education/Support-Groups/NAMI-Connection",
    category: "community",
    regions: ["US"]
  }
];

// Helper functions to access resources

export function getResourcesByCategory(category: string): Resource[] {
  return mentalHealthResources.filter(resource => resource.category === category);
}

export function getPriorityResources(): Resource[] {
  return mentalHealthResources.filter(resource => resource.isPriority);
}

export function getResourcesByRegion(region: string): Resource[] {
  return mentalHealthResources.filter(
    resource => !resource.regions || resource.regions.includes(region)
  );
}

export function searchResources(query: string): Resource[] {
  const lowerQuery = query.toLowerCase();
  return mentalHealthResources.filter(
    resource => 
      resource.name.toLowerCase().includes(lowerQuery) || 
      resource.description.toLowerCase().includes(lowerQuery)
  );
}

// Mental health techniques and exercises

export interface Technique {
  id: string;
  name: string;
  description: string;
  steps: string[];
  category: 'grounding' | 'breathing' | 'mindfulness' | 'cognitive' | 'behavioral';
  duration: 'short' | 'medium' | 'long'; // Short: <2min, Medium: 2-10min, Long: >10min
}

export const mentalHealthTechniques: Technique[] = [
  // Grounding Techniques
  {
    id: "5-4-3-2-1",
    name: "5-4-3-2-1 Grounding Exercise",
    description: "A sensory awareness exercise to help manage anxiety and bring attention to the present moment",
    steps: [
      "Acknowledge 5 things you can SEE around you",
      "Acknowledge 4 things you can TOUCH or FEEL",
      "Acknowledge 3 things you can HEAR",
      "Acknowledge 2 things you can SMELL",
      "Acknowledge 1 thing you can TASTE"
    ],
    category: "grounding",
    duration: "short"
  },
  {
    id: "body-scan",
    name: "Body Scan",
    description: "A practice to bring awareness to each part of your body to release tension",
    steps: [
      "Sit or lie down in a comfortable position",
      "Take a few deep breaths",
      "Bring awareness to your feet, noticing any sensations",
      "Slowly move your attention up through each part of your body",
      "Notice any areas of tension and consciously relax them",
      "Continue until you reach the top of your head"
    ],
    category: "grounding",
    duration: "medium"
  },
  
  // Breathing Techniques
  {
    id: "box-breathing",
    name: "Box Breathing",
    description: "A calming breathing pattern used to reduce stress and improve focus",
    steps: [
      "Inhale through your nose for a count of 4",
      "Hold your breath for a count of 4",
      "Exhale through your mouth for a count of 4",
      "Hold your breath for a count of 4",
      "Repeat for 5-10 cycles"
    ],
    category: "breathing",
    duration: "short"
  },
  {
    id: "4-7-8-breathing",
    name: "4-7-8 Breathing",
    description: "A relaxing breathing technique to help reduce anxiety and promote sleep",
    steps: [
      "Place the tip of your tongue against the roof of your mouth, behind your front teeth",
      "Exhale completely through your mouth, making a whoosh sound",
      "Close your mouth and inhale through your nose for a count of 4",
      "Hold your breath for a count of 7",
      "Exhale completely through your mouth for a count of 8, making a whoosh sound",
      "Repeat for 4 cycles"
    ],
    category: "breathing",
    duration: "short"
  },
  
  // Mindfulness Techniques
  {
    id: "mindful-minute",
    name: "Mindful Minute",
    description: "A quick mindfulness practice for busy moments",
    steps: [
      "Pause whatever you're doing",
      "Take a comfortable seated position",
      "Focus on your breath for one minute",
      "Notice the sensations of breathing without trying to change them",
      "When your mind wanders, gently bring it back to your breath"
    ],
    category: "mindfulness",
    duration: "short"
  },
  {
    id: "leaves-on-stream",
    name: "Leaves on a Stream",
    description: "A visualization exercise to detach from difficult thoughts",
    steps: [
      "Imagine sitting beside a gently flowing stream",
      "Picture leaves floating on the surface of the water",
      "When thoughts arise, place each one on a leaf",
      "Watch the leaf and the thought float away",
      "Return your attention to the stream, ready for the next leaf",
      "Continue for 5-10 minutes"
    ],
    category: "mindfulness",
    duration: "medium"
  },
  
  // Cognitive Techniques
  {
    id: "thought-challenging",
    name: "Thought Challenging",
    description: "Identify and challenge negative thought patterns",
    steps: [
      "Identify a negative or anxious thought",
      "Write down evidence that supports this thought",
      "Write down evidence that contradicts this thought",
      "Consider alternative explanations or perspectives",
      "Create a more balanced, realistic thought",
      "Notice how your feelings change with this new perspective"
    ],
    category: "cognitive",
    duration: "medium"
  },
  {
    id: "worry-time",
    name: "Scheduled Worry Time",
    description: "Set aside specific time to address worries",
    steps: [
      "Choose a 15-30 minute period each day as your 'worry time'",
      "When worries arise outside this time, note them down",
      "Remind yourself you'll address them during your scheduled worry time",
      "During worry time, review your list and address each concern",
      "When worry time is over, put the list away and return to your day"
    ],
    category: "cognitive",
    duration: "medium"
  },
  
  // Behavioral Techniques
  {
    id: "activity-scheduling",
    name: "Activity Scheduling",
    description: "Plan and engage in positive activities to improve mood",
    steps: [
      "Make a list of activities you enjoy or that give you a sense of accomplishment",
      "Schedule these activities into your week, even if just for 10-15 minutes",
      "Complete the activities as scheduled, even if you don't feel like it",
      "Notice how your mood changes before and after the activity",
      "Gradually increase the frequency and duration of activities"
    ],
    category: "behavioral",
    duration: "long"
  },
  {
    id: "progressive-muscle",
    name: "Progressive Muscle Relaxation",
    description: "Systematically tense and relax muscle groups to reduce physical tension",
    steps: [
      "Find a comfortable position seated or lying down",
      "Start with your feet, tense the muscles for 5-10 seconds",
      "Release the tension and notice the feeling of relaxation",
      "Move up through each muscle group (calves, thighs, abdomen, etc.)",
      "Tense and release each group, paying attention to the differences in sensation",
      "By the end, your whole body should feel more relaxed"
    ],
    category: "behavioral",
    duration: "medium"
  }
];

export function getTechniquesByCategory(category: string): Technique[] {
  return mentalHealthTechniques.filter(technique => technique.category === category);
}

export function getTechniquesByDuration(duration: string): Technique[] {
  return mentalHealthTechniques.filter(technique => technique.duration === duration);
}

export function getTechniqueById(id: string): Technique | undefined {
  return mentalHealthTechniques.find(technique => technique.id === id);
}

export function getRandomTechnique(): Technique {
  const randomIndex = Math.floor(Math.random() * mentalHealthTechniques.length);
  return mentalHealthTechniques[randomIndex];
}