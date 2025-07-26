# refinement/claim_extractor.py
"""
Extract factual claims from text
"""

from typing import List, Dict, Any
import re
import logging

logger = logging.getLogger(__name__)

class ClaimExtractor:
    """Extract and categorize claims from text"""
    
    def __init__(self, llm_manager: Any):
        self.llm_manager = llm_manager
        
    async def extract_claims(self, text: str) -> List[Dict]:
        """Extract factual claims from text"""
        prompt = f"""Extract all factual claims from this text. For each claim, specify:
1. The claim itself
2. Type: statistical/medical/procedural/descriptive
3. Confidence: high/medium/low
4. Whether it requires verification

Text: {text}

Format each claim as:
CLAIM: [the claim]
TYPE: [type]
CONFIDENCE: [confidence]
VERIFY: [yes/no]
---"""
        
        result = await self.llm_manager.ainvoke(prompt)
        
        # Parse claims
        claims = []
        current_claim = {}
        
        for line in result.split('\n'):
            line = line.strip()
            
            if line.startswith('CLAIM:'):
                if current_claim:
                    claims.append(current_claim)
                current_claim = {"text": line[6:].strip()}
            elif line.startswith('TYPE:'):
                current_claim["type"] = line[5:].strip()
            elif line.startswith('CONFIDENCE:'):
                current_claim["confidence"] = line[11:].strip()
            elif line.startswith('VERIFY:'):
                current_claim["requires_verification"] = line[7:].strip().lower() == "yes"
            elif line == '---':
                if current_claim:
                    claims.append(current_claim)
                    current_claim = {}
        
        # Add last claim if exists
        if current_claim and "text" in current_claim:
            claims.append(current_claim)
        
        return claims
    
    def extract_statistical_claims(self, text: str) -> List[str]:
        """Extract claims containing statistics or numbers"""
        # Pattern for numbers with context
        pattern = r'(?:(?:about|approximately|roughly|nearly|over|under|at least|up to|more than|less than)\s+)?(?:\d+(?:\.\d+)?%?|\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s+(?:\w+\s+){0,5}'
        
        matches = re.findall(pattern, text, re.IGNORECASE)
        
        # Clean and filter matches
        claims = []
        for match in matches:
            match = match.strip()
            # Ensure it has meaningful context (more than just a number)
            if len(match.split()) > 1:
                claims.append(match)
        
        return claims