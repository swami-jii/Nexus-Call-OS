# Knowledge Collections & Vector RAG — Integration & Architecture Guide

## Overview & Architecture
**Knowledge Collections & Vector RAG** serve as the centralized single source of truth (SSOT) knowledge base for AI Voice Agents in Nexus Call OS. By converting workspace documents (PDFs, FAQs, web pages, Notion manuals) into vector embeddings, AI agents retrieve sub-second contextual answers during live phone calls.

---

## Key Configuration Parameters

### 1. Ingestion & Document Sources
- **Source Types**: Upload PDF manuals, web scraper URLs, plain text FAQs, Notion/Confluence connectors, or custom API endpoints.
- **Allowed File Formats**: `.pdf`, `.txt`, `.docx`, `.csv`, `.md`.
- **Auto-Sync & Refresh**: Configure daily, weekly, or real-time webhook indexing to keep document vector stores synchronized with live business updates.

### 2. Chunking Strategy & Token Windows
- **Recursive Character**: Ideal for general text documents with nested paragraphs (default chunk size: 1024 tokens, overlap: 128 tokens).
- **Fixed Token Window**: Hard-boundary token chunking for structured tables.
- **Semantic Paragraph**: Preserves complete conceptual thoughts for technical manuals.

### 3. Vector Embeddings & Retrieval Tuning
- **Embedding Models**: Sourced from configured embedding providers (e.g. OpenAI `text-embedding-3-small`, `text-embedding-3-large`, Cohere `embed-english-v3.0`, local Ollama).
- **Retrieval Algorithms**: Cosine Similarity, Hybrid BM25 Keyword + Dense Search, or Maximal Marginal Relevance (MMR).
- **Top K & Similarity Threshold**: Tunes the number of retrieved chunks (e.g. Top K = 5) and similarity cutoff score (e.g. 0.75).

---

## Single Source of Truth (SSOT) Integration
Knowledge collections bind directly to AI Voice Agents in Agent Setup and Live Call Studio to answer caller questions accurately without hallucination.
