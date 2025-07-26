# retrieval/graph_store.py
"""
OPTIMIZED Knowledge graph store with performance improvements
"""

import networkx as nx
import pickle
from typing import List, Dict, Any, Tuple, Set
import logging
import time
from collections import defaultdict

logger = logging.getLogger(__name__)

class GraphStore:
    """OPTIMIZED Knowledge graph for entity-relationship storage with performance improvements"""
    
    def __init__(self):
        self.graph = nx.DiGraph()
        self.entity_index = {}  # entity -> node_ids
        
        # PERFORMANCE OPTIMIZATIONS
        self.search_cache = {}  # Cache for frequent searches
        self.cache_ttl = 600  # 10 minutes cache
        self.neighbor_cache = {}  # Pre-computed neighbor relationships
        self.entity_text_index = defaultdict(set)  # Full-text search on entities
        
        # Performance stats
        self.stats = {
            "cache_hits": 0,
            "cache_misses": 0,
            "searches": 0
        }
    
    def add_triple(self, subject: str, predicate: str, object: str, metadata: Dict = None):
        """Add a triple to the knowledge graph"""
        # Add nodes with enhanced attributes
        self.graph.add_node(subject, type="entity", label=subject, metadata=metadata or {})
        self.graph.add_node(object, type="entity", label=object, metadata=metadata or {})
        
        # Add edge with weight based on predicate importance
        edge_weight = self._calculate_edge_weight(predicate)
        self.graph.add_edge(
            subject, object, 
            predicate=predicate, 
            metadata=metadata or {},
            weight=edge_weight
        )
        
        # Update indexes
        self._update_entity_index(subject)
        self._update_entity_index(object)
        self._update_text_index(subject)
        self._update_text_index(object)
        
        # Clear relevant caches
        self._invalidate_cache_for_entity(subject)
        self._invalidate_cache_for_entity(object)
    
    def _calculate_edge_weight(self, predicate: str) -> float:
        """Calculate edge weight based on predicate importance"""
        important_predicates = {
            "treats": 0.9,
            "causes": 0.8,
            "symptom_of": 0.8,
            "therapy_for": 0.9,
            "medication_for": 0.8,
            "helps_with": 0.7,
            "related_to": 0.5,
            "is_type_of": 0.6
        }
        return important_predicates.get(predicate.lower(), 0.5)
    
    def _update_entity_index(self, entity: str):
        """Update entity index with case-insensitive matching"""
        entity_lower = entity.lower()
        if entity_lower not in self.entity_index:
            self.entity_index[entity_lower] = set()
        self.entity_index[entity_lower].add(entity)
    
    def _update_text_index(self, entity: str):
        """Update full-text search index"""
        words = entity.lower().split()
        for word in words:
            if len(word) > 2:  # Skip very short words
                self.entity_text_index[word].add(entity.lower())
    
    def _invalidate_cache_for_entity(self, entity: str):
        """Clear cache entries related to an entity"""
        entity_lower = entity.lower()
        keys_to_remove = [key for key in self.search_cache.keys() if entity_lower in key.lower()]
        for key in keys_to_remove:
            del self.search_cache[key]
        
        # Clear neighbor cache
        if entity_lower in self.neighbor_cache:
            del self.neighbor_cache[entity_lower]
    
    async def search_entity(self, entity: str, hop_distance: int = 2, limit: int = 20) -> List[Dict]:
        """OPTIMIZED entity search with caching and performance improvements"""
        self.stats["searches"] += 1
        
        # Check cache first
        cache_key = f"{entity.lower()}:{hop_distance}:{limit}"
        if cache_key in self.search_cache:
            cached_time, cached_results = self.search_cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                self.stats["cache_hits"] += 1
                logger.debug(f"Cache hit for entity '{entity}'")
                return cached_results
        
        self.stats["cache_misses"] += 1
        
        # Find matching nodes with improved search
        matching_nodes = self._find_matching_nodes_optimized(entity)
        
        if not matching_nodes:
            logger.debug(f"No matching nodes found for entity '{entity}'")
            return []
        
        results = []
        processed_pairs = set()  # Avoid duplicate relationships
        
        # OPTIMIZED: Process only top matching nodes to limit computation
        top_nodes = list(matching_nodes)[:3]  # Limit to top 3 matches
        
        for node in top_nodes:
            if node in self.graph:
                # Get or compute neighbors
                neighbors = self._get_neighbors_cached(node, hop_distance)
                
                for neighbor, distance in neighbors.items():
                    if neighbor != node:
                        # Avoid duplicate pairs
                        pair_key = (node, neighbor) if node < neighbor else (neighbor, node)
                        if pair_key in processed_pairs:
                            continue
                        processed_pairs.add(pair_key)
                        
                        # OPTIMIZED: Get direct path only for performance
                        try:
                            path = nx.shortest_path(self.graph, node, neighbor)
                            if len(path) <= hop_distance + 1:  # Valid path length
                                rel_text = self._path_to_text_optimized(path)
                                
                                # Calculate relevance with multiple factors
                                relevance = self._calculate_relevance(entity, node, neighbor, distance, path)
                                
                                results.append({
                                    "entity": node,
                                    "related_entity": neighbor,
                                    "relationship": rel_text,
                                    "distance": distance,
                                    "text": rel_text,
                                    "relevance": relevance,
                                    "score": relevance,  # For compatibility
                                    "source": "graph_search",
                                    "metadata": {
                                        "path_length": len(path),
                                        "original_entity": entity,
                                        "hop_distance": hop_distance
                                    }
                                })
                        except nx.NetworkXNoPath:
                            continue  # Skip if no path exists
                        
                        # Early exit if we have enough results
                        if len(results) >= limit * 2:
                            break
        
        # OPTIMIZED: Sort by relevance and apply limit
        results.sort(key=lambda x: x["relevance"], reverse=True)
        final_results = results[:limit]
        
        # Cache the results
        self.search_cache[cache_key] = (time.time(), final_results)
        self._clean_cache()
        
        logger.debug(f"Graph search for '{entity}' returned {len(final_results)} results")
        return final_results
    
    def _find_matching_nodes_optimized(self, entity: str) -> Set[str]:
        """OPTIMIZED entity matching with fuzzy search"""
        entity_lower = entity.lower()
        matching_nodes = set()
        
        # 1. Exact match
        exact_matches = self.entity_index.get(entity_lower, set())
        matching_nodes.update(exact_matches)
        
        # 2. Word-based matching for better recall
        entity_words = entity_lower.split()
        for word in entity_words:
            if len(word) > 2:  # Skip short words
                word_matches = self.entity_text_index.get(word, set())
                # Add entities that contain this word
                for match in word_matches:
                    if match in self.entity_index:
                        matching_nodes.update(self.entity_index[match])
        
        # 3. Partial substring matching (limited for performance)
        if len(matching_nodes) < 5:  # Only if we don't have enough matches
            for key, nodes in list(self.entity_index.items())[:100]:  # Limit search scope
                if entity_lower in key or key in entity_lower:
                    matching_nodes.update(nodes)
                    if len(matching_nodes) > 10:  # Stop if we have enough
                        break
        
        return matching_nodes
    
    def _get_neighbors_cached(self, node: str, hop_distance: int) -> Dict[str, int]:
        """Get neighbors with caching for performance"""
        cache_key = f"{node}:{hop_distance}"
        
        if cache_key in self.neighbor_cache:
            return self.neighbor_cache[cache_key]
        
        try:
            # OPTIMIZED: Use limited BFS for better performance
            neighbors = {}
            if hop_distance == 1:
                # Direct neighbors only - fastest
                for neighbor in self.graph.neighbors(node):
                    neighbors[neighbor] = 1
            else:
                # Multi-hop with limit
                neighbors = nx.single_source_shortest_path_length(
                    self.graph, node, cutoff=hop_distance
                )
            
            # Cache the result
            self.neighbor_cache[cache_key] = neighbors
            return neighbors
            
        except Exception as e:
            logger.warning(f"Error getting neighbors for {node}: {e}")
            return {}
    
    def _calculate_relevance(self, original_entity: str, node: str, neighbor: str, 
                           distance: int, path: List[str]) -> float:
        """Calculate relevance score with multiple factors"""
        # Base relevance inversely proportional to distance
        base_relevance = 1.0 / (distance + 1)
        
        # Boost for exact entity matches
        entity_lower = original_entity.lower()
        if entity_lower in node.lower() or entity_lower in neighbor.lower():
            base_relevance *= 1.5
        
        # Boost for important relationships in path
        edge_weight_sum = 0
        edge_count = 0
        for i in range(len(path) - 1):
            try:
                edge_data = self.graph.get_edge_data(path[i], path[i + 1])
                if edge_data:
                    edge_weight_sum += edge_data.get('weight', 0.5)
                    edge_count += 1
            except:
                continue
        
        if edge_count > 0:
            avg_edge_weight = edge_weight_sum / edge_count
            base_relevance *= (0.5 + avg_edge_weight)  # Scale by edge importance
        
        return min(1.0, base_relevance)  # Cap at 1.0
    
    def _path_to_text_optimized(self, path: List[str]) -> str:
        """Convert path to readable text with optimization"""
        if len(path) < 2:
            return ""
        
        # OPTIMIZED: Simplified text generation for performance
        if len(path) == 2:
            # Direct relationship
            try:
                edge_data = self.graph.get_edge_data(path[0], path[1])
                predicate = edge_data.get("predicate", "related to") if edge_data else "related to"
                return f"{path[0]} {predicate} {path[1]}"
            except:
                return f"{path[0]} related to {path[1]}"
        else:
            # Multi-hop relationship - simplified
            return f"{path[0]} connected to {path[-1]} via {' -> '.join(path[1:-1])}"
    
    def add_document_entities(self, entities: List[Tuple[str, str, str]], doc_metadata: Dict = None):
        """Add entities from a document with batch optimization"""
        for subject, predicate, object in entities:
            self.add_triple(subject, predicate, object, doc_metadata)
    
    def _clean_cache(self):
        """Clean old cache entries for performance"""
        current_time = time.time()
        
        # Clean search cache
        keys_to_remove = [
            key for key, (timestamp, _) in self.search_cache.items()
            if current_time - timestamp > self.cache_ttl
        ]
        for key in keys_to_remove:
            del self.search_cache[key]
        
        # Limit cache size
        if len(self.search_cache) > 100:
            sorted_items = sorted(self.search_cache.items(), key=lambda x: x[1][0])
            for key, _ in sorted_items[:50]:
                del self.search_cache[key]
        
        # Clean neighbor cache
        if len(self.neighbor_cache) > 200:
            # Remove oldest half
            keys_to_remove = list(self.neighbor_cache.keys())[:100]
            for key in keys_to_remove:
                del self.neighbor_cache[key]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        total_searches = self.stats["searches"]
        cache_hit_rate = (self.stats["cache_hits"] / total_searches * 100) if total_searches > 0 else 0
        
        return {
            **self.stats,
            "cache_hit_rate": f"{cache_hit_rate:.1f}%",
            "total_entities": len(self.entity_index),
            "total_relationships": self.graph.number_of_edges(),
            "cache_size": len(self.search_cache)
        }
    
    def save(self, path: str):
        """Save graph to disk"""
        with open(f"{path}.pkl", "wb") as f:
            pickle.dump({
                "graph": self.graph,
                "entity_index": self.entity_index,
                "entity_text_index": dict(self.entity_text_index),
                "stats": self.stats
            }, f)
        logger.info(f"Saved graph with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges")
    
    def load(self, path: str):
        """Load graph from disk"""
        try:
            with open(f"{path}.pkl", "rb") as f:
                data = pickle.load(f)
                self.graph = data["graph"]
                self.entity_index = data["entity_index"]
                
                # Load optional new fields with defaults
                if "entity_text_index" in data:
                    self.entity_text_index = defaultdict(set, data["entity_text_index"])
                else:
                    self._rebuild_text_index()
                
                if "stats" in data:
                    self.stats.update(data["stats"])
                
            logger.info(f"Loaded graph with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges")
        except Exception as e:
            logger.error(f"Failed to load graph: {e}")
            raise
    
    def _rebuild_text_index(self):
        """Rebuild text index if not present in loaded data"""
        logger.info("Rebuilding text index...")
        self.entity_text_index = defaultdict(set)
        for entity_set in self.entity_index.values():
            for entity in entity_set:
                self._update_text_index(entity)