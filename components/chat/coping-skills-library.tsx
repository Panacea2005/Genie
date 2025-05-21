// components/CopingSkillsLibrary.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Clock, HeartPulse, Brain, Activity, Menu, X } from 'lucide-react';
import { mentalHealthTechniques, Technique } from '@/lib/services/mentalHealthResources';

interface CopingSkillsLibraryProps {
  onSelectTechnique: (techniqueId: string) => void;
  onClose?: () => void;
  className?: string;
}

export default function CopingSkillsLibrary({
  onSelectTechnique,
  onClose,
  className = ''
}: CopingSkillsLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  
  // Filter techniques based on search query and category filter
  const filteredTechniques = mentalHealthTechniques.filter(technique => {
    // Filter by search query
    const matchesSearch = searchQuery.trim() === '' || 
      technique.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      technique.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = filter === 'all' || technique.category === filter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Organize techniques by category for UI
  const organizedTechniques: { [key: string]: Technique[] } = {
    breathing: [],
    grounding: [],
    mindfulness: [],
    cognitive: [],
    behavioral: []
  };
  
  filteredTechniques.forEach(technique => {
    if (organizedTechniques[technique.category]) {
      organizedTechniques[technique.category].push(technique);
    }
  });
  
  // Get icon for technique category
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'breathing':
        return <HeartPulse className="w-4 h-4 text-blue-500" />;
      case 'grounding':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'mindfulness':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'cognitive':
        return <Brain className="w-4 h-4 text-indigo-500" />;
      case 'behavioral':
        return <Activity className="w-4 h-4 text-orange-500" />;
      default:
        return <Menu className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Get color for technique category
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'breathing':
        return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'grounding':
        return 'text-green-500 bg-green-50 border-green-100';
      case 'mindfulness':
        return 'text-purple-500 bg-purple-50 border-purple-100';
      case 'cognitive':
        return 'text-indigo-500 bg-indigo-50 border-indigo-100';
      case 'behavioral':
        return 'text-orange-500 bg-orange-50 border-orange-100';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };
  
  // Get human-friendly name for category
  const getCategoryName = (category: string) => {
    switch(category) {
      case 'breathing':
        return 'Breathing Techniques';
      case 'grounding':
        return 'Grounding Exercises';
      case 'mindfulness':
        return 'Mindfulness Practices';
      case 'cognitive':
        return 'Cognitive Techniques';
      case 'behavioral':
        return 'Behavioral Strategies';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };
  
  // Get duration in minutes
  const getDurationMinutes = (duration: string) => {
    switch(duration) {
      case 'short':
        return '< 2 minutes';
      case 'medium':
        return '2-10 minutes';
      case 'long':
        return '> 10 minutes';
      default:
        return 'Various';
    }
  };
  
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 flex items-center">
          <HeartPulse className="w-4 h-4 mr-2 text-green-500" />
          Coping Skills Library
        </h3>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search coping skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-300 transition-colors"
          />
        </div>
      </div>
      
      {/* Filter pills */}
      <div className="p-3 border-b border-gray-100 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setFilter('all')}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors ${
            filter === 'all' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        
        <button
          onClick={() => setFilter('breathing')}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors flex items-center ${
            filter === 'breathing' 
              ? 'bg-blue-500 text-white' 
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <HeartPulse className="w-3 h-3 mr-1" />
          Breathing
        </button>
        
        <button
          onClick={() => setFilter('grounding')}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors flex items-center ${
            filter === 'grounding' 
              ? 'bg-green-500 text-white' 
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          <Activity className="w-3 h-3 mr-1" />
          Grounding
        </button>
        
        <button
          onClick={() => setFilter('mindfulness')}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors flex items-center ${
            filter === 'mindfulness' 
              ? 'bg-purple-500 text-white' 
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <Brain className="w-3 h-3 mr-1" />
          Mindfulness
        </button>
        
        <button
          onClick={() => setFilter('cognitive')}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors flex items-center ${
            filter === 'cognitive' 
              ? 'bg-indigo-500 text-white' 
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <Brain className="w-3 h-3 mr-1" />
          Cognitive
        </button>
        
        <button
          onClick={() => setFilter('behavioral')}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors flex items-center ${
            filter === 'behavioral' 
              ? 'bg-orange-500 text-white' 
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <Activity className="w-3 h-3 mr-1" />
          Behavioral
        </button>
      </div>
      
      {/* Techniques list */}
      <div className="max-h-80 overflow-y-auto">
        {filteredTechniques.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {Object.entries(organizedTechniques).map(([category, techniques]) => {
              if (techniques.length === 0) return null;
              
              return (
                <div key={category} className="py-2 px-3">
                  <h4 className="text-xs uppercase text-gray-500 font-medium my-2 flex items-center">
                    {getCategoryIcon(category)}
                    <span className="ml-1">{getCategoryName(category)}</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {techniques.map((technique) => (
                      <motion.div
                        key={technique.id}
                        layoutId={technique.id}
                        className="border rounded-lg overflow-hidden bg-white"
                      >
                        <div 
                          className={`p-3 cursor-pointer flex justify-between items-center ${
                            expandedTechnique === technique.id ? 'border-b border-gray-100' : ''
                          }`}
                          onClick={() => setExpandedTechnique(
                            expandedTechnique === technique.id ? null : technique.id
                          )}
                        >
                          <div>
                            <div className="font-medium text-gray-800 flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                technique.category === 'breathing' ? 'bg-blue-500' :
                                technique.category === 'grounding' ? 'bg-green-500' :
                                technique.category === 'mindfulness' ? 'bg-purple-500' :
                                technique.category === 'cognitive' ? 'bg-indigo-500' :
                                'bg-orange-500'
                              }`}></span>
                              {technique.name}
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {getDurationMinutes(technique.duration)}
                            </div>
                          </div>
                          
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedTechnique === technique.id ? 'rotate-90' : ''
                          }`} />
                        </div>
                        
                        <AnimatePresence>
                          {expandedTechnique === technique.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-3 py-2 bg-gray-50"
                            >
                              <p className="text-sm text-gray-600 mb-3">
                                {technique.description}
                              </p>
                              
                              <div className="mb-3">
                                <h5 className="text-xs font-medium mb-1">Steps:</h5>
                                <ol className="list-decimal pl-5 text-sm space-y-1">
                                  {technique.steps.map((step, index) => (
                                    <li key={index}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                              
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    onSelectTechnique(technique.id);
                                    if (onClose) onClose();
                                  }}
                                  className={`px-3 py-1.5 text-xs text-white rounded-md ${
                                    technique.category === 'breathing' ? 'bg-blue-500' :
                                    technique.category === 'grounding' ? 'bg-green-500' :
                                    technique.category === 'mindfulness' ? 'bg-purple-500' :
                                    technique.category === 'cognitive' ? 'bg-indigo-500' :
                                    'bg-orange-500'
                                  }`}
                                >
                                  Try This Exercise
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No coping skills found for "{searchQuery}".
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
        Coping skills can help manage stress, anxiety, and difficult emotions. Try different techniques to find what works best for you.
      </div>
    </div>
  );
}