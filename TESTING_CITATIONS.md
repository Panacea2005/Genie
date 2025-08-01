# Testing Enhanced Citations

To test the enhanced citations system with different search methods, you can use these sample citations in your backend or for testing:

## Sample Citations Data

```javascript
const sampleCitations = [
  // Web Search Citation
  {
    id: 1,
    text: "Regular exercise has been shown to improve mental health by reducing symptoms of depression and anxiety.",
    metadata: {
      title: "Exercise and Mental Health Benefits",
      url: "https://www.healthline.com/health/fitness/exercise-and-mental-health",
      source: "Healthline",
      searchMethod: "web"
    },
    source: "web_search",
    score: 0.92
  },
  
  // Vector Search Citation
  {
    id: 2,
    text: "Mindfulness meditation practices can significantly reduce stress levels and improve emotional regulation.",
    metadata: {
      title: "Mindfulness Research Studies",
      source: "Academic Database",
      searchMethod: "vector",
      vectorScore: 0.87
    },
    source: "vector_database",
    score: 0.87
  },
  
  // BM25 Search Citation
  {
    id: 3,
    text: "Cognitive behavioral therapy (CBT) is an effective treatment for anxiety disorders.",
    metadata: {
      title: "CBT Treatment Effectiveness",
      source: "Medical Journal",
      searchMethod: "bm25",
      bm25Score: 3.45
    },
    source: "keyword_search",
    score: 0.78
  },
  
  // Graph Search Citation
  {
    id: 4,
    text: "The relationship between sleep quality and mental wellness involves multiple interconnected factors.",
    metadata: {
      title: "Sleep-Mental Health Connection",
      source: "Knowledge Graph",
      searchMethod: "graph",
      entities: [
        { id: "e1", name: "Sleep Quality", type: "health_factor" },
        { id: "e2", name: "Mental Wellness", type: "health_outcome" },
        { id: "e3", name: "Stress Reduction", type: "benefit" },
        { id: "e4", name: "Cognitive Function", type: "brain_function" }
      ],
      relations: [
        { from: "e1", to: "e2", type: "improves" },
        { from: "e1", to: "e3", type: "enables" },
        { from: "e3", to: "e2", type: "contributes_to" },
        { from: "e1", to: "e4", type: "enhances" }
      ],
      graphPath: ["Sleep Quality", "improves", "Mental Wellness", "through", "Stress Reduction"]
    },
    source: "knowledge_graph",
    score: 0.91
  }
];
```

## Fallback Detection

The system now includes smart fallback detection based on source names:

- Sources containing "web", "search", "google" → Web Search
- Sources containing "bm25", "keyword" → BM25 Search  
- Sources containing "vector", "embedding", "semantic" → Vector Search
- Sources containing "graph", "knowledge", "entity" → Graph Search

## Testing Instructions

1. **In Backend**: Return citations with the `searchMethod` field in metadata
2. **For Testing**: Use source names that trigger fallback detection
3. **Examples**: 
   - `source: "web_search"` → Web Search
   - `source: "vector_database"` → Vector Search
   - `source: "keyword_index"` → BM25 Search
   - `source: "knowledge_graph"` → Graph Search

## Expected Display

- **Web Search**: 🌐 Blue badge "Web Search"
- **BM25 Search**: 🔍 Orange badge "BM25 Search" 
- **Vector Search**: 🗃️ Green badge "Vector Search"
- **Graph Search**: 🔗 Purple badge "Graph Search" with entity visualization

The system will now properly categorize and display different search methods even if your backend doesn't explicitly set the `searchMethod` field!
