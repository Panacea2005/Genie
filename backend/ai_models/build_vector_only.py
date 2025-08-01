# build_vector_only.py
"""
Smart Vector Store Builder - Only builds vector store if missing
Preserves existing BM25 and Knowledge Graph indexes
"""

import asyncio
import sys
import os
import time
import multiprocessing
from pathlib import Path

# Windows multiprocessing support
if __name__ == '__main__':
    multiprocessing.freeze_support()

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import optimization and main modules
from optimize_cpu import main as optimize_cpu
from main import GenieAI
from config.settings import config

async def check_existing_indexes():
    """Check what indexes already exist"""
    print("🔍 CHECKING EXISTING INDEXES")
    print("="*50)
    
    # Check index files
    vector_faiss = Path(config.data.vector_store_path) / "mental_health_index.faiss"
    vector_pkl = Path(config.data.vector_store_path) / "mental_health_index.pkl"
    bm25_index = Path(config.data.ai_models_dir) / "indexes" / "bm25_index.pkl"
    graph_index = Path(config.data.graph_store_path) / "knowledge_graph.pkl"
    
    # Check status
    vector_exists = vector_faiss.exists() and vector_pkl.exists()
    bm25_exists = bm25_index.exists()
    graph_exists = graph_index.exists()
    
    print(f"📊 INDEX STATUS:")
    print(f"  Vector Store: {'✅ EXISTS' if vector_exists else '❌ MISSING'}")
    print(f"  BM25 Index: {'✅ EXISTS' if bm25_exists else '❌ MISSING'}")
    print(f"  Knowledge Graph: {'✅ EXISTS' if graph_exists else '❌ MISSING'}")
    
    if vector_exists:
        vector_size = (vector_faiss.stat().st_size + vector_pkl.stat().st_size) / 1024 / 1024
        print(f"  Vector Store Size: {vector_size:.1f} MB")
    
    if bm25_exists:
        bm25_size = bm25_index.stat().st_size / 1024 / 1024
        print(f"  BM25 Index Size: {bm25_size:.1f} MB")
    
    if graph_exists:
        graph_size = graph_index.stat().st_size / 1024 / 1024
        print(f"  Knowledge Graph Size: {graph_size:.1f} MB")
    
    print("="*50)
    
    return {
        "vector_exists": vector_exists,
        "bm25_exists": bm25_exists,
        "graph_exists": graph_exists,
        "needs_vector": not vector_exists
    }

async def build_vector_only():
    """Build only the vector store without touching other indexes"""
    
    # Check existing indexes
    status = await check_existing_indexes()
    
    if not status["needs_vector"]:
        print("✅ Vector store already exists!")
        print("🎉 All indexes are complete - no building needed!")
        return True
    
    print(f"\n🎯 SMART VECTOR BUILDING")
    print("="*50)
    print("Will build ONLY the missing vector store")
    print("Will PRESERVE existing BM25 and Knowledge Graph")
    print("="*50)
    
    # Ask for confirmation
    response = input("\nProceed with vector store building? (y/n): ")
    if response.lower() != 'y':
        print("❌ Building cancelled.")
        return False
    
    try:
        # Step 1: CPU Optimization (if needed)
        print("\n🚀 STEP 1: CPU OPTIMIZATION")
        print("-" * 30)
        optimize_success = optimize_cpu()
        if optimize_success:
            print("✅ CPU optimization completed")
        else:
            print("⚠️ CPU optimization had issues, continuing anyway...")
        
        # Step 2: Build Vector Store Only
        print("\n🔧 STEP 2: VECTOR STORE BUILDING")
        print("-" * 30)
        print("Initializing Genie AI with smart index detection...")
        
        start_time = time.time()
        
        # This will use the smart detection we implemented
        genie = GenieAI(skip_data_loading=True)
        
        # Calculate time
        elapsed_time = time.time() - start_time
        minutes = int(elapsed_time // 60)
        seconds = int(elapsed_time % 60)
        
        print(f"\n✅ VECTOR BUILDING COMPLETED!")
        print(f"⏱️ Time taken: {minutes}m {seconds}s")
        
        # Verify the build worked
        final_status = await check_existing_indexes()
        if final_status["vector_exists"]:
            print("\n🎉 SUCCESS! Vector store built successfully!")
            print("🔥 Your Genie AI now has FULL capabilities:")
            print("  ✅ Semantic search (Vector Store)")
            print("  ✅ Keyword search (BM25)")
            print("  ✅ Knowledge relationships (Graph)")
            return True
        else:
            print("\n❌ Vector store build may have failed. Check logs above.")
            return False
            
    except Exception as e:
        print(f"\n❌ Error during vector building: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main entry point"""
    print("🚀 GENIE AI SMART VECTOR BUILDER")
    print("="*50)
    print("This tool will:")
    print("1. Check what indexes already exist")
    print("2. Only build missing vector store")
    print("3. Preserve existing BM25 and Graph indexes")
    print("4. Use maximum CPU optimization")
    print("="*50)
    
    success = await build_vector_only()
    
    if success:
        print(f"\n🎉 ALL DONE! Your Genie AI is fully operational!")
        print(f"\nYou can now:")
        print(f"  • Chat: python main.py")
        print(f"  • Test: python test_companion.py") 
        print(f"  • API: python api_server.py")
    else:
        print(f"\n❌ Build incomplete. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())
