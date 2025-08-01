# fast_setup.py
"""
Fast Initial Setup Script for Genie AI
This script runs CPU optimization and then the initial setup with maximum parallelization.
"""

import asyncio
import sys
import os
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import optimization and setup modules
from optimize_cpu import main as optimize_cpu
from initial_setup import main as run_initial_setup

async def fast_setup():
    """Run optimized setup process with smart index detection"""
    print("🚀 GENIE AI FAST SETUP")
    print("="*50)
    print("This will:")
    print("1. Optimize your CPU settings for maximum performance")
    print("2. Check existing indexes (preserves what you have)")
    print("3. Build only missing indexes using ALL available CPU cores")
    print("="*50)
    
    # Check existing indexes first
    from config.settings import config
    vector_faiss = Path("./indexes/vector_store/mental_health_index.faiss")
    vector_pkl = Path("./indexes/vector_store/mental_health_index.pkl") 
    bm25_index = Path("./indexes/bm25_index.pkl")
    graph_index = Path("./indexes/graph_store/knowledge_graph.pkl")
    
    vector_exists = vector_faiss.exists() and vector_pkl.exists()
    bm25_exists = bm25_index.exists()
    graph_exists = graph_index.exists()
    
    print(f"\n🔍 CURRENT INDEX STATUS:")
    print(f"  Vector Store: {'✅' if vector_exists else '❌'}")
    print(f"  BM25 Index: {'✅' if bm25_exists else '❌'}")  
    print(f"  Knowledge Graph: {'✅' if graph_exists else '❌'}")
    
    if vector_exists and bm25_exists and graph_exists:
        print(f"\n🎉 ALL INDEXES ALREADY EXIST!")
        print(f"No building needed - your system is ready!")
        return
    
    missing = []
    if not vector_exists: missing.append("Vector Store")
    if not bm25_exists: missing.append("BM25") 
    if not graph_exists: missing.append("Knowledge Graph")
    
    print(f"\n🔧 WILL BUILD: {', '.join(missing)}")
    print(f"✅ WILL PRESERVE: {', '.join([x for x in ['Vector Store', 'BM25', 'Knowledge Graph'] if x not in missing])}")
    
    # Confirm before starting
    response = input("\nReady to start smart setup? (y/n): ")
    if response.lower() != 'y':
        print("Setup cancelled.")
        return
    
    start_time = time.time()
    
    try:
        # Step 1: CPU Optimization
        print("\n" + "="*50)
        print("STEP 1: CPU OPTIMIZATION")
        print("="*50)
        
        success = optimize_cpu()
        if not success:
            print("❌ CPU optimization failed. Continuing anyway...")
        
        # Step 2: Initial Setup
        print("\n" + "="*50)
        print("STEP 2: INITIAL DATA SETUP")
        print("="*50)
        
        await run_initial_setup()
        
        # Calculate total time
        total_time = time.time() - start_time
        hours = int(total_time // 3600)
        minutes = int((total_time % 3600) // 60)
        seconds = int(total_time % 60)
        
        print("\n" + "="*50)
        print("🎉 FAST SETUP COMPLETED!")
        print("="*50)
        print(f"⏱️  Total time: {hours}h {minutes}m {seconds}s")
        print(f"🚀 Your system is now ready with optimized performance!")
        print("\nYou can now:")
        print("  • Run: python main.py")
        print("  • Test: python test_companion.py")
        print("  • Start API: python api_server.py")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user!")
        print("You can resume by running this script again.")
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("Please check the logs for more details.")
        import traceback
        traceback.print_exc()

def main():
    """Main entry point"""
    asyncio.run(fast_setup())

if __name__ == "__main__":
    main()
