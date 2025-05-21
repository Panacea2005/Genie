// components/SafetyPlan.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Trash, Edit, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import type { MentalHealthContext } from '@/lib/services/chatStore';

interface SafetyPlanProps {
  safetyPlan?: MentalHealthContext['safetyPlan'];
  onUpdate: (safetyPlan: MentalHealthContext['safetyPlan']) => void;
  readOnly?: boolean;
  className?: string;
}

export default function SafetyPlan({
  safetyPlan,
  onUpdate,
  readOnly = false,
  className = ''
}: SafetyPlanProps) {
  const [plan, setPlan] = useState<MentalHealthContext['safetyPlan']>(safetyPlan || {
    warningSigns: [],
    copingStrategies: [],
    contacts: [],
    resources: [],
    safeEnvironment: []
  });
  
  const [editing, setEditing] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<string>('');
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    phone: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Update local state when safetyPlan prop changes
  useEffect(() => {
    if (safetyPlan) {
      setPlan(safetyPlan);
    }
  }, [safetyPlan]);
  
  // Handle adding an item to a list
  const handleAddItem = (section: keyof MentalHealthContext['safetyPlan']) => {
    if (!newItem.trim()) return;
    
    if (section !== 'contacts') {
      const safePlan = plan ?? { warningSigns: [], copingStrategies: [], contacts: [], resources: [], safeEnvironment: [] };
      const newList = [...(safePlan[section] as string[] || []), newItem.trim()];
      const updatedPlan = { ...safePlan, [section]: newList };
      
      setPlan(updatedPlan);
      onUpdate(updatedPlan);
      setNewItem('');
      setEditing(null);
    }
  };
  
  // Handle adding a contact
  const handleAddContact = () => {
    if (!newContact.name.trim()) return;
    
    const safePlan = plan ?? { warningSigns: [], copingStrategies: [], contacts: [], resources: [], safeEnvironment: [] };
    const newList = [...(safePlan.contacts || []), newContact];
    const updatedPlan = { 
      warningSigns: safePlan.warningSigns || [], 
      copingStrategies: safePlan.copingStrategies || [], 
      contacts: newList, 
      resources: safePlan.resources || [], 
      safeEnvironment: safePlan.safeEnvironment || [] 
    };
    
    setPlan(updatedPlan);
    onUpdate(updatedPlan);
    setNewContact({ name: '', relationship: '', phone: '' });
    setEditing(null);
  };
  
  // Handle removing an item from a list
  const handleRemoveItem = (section: keyof MentalHealthContext['safetyPlan'], index: number) => {
    if (section === 'contacts') {
      const safePlan = plan ?? { warningSigns: [], copingStrategies: [], contacts: [], resources: [], safeEnvironment: [] };
      const newList = [...(safePlan.contacts || [])];
      newList.splice(index, 1);
      const updatedPlan = { 
        ...safePlan,
        contacts: newList,
        warningSigns: safePlan.warningSigns || [],
        copingStrategies: safePlan.copingStrategies || [],
        resources: safePlan.resources || [],
        safeEnvironment: safePlan.safeEnvironment || []
      };
      
      setPlan(updatedPlan);
      onUpdate(updatedPlan);
    } else {
      const safePlan = plan ?? { warningSigns: [], copingStrategies: [], contacts: [], resources: [], safeEnvironment: [] };
      const newList = [...(safePlan[section] as string[] || [])];
      newList.splice(index, 1);
      const updatedPlan = { 
        ...safePlan,
        [section]: newList,
        warningSigns: section === 'warningSigns' ? newList : safePlan.warningSigns || [],
        copingStrategies: section === 'copingStrategies' ? newList : safePlan.copingStrategies || [],
        contacts: safePlan.contacts || [],
        resources: section === 'resources' ? newList : safePlan.resources || [],
        safeEnvironment: section === 'safeEnvironment' ? newList : safePlan.safeEnvironment || []
      };
      
      setPlan(updatedPlan);
      onUpdate(updatedPlan);
    }
  };
  
  // Handle saving the entire plan
  const handleSavePlan = () => {
    onUpdate(plan);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  // Render a section of the safety plan
  const renderSection = (
    title: string, 
    section: keyof MentalHealthContext['safetyPlan'],
    description: string
  ) => {
    return (
      <div className="mb-6">
        <h3 className="text-base font-medium text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        
        <div className="space-y-2">
          {section === 'contacts' ? (
            // Render contacts list
            <>
              {plan?.contacts && plan.contacts.map((contact, index) => (
                <div 
                  key={index}
                  className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-start"
                >
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.relationship}</div>
                    {contact.phone && (
                      <div className="text-sm text-gray-700 mt-1">{contact.phone}</div>
                    )}
                  </div>
                  
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveItem(section, index)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Add contact form */}
              {editing === section && !readOnly && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2"
                >
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      placeholder="Contact name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      placeholder="e.g. Friend, Therapist"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone (optional)</label>
                    <input
                      type="text"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      placeholder="Phone number"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="px-3 py-1 text-xs text-gray-500 bg-white rounded border border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddContact}
                      className="px-3 py-1 text-xs text-white bg-blue-500 rounded"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            // Render standard list items
            <>
              {plan?.[section] && (plan[section] as string[]).map((item, index) => (
                <div 
                  key={index}
                  className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center"
                >
                  <div>{item}</div>
                  
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveItem(section, index)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Add item form */}
              {editing === section && !readOnly && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 p-3 rounded-lg border border-blue-100"
                >
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded text-sm"
                    placeholder={`Add a new ${(section as string).replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem(section);
                      }
                    }}
                  />
                  
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="px-3 py-1 text-xs text-gray-500 bg-white rounded border border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddItem(section)}
                      className="px-3 py-1 text-xs text-white bg-blue-500 rounded"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
          
          {!editing && !readOnly && (
            <button
              onClick={() => setEditing(section)}
              className="w-full p-2 border border-dashed border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="text-sm">Add {section === 'contacts' ? 'a contact' : 'an item'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-red-500 mr-2" />
          <h2 className="font-medium text-gray-800">My Safety Plan</h2>
        </div>
        
        {!readOnly && (
          <button
            onClick={handleSavePlan}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded-full flex items-center"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Plan
          </button>
        )}
      </div>
      
      <div className="p-4">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-2 bg-green-50 border border-green-100 rounded-md flex items-center text-sm text-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Safety plan updated successfully!
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start text-sm text-blue-700">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            This safety plan is a helpful tool to reference when you're feeling overwhelmed or in crisis. Keep it accessible and share it with trusted people in your support network.
          </div>
        </div>
        
        {renderSection(
          "Warning Signs", 
          "warningSigns", 
          "Thoughts, feelings, or behaviors that might indicate you're heading toward a crisis."
        )}
        
        {renderSection(
          "Coping Strategies", 
          "copingStrategies", 
          "Healthy activities you can do to help yourself feel better."
        )}
        
        {renderSection(
          "People I Can Contact", 
          "contacts", 
          "Friends, family, or professionals you can reach out to."
        )}
        
        {renderSection(
          "Professional Resources", 
          "resources", 
          "Hotlines, treatment providers, or services you can contact."
        )}
        
        {renderSection(
          "Creating a Safe Environment", 
          "safeEnvironment", 
          "Steps to make your surroundings safer when you're distressed."
        )}
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
        Remember: If you're in immediate danger, please call emergency services (911) or go to your nearest emergency room.
      </div>
    </div>
  );
}