import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Heart,
  Wind,
  Zap,
  Target,
  Clock,
  Star,
  Lock,
  CheckCircle,
  Play,
  BookOpen,
  Award,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'

interface Skill {
  id: string
  name: string
  description: string
  category: 'breathing' | 'cognitive' | 'behavioral' | 'mindfulness' | 'grounding'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  steps: string[]
  benefits: string[]
  progress: number
  locked: boolean
  practiced: number
  lastPracticed?: string
}

export default function SkillsTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const skills: Skill[] = [
    {
      id: 'deep-breathing',
      name: 'Deep Breathing',
      description: 'Fundamental breathing technique for instant calm',
      category: 'breathing',
      difficulty: 'beginner',
      duration: '2-5 min',
      steps: [
        'Find a comfortable position',
        'Breathe in slowly through your nose for 4 counts',
        'Hold for 4 counts',
        'Exhale through mouth for 6 counts',
        'Repeat 5-10 times'
      ],
      benefits: ['Reduces stress', 'Lowers heart rate', 'Improves focus'],
      progress: 100,
      locked: false,
      practiced: 23,
      lastPracticed: '2 days ago'
    },
    {
      id: 'thought-stopping',
      name: 'Thought Stopping',
      description: 'Interrupt negative thought patterns effectively',
      category: 'cognitive',
      difficulty: 'intermediate',
      duration: '5-10 min',
      steps: [
        'Notice the negative thought',
        'Say "STOP" mentally or out loud',
        'Take a deep breath',
        'Replace with a positive thought',
        'Engage in an activity'
      ],
      benefits: ['Breaks rumination', 'Reduces anxiety', 'Improves mood'],
      progress: 75,
      locked: false,
      practiced: 12,
      lastPracticed: '1 week ago'
    },
    {
      id: 'progressive-relaxation',
      name: 'Progressive Muscle Relaxation',
      description: 'Systematically release tension throughout your body',
      category: 'behavioral',
      difficulty: 'beginner',
      duration: '10-15 min',
      steps: [
        'Start with your toes',
        'Tense muscles for 5 seconds',
        'Release and notice the relaxation',
        'Move up through each muscle group',
        'End with full body relaxation'
      ],
      benefits: ['Relieves physical tension', 'Improves sleep', 'Reduces anxiety'],
      progress: 50,
      locked: false,
      practiced: 8,
      lastPracticed: '3 days ago'
    },
    {
      id: 'mindful-observation',
      name: 'Mindful Observation',
      description: 'Develop present-moment awareness',
      category: 'mindfulness',
      difficulty: 'advanced',
      duration: '15-20 min',
      steps: [
        'Choose an object to observe',
        'Focus all attention on it',
        'Notice colors, textures, shapes',
        'Observe without judgment',
        'Return focus when mind wanders'
      ],
      benefits: ['Enhances focus', 'Reduces stress', 'Increases awareness'],
      progress: 25,
      locked: false,
      practiced: 4
    },
    {
      id: 'sensory-grounding',
      name: 'Sensory Grounding',
      description: 'Use your senses to anchor in the present',
      category: 'grounding',
      difficulty: 'beginner',
      duration: '3-5 min',
      steps: [
        'Identify 5 things you see',
        'Notice 4 things you can touch',
        'Listen for 3 sounds',
        'Identify 2 scents',
        'Notice 1 taste'
      ],
      benefits: ['Stops panic attacks', 'Grounds in reality', 'Quick relief'],
      progress: 90,
      locked: false,
      practiced: 31,
      lastPracticed: 'Yesterday'
    },
    {
      id: 'advanced-visualization',
      name: 'Advanced Visualization',
      description: 'Master-level mental imagery techniques',
      category: 'mindfulness',
      difficulty: 'advanced',
      duration: '20-30 min',
      steps: ['Unlock by completing 5 intermediate skills'],
      benefits: ['Deep relaxation', 'Enhanced creativity', 'Emotional healing'],
      progress: 0,
      locked: true,
      practiced: 0
    }
  ]

  const categories = [
    { id: 'all', name: 'All Skills', icon: Brain },
    { id: 'breathing', name: 'Breathing', icon: Wind },
    { id: 'cognitive', name: 'Cognitive', icon: Brain },
    { id: 'behavioral', name: 'Behavioral', icon: Target },
    { id: 'mindfulness', name: 'Mindfulness', icon: Heart },
    { id: 'grounding', name: 'Grounding', icon: Zap }
  ]

  const filteredSkills = skills.filter(skill => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'breathing': return 'from-blue-400 to-cyan-500'
      case 'cognitive': return 'from-purple-400 to-pink-500'
      case 'behavioral': return 'from-orange-400 to-red-500'
      case 'mindfulness': return 'from-green-400 to-emerald-500'
      case 'grounding': return 'from-indigo-400 to-purple-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900 mb-2">Coping Skills Library</h1>
        <p className="text-gray-500">Master techniques to manage stress and improve well-being</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">12/20</div>
              <div className="text-xs text-gray-500">Skills Mastered</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">156</div>
              <div className="text-xs text-gray-500">Total Practice Sessions</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">Expert</div>
              <div className="text-xs text-gray-500">Current Level</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">24h</div>
              <div className="text-xs text-gray-500">Total Practice Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <button className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors
                  ${selectedCategory === category.id 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <motion.div
            key={skill.id}
            whileHover={{ y: -2 }}
            className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
              skill.locked ? 'opacity-75' : ''
            }`}
          >
            {/* Progress Bar */}
            <div className="h-1 bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${skill.progress}%` }}
                className={`h-full bg-gradient-to-r ${getCategoryGradient(skill.category)}`}
              />
            </div>
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    {skill.name}
                    {skill.locked && <Lock className="w-4 h-4 text-gray-400" />}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(skill.difficulty)}`}>
                      {skill.difficulty}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {skill.duration}
                    </span>
                  </div>
                </div>
                
                {skill.progress === 100 && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{skill.description}</p>
              
              {/* Stats */}
              {!skill.locked && (
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>Practiced {skill.practiced} times</span>
                  {skill.lastPracticed && (
                    <>
                      <span>•</span>
                      <span>{skill.lastPracticed}</span>
                    </>
                  )}
                </div>
              )}
              
              {/* Action Button */}
              <button
                onClick={() => !skill.locked && setSelectedSkill(skill)}
                disabled={skill.locked}
                className={`
                  w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors
                  ${skill.locked 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                  }
                `}
              >
                {skill.locked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Locked
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Practice
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSkill(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-32 bg-gradient-to-br ${getCategoryGradient(selectedSkill.category)} p-6 text-white`}>
              <h2 className="text-2xl font-light">{selectedSkill.name}</h2>
              <p className="text-white/80 mt-1">{selectedSkill.description}</p>
            </div>
            
            <div className="p-6">
              {/* Benefits */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSkill.benefits.map((benefit, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Steps */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">How to Practice</h3>
                <div className="space-y-3">
                  {selectedSkill.steps.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-4">
                <button className="flex-1 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
                  Start Practice
                </button>
                <button 
                  onClick={() => setSelectedSkill(null)}
                  className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}