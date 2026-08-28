# Nexus Call OS - Embedding & Vector AI Integration Guide

Embedding models convert raw workspace documents and knowledge bases into high-dimensional numerical vectors for real-time RAG (Retrieval-Augmented Generation).

## 🎯 Role in Live Phone Calls
1. Indexes uploaded PDF manuals, FAQs, website URLs, and CRM records.
2. During live phone calls, retrieves relevant context chunks based on caller queries.
3. Injects retrieved knowledge into the LLM system prompt so the voice agent speaks accurate business facts.

## 🛠️ Key Configuration Parameters
- **Vector Dimensions**: `1536` for standard OpenAI embeddings, `3072` for large embeddings.
- **Distance Metric**: `Cosine Similarity` is recommended for semantic text search.

## 🔗 Official Developer Consoles & API Docs
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **Cohere Embed v3**: https://docs.cohere.com/docs/embeddings
