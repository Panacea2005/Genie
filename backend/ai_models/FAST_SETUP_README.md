# 🚀 Genie AI Optimized Setup Guide

This guide shows you how to use **ALL your CPU cores** for maximum speed during the initial setup process.

## ⚡ Quick Start (Recommended)

### Option 1: Automated Fast Setup
Run the optimized setup script that handles everything automatically:

**Windows:**
```bash
# Double-click this file or run in command prompt:
fast_setup.bat
```

**Python (All Platforms):**
```bash
python fast_setup.py
```

This will:
1. ✅ Optimize your CPU settings automatically
2. ✅ Use ALL available CPU cores (instead of just 1-2)
3. ✅ Run parallel processing for embeddings, BM25, and graph building
4. ✅ Show real-time CPU utilization monitoring
5. ✅ Estimate completion time accurately

---

## 🔧 Manual Optimization (Advanced)

### Step 1: CPU Optimization
First, optimize your system for maximum CPU utilization:

```bash
python optimize_cpu.py
```

This will:
- Configure PyTorch to use all CPU cores
- Set optimal memory allocation
- Adjust process priority (Windows)
- Show system information and performance estimates

### Step 2: Run Initial Setup
After optimization, run the setup:

```bash
python initial_setup.py
```

---

## 📊 Performance Improvements

| System | Before Optimization | After Optimization | Speedup |
|--------|-------------------|-------------------|---------|
| 4-core CPU | ~4 hours | ~45-60 minutes | **4-5x faster** |
| 8-core CPU | ~4 hours | ~25-35 minutes | **6-8x faster** |
| 16-core CPU | ~4 hours | ~15-20 minutes | **10-12x faster** |
| 20-core CPU | ~4 hours | ~10-15 minutes | **15-20x faster** |

*Times are estimates based on ~500k documents. Actual times depend on your hardware.*

---

## 🎯 What's Optimized

### 1. **Multi-Core Embedding Generation**
- Uses `sentence-transformers` multiprocessing pool
- Distributes embedding work across ALL CPU cores
- Batch processing optimized for your CPU count

### 2. **Parallel Index Building**
- Vector store, BM25, and knowledge graph build simultaneously
- Document preprocessing parallelized across threads
- Optimized batch sizes based on available memory

### 3. **CPU Configuration**
- PyTorch thread count = CPU cores
- Process priority elevated (Windows)
- Memory allocation optimized
- CPU affinity set to use all cores

### 4. **Real-Time Monitoring**
- Live CPU utilization per core
- Memory usage tracking
- Progress estimation with ETA
- Performance warnings if utilization is low

---

## 🔍 Monitoring During Setup

You'll see detailed progress information like:

```
📊 CPU utilization: avg=85.2%, peak=98.1%, cores_utilized=19/20
⚡ Embedding completed: 12.3s (83.7 docs/sec)
🚀 Optimizing for CPU: Using 19 threads
✅ Multiprocess pool started
```

If you see low utilization warnings:
```
⚠️  Low CPU utilization detected! Consider checking:
   - Close background applications
   - Check if multiprocessing is working correctly
   - Verify sentence-transformers version supports multiprocessing
```

---

## 💡 Troubleshooting

### Issue: Still slow after optimization
**Solutions:**
1. Close other applications (browsers, games, etc.)
2. Make sure you're using the latest sentence-transformers:
   ```bash
   pip install -U sentence-transformers
   ```
3. Check if you have enough RAM (8GB+ recommended)
4. Use SSD instead of HDD for better I/O performance

### Issue: High memory usage
**Solutions:**
1. The script automatically adjusts batch sizes based on available memory
2. Close other applications to free up RAM
3. Restart your computer before running setup

### Issue: CPU throttling
**Solutions:**
1. Ensure good cooling (laptop on cooling pad)
2. Connect to power (for laptops)
3. Check CPU temperature with monitoring software

---

## 📈 Performance Tips

1. **Before Setup:**
   - Close all unnecessary applications
   - Connect laptop to power
   - Ensure good ventilation/cooling
   - Free up disk space (10GB+ recommended)

2. **During Setup:**
   - Don't run other CPU-intensive tasks
   - Monitor the progress logs
   - Let it run uninterrupted

3. **Hardware Recommendations:**
   - SSD for faster I/O
   - 16GB+ RAM for large datasets
   - Good CPU cooling for sustained performance

---

## 🔧 Configuration Details

The optimization automatically adjusts these settings:

```python
# CPU Utilization
max_workers = CPU_CORES - 1  # Use almost all cores
embedding_batch_size = 1024  # Large batches for efficiency
batch_size = 1024           # Optimized for parallel processing

# Memory Management
vector_index_batch_size = 2000  # Process more vectors at once
save_checkpoint_interval = 5000  # More frequent saves

# Threading
OMP_NUM_THREADS = CPU_CORES
MKL_NUM_THREADS = CPU_CORES
NUMEXPR_NUM_THREADS = CPU_CORES
```

---

## ✅ Verification

After setup completes, you should see:

```
🎉 FAST SETUP COMPLETED!
⏱️  Total time: 0h 25m 34s
🚀 Your system is now ready with optimized performance!

✅ All indexes created successfully!
  ✅ FAISS index: 2,847.3 MB
  ✅ Vector metadata: 156.2 MB  
  ✅ BM25 index: 89.4 MB
```

Now you can run:
- `python main.py` - CLI interface
- `python test_companion.py` - Run tests
- `python api_server.py` - Start API server

---

**🎉 Enjoy your blazing-fast Genie AI setup!**
