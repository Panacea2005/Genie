import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, ExternalLinkIcon, GlobeIcon, DatabaseIcon } from "lucide-react";

interface Citation {
  id: number;
  text: string;
  metadata?: {
    title?: string;
    url?: string;
    source?: string;
  };
  source: string;
  score?: number;
}

interface MessageCitationsProps {
  citations: Citation[];
  isVisible?: boolean;
}

const MessageCitations = ({ citations, isVisible = true }: MessageCitationsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0 || !isVisible) {
    return null;
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'web_search':
        return <GlobeIcon className="w-3.5 h-3.5" />;
      case 'knowledge_base':
        return <DatabaseIcon className="w-3.5 h-3.5" />;
      default:
        return <GlobeIcon className="w-3.5 h-3.5" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'web_search':
        return 'text-blue-600 bg-blue-50/60';
      case 'knowledge_base':
        return 'text-emerald-600 bg-emerald-50/60';
      default:
        return 'text-gray-600 bg-gray-50/60';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'web_search':
        return 'Web';
      case 'knowledge_base':
        return 'Knowledge';
      default:
        return 'Source';
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-100/60">
      {/* Elegant Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 
                   transition-all duration-200 mb-3"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 group-hover:text-gray-600"
        >
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </motion.div>
        <span>
          {citations.length} source{citations.length > 1 ? 's' : ''}
        </span>
      </motion.button>

      {/* Minimal Citations List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-2.5 overflow-hidden"
          >
            {citations.map((citation, index) => (
              <motion.div
                key={citation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                {/* Elegant Citation Card */}
                <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3.5 border border-gray-100/60
                               hover:bg-white/60 hover:border-gray-200/60 transition-all duration-200
                               shadow-sm hover:shadow-md">
                  
                  {/* Minimal Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full 
                                      text-xs font-medium ${getSourceColor(citation.source)}`}>
                        {getSourceIcon(citation.source)}
                        {getSourceLabel(citation.source)}
                      </div>
                      
                      {citation.score && (
                        <div className="text-xs text-gray-400 font-mono">
                          {Math.min(citation.score, 1) * 100}%
                        </div>
                      )}
                    </div>

                    {/* External Link Icon */}
                    {citation.metadata?.url && (
                      <motion.a
                        href={citation.metadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                   text-gray-400 hover:text-gray-600"
                        whileHover={{ scale: 1.1 }}
                      >
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </motion.a>
                    )}
                  </div>

                  {/* Citation Title */}
                  {citation.metadata?.title && (
                    <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-1">
                      {citation.metadata.title}
                    </h4>
                  )}

                  {/* Citation Text */}
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {citation.text}
                  </p>

                  {/* Subtle URL */}
                  {citation.metadata?.url && (
                    <div className="mt-2.5 text-xs text-gray-400 truncate">
                      {citation.metadata.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageCitations; 