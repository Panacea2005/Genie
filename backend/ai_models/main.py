# main.py
"""
Main entry point for Genie AI Companion System

This module initializes the complete agentic RAG system and provides
both CLI and API interfaces for interacting with your AI companion.
"""

import asyncio
import logging
from pathlib import Path
import sys
from typing import Dict, Any, Optional, List
import argparse
import json
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from config.settings import config
from core.llm_manager import LLMManager
from core.embeddings import EmbeddingManager
from agents.orchestrator import OrchestratorAgent
from data_processing.adapter import DataLoader, DataIndexer
from retrieval.vector_store import VectorStore
from retrieval.bm25_search import BM25Search
from retrieval.graph_store import GraphStore
from retrieval.web_search import WebSearch

# Setup logging
def setup_logging(log_level: str = None):
    """Configure logging for the application"""
    level = getattr(logging, log_level or config.system.log_level)
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Create timestamped log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"genie_ai_{timestamp}.log"
    
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Set specific loggers to WARNING to reduce noise
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)

logger = setup_logging()

class GenieAI:
    """Main Genie AI application class"""
    
    def __init__(self, skip_data_loading: bool = True):
        """
        Initialize Genie AI system
        
        Args:
            skip_data_loading: If True, load existing indexes. If False, rebuild from scratch.
        """
        logger.info("="*60)
        logger.info(" Initializing Genie AI Companion System ")
        logger.info("="*60)
        
        try:
            # Initialize managers
            logger.info("Initializing LLM and Embedding managers...")
            self.llm_manager = LLMManager(config)
            self.embedding_manager = EmbeddingManager(config)
            
            # Initialize retrieval components
            logger.info("Initializing retrieval components...")
            self.vector_store = VectorStore(self.embedding_manager)
            self.bm25_search = BM25Search()
            self.graph_store = GraphStore()
            self.web_search = WebSearch() if config.agent.enable_web_search else None
            
            # Initialize orchestrator
            logger.info("Initializing agent orchestrator...")
            self.orchestrator = OrchestratorAgent(
                self.llm_manager,
                self.embedding_manager,
                config
            )
            
            # Set retrieval components in orchestrator
            self.orchestrator.retrieval_agent.set_vector_store(self.vector_store)
            self.orchestrator.retrieval_agent.set_bm25_search(self.bm25_search)
            self.orchestrator.retrieval_agent.set_graph_store(self.graph_store)
            if self.web_search:
                self.orchestrator.retrieval_agent.set_web_search(self.web_search)
            
            # Handle data loading based on flag
            if skip_data_loading:
                logger.info("Loading existing indexes...")
                self._load_existing_indexes()
            else:
                logger.info("Building indexes from scratch...")
                self._build_indexes_from_scratch()
            
            logger.info("Genie AI initialized successfully!")
            logger.info("="*60)
            
        except Exception as e:
            logger.error(f"Failed to initialize Genie AI: {e}", exc_info=True)
            raise
    
    def _get_index_paths(self) -> Dict[str, Path]:
        """Get standardized index paths"""
        return {
            "vector_faiss": Path(config.data.vector_store_path) / "mental_health_index.faiss",
            "vector_pkl": Path(config.data.vector_store_path) / "mental_health_index.pkl",
            "bm25": Path(config.data.ai_models_dir) / "indexes" / "bm25_index.pkl",
            "graph": Path(config.data.graph_store_path) / "knowledge_graph.pkl"
        }
    
    def _check_indexes_exist(self) -> bool:
        """Check if all required indexes exist"""
        paths = self._get_index_paths()
        required_files = [paths["vector_faiss"], paths["vector_pkl"], paths["bm25"]]
        return all(path.exists() for path in required_files)
    
    def _load_existing_indexes(self):
        """Load existing indexes"""
        paths = self._get_index_paths()
        
        if not self._check_indexes_exist():
            logger.warning("Some indexes are missing. Building from scratch...")
            self._build_indexes_from_scratch()
            return
        
        try:
            # Load vector store
            vector_base_path = str(paths["vector_faiss"].parent / "mental_health_index")
            self.vector_store.load_index(vector_base_path)
            logger.info(f"Loaded knowledge base with {len(self.vector_store.documents):,} documents")
            
            # Load BM25 index
            try:
                self.bm25_search.load(str(paths["bm25"]))
                bm25_count = len(self.bm25_search.documents) if hasattr(self.bm25_search, 'documents') else 0
                logger.info(f"Loaded BM25 index with {bm25_count:,} documents")
            except Exception as e:
                logger.error(f"Failed to load BM25 index: {e}")
                logger.info("BM25 search will be unavailable")
            
            # Load graph store if it exists
            try:
                if paths["graph"].exists():
                    # Use just the base path without extension for graph store
                    graph_base_path = str(paths["graph"]).replace('.pkl', '')
                    self.graph_store.load(graph_base_path)
                    graph_count = len(self.graph_store.graph.nodes()) if hasattr(self.graph_store, 'graph') else 0
                    logger.info(f"Loaded knowledge graph with {graph_count:,} nodes")
                else:
                    logger.info("Knowledge graph file not found - graph search will be unavailable")
            except Exception as e:
                logger.error(f"Failed to load knowledge graph: {e}")
                logger.info("Knowledge graph search will be unavailable")
            
        except Exception as e:
            logger.error(f"Error loading indexes: {e}")
            logger.info("Attempting to rebuild indexes...")
            self._build_indexes_from_scratch()
    
    def _build_indexes_from_scratch(self):
        """Build all indexes from training data"""
        try:
            # Clear any existing partial indexes
            logger.info("Clearing existing indexes...")
            paths = self._get_index_paths()
            for path in paths.values():
                if path.exists():
                    logger.info(f"Removing {path}")
                    path.unlink()
            
            # Load data
            logger.info("Loading training data...")
            data_loader = DataLoader(config)
            documents = data_loader.load_all_data()
            
            if not documents:
                logger.warning("No training data found! System will work with limited functionality.")
                logger.warning("Please ensure training data is available in:")
                logger.warning(f"  - {config.data.training_dir}")
                logger.warning(f"  - {config.data.data_dir}")
                return
            
            logger.info(f"Loaded {len(documents)} documents")
            
            # Build indexes
            logger.info("Building search indexes...")
            indexer = DataIndexer(config)
            indexer.vector_store = self.vector_store
            indexer.bm25_search = self.bm25_search
            indexer.graph_store = self.graph_store
            indexer.build_all_indexes(documents)
            
            logger.info("Indexes built successfully")
            
            # IMPORTANT: Reload the indexes after building
            logger.info("Loading newly built indexes...")
            self._load_existing_indexes()
            
        except Exception as e:
            logger.error(f"Error building indexes: {e}", exc_info=True)
            logger.warning("System will operate with limited retrieval capabilities")
            logger.warning("You may need to check:")
            logger.warning("  1. Training data is available")
            logger.warning("  2. Embedding model is working")
            logger.warning("  3. Sufficient disk space")
    
    async def process_query(self, 
                           query: str, 
                           session_id: str = "default",
                           context: Optional[Dict[str, Any]] = None,
                           model_preference: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a query (alias for chat method to match test files)
        
        Args:
            query: User's input query
            session_id: Session identifier for conversation tracking
            context: Additional context (user preferences, etc.)
            model_preference: Preferred model ("groq" or "local")
            
        Returns:
            Response dictionary with answer, confidence, sources, etc.
        """
        return await self.chat(query, session_id, context, model_preference)
    
    async def chat(self, 
                   query: str, 
                   session_id: str = "default",
                   context: Optional[Dict[str, Any]] = None,
                   model_preference: Optional[str] = None,
                   conversation_history: Optional[list] = None) -> Dict[str, Any]:
        """
        Process a chat query
        
        Args:
            query: User's input query
            session_id: Session identifier for conversation tracking
            context: Additional context (user preferences, etc.)
            model_preference: Preferred model ("groq" or "local")
            
        Returns:
            Response dictionary with answer, confidence, sources, etc.
        """
        try:
            # Validate query
            if not query or not query.strip():
                return {
                    "response": "I notice you haven't entered a question. How can I help you today?",
                    "confidence": 1.0,
                    "error": None
                }
            
            logger.info(f"Processing query for session {session_id} with model: {model_preference}: {query[:100]}...")
            
            # Add model preference to context
            if context is None:
                context = {}
            if model_preference:
                context['model_preference'] = model_preference
            
            response = await self.orchestrator.process(
                query=query,
                session_id=session_id,
                context=context,
                conversation_history=conversation_history
            )
            
            if response.success:
                logger.info(f"Query processed successfully. Confidence: {response.data.get('confidence', 0):.2f}")
                return response.data
            else:
                logger.error(f"Query processing failed: {response.error}")
                return {
                    "response": "I apologize, but I encountered an error processing your request. Please try rephrasing your question.",
                    "confidence": 0.0,
                    "error": response.error
                }
                
        except Exception as e:
            logger.error(f"Unexpected error processing query: {e}", exc_info=True)
            return {
                "response": "I apologize, but I encountered an unexpected error. Please try again.",
                "confidence": 0.0,
                "error": str(e)
            }
    
    def get_session_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return self.orchestrator.get_session_history(session_id)
    
    def clear_session(self, session_id: str):
        """Clear conversation history for a session"""
        self.orchestrator.clear_session(session_id)
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information and statistics"""
        # Check index status
        index_status = "ready" if self._check_indexes_exist() else "missing"
        
        # Get actual counts from loaded components
        vector_docs = len(self.vector_store.documents) if self.vector_store.documents else 0
        bm25_docs = len(self.bm25_search.documents) if hasattr(self.bm25_search, 'documents') and self.bm25_search.documents else 0
        graph_nodes = len(self.graph_store.graph.nodes()) if hasattr(self.graph_store, 'graph') else 0
        
        return {
            "version": "1.0.0",
            "llm_model": config.model.llm_model,
            "embedding_model": config.model.embedding_model,
            "vector_store_docs": vector_docs,
            "bm25_docs": bm25_docs,
            "graph_nodes": graph_nodes,
            "index_status": index_status,
            "features": {
                "web_search": config.agent.enable_web_search,
                "cove": config.agent.enable_cove,
                "fact_checking": config.agent.enable_fact_checking
            },
            "agent_metrics": {
                agent_name: agent.get_metrics() 
                for agent_name, agent in [
                    ("orchestrator", self.orchestrator),
                    ("query", self.orchestrator.query_agent),
                    ("retrieval", self.orchestrator.retrieval_agent),
                    ("verifier", self.orchestrator.verifier_agent),
                    ("synthesis", self.orchestrator.synthesis_agent)
                ]
            }
        }
    
    def run_cli(self):
        """Run interactive command-line interface"""
        print("\n" + "="*60)
        print(" GENIE AI - Your Friendly Companion ")
        print("="*60)
        print("\nHello! I'm Genie, your AI companion and friend. I'm here for all of life's moments!")
        print("Whether you're celebrating, need support, want to chat, or have questions - I'm here!")
        print("\nCommands:")
        print("  'exit' or 'quit' - End the conversation")
        print("  'clear' - Start a new conversation")
        print("  'history' - View conversation history")
        print("  'info' - Show system information")
        print("  'help' - Show this help message")
        print("\n" + "-"*60 + "\n")
        
        session_id = f"cli_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        while True:
            try:
                # Get user input
                user_input = input("\nYou: ").strip()
                
                # Handle commands
                if user_input.lower() in ['exit', 'quit']:
                    print("\nGenie: Take care! I'm always here when you want to chat. 💙")
                    break
                
                elif user_input.lower() == 'clear':
                    self.clear_session(session_id)
                    session_id = f"cli_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    print("\nGenie: I've started a fresh conversation. What's on your mind?")
                    continue
                
                elif user_input.lower() == 'history':
                    history = self.get_session_history(session_id)
                    print("\n--- Conversation History ---")
                    for msg in history:
                        print(f"{msg['role'].upper()}: {msg['content'][:100]}...")
                    print("--- End of History ---")
                    continue
                
                elif user_input.lower() == 'info':
                    info = self.get_system_info()
                    print("\n--- System Information ---")
                    print(json.dumps(info, indent=2))
                    print("--- End of Information ---")
                    continue
                
                elif user_input.lower() == 'help':
                    print("\nCommands:")
                    print("  'exit' or 'quit' - End the conversation")
                    print("  'clear' - Start a new conversation")
                    print("  'history' - View conversation history")
                    print("  'info' - Show system information")
                    print("  'help' - Show this help message")
                    continue
                
                # Process normal query
                if user_input:
                    # Show thinking indicator
                    print("\nGenie: ", end='', flush=True)
                    
                    # Get response
                    response = asyncio.run(self.chat(user_input, session_id))
                    
                    # Clear thinking indicator and show response
                    print(response['response'])
                    
                    # Show confidence if low
                    confidence = response.get('confidence', 1.0)
                    if confidence < 0.7:
                        print(f"\n[Confidence: {confidence:.1%}]")
                    
                    # Show sources if available
                    sources = response.get('sources', [])
                    if sources and len(sources) > 0:
                        print("\nSources:")
                        for i, source in enumerate(sources[:3], 1):
                            print(f"  [{i}] {source.get('metadata', {}).get('source', 'Unknown source')}")
                
            except KeyboardInterrupt:
                print("\n\nGenie: Take care! I'm always here when you want to chat. 💙")
                break
            except Exception as e:
                logger.error(f"CLI error: {e}", exc_info=True)
                print(f"\nGenie: I apologize, but I encountered an error. Please try again.")

def main():
    """Main entry point with argument parsing"""
    parser = argparse.ArgumentParser(
        description="Genie AI - Your Friendly Companion",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                    # Run interactive CLI
  python main.py --api              # Run as API server
  python main.py --test "query"     # Test with a single query
  python main.py --rebuild-index    # Rebuild search indexes
        """
    )
    
    parser.add_argument(
        "--api",
        action="store_true",
        help="Run as API server instead of CLI"
    )
    
    parser.add_argument(
        "--test",
        type=str,
        metavar="QUERY",
        help="Test with a single query and exit"
    )
    
    parser.add_argument(
        "--rebuild-index",
        action="store_true",
        help="Force rebuild of search indexes"
    )
    
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default=None,
        help="Set logging level"
    )
    
    parser.add_argument(
        "--skip-data",
        action="store_true",
        help="Skip data loading (use existing indexes)"
    )
    
    args = parser.parse_args()
    
    # Setup logging with specified level
    if args.log_level:
        logger = setup_logging(args.log_level)
    
    try:
        # Handle index rebuilding
        if args.rebuild_index:
            print("Rebuilding search indexes...")
            genie = GenieAI(skip_data_loading=False)
            print("Indexes rebuilt successfully!")
            return
        
        # Initialize Genie AI
        # Default to loading existing indexes unless rebuilding
        skip_loading = args.skip_data if args.skip_data else True
        genie = GenieAI(skip_data_loading=skip_loading)
        
        # Handle test mode
        if args.test:
            print(f"\nTesting with query: {args.test}")
            response = asyncio.run(genie.chat(args.test))
            print(f"\nResponse: {response['response']}")
            print(f"Confidence: {response.get('confidence', 0):.2%}")
            return
        
        # Handle API mode
        if args.api:
            print("\nStarting Genie AI API server...")
            print("API mode not yet implemented. Please use CLI mode for now.")
            # TODO: Implement FastAPI server
            return
        
        # Default: Run CLI interface
        genie.run_cli()
        
    except KeyboardInterrupt:
        print("\n\nShutting down gracefully...")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        print(f"\nError: {e}")
        print("Please check the logs for more details.")
        sys.exit(1)

# Create global genie instance for test files (like other test files expect)
# Initialize with existing indexes by default
genie = None

def initialize_genie(skip_data_loading: bool = True):
    """Initialize global Genie instance"""
    global genie
    if genie is None:
        logger.info("Initializing new GenieAI instance...")
        genie = GenieAI(skip_data_loading=skip_data_loading)
    return genie

# Add auto-initialization for testing scenarios
if __name__ == "__main__":
    main()
else:
    # Auto-initialize for imports (useful for testing)
    try:
        if 'genie' not in globals() or genie is None:
            genie = initialize_genie(skip_data_loading=True)
    except Exception as e:
        logger.warning(f"Auto-initialization failed: {e}")
        genie = None