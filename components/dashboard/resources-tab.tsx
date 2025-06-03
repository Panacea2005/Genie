import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Globe,
  Users,
  BookOpen,
  ExternalLink,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  MessageCircle,
  Heart,
  Shield,
  AlertCircle,
  X
} from 'lucide-react'

interface Resource {
  id: string
  name: string
  description: string
  category: 'crisis' | 'therapy' | 'community' | 'education' | 'apps'
  type: 'hotline' | 'website' | 'app' | 'article' | 'group'
  url?: string
  phone?: string
  availability?: string
  rating?: number
  featured?: boolean
  tags: string[]
  color: string
}

export default function ResourcesTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const resources: Resource[] = [
    {
      id: '1',
      name: 'National Suicide Prevention Lifeline',
      description: '24/7 free and confidential support for people in distress',
      category: 'crisis',
      type: 'hotline',
      phone: '988',
      availability: '24/7',
      featured: true,
      tags: ['crisis', 'urgent', 'suicide prevention'],
      color: '#ef4444' // red-500
    },
    {
      id: '2',
      name: 'Crisis Text Line',
      description: 'Free 24/7 text-based support from trained counselors',
      category: 'crisis',
      type: 'hotline',
      phone: 'Text HOME to 741741',
      availability: '24/7',
      featured: true,
      tags: ['crisis', 'text support', 'anxiety'],
      color: '#ef4444' // red-500
    },
    {
      id: '3',
      name: 'BetterHelp',
      description: 'Online therapy platform connecting you with licensed therapists',
      category: 'therapy',
      type: 'website',
      url: 'https://betterhelp.com',
      rating: 4.5,
      tags: ['therapy', 'online', 'counseling'],
      color: '#a855f7' // purple-500
    },
    {
      id: '4',
      name: 'Headspace',
      description: 'Meditation and mindfulness app for stress and anxiety',
      category: 'apps',
      type: 'app',
      url: 'https://headspace.com',
      rating: 4.8,
      tags: ['meditation', 'mindfulness', 'sleep'],
      color: '#f97316' // orange-500
    },
    {
      id: '5',
      name: 'NAMI Support Groups',
      description: 'Free, peer-led support groups for mental health',
      category: 'community',
      type: 'group',
      url: 'https://nami.org',
      tags: ['support groups', 'peer support', 'community'],
      color: '#3b82f6' // blue-500
    },
    {
      id: '6',
      name: 'Mental Health First Aid',
      description: 'Educational resources and training for mental health awareness',
      category: 'education',
      type: 'article',
      url: 'https://mentalhealthfirstaid.org',
      tags: ['education', 'training', 'awareness'],
      color: '#10b981' // emerald-500
    }
  ]

  const categories = [
    { id: 'all', name: 'All Resources', icon: Globe, color: '#6b7280' },
    { id: 'crisis', name: 'Crisis Support', icon: AlertCircle, color: '#ef4444' },
    { id: 'therapy', name: 'Therapy', icon: Heart, color: '#a855f7' },
    { id: 'community', name: 'Community', icon: Users, color: '#3b82f6' },
    { id: 'education', name: 'Education', icon: BookOpen, color: '#10b981' },
    { id: 'apps', name: 'Apps & Tools', icon: Phone, color: '#f97316' }
  ]

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const featuredResources = resources.filter(r => r.featured)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search - Minimal design */}
      <div className="mb-12">
        <motion.div 
          className="relative mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources, topics, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl focus:outline-none focus:border-gray-300 transition-all placeholder-gray-400 font-light"
          />
        </motion.div>

        {/* Category Pills - Minimal style */}
        <motion.div 
          className="flex gap-3 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {categories.map((category, index) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            
            return (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-light transition-all
                  ${isSelected 
                    ? 'bg-white/60 backdrop-blur-sm border border-gray-200 shadow-sm' 
                    : 'bg-white/30 backdrop-blur-sm border border-white/40 hover:bg-white/50'
                  }
                `}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon 
                  className="w-4 h-4 transition-colors" 
                  style={{ color: isSelected ? category.color : '#9ca3af' }}
                />
                <span className={isSelected ? 'text-gray-800' : 'text-gray-600'}>
                  {category.name}
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      {/* Emergency Banner - Minimal design */}
      <AnimatePresence>
        {selectedCategory === 'all' || selectedCategory === 'crisis' ? (
          <motion.div 
            className="mb-12 bg-red-50/30 backdrop-blur-sm border border-red-100/50 rounded-3xl p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Phone className="w-6 h-6 text-red-500" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Need immediate help?</h3>
                <p className="text-sm text-gray-600 font-light mb-4">
                  If you're in crisis or experiencing suicidal thoughts, help is available 24/7.
                </p>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <div className="text-xs text-gray-500 font-light mb-1">Call</div>
                    <div className="text-xl font-medium text-red-600">988</div>
                  </div>
                  <div className="h-10 w-px bg-red-100" />
                  <div>
                    <div className="text-xs text-gray-500 font-light mb-1">Text</div>
                    <div className="text-xl font-medium text-red-600">HOME to 741741</div>
                  </div>
                  <div className="h-10 w-px bg-red-100" />
                  <div>
                    <div className="text-xs text-gray-500 font-light mb-1">Emergency</div>
                    <div className="text-xl font-medium text-red-600">911</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Featured Resources - Minimal cards */}
      {!searchQuery && selectedCategory === 'all' && (
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-base font-medium text-gray-800 mb-6">Featured Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 * index }}
                  >
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-light text-gray-600">Featured</span>
                  </motion.div>
                  {resource.availability && (
                    <span className="text-xs text-gray-500 font-light flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resource.availability}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-gray-800 mb-2">{resource.name}</h3>
                <p className="text-sm text-gray-600 font-light mb-4">{resource.description}</p>
                
                {resource.phone && (
                  <motion.div 
                    className="flex items-center gap-3 text-lg font-medium"
                    style={{ color: resource.color }}
                    whileHover={{ x: 5 }}
                  >
                    <Phone className="w-5 h-5" />
                    {resource.phone}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resource Grid - Minimal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource, index) => {
          const categoryInfo = categories.find(c => c.id === resource.category)
          const Icon = categoryInfo?.icon || Globe
          
          return (
            <motion.div
              key={resource.id}
              className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6 hover:bg-white/50 hover:border-white/60 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
            >
              {/* Icon and Rating */}
              <div className="flex items-start justify-between mb-4">
                <Icon 
                  className="w-6 h-6" 
                  style={{ color: resource.color }}
                />
                {resource.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span className="text-sm text-gray-600 font-light">{resource.rating}</span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-medium text-gray-800 mb-2">{resource.name}</h3>
              <p className="text-sm text-gray-600 font-light mb-4 line-clamp-2">{resource.description}</p>
              
              {/* Tags - Minimal style */}
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-white/50 backdrop-blur-sm rounded-full text-xs text-gray-600 font-light">
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200/30">
                {resource.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4" />
                    <span className="font-light">{resource.phone}</span>
                  </div>
                )}
                
                {resource.url && (
                  <motion.a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-light hover:gap-2 transition-all"
                    style={{ color: resource.color }}
                    whileHover={{ x: 2 }}
                  >
                    Visit
                    <ExternalLink className="w-3 h-3" />
                  </motion.a>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Additional Resources - Minimal design */}
      <motion.div 
        className="mt-12 bg-gradient-to-br from-gray-50/30 to-gray-100/30 backdrop-blur-sm rounded-3xl border border-white/40 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-10 h-10 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-light text-gray-800 mb-3">Can't find what you need?</h3>
          <p className="text-gray-600 font-light mb-6 max-w-xl mx-auto">
            We're constantly updating our resources. If you need specific help or have suggestions for resources to add, 
            please let us know.
          </p>
          <div className="flex gap-4 justify-center">
            <motion.button 
              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-light hover:bg-gray-800 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Request a Resource
            </motion.button>
            <motion.button 
              className="px-6 py-3 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl font-light hover:bg-white/70 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Contact Support
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}