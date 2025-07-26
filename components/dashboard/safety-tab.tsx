import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { 
  SafetyPlanService, 
  SafetyPlanWithItems,
  SafetyPlanSection,
  SafetyPlanItem,
  SafetyPlanContact,
  CreateSafetyPlanItem,
  CreateSafetyPlanContact 
} from '@/lib/services/safetyPlanService'
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
  Circle,
  Loader2
} from 'lucide-react'

// Icon mapping for safety plan sections
const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  'AlertCircle': AlertCircle,
  'Heart': Heart,
  'MapPin': MapPin,
  'Shield': Shield
}

export default function SafetyTab() {
  const { user } = useAuth()
  
  // State management
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlanWithItems | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState<CreateSafetyPlanContact>({
    name: '',
    relationship: '',
    phone: '',
    available_hours: ''
  })
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load safety plan data on component mount
  useEffect(() => {
    if (!user?.id) return

    const loadSafetyPlan = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: loadError } = await SafetyPlanService.getCompleteSafetyPlan(user.id)
        
        if (loadError) {
          throw new Error('Failed to load safety plan')
        }

        setSafetyPlan(data)
      } catch (err: any) {
        console.error('Error loading safety plan:', err)
        setError(err.message || 'Failed to load safety plan')
      } finally {
        setLoading(false)
      }
    }

    loadSafetyPlan()
  }, [user?.id])

  const handleAddItem = async (sectionId: string) => {
    if (!newItem.trim() || !user?.id || submitting) return
    
    try {
      setSubmitting(true)
      setError(null)

      const itemData: CreateSafetyPlanItem = {
        section_id: sectionId,
        content: newItem.trim()
      }

      const { data: newItemData, error: createError } = await SafetyPlanService.createSafetyPlanItem(user.id, itemData)
      
      if (createError) {
        throw new Error('Failed to add item')
      }

      if (newItemData && safetyPlan) {
        // Update local state
        const updatedItems = { ...safetyPlan.items }
        if (!updatedItems[sectionId]) {
          updatedItems[sectionId] = []
        }
        updatedItems[sectionId] = [...updatedItems[sectionId], newItemData]
        
        setSafetyPlan({
          ...safetyPlan,
          items: updatedItems
        })
      }
      
      setNewItem('')
      setEditingSection(null)
    } catch (err: any) {
      console.error('Error adding item:', err)
      setError(err.message || 'Failed to add item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !user?.id || submitting) return
    
    try {
      setSubmitting(true)
      setError(null)

      const { data: newContactData, error: createError } = await SafetyPlanService.createSafetyPlanContact(user.id, newContact)
      
      if (createError) {
        throw new Error('Failed to add contact')
      }

      if (newContactData && safetyPlan) {
        setSafetyPlan({
          ...safetyPlan,
          contacts: [...safetyPlan.contacts, newContactData]
        })
      }
      
      setNewContact({ name: '', relationship: '', phone: '', available_hours: '' })
      setShowAddContact(false)
    } catch (err: any) {
      console.error('Error adding contact:', err)
      setError(err.message || 'Failed to add contact')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!user?.id) return
    
    try {
      const { data: content, error } = await SafetyPlanService.generateSafetyPlanExport(user.id)
      
      if (error || !content) {
        throw new Error('Failed to generate safety plan export')
      }

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `safety-plan-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error exporting safety plan:', err)
      setError('Failed to export safety plan')
    }
  }

  const emergencyResources = [
    { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7' },
    { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
    { name: 'Emergency Services', number: '911', available: '24/7' }
  ]

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 font-light">Loading your safety plan...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-red-800 font-medium mb-2">Unable to load safety plan</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show empty state if no safety plan
  if (!safetyPlan) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-800 font-medium mb-2">No safety plan found</h3>
          <p className="text-gray-600 text-sm">Unable to load your safety plan data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-light text-gray-800 mb-2">Personal Safety Plan</h1>
          <p className="text-gray-500 font-light">Your personalized strategy for managing difficult moments</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.button 
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl hover:bg-white/70 flex items-center gap-2 transition-all font-light"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </motion.button>
        </motion.div>
      </div>

      {/* Emergency Resources - Minimal design */}
      <motion.div 
        className="bg-red-50/30 backdrop-blur-sm border border-red-100/50 rounded-3xl p-6 mb-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
            <h3 className="text-lg font-medium text-gray-800 mb-4">Emergency Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {emergencyResources.map((resource, index) => (
                <motion.div 
                  key={resource.name} 
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="font-medium text-sm text-gray-800">{resource.name}</div>
                  <div className="text-red-600 font-medium text-lg my-1">{resource.number}</div>
                  <div className="text-xs text-gray-500 font-light">{resource.available}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Safety Plan Sections - Minimal cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
        {safetyPlan.sections.map((section, index) => {
          const Icon = iconMap[section.icon_name] || Shield
          const isEditing = editingSection === section.id
          
          return (
            <motion.div
              key={section.id}
              className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 overflow-hidden hover:bg-white/50 hover:border-white/60 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="p-6">
                {/* Section Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-3">
                    <Icon 
                      className="w-6 h-6 mt-0.5" 
                      style={{ color: section.color }}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{section.title}</h3>
                      <p className="text-sm text-gray-500 font-light">{section.description}</p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => setEditingSection(isEditing ? null : section.id)}
                    className="p-2 hover:bg-white/50 rounded-xl transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isEditing ? <X className="w-4 h-4 text-gray-600" /> : <Edit2 className="w-4 h-4 text-gray-400" />}
                  </motion.button>
                </div>
                
                {/* Items List - Minimal style */}
                <div className="space-y-2">
                  {(safetyPlan.items[section.id] || []).map((item, itemIndex) => (
                    <motion.div 
                      key={itemIndex} 
                      className="flex items-center gap-3 p-3 bg-white/30 backdrop-blur-sm rounded-2xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIndex * 0.05 }}
                    >
                      <Circle 
                        className="w-2 h-2 flex-shrink-0" 
                        fill={section.color}
                        style={{ color: section.color }}
                      />
                      <span className="text-sm text-gray-700 font-light">{item.content}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Add Item Form */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200/30"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          placeholder="Add new item..."
                          className="flex-1 px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl text-sm focus:outline-none focus:border-gray-300 transition-all placeholder-gray-400 font-light"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddItem(section.id)}
                        />
                        <motion.button
                          onClick={() => handleAddItem(section.id)}
                          className="px-5 py-2.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 text-sm font-light transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Add
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Support Contacts - Minimal design */}
      <motion.div 
        className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users 
              className="w-6 h-6"
              style={{ color: '#3b82f6' }}
            />
            <div>
              <h3 className="text-lg font-medium text-gray-800">Support Contacts</h3>
              <p className="text-sm text-gray-500 font-light">People I can reach out to when I need help</p>
            </div>
          </div>
          
          <motion.button 
            onClick={() => setShowAddContact(true)}
            className="p-2 hover:bg-white/50 rounded-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safetyPlan.contacts.map((contact, index) => (
            <motion.div 
              key={contact.id} 
              className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="font-medium text-gray-800">{contact.name}</div>
              <div className="text-sm text-gray-500 font-light">{contact.relationship}</div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700 font-light">{contact.phone}</span>
                </div>
                <div className="text-xs text-gray-500 font-light">{contact.available_hours || 'Anytime'}</div>
              </div>
            </motion.div>
          ))}
          
          {/* Add Contact Card */}
          <motion.button 
            onClick={() => setShowAddContact(true)}
            className="border-2 border-dashed border-white/50 backdrop-blur-sm rounded-2xl p-4 hover:border-white/70 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-500 font-light">Add Contact</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Plan Summary - Minimal design */}
      <motion.div 
        className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start gap-4">
          <FileText 
            className="w-6 h-6 mt-0.5"
            style={{ color: '#6366f1' }}
          />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Your Plan Summary</h3>
            <p className="text-sm text-gray-600 font-light mb-6 leading-relaxed">
              Your safety plan is a living document. Update it regularly as you discover new strategies 
              that work for you. Share it with trusted people in your support network.
            </p>
            <div className="flex gap-3">
              <motion.button 
                className="px-5 py-2.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 text-sm font-light transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Share with Therapist
              </motion.button>
              <motion.button 
                className="px-5 py-2.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl hover:bg-white/70 text-sm font-light transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Print Copy
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/10 backdrop-blur-md z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddContact(false)}
            />
            
            {/* Modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <motion.button
                  onClick={() => setShowAddContact(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100/50 rounded-2xl transition-all"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
                
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                  >
                    <Users className="w-8 h-8 text-blue-600" />
                  </motion.div>
                  <h3 className="text-2xl font-light text-gray-800">Add Support Contact</h3>
                  <p className="text-sm text-gray-500 font-light mt-2">Add someone you trust to your support network</p>
                </div>
                
                {/* Form */}
                <motion.div 
                  className="space-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 ml-1">Name *</label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:border-blue-300 focus:bg-white/50 transition-all font-light placeholder-gray-400"
                      placeholder="Enter their name"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 ml-1">Relationship</label>
                    <input
                      type="text"
                      value={newContact.relationship || ''}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:border-blue-300 focus:bg-white/50 transition-all font-light placeholder-gray-400"
                      placeholder="Friend, Family, Therapist..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 ml-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:border-blue-300 focus:bg-white/50 transition-all font-light placeholder-gray-400"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 ml-1">When are they available?</label>
                    <input
                      type="text"
                      value={newContact.available_hours || ''}
                      onChange={(e) => setNewContact({ ...newContact, available_hours: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:border-blue-300 focus:bg-white/50 transition-all font-light placeholder-gray-400"
                      placeholder="Anytime, Weekdays, Emergency only..."
                    />
                  </div>
                </motion.div>
                
                {/* Actions */}
                <motion.div 
                  className="flex gap-3 mt-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    onClick={handleAddContact}
                    className="flex-1 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl hover:from-gray-900 hover:to-black transition-all font-light shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!newContact.name || !newContact.phone}
                  >
                    Add to Contacts
                  </motion.button>
                  <motion.button
                    onClick={() => setShowAddContact(false)}
                    className="px-6 py-3 bg-gray-100/50 backdrop-blur-sm rounded-2xl hover:bg-gray-200/50 transition-all font-light text-gray-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}