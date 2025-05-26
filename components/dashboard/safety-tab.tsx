import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertCircle,
  Heart,
  Users,
  MapPin,
  Phone,
  Plus,
  Edit2,
  Save,
  X,
  CheckCircle,
  FileText,
  Download,
  Lock,
  Unlock
} from 'lucide-react'

interface SafetySection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  items: string[]
  color: string
}

interface Contact {
  id: string
  name: string
  relationship: string
  phone: string
  available: string
}

export default function SafetyTab() {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      relationship: 'Therapist',
      phone: '(555) 123-4567',
      available: 'Mon-Fri 9AM-5PM'
    },
    {
      id: '2',
      name: 'Emma',
      relationship: 'Best Friend',
      phone: '(555) 987-6543',
      available: 'Anytime'
    }
  ])
  const [isPrivate, setIsPrivate] = useState(true)

  const safetySections: SafetySection[] = [
    {
      id: 'warning-signs',
      title: 'Warning Signs',
      description: 'Early indicators that I need to use my safety plan',
      icon: AlertCircle,
      items: [
        'Feeling overwhelmed or hopeless',
        'Isolating from friends and family',
        'Changes in sleep patterns',
        'Difficulty concentrating'
      ],
      color: 'text-red-600 bg-red-100'
    },
    {
      id: 'coping-strategies',
      title: 'Coping Strategies',
      description: 'Things I can do on my own to feel better',
      icon: Heart,
      items: [
        'Take a walk in nature',
        'Practice deep breathing exercises',
        'Listen to calming music',
        'Write in my journal',
        'Call a friend'
      ],
      color: 'text-purple-600 bg-purple-100'
    },
    {
      id: 'safe-places',
      title: 'Safe Places',
      description: 'Locations where I feel secure and calm',
      icon: MapPin,
      items: [
        'Local park near home',
        'Coffee shop on Main Street',
        'Public library',
        'Friend\'s house'
      ],
      color: 'text-green-600 bg-green-100'
    },
    {
      id: 'reasons-to-live',
      title: 'Reasons to Live',
      description: 'Things that give my life meaning and purpose',
      icon: Shield,
      items: [
        'My family and friends',
        'Future goals and dreams',
        'My pet',
        'Helping others',
        'Beautiful sunsets'
      ],
      color: 'text-blue-600 bg-blue-100'
    }
  ]

  const handleAddItem = (sectionId: string) => {
    if (!newItem.trim()) return
    
    // In a real app, this would update the database
    console.log('Adding item:', newItem, 'to section:', sectionId)
    setNewItem('')
    setEditingSection(null)
  }

  const emergencyResources = [
    { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7' },
    { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
    { name: 'Emergency Services', number: '911', available: '24/7' }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-gray-900 mb-2">Personal Safety Plan</h1>
          <p className="text-gray-500">Your personalized strategy for managing difficult moments</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              isPrivate 
                ? 'bg-gray-900 text-white' 
                : 'border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {isPrivate ? 'Private' : 'Shared'}
          </button>
          
          <button className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Emergency Resources Banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Emergency Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyResources.map((resource) => (
                <div key={resource.name} className="bg-white rounded-lg p-3">
                  <div className="font-medium text-sm text-gray-900">{resource.name}</div>
                  <div className="text-red-600 font-medium">{resource.number}</div>
                  <div className="text-xs text-gray-500">{resource.available}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Safety Plan Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {safetySections.map((section) => {
          const Icon = section.icon
          const isEditing = editingSection === section.id
          
          return (
            <motion.div
              key={section.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                {/* Section Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setEditingSection(isEditing ? null : section.id)}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Items List */}
                <div className="space-y-2">
                  {section.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                
                {/* Add Item Form */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add new item..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem(section.id)}
                      />
                      <button
                        onClick={() => handleAddItem(section.id)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Support Contacts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Support Contacts</h3>
              <p className="text-sm text-gray-500">People I can reach out to when I need help</p>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
              <div className="font-medium text-gray-900">{contact.name}</div>
              <div className="text-sm text-gray-500">{contact.relationship}</div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700">{contact.phone}</span>
                </div>
                <div className="text-xs text-gray-500">{contact.available}</div>
              </div>
            </div>
          ))}
          
          {/* Add Contact Card */}
          <button className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors flex flex-col items-center justify-center gap-2">
            <Plus className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-500">Add Contact</span>
          </button>
        </div>
      </div>

      {/* Plan Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Plan Summary</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your safety plan is a living document. Update it regularly as you discover new strategies 
              that work for you. Share it with trusted people in your support network.
            </p>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                Share with Therapist
              </button>
              <button className="px-4 py-2 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 text-sm">
                Print Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}