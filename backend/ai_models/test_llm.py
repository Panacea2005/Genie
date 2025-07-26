#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG-Integrated Mental Health Model Comparison Tester
Run ONE model at a time, store results, then compare
"""

import sys
import os

# Ensure the parent directory is in sys.path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
import json
import asyncio
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Add project root to path and load environment variables
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
load_dotenv()  # Load environment variables first

import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("rag_comparison_test.log", encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Color support (Windows-safe)
try:
    from colorama import init, Fore, Style
    init()
    SUCCESS = Fore.GREEN
    ERROR = Fore.RED
    WARNING = Fore.YELLOW
    INFO = Fore.CYAN
    BOLD = Style.BRIGHT
    RESET = Style.RESET_ALL
    CHECK_MARK = "✓" if not sys.platform.startswith('win') else "[OK]"
    CROSS_MARK = "✗" if not sys.platform.startswith('win') else "[X]"
except ImportError:
    SUCCESS = ERROR = WARNING = INFO = BOLD = RESET = ""
    CHECK_MARK = "[OK]"
    CROSS_MARK = "[X]"

import asyncio
import json
from tabulate import tabulate # type: ignore
from ai_models.main import GenieAI

# Define robust test cases
TEST_CASES = [
    # Emotional: Happy
    {"name": "Happy - General", "message": "I'm feeling really happy today!", "type": "emotional"},
    {"name": "Happy - Achievement", "message": "I just got a promotion at work!", "type": "emotional"},
    {"name": "Happy - Social", "message": "I had a wonderful time with my friends yesterday.", "type": "emotional"},
    # Emotional: Sad
    {"name": "Sad - General", "message": "I'm feeling very sad and down.", "type": "emotional"},
    {"name": "Sad - Loss", "message": "I lost my pet recently and I can't stop crying.", "type": "emotional"},
    {"name": "Sad - Loneliness", "message": "I feel so alone even when I'm with people.", "type": "emotional"},
    # Emotional: Anxious
    {"name": "Anxious - Exams", "message": "I'm anxious about my upcoming exams.", "type": "emotional"},
    {"name": "Anxious - Social", "message": "I get really nervous before meeting new people.", "type": "emotional"},
    {"name": "Anxious - Future", "message": "I'm worried about what the future holds for me.", "type": "emotional"},
    # Emotional: Angry
    {"name": "Angry - Work", "message": "I'm so angry about what happened at work.", "type": "emotional"},
    {"name": "Angry - Injustice", "message": "It's unfair how some people are treated.", "type": "emotional"},
    {"name": "Angry - Argument", "message": "I had a big argument with my friend and I'm still upset.", "type": "emotional"},
    # Emotional: Supportive
    {"name": "Supportive - Help", "message": "I need some support, can you help me?", "type": "emotional"},
    {"name": "Supportive - Motivation", "message": "I'm struggling to stay motivated, any advice?", "type": "emotional"},
    {"name": "Supportive - Encouragement", "message": "Can you give me some encouragement?", "type": "emotional"},
    # Emotional: Self-Reflection
    {"name": "Self-Reflection - Lost", "message": "Sometimes I feel lost, what should I do?", "type": "emotional"},
    {"name": "Self-Reflection - Purpose", "message": "How do I find my purpose in life?", "type": "emotional"},
    {"name": "Self-Reflection - Growth", "message": "How can I become a better person?", "type": "emotional"},
    # Neutral
    {"name": "Neutral - Weather", "message": "What is the weather like today?", "type": "neutral"},
    {"name": "Neutral - Time", "message": "What time is it in Tokyo?", "type": "neutral"},
    {"name": "Neutral - Joke", "message": "Tell me a joke.", "type": "neutral"},
    {"name": "Neutral - Greeting", "message": "Hello, how are you?", "type": "neutral"},
    {"name": "Neutral - Random Fact", "message": "Tell me a random fact.", "type": "neutral"},
    # Factual
    {"name": "Factual - Capital", "message": "What is the capital of France?", "type": "factual"},
    {"name": "Factual - Health", "message": "What are the symptoms of flu?", "type": "factual"},
    {"name": "Factual - History", "message": "Tell me about the history of the internet.", "type": "factual"},
    {"name": "Factual - Science", "message": "Explain the theory of relativity.", "type": "factual"},
    {"name": "Factual - Math", "message": "What is the Pythagorean theorem?", "type": "factual"},
    {"name": "Factual - Technology", "message": "How does a blockchain work?", "type": "factual"},
    {"name": "Factual - Geography", "message": "Where is Mount Everest located?", "type": "factual"},
    {"name": "Factual - Literature", "message": "Who wrote 'Pride and Prejudice'?", "type": "factual"},
    {"name": "Factual - Space", "message": "What is a black hole?", "type": "factual"},
    {"name": "Factual - Biology", "message": "What is DNA?", "type": "factual"},
]

# Models to test
MODELS = [
    {"name": "Groq", "model_preference": "groq"},
    {"name": "Local", "model_preference": "local"},
]

async def run_test_cases():
    genie_ai = GenieAI()
    results = []
    for test in TEST_CASES:
        row = {"Test Case": test["name"]}
        for model in MODELS:
            try:
                response = await genie_ai.chat(
                    query=test["message"],
                    session_id=f"test_{test['name'].replace(' ', '_').lower()}_{model['name'].lower()}",
                    context={},
                    model_preference=model["model_preference"]
                )
                row[f"{model['name']}_confidence"] = response.get("confidence", None)
                row[f"{model['name']}_time"] = response.get("processing_time", None)
                # For total score, use confidence as a proxy (or add more if available)
                row[f"{model['name']}_total"] = response.get("confidence", None)
            except Exception as e:
                row[f"{model['name']}_confidence"] = "ERROR"
                row[f"{model['name']}_time"] = "ERROR"
                row[f"{model['name']}_total"] = "ERROR"
        results.append(row)

    # Print tables
    print("\n=== Confidence Scores ===")
    conf_table = [[r["Test Case"], r["Groq_confidence"], r["Local_confidence"]] for r in results]
    print(tabulate(conf_table, headers=["Test Case", "Groq", "Local"], floatfmt=".2f"))

    print("\n=== Response Times (seconds) ===")
    time_table = [[r["Test Case"], r["Groq_time"], r["Local_time"]] for r in results]
    print(tabulate(time_table, headers=["Test Case", "Groq", "Local"], floatfmt=".2f"))

    print("\n=== Total Scores ===")
    total_table = [[r["Test Case"], r["Groq_total"], r["Local_total"]] for r in results]
    print(tabulate(total_table, headers=["Test Case", "Groq", "Local"], floatfmt=".2f"))

if __name__ == "__main__":
    asyncio.run(run_test_cases())

def print_separator(char="=", length=80, color=""):
    """Print a separator line"""
    print(f"{color}{char * length}{RESET}")

def format_time(seconds):
    """Format time with color"""
    if seconds < 1:
        return f"{INFO}{seconds:.3f}s{RESET}"
    elif seconds < 3:
        return f"{WARNING}{seconds:.2f}s{RESET}"
    else:
        return f"{ERROR}{seconds:.2f}s{RESET}"

def format_confidence(confidence):
    """Format confidence with color"""
    if confidence >= 0.8:
        return f"{SUCCESS}{confidence:.1%}{RESET}"
    elif confidence >= 0.6:
        return f"{WARNING}{confidence:.1%}{RESET}"
    else:
        return f"{ERROR}{confidence:.1%}{RESET}"

class SingleModelTester:
    """Test ONE model at a time using the existing GenieAI RAG system"""
    
    def __init__(self):
        # Initialize provider first
        self.current_provider, _ = self.get_current_provider()
        self.genie = None
        
        self.test_queries = [
            # Emotional Support Queries
            {
                "category": "Emotional Support",
                "query": "I'm feeling really anxious about my upcoming job interview. Can you help?",
                "expected_elements": ["validation", "practical advice", "empathy", "coping strategies"],
                "description": "Job interview anxiety support"
            },
            {
                "category": "Emotional Support", 
                "query": "I've been feeling depressed lately and don't know what to do.",
                "expected_elements": ["understanding", "professional help", "immediate support", "hope"],
                "description": "Depression support and guidance"
            },
            {
                "category": "Emotional Support",
                "query": "Everything feels overwhelming right now and I can't cope.",
                "expected_elements": ["immediate support", "grounding techniques", "validation", "professional help"],
                "description": "Overwhelm and coping support"
            },
            
            # Practical Guidance Queries
            {
                "category": "Practical Guidance",
                "query": "What are some effective coping strategies for anxiety?",
                "expected_elements": ["specific techniques", "actionable steps", "examples", "structured approach"],
                "description": "Anxiety coping strategies"
            },
            {
                "category": "Practical Guidance",
                "query": "How can I improve my sleep when I'm stressed?",
                "expected_elements": ["sleep hygiene", "relaxation techniques", "routine", "specific actions"],
                "description": "Stress-related sleep improvement"
            },
            {
                "category": "Practical Guidance",
                "query": "What techniques can help me manage panic attacks?",
                "expected_elements": ["immediate steps", "breathing techniques", "grounding", "prevention"],
                "description": "Panic attack management techniques"
            },
            
            # Crisis Support Queries
            {
                "category": "Crisis Support",
                "query": "I'm feeling really hopeless and don't see a way forward.",
                "expected_elements": ["crisis support", "professional help", "immediate safety", "hope"],
                "description": "Hopelessness and crisis support"
            },
            {
                "category": "Crisis Support",
                "query": "I don't want to be a burden to anyone anymore.",
                "expected_elements": ["professional help", "crisis resources", "value affirmation", "immediate support"],
                "description": "Burden feelings and suicidal ideation"
            },
            
            # General Mental Health
            {
                "category": "General Mental Health",
                "query": "What's the difference between feeling sad and being depressed?",
                "expected_elements": ["education", "clear explanation", "professional guidance", "examples"],
                "description": "Mental health education"
            },
            {
                "category": "General Mental Health",
                "query": "How do I know if I need to see a therapist?",
                "expected_elements": ["guidance", "indicators", "reassurance", "practical steps"],
                "description": "Therapy guidance and indicators"
            },
            
            # Factual/Web Search Queries (require citations)
            {
                "category": "Current Information",
                "query": "What are the latest treatment approaches for anxiety disorders?",
                "expected_elements": ["current research", "treatment options", "professional guidance", "citations"],
                "description": "Latest anxiety treatment information"
            },
            {
                "category": "Current Information",
                "query": "Are there any new studies about meditation for depression?",
                "expected_elements": ["research findings", "specific studies", "citations", "practical implications"],
                "description": "Recent meditation research"
            },
            {
                "category": "Current Information", 
                "query": "What is cognitive behavioral therapy and how effective is it?",
                "expected_elements": ["definition", "effectiveness", "research", "citations"],
                "description": "CBT information and effectiveness"
            }
        ]
        
        self.genie = None
    
    def get_current_provider(self):
        """Get the currently configured provider"""
        provider = os.getenv("LLM_PROVIDER", "groq").lower()
        model_info = {
            "groq": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            "local": os.path.basename(os.getenv("LOCAL_MODEL_PATH", "llama1b-qlora-mh"))
        }
        return provider, model_info.get(provider, "Unknown model")
    
    def initialize_genie(self):
        """Initialize GenieAI system if not already initialized"""
        try:
            # First try to import existing instance
            try:
                from main import genie
                if genie is not None:
                    self.genie = genie
                    self.current_provider, current_model = self.get_current_provider()
                    
                    system_info = self.genie.get_system_info()
                    
                    print(f"{SUCCESS}{CHECK_MARK} Using existing GenieAI instance{RESET}")
                    print(f"  Current provider: {self.current_provider.upper()}")
                    print(f"  Model: {current_model}")
                    print(f"  Vector store: {system_info.get('vector_store_docs', 0):,} documents")
                    print(f"  BM25 index: {system_info.get('bm25_docs', 0):,} documents")
                    print(f"  Graph store: {system_info.get('graph_nodes', 0):,} nodes")
                    print(f"  Index status: {system_info.get('index_status', 'unknown')}")
                    
                    return True
            except (ImportError, AttributeError):
                pass
            
            # If no existing instance, create new one
            print(f"{INFO}Initializing new GenieAI instance...{RESET}")
            print(f"Current provider: {self.current_provider.upper()}")
            
            # Import and initialize
            from main import GenieAI, initialize_genie
            
            # Try to initialize with existing indexes first (faster)
            try:
                self.genie = initialize_genie(skip_data_loading=True)
            except Exception as e:
                print(f"{WARNING}Failed to load existing indexes: {e}{RESET}")
                print(f"{INFO}Attempting to initialize without existing data...{RESET}")
                self.genie = GenieAI(skip_data_loading=True)
            
            system_info = self.genie.get_system_info()
            
            print(f"{SUCCESS}{CHECK_MARK} GenieAI initialized successfully{RESET}")
            print(f"  Provider: {self.current_provider.upper()}")
            print(f"  Vector store: {system_info.get('vector_store_docs', 0):,} documents")
            print(f"  Index status: {system_info.get('index_status', 'unknown')}")
            
            # Store global instance for other imports
            import main
            main.genie = self.genie
            
            return True
            
        except Exception as e:
            print(f"{ERROR}Failed to initialize GenieAI: {e}{RESET}")
            logger.error(f"GenieAI initialization failed: {e}", exc_info=True)
            
            # Try to give helpful error messages
            if "GROQ_API_KEY" in str(e):
                print(f"{WARNING}Tip: Make sure GROQ_API_KEY is set in your environment{RESET}")
                print(f"{INFO}   You can set it with: set GROQ_API_KEY=your_key_here{RESET}")
            elif "index" in str(e).lower() or "faiss" in str(e).lower():
                print(f"{WARNING}Tip: Try rebuilding indexes or check if data files exist{RESET}")
                print(f"{INFO}   Data should be in: ai_models/indexes/{RESET}")
            elif "model" in str(e).lower():
                print(f"{WARNING}Tip: Check if the local model path is correct{RESET}")
                print(f"{INFO}   Model should be in: ai_models/model/{RESET}")
            
            return False
    
    async def test_single_query(self, query_data, index, total):
        """Test a single query using the current provider"""
        query = query_data["query"]
        category = query_data["category"]
        description = query_data["description"]
        
        print(f"\n{INFO}[{index}/{total}] {category}: {description}{RESET}")
        print(f"  Query: \"{query[:60]}...\"")
        
        start_time = time.time()
        
        try:
            # Use the existing GenieAI system
            response_data = await self.genie.process_query(query)
            end_time = time.time()
            
            # Extract response details
            response_text = response_data.get('response', '')
            confidence = response_data.get('confidence', 0.0)
            sources = response_data.get('sources', [])
            
            # Create retrieval_info from sources for backward compatibility
            retrieval_info = {
                'total_sources': len(sources),
                'vector_results': len([s for s in sources if s.get('source') == 'vector_search']),
                'bm25_results': len([s for s in sources if s.get('source') == 'bm25_search']),
                'graph_results': len([s for s in sources if s.get('source') == 'graph_search']),
                'web_results': len([s for s in sources if s.get('source') == 'web_search']),
                'avg_relevance': sum(s.get('score', 0.5) for s in sources) / len(sources) if sources else 0.0
            }
            
            # Analyze response quality with RAG context
            quality_score = self._analyze_rag_response_quality(
                response_text, query_data, retrieval_info
            )
            
            # Count citations in response
            citation_count = self._count_citations(response_text)
            
            result = {
                "category": category,
                "description": description,
                "query": query,
                "response": response_text,
                "response_time": end_time - start_time,
                "success": True,
                "error": None,
                "response_length": len(response_text),
                "word_count": len(response_text.split()),
                "quality_score": quality_score,
                "confidence": confidence,
                "provider": self.current_provider,
                "rag_info": retrieval_info,
                "sources": sources,
                "citation_count": citation_count,
                "has_citations": citation_count > 0
            }
            
            print(f"    {SUCCESS}{CHECK_MARK} Success - {format_time(result['response_time'])} - Quality: {quality_score:.1%} - Confidence: {format_confidence(confidence)}{RESET}")
            print(f"    RAG Sources: {retrieval_info.get('total_sources', 0)} documents | Citations: {citation_count}")
            
            # Show source breakdown
            source_breakdown = []
            if retrieval_info.get('vector_results', 0) > 0:
                source_breakdown.append(f"Vector: {retrieval_info['vector_results']}")
            if retrieval_info.get('bm25_results', 0) > 0:
                source_breakdown.append(f"BM25: {retrieval_info['bm25_results']}")
            if retrieval_info.get('web_results', 0) > 0:
                source_breakdown.append(f"Web: {retrieval_info['web_results']}")
            if retrieval_info.get('graph_results', 0) > 0:
                source_breakdown.append(f"Graph: {retrieval_info['graph_results']}")
            
            if source_breakdown:
                print(f"    Source breakdown: {' | '.join(source_breakdown)}")
            
        except Exception as e:
            end_time = time.time()
            result = {
                "category": category,
                "description": description,
                "query": query,
                "response": None,
                "response_time": end_time - start_time,
                "success": False,
                "error": str(e),
                "response_length": 0,
                "word_count": 0,
                "quality_score": 0.0,
                "confidence": 0.0,
                "provider": self.current_provider,
                "rag_info": {},
                "sources": [],
                "citation_count": 0,
                "has_citations": False
            }
            
            print(f"    {ERROR}{CROSS_MARK} Failed: {e}{RESET}")
        
        return result
    
    def _count_citations(self, text):
        """Count citation markers in text"""
        import re
        # Look for various citation patterns
        citation_patterns = [
            r'\[\d+\]',  # [1], [2], etc.
            r'\[Source:.*?\]',  # [Source: something]
            r'\[.*?source.*?\]',  # [any source]
            r'Source:.*?(?=\n|$)',  # Source: something (line ending)
            r'According to.*?(?=\.|,)',  # According to something
        ]
        
        total_citations = 0
        for pattern in citation_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            total_citations += len(matches)
        
        return total_citations
    
    def _analyze_rag_response_quality(self, response, query_data, retrieval_info):
        """Analyze RAG response quality based on expected elements and context usage"""
        if not response or len(response) < 20:
            return 0.0
        
        response_lower = response.lower()
        expected_elements = query_data.get("expected_elements", [])
        
        # Quality indicators (same as your existing test files)
        quality_indicators = {
            "validation": ["understand", "hear you", "valid", "normal", "okay to feel", "makes sense"],
            "empathy": ["I can imagine", "sounds difficult", "that must be", "I'm sorry", "I hear you"],
            "practical advice": ["try", "can help", "consider", "might", "suggest", "technique", "strategy"],
            "professional help": ["therapist", "counselor", "professional", "doctor", "support", "mental health"],
            "coping strategies": ["breathing", "mindfulness", "exercise", "routine", "relaxation", "meditation"],
            "immediate support": ["right now", "immediately", "urgent", "crisis", "emergency", "help available"],
            "hope": ["better", "improve", "change", "possible", "hope", "healing", "recovery"],
            "specific techniques": ["step", "method", "technique", "strategy", "approach", "practice"],
            "actionable steps": ["first", "then", "next", "start by", "begin with", "try this"],
            "examples": ["example", "for instance", "such as", "like", "including", "for example"],
            "structured approach": ["1.", "2.", "3.", "first", "second", "steps", "process"],
            "crisis support": ["crisis", "emergency", "immediate help", "hotline", "urgent", "safety"],
            "education": ["difference", "means", "definition", "typically", "usually", "research shows"],
            "reassurance": ["not alone", "normal", "okay", "safe", "support you", "here for you"],
            "sleep hygiene": ["sleep schedule", "bedroom", "routine", "caffeine", "screen time"],
            "relaxation techniques": ["deep breathing", "progressive muscle", "meditation", "mindfulness"],
            "breathing techniques": ["breathe", "inhale", "exhale", "breathing exercise"],
            "grounding": ["5 senses", "grounding", "present moment", "focus on", "notice"],
            "prevention": ["prevent", "avoid", "early signs", "triggers", "warning signs"],
            "citations": ["source", "study", "research", "[", "according to", "found that"],
            "current research": ["recent", "latest", "new", "current", "2023", "2024"]
        }
        
        # Count element matches
        found_elements = 0
        total_elements = len(expected_elements)
        
        for element in expected_elements:
            if element in quality_indicators:
                indicators = quality_indicators[element]
                if any(indicator in response_lower for indicator in indicators):
                    found_elements += 1
        
        element_score = found_elements / total_elements if total_elements > 0 else 0.5
        
        # Additional quality factors
        length_score = min(1.0, len(response.split()) / 50)  # Expect at least 50 words
        empathy_score = min(1.0, sum(1 for word in ["understand", "feel", "here", "support"] if word in response_lower) / 4)
        
        # RAG utilization score
        rag_score = 0.0
        total_sources = retrieval_info.get('total_sources', 0)
        avg_relevance = retrieval_info.get('avg_relevance', 0.0)
        
        if total_sources > 0:
            # Score based on number of sources used and their relevance
            source_score = min(1.0, total_sources / 5)  # Optimal: 5+ sources
            relevance_score = avg_relevance
            rag_score = (source_score * 0.4) + (relevance_score * 0.6)
        
        # Citation quality bonus
        citation_bonus = 0.0
        if "citations" in expected_elements:
            citation_count = self._count_citations(response)
            citation_bonus = min(0.2, citation_count * 0.1)  # Up to 20% bonus for citations
        
        # Combined score with RAG emphasis
        final_score = (element_score * 0.35) + (length_score * 0.15) + (empathy_score * 0.15) + (rag_score * 0.35) + citation_bonus
        
        return min(1.0, final_score)
    
    async def run_single_model_test(self):
        """Run test for the currently configured model"""
        print(f"{BOLD}🚀 SINGLE MODEL RAG TEST{RESET}")
        print(f"Testing with provider: {self.current_provider.upper()}")
        print_separator("=", 80, BOLD)
        
        # Use existing GenieAI instance
        if not self.initialize_genie():
            return None
        
        print(f"\nTesting {len(self.test_queries)} queries with {self.current_provider.upper()} + RAG...")
        
        results = []
        
        for i, query_data in enumerate(self.test_queries, 1):
            result = await self.test_single_query(query_data, i, len(self.test_queries))
            results.append(result)
            
            # Small delay between requests
            await asyncio.sleep(0.5)
        
        return results
    
    def analyze_single_results(self, results):
        """Analyze results for a single provider"""
        if not results:
            return
        
        print(f"\n{BOLD}=" * 80)
        print(f"{self.current_provider.upper()} + RAG RESULTS")
        print(f"=" * 80 + RESET)
        
        successful = [r for r in results if r["success"]]
        failed = [r for r in results if not r["success"]]
        
        if successful:
            # Performance metrics
            avg_time = sum(r["response_time"] for r in successful) / len(successful)
            avg_quality = sum(r["quality_score"] for r in successful) / len(successful)
            avg_words = sum(r["word_count"] for r in successful) / len(successful)
            avg_confidence = sum(r["confidence"] for r in successful) / len(successful)
            
            # RAG metrics
            total_sources = sum(r["rag_info"].get("total_sources", 0) for r in successful)
            avg_sources = total_sources / len(successful) if successful else 0
            avg_relevance = sum(r["rag_info"].get("avg_relevance", 0) for r in successful) / len(successful)
            
            print(f"\n{SUCCESS}{BOLD}PERFORMANCE METRICS:{RESET}")
            print(f"  {CHECK_MARK} Success Rate: {len(successful)}/{len(results)} ({len(successful)/len(results)*100:.1f}%)")
            print(f"  ⏱️ Average Response Time: {avg_time:.2f}s")
            print(f"  🎯 Average Quality Score: {avg_quality:.1%}")
            print(f"  📝 Average Response Length: {avg_words:.0f} words")
            print(f"  🤖 Average Confidence: {avg_confidence:.1%}")
            print(f"  📚 Average RAG Sources: {avg_sources:.1f} documents")
            print(f"  🔍 Average Relevance: {avg_relevance:.3f}")
            
            # Category breakdown
            categories = {}
            for test in successful:
                cat = test["category"]
                if cat not in categories:
                    categories[cat] = []
                categories[cat].append(test)
            
            print(f"\n{INFO}📊 Category Performance:{RESET}")
            for category, cat_tests in categories.items():
                cat_avg_quality = sum(t["quality_score"] for t in cat_tests) / len(cat_tests)
                cat_avg_time = sum(t["response_time"] for t in cat_tests) / len(cat_tests)
                cat_avg_sources = sum(t["rag_info"].get("total_sources", 0) for t in cat_tests) / len(cat_tests)
                print(f"    • {category}: Quality {cat_avg_quality:.1%}, Time {cat_avg_time:.2f}s, Sources {cat_avg_sources:.1f}")
            
            if failed:
                print(f"\n{ERROR}🚨 Failed Tests: {len(failed)}{RESET}")
                for test in failed:
                    print(f"    • {test['category']}: {test['error']}")
    
    def save_single_results(self, results):
        """Save results for single provider"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"single_model_test_{self.current_provider}_{timestamp}.json"
        
        # Prepare results for JSON
        results_data = {
            "timestamp": timestamp,
            "test_type": "SINGLE_MODEL_RAG_TEST", 
            "provider": self.current_provider,
            "test_info": {
                "total_queries": len(self.test_queries),
                "categories": list(set(q["category"] for q in self.test_queries)),
                "rag_enabled": True,
                "uses_existing_system": True
            },
            "results": results,
            "summary": self._generate_single_summary(results)
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n{SUCCESS}📄 Results saved to: {filename}{RESET}")
        return filename
    
    def _generate_single_summary(self, results):
        """Generate summary statistics for single provider"""
        successful = [r for r in results if r["success"]]
        if not successful:
            return {}
        
        return {
            "total_tests": len(results),
            "successful_tests": len(successful),
            "success_rate": len(successful) / len(results),
            "avg_response_time": sum(r["response_time"] for r in successful) / len(successful),
            "avg_quality_score": sum(r["quality_score"] for r in successful) / len(successful),
            "avg_word_count": sum(r["word_count"] for r in successful) / len(successful),
            "avg_confidence": sum(r["confidence"] for r in successful) / len(successful),
            "avg_rag_sources": sum(r["rag_info"].get("total_sources", 0) for r in successful) / len(successful),
            "avg_relevance": sum(r["rag_info"].get("avg_relevance", 0) for r in successful) / len(successful)
        }

def compare_results(file1, file2):
    """Compare results from two different model runs"""
    try:
        with open(file1, 'r', encoding='utf-8') as f:
            data1 = json.load(f)
        with open(file2, 'r', encoding='utf-8') as f:
            data2 = json.load(f)
        
        provider1 = data1['provider']
        provider2 = data2['provider']
        summary1 = data1['summary']
        summary2 = data2['summary']
        
        print(f"\n{BOLD}📊 MODEL COMPARISON{RESET}")
        print_separator("=", 80)
        
        print(f"{'Metric':<20} {provider1.upper():<20} {provider2.upper():<20} {'Winner':<15}")
        print("-" * 75)
        
        # Compare each metric
        comparisons = []
        for metric, label in [
            ("avg_quality_score", "Quality Score"),
            ("avg_response_time", "Response Time"), 
            ("avg_word_count", "Avg Words"),
            ("avg_confidence", "Confidence"),
            ("avg_rag_sources", "RAG Sources"),
            ("avg_relevance", "Relevance")
        ]:
            val1 = summary1.get(metric, 0)
            val2 = summary2.get(metric, 0)
            
            if metric == "avg_response_time":  # Lower is better for time
                winner = provider1 if val1 < val2 else provider2
                display1 = f"{val1:.2f}s"
                display2 = f"{val2:.2f}s"
            elif metric in ["avg_quality_score", "avg_confidence", "avg_relevance"]:  # Percentage display
                winner = provider1 if val1 > val2 else provider2
                display1 = f"{val1:.1%}"
                display2 = f"{val2:.1%}"
            else:  # Regular numbers
                winner = provider1 if val1 > val2 else provider2
                display1 = f"{val1:.1f}"
                display2 = f"{val2:.1f}"
            
            print(f"{label:<20} {display1:<20} {display2:<20} {winner:<15}")
            comparisons.append((metric, winner, val1, val2))
        
        # Overall winner
        wins1 = sum(1 for _, winner, _, _ in comparisons if winner == provider1)
        wins2 = len(comparisons) - wins1
        
        print(f"\n{SUCCESS}🏆 OVERALL RESULTS:{RESET}")
        print(f"  • {provider1.upper()} wins: {wins1} categories")
        print(f"  • {provider2.upper()} wins: {wins2} categories")
        
        # Save comparison
        comparison_data = {
            "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "file1": file1,
            "file2": file2,
            "provider1": provider1,
            "provider2": provider2,
            "comparison": {
                f"{provider1}_wins": wins1,
                f"{provider2}_wins": wins2,
                "metrics": {
                    metric: {
                        "provider1_value": val1,
                        "provider2_value": val2,
                        "winner": winner
                    }
                    for metric, winner, val1, val2 in comparisons
                }
            }
        }
        
        comparison_file = f"model_comparison_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(comparison_file, 'w', encoding='utf-8') as f:
            json.dump(comparison_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n{SUCCESS}📄 Comparison saved to: {comparison_file}{RESET}")
        
    except Exception as e:
        print(f"{ERROR}Error comparing results: {e}{RESET}")

def check_environment():
    """Check environment setup for both GROQ and local model testing"""
    print(f"\n{INFO}Checking environment for RAG testing...{RESET}")
    
    issues = []
    
    # Get current provider
    current_provider = os.getenv("LLM_PROVIDER", "groq").lower()
    
    # Check model-specific requirements
    if current_provider == "groq":
        if not os.getenv("GROQ_API_KEY"):
            issues.append("GROQ_API_KEY not found in environment")
        else:
            print(f"{SUCCESS}{CHECK_MARK} GROQ_API_KEY found{RESET}")
            print(f"{INFO}Using GROQ model: {os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')}{RESET}")
    else:
        # Check local model
        local_model_path = os.getenv("LOCAL_MODEL_PATH", "./model/llama1b-qlora-mh")
        if not os.path.exists(local_model_path):
            issues.append(f"Local model not found at {local_model_path}")
        else:
            print(f"{SUCCESS}{CHECK_MARK} Local model found at {local_model_path}{RESET}")
    
    # Check if GenieAI is already initialized
    try:
        from main import genie
        if genie is not None:
            print(f"{SUCCESS}{CHECK_MARK} GenieAI already initialized{RESET}")
            system_info = genie.get_system_info()
            print(f"{INFO}Current configuration:{RESET}")
            print(f"  • Provider: {current_provider.upper()}")
            print(f"  • Vector store: {system_info.get('vector_store_docs', 0):,} documents")
            print(f"  • BM25 index: {system_info.get('bm25_docs', 0):,} documents")
            print(f"  • Graph store: {system_info.get('graph_nodes', 0):,} nodes")
        else:
            issues.append("GenieAI not initialized - please run main system first")
    except ImportError as e:
        issues.append(f"GenieAI system not available: {e}")
    
    if issues:
        print(f"\n{WARNING}Issues found:{RESET}")
        for issue in issues:
            print(f"{ERROR}  {CROSS_MARK} {issue}{RESET}")
        print(f"\n{INFO}To resolve:{RESET}")
        print("1. Make sure environment variables are set in .env file")
        print("2. For GROQ: Set GROQ_API_KEY and LLM_PROVIDER=groq")
        print("3. For local model: Set LOCAL_MODEL_PATH and LLM_PROVIDER=local")
        print("4. Initialize the main system before running tests")
        return False
    
    print(f"\n{SUCCESS}{CHECK_MARK} Environment ready for RAG testing with {current_provider.upper()}!{RESET}")
    return True

async def interactive_test():
    """Interactive testing mode using existing system"""
    print(f"\n{BOLD}💬 INTERACTIVE SINGLE MODEL TEST{RESET}")
    
    # Use existing genie instance
    try:
        from main import genie
        if genie is None:
            print(f"{ERROR}GenieAI not initialized. Please run the main system first.{RESET}")
            return
    except ImportError:
        print(f"{ERROR}Could not import GenieAI system{RESET}")
        return
    
    current_provider = os.getenv("LLM_PROVIDER", "groq").lower()
    print(f"\n{CHECK_MARK} Using {current_provider.upper()} + RAG")
    system_info = genie.get_system_info()
    print(f"Knowledge base: {system_info.get('vector_store_docs', 0):,} documents")
    
    while True:
        query = input(f"\nEnter your query (or 'exit' to quit): ").strip()
        
        if query.lower() == 'exit':
            break
        elif query:
            print(f"\n🤖 {current_provider.upper()} + RAG Response:")
            print_separator("-", 50)
            
            start_time = time.time()
            try:
                response_data = await genie.process_query(query)
                end_time = time.time()
                
                response_text = response_data.get('response', '')
                confidence = response_data.get('confidence', 0.0)
                retrieval_info = response_data.get('retrieval_info', {})
                
                print(response_text)
                print_separator("-", 50)
                print(f"Response time: {end_time - start_time:.2f}s")
                print(f"Confidence: {confidence:.1%}")
                print(f"RAG sources: {retrieval_info.get('total_sources', 0)} documents")
                print(f"Avg relevance: {retrieval_info.get('avg_relevance', 0.0):.3f}")
                
            except Exception as e:
                print(f"{ERROR}Error: {e}{RESET}")

async def main():
    """Main testing function"""
    print(f"{BOLD}🧠 Single Model RAG Tester{RESET}")
    print("=" * 70)
    print(f"{INFO}Tests ONE model at a time using your existing GenieAI RAG system{RESET}")
    print(f"{WARNING}Current provider: {os.getenv('LLM_PROVIDER', 'groq').upper()}{RESET}")
    
    if not check_environment():
        return
    
    print(f"\n{INFO}Select test mode:{RESET}")
    print("1. Run single model test (current provider)")
    print("2. Interactive test (current provider)")
    print("3. Compare two existing result files")
    print("4. Exit")
    
    choice = input(f"\n{INFO}Enter choice (1-4):{RESET} ").strip()
    
    try:
        if choice == "1":
            print(f"\n{BOLD}🚀 SINGLE MODEL TEST{RESET}")
            tester = SingleModelTester()
            results = await tester.run_single_model_test()
            if results:
                tester.analyze_single_results(results)
                result_file = tester.save_single_results(results)
                
                print(f"\n{INFO}Next steps:{RESET}")
                print(f"1. Change LLM_PROVIDER in your environment")
                print(f"2. Restart the main system with the new provider")
                print(f"3. Run this test again")
                print(f"4. Use option 3 to compare the two result files")
            
        elif choice == "2":
            await interactive_test()
            
        elif choice == "3":
            print(f"\n{BOLD}📊 COMPARE RESULTS{RESET}")
            print("Enter the paths to two result files:")
            file1 = input("First file: ").strip()
            file2 = input("Second file: ").strip()
            
            if os.path.exists(file1) and os.path.exists(file2):
                compare_results(file1, file2)
            else:
                print(f"{ERROR}One or both files not found{RESET}")
            
        elif choice == "4":
            print(f"{INFO}Goodbye!{RESET}")
        else:
            print(f"{ERROR}Invalid choice{RESET}")
            
    except KeyboardInterrupt:
        print(f"\n{WARNING}Test interrupted by user{RESET}")
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())