# refinement/fact_checker.py
"""
Fact checking using retrieved context
"""

from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class FactChecker:
    """Check facts against retrieved context"""
    
    def __init__(self, llm_manager: Any):
        self.llm_manager = llm_manager
    
    async def check_fact(self, claim: str, context: List[Dict]) -> Dict:
        """Check if a claim is supported by context"""
        # Prepare context
        context_text = "\n\n".join([
            f"Source {i+1}: {doc.get('text', '')[:500]}"
            for i, doc in enumerate(context[:5])
        ])
        
        prompt = f"""Verify if this claim is supported by the provided sources.

Claim: {claim}

Sources:
{context_text}

Analyze:
1. Is the claim directly supported? (yes/no/partially)
2. Which sources support it? (list source numbers)
3. Are there any contradictions? (yes/no)
4. Confidence level: (0.0-1.0)
5. Explanation: (brief explanation)

Format your response as:
SUPPORTED: [yes/no/partially]
SOURCES: [1,2,3 or none]
CONTRADICTIONS: [yes/no]
CONFIDENCE: [0.0-1.0]
EXPLANATION: [your explanation]"""
        
        result = await self.llm_manager.ainvoke(prompt)
        
        # Parse result
        parsed = self._parse_fact_check_result(result)
        parsed["claim"] = claim
        
        return parsed
    
    def _parse_fact_check_result(self, result: str) -> Dict:
        """Parse fact checking result"""
        parsed = {
            "supported": "unknown",
            "sources": [],
            "has_contradictions": False,
            "confidence": 0.5,
            "explanation": ""
        }
        
        for line in result.split('\n'):
            line = line.strip()
            
            if line.startswith('SUPPORTED:'):
                value = line[10:].strip().lower()
                parsed["supported"] = value
            
            elif line.startswith('SOURCES:'):
                sources_str = line[8:].strip()
                if sources_str.lower() != 'none':
                    # Extract numbers
                    import re
                    numbers = re.findall(r'\d+', sources_str)
                    parsed["sources"] = [int(n) for n in numbers]
            
            elif line.startswith('CONTRADICTIONS:'):
                parsed["has_contradictions"] = 'yes' in line.lower()
            
            elif line.startswith('CONFIDENCE:'):
                try:
                    conf_str = line[11:].strip()
                    parsed["confidence"] = float(conf_str)
                except:
                    pass
            
            elif line.startswith('EXPLANATION:'):
                parsed["explanation"] = line[12:].strip()
        
        return parsed
    
    async def check_multiple_facts(self, claims: List[str], context: List[Dict]) -> List[Dict]:
        """Check multiple facts in parallel"""
        import asyncio
        
        tasks = [self.check_fact(claim, context) for claim in claims]
        results = await asyncio.gather(*tasks)
        
        return results