import { useState } from 'react'
import { motion } from 'framer-motion'
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
  AlertCircle
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
}

export default function ResourcesTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

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
      tags: ['crisis', 'urgent', 'suicide prevention']
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
      tags: ['crisis', 'text support', 'anxiety']
    },
    {
      id: '3',
      name: 'BetterHelp',
      description: 'Online therapy platform connecting you with licensed therapists',
      category: 'therapy',
      type: 'website',
      url: 'https://betterhelp.com',
      rating: 4.5,
      tags: ['therapy', 'online', 'counseling']
    },
    {
      id: '4',
      name: 'Headspace',
      description: 'Meditation and mindfulness app for stress and anxiety',
      category: 'apps',
      type: 'app',
      url: 'https://headspace.com',
      rating: 4.8,
      tags: ['meditation', 'mindfulness', 'sleep']
    },
    {
      id: '5',
      name: 'NAMI Support Groups',
      description: 'Free, peer-led support groups for mental health',
      category: 'community',
      type: 'group',
      url: 'https://nami.org',
      tags: ['support groups', 'peer support', 'community']
    },
    {
      id: '6',
      name: 'Mental Health First Aid',
      description: 'Educational resources and training for mental health awareness',
      category: 'education',
      type: 'article',
      url: 'https://mentalhealthfirstaid.org',
      tags: ['education', 'training', 'awareness']
    }
  ]

  const categories = [
    { id: 'all', name: 'All Resources', icon: Globe },
    { id: 'crisis', name: 'Crisis Support', icon: AlertCircle },
    { id: 'therapy', name: 'Therapy', icon: Heart },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'education', name: 'Education', icon: BookOpen },
    { id: 'apps', name: 'Apps & Tools', icon: Phone }
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900 mb-2">Mental Health Resources</h1>
        <p className="text-gray-500">Find support, information, and tools for your wellness journey</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources, topics, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 border rounded-xl flex items-center gap-2 transition-colors ${
              showFilters ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
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

      {/* Emergency Banner */}
      <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Need immediate help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you're in crisis or experiencing suicidal thoughts, help is available 24/7.
            </p>
            <div className="flex flex-wrap gap-4">
              <div>
                <div className="text-sm text-gray-600">Call</div>
                <div className="text-lg font-medium text-red-600">988</div>
              </div>
              <div className="h-12 w-px bg-red-200" />
              <div>
                <div className="text-sm text-gray-600">Text</div>
                <div className="text-lg font-medium text-red-600">HOME to 741741</div>
              </div>
              <div className="h-12 w-px bg-red-200" />
              <div>
                <div className="text-sm text-gray-600">Emergency</div>
                <div className="text-lg font-medium text-red-600">911</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Resources */}
      {!searchQuery && selectedCategory === 'all' && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Featured Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredResources.map((resource) => (
              <motion.div
                key={resource.id}
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-indigo-700">Featured</span>
                  </div>
                  {resource.availability && (
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resource.availability}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">{resource.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                
                {resource.phone && (
                  <div className="flex items-center gap-3 text-lg font-medium text-indigo-600">
                    <Phone className="w-5 h-5" />
                    {resource.phone}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const categoryColor = {
            crisis: 'bg-red-50 text-red-600',
            therapy: 'bg-purple-50 text-purple-600',
            community: 'bg-blue-50 text-blue-600',
            education: 'bg-green-50 text-green-600',
            apps: 'bg-orange-50 text-orange-600'
          }[resource.category]
          
          return (
            <motion.div
              key={resource.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
                  {resource.category}
                </span>
                {resource.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-gray-600">{resource.rating}</span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">{resource.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between">
                {resource.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4" />
                    {resource.phone}
                  </div>
                )}
                
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Visit
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Additional Resources */}
      <div className="mt-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-8">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Can't find what you need?</h3>
          <p className="text-gray-600 mb-6">
            We're constantly updating our resources. If you need specific help or have suggestions for resources to add, 
            please let us know.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
              Request a Resource
            </button>
            <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-white transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}