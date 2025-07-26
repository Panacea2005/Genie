# Genie AI System: Score Explanations (Detailed)

This document explains all scores used in the Genie AI backend, with clear mathematical formulas and plain English descriptions.

---

## 1. Confidence Score (confidence)

**Purpose:**
- Represents the overall reliability and quality of a response.
- Shown to the user as a number between 0.0 (very low) and 1.0 (very high).

**Formula:**
The confidence score is a weighted sum of several quality components:

Let:
- $S_{source}$ = Source Quality (trustworthiness of sources)
- $S_{relevance}$ = Content Relevance (how well sources match the query)
- $S_{linguistic}$ = Linguistic Confidence (clarity, specificity, and confidence in language)
- $S_{citation}$ = Citation Quality (proper use and formatting of citations)
- $S_{structure}$ = Structural Quality (structure appropriate for the response type)
- $S_{factual}$ = Factual Accuracy (based on verification and fact-checking)
- $w_i$ = Weight for each component (varies by response type)

The raw confidence score is:

$$
C_{raw} = w_1 S_{source} + w_2 S_{relevance} + w_3 S_{linguistic} + w_4 S_{citation} + w_5 S_{structure} + w_6 S_{factual}
$$

This score is then adjusted for quality (bonuses/penalties for things like vague language, strong statistics, or missing citations), and finally clamped to the range $[0.3, 1.0]$:

$$
C = \text{clamp}(C_{raw} + \text{adjustments}, 0.3, 1.0)
$$

**Component meanings:**
- **Source Quality:** Higher if the answer uses trusted sources (e.g., curated knowledge base, reputable web sources).
- **Content Relevance:** Higher if the sources are highly relevant to the user's question.
- **Linguistic Confidence:** Higher if the answer is clear, specific, and avoids vague or uncertain language.
- **Citation Quality:** Higher if sources are cited properly and clearly.
- **Structural Quality:** Higher if the answer is well-organized for its type (e.g., factual, emotional support).
- **Factual Accuracy:** Higher if the answer passes fact-checking or verification steps.

**Usage:**
- Shown to the user as `confidence` in every response.
- Used internally to decide if a response is high/medium/low quality.

---

## 2. Quality Score (Internal Only)

**Purpose:**
- Used for self-learning, pipeline control, and enhancement triggers.
- Not shown to the user by default.

**Formula:**
The quality score is a sum of binary and continuous features, each with a weight:

Let:
- $Q_{empathy}$ = 1 if the response shows empathy, 0 otherwise
- $Q_{specifics}$ = 1 if the response is specific, 0 otherwise
- $Q_{citations}$ = 1 if the response includes citations, 0 otherwise
- $Q_{structure}$ = 1 if the response is well-structured, 0 otherwise
- $Q_{personal}$ = 1 if the response has a personal touch, 0 otherwise
- $Q_{actionable}$ = 1 if the response gives actionable advice, 0 otherwise
- $Q_{disclaimer}$ = 1 if the response includes a professional disclaimer (when needed), 0 otherwise
- $Q_{length}$ = 1 if the response is within the target length, 0 otherwise
- $Q_{readability}$ = Readability score (0 to 1)
- $v_i$ = Weight for each feature

The quality score is:

$$
Q = v_1 Q_{empathy} + v_2 Q_{specifics} + v_3 Q_{citations} + v_4 Q_{structure} + v_5 Q_{personal} + v_6 Q_{actionable} + v_7 Q_{disclaimer} + v_8 Q_{length} + v_9 Q_{readability}
$$

The score is clamped to $[0.0, 1.0]$.

**Component meanings:**
- **Empathy:** Does the response show understanding and care?
- **Specifics:** Does it provide concrete details, not just generalities?
- **Citations:** Are sources included and formatted well?
- **Structure:** Is the answer organized and easy to follow?
- **Personal Touch:** Does it feel human and tailored?
- **Actionable Advice:** Are there clear steps or suggestions?
- **Disclaimer:** Is a professional disclaimer included when needed?
- **Length:** Is the response neither too short nor too long?
- **Readability:** Is the language easy to read and understand?

**Usage:**
- Used to decide if a response should be enhanced, flagged, or retrained.
- Used for analytics and self-improvement.

---

## 3. Response Time (processing_time)

**Purpose:**
- Measures the time (in seconds) taken to generate a response.
- Shown to the user in every API response.

**Formula:**

$$
T = t_{end} - t_{start}
$$

Where $t_{start}$ is when the request is received, and $t_{end}$ is when the response is ready.

**Usage:**
- Shown to the user as `processing_time`.
- Used for monitoring and performance optimization.

---

## 4. Other Component Scores (Internal)

- **Source Quality ($S_{source}$):** Trustworthiness of sources (vector, web, etc.)
- **Content Relevance ($S_{relevance}$):** How well sources match the query
- **Linguistic Confidence ($S_{linguistic}$):** Clarity, specificity, and confidence in language
- **Citation Quality ($S_{citation}$):** Proper use and formatting of citations
- **Structural Quality ($S_{structure}$):** Structure appropriate for the response type
- **Factual Accuracy ($S_{factual}$):** Based on verification and fact-checking

These are combined (with weights) to produce the final `confidence` score.

---

## 5. Example API Response

```json
{
  "response": "...",
  "confidence": 0.87,
  "processing_time": 1.42,
  ...
}
```

---

**Note:** Only `confidence` and `processing_time` are shown to users. All other scores are used internally for quality control and self-learning. 