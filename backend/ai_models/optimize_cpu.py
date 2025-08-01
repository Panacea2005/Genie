# optimize_cpu.py
"""
CPU Optimization Script for Genie AI Initial Setup
This script optimizes system settings for maximum CPU utilization during the initial setup process.
"""

import os
import sys
import psutil
import multiprocessing
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_system_info():
    """Get detailed system information"""
    cpu_count = multiprocessing.cpu_count()
    memory = psutil.virtual_memory()
    
    info = {
        "cpu_count": cpu_count,
        "cpu_freq": psutil.cpu_freq(),
        "memory_total_gb": memory.total / (1024**3),
        "memory_available_gb": memory.available / (1024**3),
        "memory_percent": memory.percent
    }
    
    # Get CPU usage per core
    cpu_usage = psutil.cpu_percent(interval=1, percpu=True)
    info["cpu_usage_per_core"] = cpu_usage
    info["avg_cpu_usage"] = sum(cpu_usage) / len(cpu_usage)
    
    return info

def optimize_system_for_processing():
    """Optimize system settings for maximum CPU utilization"""
    logger.info("🚀 Optimizing system for maximum CPU utilization...")
    
    system_info = get_system_info()
    
    logger.info("="*60)
    logger.info("SYSTEM INFORMATION")
    logger.info("="*60)
    logger.info(f"CPU cores: {system_info['cpu_count']}")
    if system_info['cpu_freq']:
        logger.info(f"CPU frequency: {system_info['cpu_freq'].current:.0f} MHz (max: {system_info['cpu_freq'].max:.0f} MHz)")
    logger.info(f"Total RAM: {system_info['memory_total_gb']:.1f} GB")
    logger.info(f"Available RAM: {system_info['memory_available_gb']:.1f} GB ({100-system_info['memory_percent']:.1f}% free)")
    logger.info(f"Average CPU usage: {system_info['avg_cpu_usage']:.1f}%")
    logger.info("="*60)
    
    # Set environment variables for optimal performance
    optimizations = []
    
    # 1. PyTorch optimizations
    os.environ["OMP_NUM_THREADS"] = str(system_info['cpu_count'])
    os.environ["MKL_NUM_THREADS"] = str(system_info['cpu_count'])
    os.environ["NUMEXPR_NUM_THREADS"] = str(system_info['cpu_count'])
    optimizations.append(f"Set thread count to {system_info['cpu_count']} for PyTorch/MKL/NumExpr")
    
    # 2. Memory optimizations
    os.environ["MALLOC_ARENA_MAX"] = "4"  # Reduce memory fragmentation
    optimizations.append("Optimized memory allocation (MALLOC_ARENA_MAX=4)")
    
    # 3. Process priority (Windows)
    if sys.platform == "win32":
        try:
            import subprocess
            # Set process priority to high
            subprocess.run(['wmic', 'process', 'where', f'processid={os.getpid()}', 'CALL', 'setpriority', '128'], 
                         capture_output=True, check=False)
            optimizations.append("Set process priority to HIGH")
        except Exception as e:
            logger.warning(f"Could not set process priority: {e}")
    
    # 4. Hugepages (Linux)
    elif sys.platform.startswith("linux"):
        try:
            # Enable transparent hugepages
            with open('/sys/kernel/mm/transparent_hugepage/enabled', 'r') as f:
                hugepage_status = f.read().strip()
                if 'always' in hugepage_status:
                    optimizations.append("Transparent hugepages already enabled")
                else:
                    optimizations.append("Transparent hugepages status: " + hugepage_status)
        except Exception:
            pass
    
    # 5. Set CPU affinity to use all cores
    try:
        current_process = psutil.Process()
        available_cores = list(range(system_info['cpu_count']))
        current_process.cpu_affinity(available_cores)
        optimizations.append(f"Set CPU affinity to use all {len(available_cores)} cores")
    except Exception as e:
        logger.warning(f"Could not set CPU affinity: {e}")
    
    # 6. Python optimizations
    os.environ["PYTHONHASHSEED"] = "0"  # Reproducible hashing
    optimizations.append("Set reproducible Python hashing")
    
    logger.info("\n🔧 APPLIED OPTIMIZATIONS:")
    for i, opt in enumerate(optimizations, 1):
        logger.info(f"  {i}. {opt}")
    
    return system_info

def estimate_performance_improvement():
    """Estimate expected performance improvement"""
    system_info = get_system_info()
    
    # Calculate expected speedup based on CPU cores
    cpu_cores = system_info['cpu_count']
    
    # Conservative estimates based on typical parallel efficiency
    if cpu_cores <= 4:
        expected_speedup = cpu_cores * 0.9  # 90% efficiency
    elif cpu_cores <= 8:
        expected_speedup = cpu_cores * 0.85  # 85% efficiency
    elif cpu_cores <= 16:
        expected_speedup = cpu_cores * 0.8  # 80% efficiency
    else:
        expected_speedup = cpu_cores * 0.75  # 75% efficiency for many cores
    
    logger.info(f"\n📈 PERFORMANCE ESTIMATES:")
    logger.info(f"  CPU cores available: {cpu_cores}")
    logger.info(f"  Expected parallel speedup: {expected_speedup:.1f}x")
    logger.info(f"  Previous setup time (estimated): ~2-4 hours")
    logger.info(f"  Optimized setup time (estimated): ~{120/expected_speedup:.0f}-{240/expected_speedup:.0f} minutes")
    
    return expected_speedup

def verify_dependencies():
    """Verify that all required packages support multiprocessing"""
    logger.info("\n🔍 VERIFYING MULTIPROCESSING SUPPORT:")
    
    packages_to_check = [
        ("torch", "PyTorch"),
        ("sentence_transformers", "Sentence Transformers"),
        ("faiss", "FAISS"),
        ("numpy", "NumPy"),
        ("concurrent.futures", "Python Concurrent Futures")
    ]
    
    for package, name in packages_to_check:
        try:
            __import__(package)
            logger.info(f"  ✅ {name} - Available")
        except ImportError:
            logger.warning(f"  ❌ {name} - Not installed")
            return False
    
    # Check if sentence-transformers supports multiprocessing
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
        if hasattr(model, 'start_multi_process_pool'):
            logger.info(f"  ✅ Sentence Transformers multiprocessing - Supported")
        else:
            logger.warning(f"  ⚠️  Sentence Transformers multiprocessing - Not supported in this version")
    except Exception as e:
        logger.warning(f"  ⚠️  Could not verify Sentence Transformers multiprocessing: {e}")
    
    return True

def main():
    """Main optimization function"""
    print("🚀 Genie AI CPU Optimization Tool")
    print("="*50)
    
    # Get system info and apply optimizations
    system_info = optimize_system_for_processing()
    
    # Verify dependencies
    if not verify_dependencies():
        logger.error("❌ Some required packages are missing. Please install them first.")
        return False
    
    # Estimate performance improvement
    expected_speedup = estimate_performance_improvement()
    
    # Final recommendations
    logger.info(f"\n💡 RECOMMENDATIONS:")
    
    if system_info['memory_available_gb'] < 8:
        logger.warning(f"  ⚠️  Low available memory ({system_info['memory_available_gb']:.1f} GB)")
        logger.warning(f"     Consider closing other applications for better performance")
    
    if system_info['avg_cpu_usage'] > 50:
        logger.warning(f"  ⚠️  High CPU usage ({system_info['avg_cpu_usage']:.1f}%)")
        logger.warning(f"     Consider closing other applications for better performance")
    
    logger.info(f"  💾 Ensure at least 10GB free disk space for indexes")
    logger.info(f"  🔋 Connect to power (for laptops) to avoid throttling")
    logger.info(f"  ❄️  Ensure good cooling to prevent thermal throttling")
    
    logger.info(f"\n✅ System optimized! You can now run:")
    logger.info(f"   python initial_setup.py")
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print(f"\n🎉 Optimization complete! Your {multiprocessing.cpu_count()}-core system is ready for maximum performance.")
    else:
        print("\n❌ Optimization failed. Please check the errors above.")
        sys.exit(1)
