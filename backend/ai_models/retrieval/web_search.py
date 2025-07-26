# retrieval/web_search.py
"""
Web search integration using DuckDuckGo
"""

from duckduckgo_search import DDGS
from typing import List, Dict, Any
import logging
import asyncio

logger = logging.getLogger(__name__)

class WebSearch:
    """Web search using DuckDuckGo"""
    
    def __init__(self, timeout: int = 5):  # Note: timeout not used in DDGS  # Note: timeout not used in DDGS
        self.timeout = timeout
        self.ddgs = DDGS()
    
    async def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """Search the web"""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None, 
                self._search_sync, 
                query, 
                max_results
            )
            return results
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return []
    
    def _search_sync(self, query: str, max_results: int) -> List[Dict]:
        """Synchronous search"""
        results = []
        
        try:
            # Fixed: removed timeout parameter
            search_results = list(self.ddgs.text(
                query, 
                max_results=max_results
            ))
            
            for result in search_results:
                results.append({
                    "title": result.get("title", ""),
                    "snippet": result.get("body", ""),
                    "url": result.get("href", ""),
                    "text": f"{result.get('title', '')} {result.get('body', '')}",
                    "metadata": {
                        "source": "web_search",
                        "url": result.get("href", "")
                    }
                })
        except Exception as e:
            logger.error(f"DuckDuckGo search error: {e}")
        
        return results