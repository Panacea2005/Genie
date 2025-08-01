# main.py
"""
Main entry point for Genie AI Companion System

This module initializes the complete agentic RAG system and provides
both CLI and API interfaces for interacting with your AI companion.
"""

import asyncio
import logging
import multiprocessing
from pathlib import Path
import sys
from typing import Dict, Any, Optional, List
import argparse
import json
from datetime import datetime

# Windows multiprocessing support
if __name__ == '__main__':
    multiprocessing.freeze_support()

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
            skip_data_loading: DEPRECATED - System now automatically detects existing indexes.
                             Always uses smart index checking to prevent unnecessary rebuilds.
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
            
            # ALWAYS use smart index checking instead of the skip_data_loading flag
            # This prevents unnecessary rebuilds and uses existing indexes intelligently
            if self._check_indexes_exist():
                logger.info("🔍 Found existing indexes - loading what's available...")
                self._load_existing_indexes()
            else:
                logger.info("🔨 No indexes found - building from scratch...")
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
        """Check if any indexes exist - don't require ALL to exist"""
        paths = self._get_index_paths()
        
        # Check which indexes exist
        vector_exists = paths["vector_faiss"].exists() and paths["vector_pkl"].exists()
        bm25_exists = paths["bm25"].exists()
        graph_exists = paths["graph"].exists()
        
        logger.info(f"Index status check:")
        logger.info(f"  Vector store: {'✅' if vector_exists else '❌'}")
        logger.info(f"  BM25 index: {'✅' if bm25_exists else '❌'}")
        logger.info(f"  Knowledge graph: {'✅' if graph_exists else '❌'}")
        
        # Return True if ANY index exists (we can load partial indexes)
        any_exist = vector_exists or bm25_exists or graph_exists
        
        if any_exist:
            logger.info("Found existing indexes - will load what's available")
        else:
            logger.info("No indexes found - will build from scratch")
            
        return any_exist
    
    def _load_existing_indexes(self):
        """Load existing indexes - handle partial index availability gracefully"""
        paths = self._get_index_paths()
        
        # Check which indexes exist
        vector_exists = paths["vector_faiss"].exists() and paths["vector_pkl"].exists()
        bm25_exists = paths["bm25"].exists()
        graph_exists = paths["graph"].exists()
        
        any_loaded = False
        
        # Load vector store if available
        if vector_exists:
            try:
                vector_base_path = str(paths["vector_faiss"].parent / "mental_health_index")
                self.vector_store.load_index(vector_base_path)
                logger.info(f"✅ Loaded vector store with {len(self.vector_store.documents):,} documents")
                any_loaded = True
            except Exception as e:
                logger.error(f"❌ Failed to load vector store: {e}")
                # Don't rebuild everything, just mark as unavailable
                logger.info("Vector search will be unavailable until rebuilt")
        else:
            logger.info("🔄 Vector store not found - will need to build")

        # Load BM25 index if available
        if bm25_exists:
            try:
                self.bm25_search.load(str(paths["bm25"]))
                bm25_count = len(self.bm25_search.documents) if hasattr(self.bm25_search, 'documents') else 0
                logger.info(f"✅ Loaded BM25 index with {bm25_count:,} documents")
                any_loaded = True
            except Exception as e:
                logger.error(f"❌ Failed to load BM25 index: {e}")
                logger.info("BM25 search will be unavailable until rebuilt")
        else:
            logger.info("🔄 BM25 index not found - will need to build")

        # Load graph store if available
        if graph_exists:
            try:
                graph_base_path = str(paths["graph"]).replace('.pkl', '')
                self.graph_store.load(graph_base_path)
                graph_count = len(self.graph_store.graph.nodes()) if hasattr(self.graph_store, 'graph') else 0
                logger.info(f"✅ Loaded knowledge graph with {graph_count:,} nodes")
                any_loaded = True
            except Exception as e:
                logger.error(f"❌ Failed to load knowledge graph: {e}")
                logger.info("Knowledge graph search will be unavailable until rebuilt")
        else:
            logger.info("🔄 Knowledge graph not found - will need to build")

        # Only rebuild missing indexes, not everything
        missing_indexes = []
        if not vector_exists:
            missing_indexes.append("vector store")
        if not bm25_exists:
            missing_indexes.append("BM25")
        if not graph_exists:
            missing_indexes.append("knowledge graph")
        
        if missing_indexes:
            logger.info(f"🔧 Need to build missing indexes: {', '.join(missing_indexes)}")
            self._build_missing_indexes(missing_indexes)
        elif any_loaded:
            logger.info("🎉 All available indexes loaded successfully!")
        else:
            logger.warning("⚠️ No indexes could be loaded - building from scratch")
            self._build_indexes_from_scratch()
    
    def _build_missing_indexes(self, missing_indexes: List[str]):
        """Build only the missing indexes instead of rebuilding everything"""
        try:
            logger.info(f"🔧 Building missing indexes: {', '.join(missing_indexes)}")
            
            # Load data only if we need to build indexes
            logger.info("📚 Loading training data for missing indexes...")
            data_loader = DataLoader(config)
            documents = data_loader.load_all_data()
            
            if not documents:
                logger.warning("No training data found! Cannot build missing indexes.")
                return
            
            logger.info(f"📊 Loaded {len(documents)} documents for index building")
            
            # Build only the missing indexes using the optimized indexer
            indexer = DataIndexer(config)
            
            # Set the components based on what's missing
            if "vector store" in missing_indexes:
                indexer.vector_store = self.vector_store
            if "BM25" in missing_indexes:
                indexer.bm25_search = self.bm25_search  
            if "knowledge graph" in missing_indexes:
                indexer.graph_store = self.graph_store
            
            # Use the smart indexer that can build specific indexes
            indexer.build_specific_indexes(documents, missing_indexes)
            
            logger.info("✅ Missing indexes built successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error building missing indexes: {e}")
            logger.warning("Falling back to full rebuild...")
            self._build_indexes_from_scratch()
    
    def _build_indexes_from_scratch(self):
        """Build all indexes from training data - only when truly needed"""
        try:
            logger.info("🔨 Building ALL indexes from scratch...")
            
            # Only clear indexes if we're doing a complete rebuild
            logger.info("🧹 Clearing existing partial indexes...")
            paths = self._get_index_paths()
            for path_name, path in paths.items():
                if path.exists():
                    logger.info(f"  Removing {path}")
                    path.unlink()
            
            # Load data
            logger.info("📚 Loading training data...")
            data_loader = DataLoader(config)
            documents = data_loader.load_all_data()
            
            if not documents:
                logger.warning("No training data found! System will work with limited functionality.")
                logger.warning("Please ensure training data is available in:")
                logger.warning(f"  - {config.data.training_dir}")
                logger.warning(f"  - {config.data.data_dir}")
                return
            
            logger.info(f"📊 Loaded {len(documents)} documents")
            
            # Build indexes using the optimized indexer
            logger.info("🏗️ Building search indexes with full parallelization...")
            indexer = DataIndexer(config)
            indexer.vector_store = self.vector_store
            indexer.bm25_search = self.bm25_search
            indexer.graph_store = self.graph_store
            indexer.build_all_indexes(documents)
            
            logger.info("✅ All indexes built successfully")
            
            # IMPORTANT: Reload the indexes after building
            logger.info("🔄 Loading newly built indexes...")
            self._load_existing_indexes()
            
        except Exception as e:
            logger.error(f"❌ Error building indexes: {e}", exc_info=True)
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
                        for i, source in enumerate(sources, 1):  # Remove limit to show all sources
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