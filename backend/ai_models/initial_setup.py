# initial_setup.py
"""
One-time initial setup script for Genie AI
This processes all data and creates indexes - only run once!
"""

import asyncio
import os
import sys
from pathlib import Path
from main import GenieAI
import time
from datetime import datetime

# Add color support
try:
    from colorama import init, Fore, Style
    init()
    SUCCESS = Fore.GREEN
    ERROR = Fore.RED
    WARNING = Fore.YELLOW
    INFO = Fore.CYAN
    RESET = Style.RESET_ALL
except:
    SUCCESS = ERROR = WARNING = INFO = RESET = ""

def check_environment():
    """Check if environment is properly set up"""
    print(f"\n{INFO}Checking environment...{RESET}")
    
    # Check for GROQ API key
    if not os.getenv("GROQ_API_KEY"):
        print(f"{ERROR}✗ GROQ_API_KEY not found in environment!{RESET}")
        print(f"{INFO}Please create a .env file with:{RESET}")
        print(f"  GROQ_API_KEY=your_api_key_here")
        return False
    else:
        print(f"{SUCCESS}✓ GROQ_API_KEY found{RESET}")
    
    # Check for required packages
    required_packages = [
        "faiss-cpu",  # or faiss-gpu if you have GPU
        "sentence-transformers",
        "rank-bm25",
        "networkx",
        "groq"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            # Special handling for faiss-cpu which imports as 'faiss'
            if package == "faiss-cpu":
                __import__("faiss")
            else:
                __import__(package.replace("-", "_"))
            print(f"{SUCCESS}✓ {package} installed{RESET}")
        except ImportError:
            missing_packages.append(package)
            print(f"{ERROR}✗ {package} not installed{RESET}")
    
    if missing_packages:
        print(f"\n{ERROR}Missing packages! Install with:{RESET}")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def estimate_processing_time(num_documents: int = 510656) -> dict:
    """Estimate processing time based on batch settings and CPU optimization"""
    from config.settings import config
    import multiprocessing
    
    # Get processing settings
    batch_size = config.system.batch_size
    workers = config.system.max_workers
    cpu_count = multiprocessing.cpu_count()
    
    # More accurate estimates based on optimizations
    # With multiprocessing, we can achieve much better throughput
    if workers >= cpu_count * 0.8:  # Using most cores
        # Optimized parallel processing rate
        docs_per_second_estimate = batch_size * workers / 6  # Improved from /10
        speedup_factor = min(workers * 0.7, cpu_count * 0.6)  # Account for parallel efficiency
    else:
        # Conservative estimate for limited workers
        docs_per_second_estimate = batch_size * workers / 10
        speedup_factor = workers * 0.5
    
    total_seconds = num_documents / docs_per_second_estimate
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    
    return {
        "documents": num_documents,
        "batch_size": batch_size,
        "workers": workers,
        "cpu_count": cpu_count,
        "speedup_factor": f"{speedup_factor:.1f}x",
        "estimated_time": f"{hours}h {minutes}m",
        "docs_per_second": f"{docs_per_second_estimate:.1f}",
        "optimization_status": "OPTIMIZED" if workers >= cpu_count * 0.8 else "STANDARD"
    }

async def run_initial_setup():
    """Run the initial data setup"""
    print(f"{INFO}{'='*60}{RESET}")
    print(f"{INFO} GENIE AI - ONE-TIME INITIAL DATA SETUP {RESET}")
    print(f"{INFO}{'='*60}{RESET}")
    
    # Check environment first
    if not check_environment():
        print(f"\n{ERROR}Please fix the environment issues above and try again.{RESET}")
        return
    
    # Show processing estimates
    print(f"\n{INFO}🚀 OPTIMIZED PROCESSING CONFIGURATION:{RESET}")
    from config.settings import config
    proc_info = config.get_processing_info()
    for key, value in proc_info.items():
        if isinstance(value, (int, float)) and value > 1000:
            print(f"  {key}: {value:,}")
        else:
            print(f"  {key}: {value}")
    
    # Estimate time with new optimization info
    estimate = estimate_processing_time()
    print(f"\n{SUCCESS}⚡ PERFORMANCE ESTIMATE:{RESET}")
    print(f"  CPU cores: {estimate['cpu_count']} (using {estimate['workers']} workers)")
    print(f"  Expected speedup: {estimate['speedup_factor']}")
    print(f"  Processing rate: {estimate['docs_per_second']} docs/sec")
    print(f"  Estimated time: {estimate['estimated_time']}")
    print(f"  Optimization: {estimate['optimization_status']}")
    if estimate['optimization_status'] == 'OPTIMIZED':
        print(f"  {SUCCESS}✅ MAXIMUM CPU UTILIZATION ENABLED!{RESET}")
    else:
        print(f"  {WARNING}⚠️  Consider running optimize_cpu.py first for better performance{RESET}")
    print(f"{INFO}(Actual time depends on your hardware and system load){RESET}")
    
    # Final confirmation
    print(f"\n{WARNING}⚠️  This process will:{RESET}")
    print(f"  1. Load all training data files")
    print(f"  2. Process and clean the text")
    print(f"  3. Generate embeddings for all documents")
    print(f"  4. Build FAISS vector index")
    print(f"  5. Build BM25 keyword index")
    print(f"  6. Build knowledge graph (if enabled)")
    print(f"  7. Save all indexes to disk")
    
    print(f"\n{INFO}Ready to start? (y/n):{RESET}", end=" ")
    
    if input().lower() != 'y':
        print(f"{INFO}Setup cancelled.{RESET}")
        return
    
    try:
        # Start processing
        print(f"\n{INFO}Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
        start_time = time.time()
        
        # Initialize Genie with data loading enabled
        print(f"\n{INFO}Initializing Genie AI and processing data...{RESET}")
        print(f"{INFO}This will take a while. You can:{RESET}")
        print(f"  - Take a break ☕")
        print(f"  - Monitor the progress bars")
        print(f"  - Check logs/genie_ai_*.log for details")
        print(f"\n{INFO}Processing...{RESET}\n")
        
        # Use smart index detection instead of forcing rebuild!
        # This will only build what's actually missing
        genie = GenieAI(skip_data_loading=True)
        
        # Calculate actual time
        elapsed_time = time.time() - start_time
        hours = int(elapsed_time // 3600)
        minutes = int((elapsed_time % 3600) // 60)
        seconds = int(elapsed_time % 60)
        
        print(f"\n{SUCCESS}{'='*60}{RESET}")
        print(f"{SUCCESS} SETUP COMPLETE! {RESET}")
        print(f"{SUCCESS}{'='*60}{RESET}")
        print(f"\n{INFO}Processing Statistics:{RESET}")
        print(f"  Total time: {hours}h {minutes}m {seconds}s")
        print(f"  End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Get system info
        system_info = genie.get_system_info()
        print(f"\n{INFO}System Status:{RESET}")
        print(f"  Vector Store Documents: {system_info['vector_store_docs']}")
        print(f"  Index Status: {system_info.get('index_status', 'ready')}")
        
        # Verify files were created
        print(f"\n{INFO}Verifying created files...{RESET}")
        from config.settings import config
        
        files_to_check = [
            (Path(config.data.vector_store_path) / "mental_health_index.faiss", "FAISS index"),
            (Path(config.data.vector_store_path) / "mental_health_index.pkl", "Vector metadata"),
            (Path(config.data.ai_models_dir) / "indexes" / "bm25_index.pkl", "BM25 index"),
        ]
        
        all_good = True
        for file_path, description in files_to_check:
            if file_path.exists():
                size_mb = file_path.stat().st_size / (1024 * 1024)
                print(f"  {SUCCESS}✓ {description}: {size_mb:.1f} MB{RESET}")
            else:
                print(f"  {ERROR}✗ {description}: NOT FOUND{RESET}")
                all_good = False
        
        if all_good:
            print(f"\n{SUCCESS}All indexes created successfully!{RESET}")
            print(f"\n{INFO}You can now:{RESET}")
            print(f"  1. Run tests: python test_genie.py")
            print(f"  2. Use the CLI: python main.py")
            print(f"  3. Test a query: python main.py --test \"What is anxiety?\"")
        else:
            print(f"\n{WARNING}Some files are missing. Check the logs for errors.{RESET}")
        
    except KeyboardInterrupt:
        print(f"\n\n{WARNING}Setup interrupted by user!{RESET}")
        print(f"{INFO}Progress has been lost. You'll need to run setup again.{RESET}")
    except Exception as e:
        print(f"\n{ERROR}Setup failed with error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        print(f"\n{INFO}Check the log files for more details.{RESET}")

def cleanup_partial_files():
    """Clean up any partial files from failed runs"""
    print(f"\n{INFO}Cleaning up any partial files...{RESET}")
    
    from config.settings import config
    files_to_clean = [
        Path(config.data.vector_store_path) / "mental_health_index.faiss",
        Path(config.data.vector_store_path) / "mental_health_index.pkl",
        Path(config.data.ai_models_dir) / "indexes" / "bm25_index.pkl",
        Path(config.data.graph_store_path) / "knowledge_graph.pkl",
    ]
    
    for file_path in files_to_clean:
        if file_path.exists():
            print(f"  Removing {file_path.name}")
            file_path.unlink()

async def quick_test():
    """Quick test to verify setup worked"""
    print(f"\n{INFO}Running quick test...{RESET}")
    
    try:
        # Initialize with existing indexes
        genie = GenieAI(skip_data_loading=True)
        
        # Test query
        test_query = "What are the symptoms of anxiety?"
        response = await genie.chat(test_query)
        
        if response and response.get('response'):
            print(f"\n{SUCCESS}Test query successful!{RESET}")
            print(f"\nQuery: {test_query}")
            print(f"Response preview: {response['response'][:200]}...")
            print(f"Confidence: {response.get('confidence', 0):.2%}")
            return True
        else:
            print(f"{ERROR}Test query failed - no response{RESET}")
            return False
            
    except Exception as e:
        print(f"{ERROR}Test failed: {e}{RESET}")
        return False

async def main():
    """Main setup runner"""
    print(f"{INFO}Genie AI Initial Setup Script{RESET}")
    print(f"{INFO}This will process all data and create indexes.{RESET}")
    
    # Check if indexes already exist
    from config.settings import config
    vector_index = Path(config.data.vector_store_path) / "mental_health_index.faiss"
    
    if vector_index.exists():
        print(f"\n{WARNING}Existing indexes found!{RESET}")
        print(f"{INFO}What would you like to do?{RESET}")
        print(f"  1. Delete and rebuild from scratch")
        print(f"  2. Test existing indexes")
        print(f"  3. Cancel")
        
        choice = input(f"\n{INFO}Enter choice (1-3):{RESET} ")
        
        if choice == "1":
            cleanup_partial_files()
            await run_initial_setup()
        elif choice == "2":
            success = await quick_test()
            if not success:
                print(f"\n{INFO}Would you like to rebuild? (y/n):{RESET}", end=" ")
                if input().lower() == 'y':
                    cleanup_partial_files()
                    await run_initial_setup()
        else:
            print(f"{INFO}Setup cancelled.{RESET}")
    else:
        # No existing indexes, run setup
        await run_initial_setup()
    
    # Ask if user wants to run a test
    print(f"\n{INFO}Run a test query? (y/n):{RESET}", end=" ")
    if input().lower() == 'y':
        await quick_test()
    
    print(f"\n{SUCCESS}Done!{RESET}")

if __name__ == "__main__":
    asyncio.run(main())