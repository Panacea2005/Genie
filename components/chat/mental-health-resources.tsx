// components/MentalHealthResources.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Search, ChevronRight, Shield, X } from 'lucide-react';
import { 
  mentalHealthResources, 
  getResourcesByCategory,
  Resource
} from '@/lib/services/mentalHealthResources';

interface MentalHealthResourcesProps {
  category?: string;
  maxResources?: number;
  showSearch?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function MentalHealthResources({
  category,
  maxResources: initialMaxResources = 5,
  showSearch = true,
  onClose,
  className = ''
}: MentalHealthResourcesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(category);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [maxResources, setMaxResources] = useState(initialMaxResources);
  
  // Filter resources based on search query and/or category
  const filteredResources = (): Resource[] => {
    let resources = mentalHealthResources;
    
    if (activeCategory) {
      resources = getResourcesByCategory(activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return resources.filter(resource => 
        resource.name.toLowerCase().includes(query) || 
        resource.description.toLowerCase().includes(query)
      );
    }
    
    return resources;
  };
  
  // Categories with counts
  const categories = [
    { id: 'crisis', name: 'Crisis Support', icon: '🆘' },
    { id: 'anxiety', name: 'Anxiety', icon: '😰' },
    { id: 'depression', name: 'Depression', icon: '😔' },
    { id: 'general', name: 'General', icon: '🧠' },
    { id: 'wellness', name: 'Wellness', icon: '🌱' },
    { id: 'community', name: 'Community', icon: '👥' }
  ];
  
  const resourcesToShow = filteredResources().slice(0, maxResources);
  
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 flex items-center">
          <Shield className="w-4 h-4 mr-2 text-blue-500" />
          Mental Health Resources
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {showSearch && (
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-300 transition-colors"
            />
          </div>
        </div>
      )}
      
      {/* Category pills */}
      <div className="p-3 border-b border-gray-100 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveCategory(undefined)}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors ${
            !activeCategory 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        
        {categories.map(cat => {
          const count = getResourcesByCategory(cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors ${
                activeCategory === cat.id 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name} ({count})
            </button>
          );
        })}
      </div>
      
      {/* Resources list */}
      <div className="max-h-80 overflow-y-auto p-3">
        {resourcesToShow.length > 0 ? (
          <div className="space-y-2">
            {resourcesToShow.map((resource) => (
              <motion.div
                key={resource.name}
                layoutId={resource.name}
                className={`border rounded-lg overflow-hidden ${
                  resource.category === 'crisis' 
                    ? 'border-red-100 bg-red-50/50' 
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div 
                  className={`p-3 cursor-pointer flex justify-between items-center ${
                    expandedResource === resource.name ? 'border-b border-gray-100' : ''
                  }`}
                  onClick={() => setExpandedResource(
                    expandedResource === resource.name ? null : resource.name
                  )}
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {resource.category === 'crisis' && (
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded mr-2">
                          CRISIS
                        </span>
                      )}
                      {resource.name}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-0.5">
                      {resource.description}
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedResource === resource.name ? 'rotate-90' : ''
                  }`} />
                </div>
                
                <AnimatePresence>
                  {expandedResource === resource.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 py-2 bg-gray-50"
                    >
                      {resource.phone && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Phone: </span>
                          {resource.phone}
                        </div>
                      )}
                      
                      {resource.regions && (
                        <div className="text-xs text-gray-500 mb-2">
                          Available in: {resource.regions.join(', ')}
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <a 
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Visit Website <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No resources found for "{searchQuery}".
          </div>
        )}
        
        {resourcesToShow.length < filteredResources().length && (
          <div className="text-center mt-2">
            <button
              onClick={() => setMaxResources(maxResources + 5)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Show more resources
            </button>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
        If you're experiencing a mental health emergency, please call 988 or your local emergency services.
      </div>
    </div>
  );
}