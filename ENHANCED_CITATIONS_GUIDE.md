# Enhanced Citations System

## Overview
The enhanced citations system now supports multiple search methods with specialized visualizations for each type:

## Supported Search Methods

### 1. **Web Search** (`web`)
- **Icon**: Globe icon (blue)
- **Color**: Blue theme
- **Features**: External links, URL display

### 2. **BM25 Search** (`bm25`)
- **Icon**: Search icon (orange)
- **Color**: Orange theme
- **Features**: BM25 score display, keyword-based matching

### 3. **Vector Search** (`vector`)
- **Icon**: Database icon (green)
- **Color**: Emerald theme
- **Features**: Vector similarity score (0-100%)

### 4. **Graph Search** (`graph`)
- **Icon**: Network icon (purple)
- **Color**: Purple theme
- **Features**: Entity visualization, relationship mapping, knowledge paths

## Citation Data Structure

```typescript
interface Citation {
  id: number;
  text: string;
  metadata?: {
    title?: string;
    url?: string;
    source?: string;
    searchMethod?: 'web' | 'bm25' | 'vector' | 'graph';
    entities?: GraphEntity[];
    relations?: GraphRelation[];
    vectorScore?: number;
    bm25Score?: number;
    graphPath?: string[];
  };
  source: string;
  score?: number;
}
```

## Graph Entities Structure

```typescript
interface GraphEntity {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, any>;
}

interface GraphRelation {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}
```

## Usage Examples

### Basic Citation
```javascript
const citation = {
  id: 1,
  text: "Regular exercise improves cardiovascular health...",
  metadata: {
    title: "Health Benefits of Exercise",
    searchMethod: "vector",
    vectorScore: 0.87
  },
  source: "health_database",
  score: 0.87
};
```

### Graph Search Citation
```javascript
const graphCitation = {
  id: 2,
  text: "Mental wellness is connected to physical activity...",
  metadata: {
    title: "Wellness Knowledge Graph",
    searchMethod: "graph",
    entities: [
      { id: "e1", name: "Mental Wellness", type: "concept" },
      { id: "e2", name: "Physical Activity", type: "action" },
      { id: "e3", name: "Stress Reduction", type: "outcome" }
    ],
    relations: [
      { from: "e2", to: "e1", type: "improves" },
      { from: "e1", to: "e3", type: "leads_to" }
    ],
    graphPath: ["Physical Activity", "improves", "Mental Wellness", "leads_to", "Stress Reduction"]
  },
  source: "wellness_graph"
};
```

## Features

### 1. **Search Method Breakdown**
- Shows count of citations per search method
- Color-coded badges for each method
- Visual summary in the header

### 2. **Enhanced Score Display**
- Vector scores: V: 87.5%
- BM25 scores: BM25: 2.34
- General scores: 87.5%

### 3. **Graph Visualization**
- **Entities**: Displayed as colored badges with type information
- **Relations**: Arrows showing connections between entities
- **Knowledge Paths**: Sequential flow of reasoning

### 4. **Interactive Elements**
- Collapsible citation view
- Hover effects on external links
- Animated entity appearances
- Smooth transitions

## Integration

The enhanced citations are automatically used in the chat interface when the backend provides properly formatted citation data with the `searchMethod` field specified.

## Backend Integration

Ensure your backend returns citations with the following structure:

```python
{
    "citations": [
        {
            "id": 1,
            "text": "Citation content...",
            "metadata": {
                "searchMethod": "graph",  # or "web", "bm25", "vector"
                "entities": [...],
                "relations": [...],
                "vectorScore": 0.87,
                # ... other metadata
            },
            "source": "source_name",
            "score": 0.87
        }
    ]
}
```

This enhanced system provides users with clear visibility into how the AI found and processed information from different search methods, with special attention to graph-based knowledge connections.
