import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Phone,
  Globe,
  Users,
  BookOpen,
  ExternalLink,
  Search,
  Heart,
  AlertCircle,
  MessageCircle
} from 'lucide-react'

interface Resource {
  id: string
  name: string
  description: string
  category: 'crisis' | 'therapy' | 'community' | 'education' | 'apps'
  url?: string
  phone?: string
  featured?: boolean
  icon: React.ComponentType<{ className?: string, style?: React.CSSProperties }>
  color: string
}

export default function ResourcesTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const resources: Resource[] = [
    {
      id: '1',
      name: 'Crisis Support',
      description: '24/7 confidential support when you need it most',
      category: 'crisis',
      phone: '988',
      featured: true,
      icon: Phone,
      color: '#ef4444' // red-500
    },
    {
      id: '2',
      name: 'Crisis Text Line',
      description: 'Free text-based support from trained counselors',
      category: 'crisis',
      phone: 'Text HOME to 741741',
      featured: true,
      icon: MessageCircle,
      color: '#ef4444' // red-500
    },
    {
      id: '3',
      name: 'Find a Therapist',
      description: 'Connect with licensed mental health professionals',
      category: 'therapy',
      url: 'https://psychologytoday.com',
      icon: Heart,
      color: '#a855f7' // purple-500
    },
    {
      id: '4',
      name: 'Meditation Apps',
      description: 'Guided meditation and mindfulness resources',
      category: 'apps',
      url: 'https://headspace.com',
      icon: Globe,
      color: '#3b82f6' // blue-500
    },
    {
      id: '5',
      name: 'Support Groups',
      description: 'Connect with others who understand your journey',
      category: 'community',
      url: 'https://nami.org',
      icon: Users,
      color: '#10b981' // emerald-500
    },
    {
      id: '6',
      name: 'Learn More',
      description: 'Educational resources about mental health',
      category: 'education',
      url: 'https://mentalhealthfirstaid.org',
      icon: BookOpen,
      color: '#f59e0b' // amber-500
    }
  ]

  const categories = [
    { id: 'all', name: 'All', icon: Globe, color: '#6b7280' },
    { id: 'crisis', name: 'Crisis', icon: AlertCircle, color: '#ef4444' },
    { id: 'therapy', name: 'Therapy', icon: Heart, color: '#a855f7' },
    { id: 'community', name: 'Community', icon: Users, color: '#10b981' },
    { id: 'education', name: 'Education', icon: BookOpen, color: '#f59e0b' },
    { id: 'apps', name: 'Apps', icon: Globe, color: '#3b82f6' }
  ]

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const emergencyResources = resources.filter(r => r.featured)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        className="mb-16 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl font-light text-gray-800 mb-2">Mental Health Resources</h1>
        <p className="text-gray-500 font-light text-sm">Find support when you need it</p>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="max-w-2xl mx-auto mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent font-light text-gray-700 placeholder-gray-400"
          />
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div 
        className="flex justify-center gap-3 mb-12 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {categories.map((category, index) => {
          const Icon = category.icon
          const isActive = selectedCategory === category.id
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-light transition-all
                ${isActive 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Emergency Section */}
      {selectedCategory === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-lg font-light text-gray-800 mb-6 text-center">Immediate Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {emergencyResources.map((resource, index) => {
              const Icon = resource.icon
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="bg-red-50/50 rounded-xl p-6 border border-red-100"
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${resource.color}15` }}
                    >
                      <Icon 
                        className="w-6 h-6" 
                        style={{ color: resource.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-light text-gray-800 mb-1">{resource.name}</h3>
                      <p className="text-sm font-light text-gray-600 mb-3">{resource.description}</p>
                      {resource.phone && (
                        <div className="text-lg font-light" style={{ color: resource.color }}>
                          {resource.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Resources Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {filteredResources.map((resource, index) => {
          const Icon = resource.icon
          
          return (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${resource.color}15` }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    style={{ color: resource.color }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-light text-gray-800 mb-2">{resource.name}</h3>
                  <p className="text-sm font-light text-gray-600 mb-4">{resource.description}</p>
                  
                  {resource.phone && (
                    <div className="text-sm font-light text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {resource.phone}
                    </div>
                  )}
                  
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-light text-gray-500 hover:text-gray-700 transition-colors group-hover:text-gray-700"
                    >
                      Learn more
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Help Section */}
      <motion.div 
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <p className="text-sm font-light text-gray-500 mb-6">
          Can't find what you're looking for?
        </p>
        <button className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-light text-sm">
          Request Support
        </button>
      </motion.div>
    </div>
  )
}