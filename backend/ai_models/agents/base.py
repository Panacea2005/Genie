# agents/base.py
"""
Base agent class that all agents inherit from
Provides common functionality and interface
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import logging
import time
import json
from dataclasses import dataclass
import asyncio

@dataclass
class AgentResponse:
    """Standard response format for all agents"""
    success: bool
    data: Any
    metadata: Dict[str, Any]
    error: Optional[str] = None
    processing_time: float = 0.0
    confidence: float = 1.0

class BaseAgent(ABC):
    """Base class for all agents in the system"""
    
    def __init__(self, name: str, llm_manager: Any, config: Any):
        self.name = name
        self.llm_manager = llm_manager
        self.config = config
        self.logger = logging.getLogger(f"agent.{name}")
        self.metrics = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "total_processing_time": 0.0
        }
    
    @abstractmethod
    async def process(self, *args, **kwargs) -> AgentResponse:
        """Process input and return results - must be implemented by subclasses"""
        pass
    
    async def __call__(self, *args, **kwargs) -> AgentResponse:
        """Make agent callable with automatic metrics tracking"""
        start_time = time.time()
        self.metrics["total_calls"] += 1
        
        try:
            # Log the call - Fixed: changed 'args' to 'input_args' to avoid conflict
            self.logger.info(f"Processing request", extra={"input_args": str(args), "input_kwargs": str(kwargs)})
            
            # Process the request
            response = await self.process(*args, **kwargs)

            # Check if response is valid
            if response is None:
                response = AgentResponse(
                    success=False,
                    data=None,
                    metadata={"error_type": "NoneResponse"},
                    error="Process method returned None",
                    confidence=0.0
                )
            
            # Update metrics
            processing_time = time.time() - start_time
            
            # Check if response is valid before setting processing_time
            if response is not None:
                response.processing_time = processing_time
            else:
                # Create error response if process returned None
                response = AgentResponse(
                    success=False,
                    data=None,
                    metadata={"error_type": "NoneResponse"},
                    error="Process method returned None",
                    processing_time=processing_time,
                    confidence=0.0
                )
            self.metrics["successful_calls"] += 1
            self.metrics["total_processing_time"] += processing_time
            
            # Log success
            self.logger.info(f"Request processed successfully", extra={
                "processing_time": processing_time,
                "confidence": response.confidence
            })
            
            return response
            
        except Exception as e:
            # Update metrics
            self.metrics["failed_calls"] += 1
            processing_time = time.time() - start_time
            
            # Log error
            self.logger.error(f"Request failed: {str(e)}", exc_info=True)
            
            # Return error response
            return AgentResponse(
                success=False,
                data=None,
                metadata={"error_type": type(e).__name__},
                error=str(e),
                processing_time=processing_time,
                confidence=0.0
            )
    
    async def invoke_llm(self, prompt: str, parse_json: bool = False, **kwargs) -> Any:
        """Invoke LLM with error handling"""
        try:
            # Use generate method from LLM manager
            response = self.llm_manager.generate(prompt, **kwargs)
            
            if parse_json:
                # Try to extract JSON from response
                return self._extract_json(response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"LLM invocation failed: {e}")
            raise
    
    def _extract_json(self, text: str) -> Dict:
        """Extract JSON from LLM response"""
        # Try to find JSON in the response
        try:
            # First, try to parse the entire response
            return json.loads(text)
        except:
            # Look for JSON between ```json and ```
            import re
            json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Look for JSON between { and }
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            
            raise ValueError(f"Could not extract JSON from response: {text[:200]}...")
    
    async def run_with_timeout(self, coro, timeout: int):
        """Run coroutine with timeout"""
        try:
            return await asyncio.wait_for(coro, timeout=timeout)
        except asyncio.TimeoutError:
            self.logger.warning(f"Operation timed out after {timeout} seconds")
            raise
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get agent metrics"""
        metrics = self.metrics.copy()
        if metrics["total_calls"] > 0:
            metrics["success_rate"] = metrics["successful_calls"] / metrics["total_calls"]
            metrics["average_processing_time"] = metrics["total_processing_time"] / metrics["total_calls"]
        else:
            metrics["success_rate"] = 0.0
            metrics["average_processing_time"] = 0.0
        return metrics
    
    def reset_metrics(self):
        """Reset agent metrics"""
        self.metrics = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "total_processing_time": 0.0
        }