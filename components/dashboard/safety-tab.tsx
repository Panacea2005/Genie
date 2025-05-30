import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Shield,
  AlertCircle,
  Heart,
  Users,
  MapPin,
  Phone,
  Plus,
  Edit2,
  X,
  Check
} from 'lucide-react'

interface SafetySection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: string[]
  color: string
}

interface Contact {
  id: string
  name: string
  relationship: string
  phone: string
}

export default function SafetyTab() {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      relationship: 'Therapist',
      phone: '(555) 123-4567'
    },
    {
      id: '2',
      name: 'Emma',
      relationship: 'Best Friend',
      phone: '(555) 987-6543'
    }
  ])

  const safetySections: SafetySection[] = [
    {
      id: 'warning-signs',
      title: 'Warning Signs',
      icon: AlertCircle,
      items: [
        'Feeling overwhelmed or hopeless',
        'Isolating from friends and family',
        'Changes in sleep patterns',
        'Difficulty concentrating'
      ],
      color: '#ef4444'
    },
    {
      id: 'coping-strategies',
      title: 'Coping Strategies',
      icon: Heart,
      items: [
        'Take a walk in nature',
        'Practice deep breathing',
        'Listen to calming music',
        'Write in my journal'
      ],
      color: '#a855f7'
    },
    {
      id: 'safe-places',
      title: 'Safe Places',
      icon: MapPin,
      items: [
        'Local park',
        'Coffee shop on Main',
        'Public library',
        'Friend\'s house'
      ],
      color: '#10b981'
    },
    {
      id: 'reasons',
      title: 'Reasons to Keep Going',
      icon: Shield,
      items: [
        'My family and friends',
        'Future goals and dreams',
        'My pet',
        'Beautiful moments'
      ],
      color: '#3b82f6'
    }
  ]

  const handleAddItem = (sectionId: string) => {
    if (!newItem.trim()) return
    console.log('Adding item:', newItem, 'to section:', sectionId)
    setNewItem('')
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        className="mb-16 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl font-light text-gray-800 mb-2">Safety Plan</h1>
        <p className="text-gray-500 font-light text-sm">Your personal guide for difficult moments</p>
      </motion.div>

      {/* Emergency Contact */}
      <motion.div 
        className="bg-red-50/50 rounded-xl p-6 mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Phone className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm font-light text-gray-700 mb-2">If you need immediate help</p>
        <div className="text-2xl font-light text-red-600">Call 988</div>
        <p className="text-xs font-light text-gray-500 mt-1">Available 24/7</p>
      </motion.div>

      {/* Safety Sections */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {safetySections.map((section, index) => {
          const Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> = section.icon
          const isEditing = editingSection === section.id
          
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-100"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${section.color}15` }}
                  >
                    <Icon className="w-5 h-5" stroke={section.color} />
                  </div>
                  <h3 className="text-lg font-light text-gray-800">{section.title}</h3>
                </div>
                
                <button
                  onClick={() => setEditingSection(isEditing ? null : section.id)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isEditing ? <X className="w-4 h-4 text-gray-400" /> : <Edit2 className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              
              {/* Items List */}
              <div className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-light text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              
              {/* Add Item Form */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add new item..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-light focus:outline-none focus:ring-1 focus:ring-gray-300"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem(section.id)}
                      />
                      <button
                        onClick={() => handleAddItem(section.id)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-light"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Support Contacts */}
      <motion.div 
        className="bg-white rounded-xl p-6 border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-light text-gray-800">Support Contacts</h3>
          </div>
          
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-gray-50 rounded-lg p-4">
              <div className="font-light text-gray-800">{contact.name}</div>
              <div className="text-sm font-light text-gray-500">{contact.relationship}</div>
              <div className="flex items-center gap-2 mt-2 text-sm font-light text-gray-600">
                <Phone className="w-3 h-3" />
                {contact.phone}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer Note */}
      <motion.div 
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <p className="text-sm font-light text-gray-500">
          Update this plan as you discover what works best for you
        </p>
      </motion.div>
    </div>
  )
}