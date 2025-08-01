import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDownIcon, 
  ExternalLinkIcon, 
  GlobeIcon, 
  DatabaseIcon, 
  SearchIcon, 
  NetworkIcon,
  CircleIcon,
  ArrowRightIcon,
  TagIcon
} from "lucide-react";

interface GraphEntity {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, any>;
}

interface GraphRelation {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

interface Citation {
  id: number;
  text: string;
  metadata?: {
    title?: string;
    url?: string;
    source?: string;
    searchMethod?: 'web' | 'bm25' | 'vector' | 'graph';
    entities?: GraphEntity[];
    relations?: GraphRelation[];
    vectorScore?: number;
    bm25Score?: number;
    graphPath?: string[];
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

  const getSourceIcon = (searchMethod?: string, citation?: Citation | string) => {
    // If searchMethod is provided, use it directly
    if (searchMethod) {
      switch (searchMethod) {
        case 'web':
          return <GlobeIcon className="w-3.5 h-3.5" />;
        case 'bm25':
          return <SearchIcon className="w-3.5 h-3.5" />;
        case 'vector':
          return <DatabaseIcon className="w-3.5 h-3.5" />;
        case 'graph':
          return <NetworkIcon className="w-3.5 h-3.5" />;
        default:
          return <DatabaseIcon className="w-3.5 h-3.5" />;
      }
    }
    
    // Try to detect from citation object or fallback to source string
    const detectedMethod = typeof citation === 'object' 
      ? detectSearchMethod(citation)
      : detectSearchMethod({ source: citation });
    
    switch (detectedMethod) {
      case 'web':
        return <GlobeIcon className="w-3.5 h-3.5" />;
      case 'bm25':
        return <SearchIcon className="w-3.5 h-3.5" />;
      case 'vector':
        return <DatabaseIcon className="w-3.5 h-3.5" />;
      case 'graph':
        return <NetworkIcon className="w-3.5 h-3.5" />;
      default:
        return <DatabaseIcon className="w-3.5 h-3.5" />;
    }
  };

  const getSourceColor = (searchMethod?: string, citation?: Citation | string) => {
    // If searchMethod is provided, use it directly
    if (searchMethod) {
      switch (searchMethod) {
        case 'web':
          return 'text-blue-600 bg-blue-50/60';
        case 'bm25':
          return 'text-orange-600 bg-orange-50/60';
        case 'vector':
          return 'text-emerald-600 bg-emerald-50/60';
        case 'graph':
          return 'text-purple-600 bg-purple-50/60';
        default:
          return 'text-gray-600 bg-gray-50/60';
      }
    }
    
    const detectedMethod = typeof citation === 'object' 
      ? detectSearchMethod(citation)
      : detectSearchMethod({ source: citation });
    
    switch (detectedMethod) {
      case 'web':
        return 'text-blue-600 bg-blue-50/60';
      case 'bm25':
        return 'text-orange-600 bg-orange-50/60';
      case 'vector':
        return 'text-emerald-600 bg-emerald-50/60';
      case 'graph':
        return 'text-purple-600 bg-purple-50/60';
      default:
        return 'text-gray-600 bg-gray-50/60';
    }
  };

  const getSourceLabel = (searchMethod?: string, citation?: Citation | string) => {
    // If searchMethod is provided, use it directly
    if (searchMethod) {
      switch (searchMethod) {
        case 'web':
          return 'Web Search';
        case 'bm25':
          return 'BM25 Search';
        case 'vector':
          return 'Vector Search';
        case 'graph':
          return 'Graph Search';
        default:
          return 'Knowledge Base';
      }
    }
    
    const detectedMethod = typeof citation === 'object' 
      ? detectSearchMethod(citation)
      : detectSearchMethod({ source: citation });
    
    switch (detectedMethod) {
      case 'web':
        return 'Web Search';
      case 'bm25':
        return 'BM25 Search';
      case 'vector':
        return 'Vector Search';
      case 'graph':
        return 'Graph Search';
      default:
        return typeof citation === 'string' ? citation : 'Knowledge Base';
    }
  };

  // Helper function to detect search method from source data
  const detectSearchMethod = (citation: Citation | any): string | undefined => {
    // First check metadata.source field (backend format)
    if (citation?.metadata?.source) {
      switch (citation.metadata.source) {
        case 'vector_search':
          return 'vector';
        case 'bm25_search':
          return 'bm25';
        case 'graph_search':
          return 'graph';
        case 'web_search':
          return 'web';
      }
    }
    
    // Then check the direct source field (backend format)
    if (citation?.source) {
      // Check if it matches backend format
      switch (citation.source) {
        case 'vector_search':
          return 'vector';
        case 'bm25_search':
          return 'bm25';
        case 'graph_search':
          return 'graph';
        case 'web_search':
          return 'web';
      }
    }
    
    // Fallback to string-based detection for legacy/other formats
    const sourceStr = citation?.source || citation?.metadata?.title || citation?.text || '';
    if (!sourceStr) return undefined;
    
    const sourceLower = sourceStr.toLowerCase();
    if (sourceLower.includes('web') || sourceLower.includes('http') || sourceLower.includes('google')) {
      return 'web';
    }
    if (sourceLower.includes('bm25') || sourceLower.includes('keyword')) {
      return 'bm25';
    }
    if (sourceLower.includes('vector') || sourceLower.includes('embedding') || sourceLower.includes('semantic')) {
      return 'vector';
    }
    if (sourceLower.includes('graph') || sourceLower.includes('knowledge') || sourceLower.includes('entity')) {
      return 'graph';
    }
    return 'vector'; // Default to vector for knowledge base
  };

  // Graph Visualization Component
  const GraphVisualization = ({ entities, relations, graphPath }: { 
    entities?: GraphEntity[], 
    relations?: GraphRelation[], 
    graphPath?: string[] 
  }) => {
    if (!entities || entities.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-purple-50/30 rounded-lg border border-purple-100/60">
        <div className="flex items-center gap-2 mb-3">
          <NetworkIcon className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-medium text-purple-700">Knowledge Graph</span>
        </div>
        
        {/* Entities */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Entities:</div>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/60 
                           rounded-full border border-purple-200/60 text-xs"
              >
                <CircleIcon className="w-2.5 h-2.5 text-purple-500" />
                <span className="font-medium text-gray-800">{entity.name}</span>
                <TagIcon className="w-2.5 h-2.5 text-gray-400" />
                <span className="text-gray-500 text-xs">{entity.type}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Relations */}
        {relations && relations.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Relations:</div>
            <div className="space-y-1.5">
              {relations.slice(0, 3).map((relation, index) => {
                const fromEntity = entities.find(e => e.id === relation.from);
                const toEntity = entities.find(e => e.id === relation.to);
                return (
                  <motion.div
                    key={`${relation.from}-${relation.to}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-xs bg-white/40 rounded p-2"
                  >
                    <span className="font-medium text-purple-700">
                      {fromEntity?.name || relation.from}
                    </span>
                    <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {relation.type}
                    </span>
                    <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-purple-700">
                      {toEntity?.name || relation.to}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Graph Path */}
        {graphPath && graphPath.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Knowledge Path:</div>
            <div className="flex items-center gap-1 flex-wrap">
              {graphPath.map((node, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {node}
                  </span>
                  {index < graphPath.length - 1 && (
                    <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-100/60">
      {/* Enhanced Search Methods Summary */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 
                       transition-all duration-200"
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
        </div>
        
        {/* Search Method Breakdown */}
        <div className="flex items-center gap-1.5 ml-2">
          {['web', 'bm25', 'vector', 'graph'].map(method => {
            const count = citations.filter(c => {
              const detectedMethod = c.metadata?.searchMethod || detectSearchMethod(c);
              return detectedMethod === method;
            }).length;
            if (count === 0) return null;
            return (
              <div 
                key={method}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs 
                           ${getSourceColor(method)} font-medium`}
              >
                {getSourceIcon(method)}
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

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
                                      text-xs font-medium ${getSourceColor(citation.metadata?.searchMethod, citation)}`}>
                        {getSourceIcon(citation.metadata?.searchMethod, citation)}
                        {getSourceLabel(citation.metadata?.searchMethod, citation)}
                      </div>
                      
                      {/* Enhanced Score Display */}
                      <div className="flex items-center gap-1.5">
                        {citation.metadata?.vectorScore && (
                          <div className="text-xs text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                            V: {(citation.metadata.vectorScore * 100).toFixed(1)}%
                          </div>
                        )}
                        {citation.metadata?.bm25Score && (
                          <div className="text-xs text-orange-600 font-mono bg-orange-50 px-1.5 py-0.5 rounded">
                            BM25: {citation.metadata.bm25Score.toFixed(2)}
                          </div>
                        )}
                        {citation.score && !citation.metadata?.vectorScore && !citation.metadata?.bm25Score && (
                          <div className="text-xs text-gray-400 font-mono">
                            {(Math.min(citation.score, 1) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
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

                  {/* Graph Visualization for Graph Search Results */}
                  {citation.metadata?.searchMethod === 'graph' && (
                    <GraphVisualization 
                      entities={citation.metadata.entities}
                      relations={citation.metadata.relations}
                      graphPath={citation.metadata.graphPath}
                    />
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