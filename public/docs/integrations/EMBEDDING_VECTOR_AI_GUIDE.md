# Embedding & Vector AI Models — Operational Guide

Embedding Models convert raw text documents into **High-Dimensional Numerical Vector Embeddings** for real-time RAG context retrieval.

---

## 🎯 Role in Live Phone Calls & Purpose
Knowledge Base PDFs and website FAQs must be converted into mathematical vector representations so the vector search engine can find relevant answers in <20ms during live calls.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used behind the scenes whenever Knowledge Collections are built, indexed, or queried during live customer conversations.

---

## 💡 Real-World Voice Calling Example
- **Scenario**: Querying clinic policy documents for cancellation fees.
- **Execution**: The embedding model converts the user's question into a 1536-dimensional vector, matches it against vector store chunks using **Cosine Similarity**, and returns the exact snippet to the AI Agent.

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **SSOT Vector Grounding**: Connects OpenAI Embeddings, Cohere, or local HuggingFace BGE engines.
2. **Sub-20ms Search Latency**: Ensures instant context lookup during phone calls.
3. **Flexible Vector Dimensions**: Supports 1536 (Default), 3072 (Large), and 1024 (Multilingual).

---

## 🛠️ Step-by-Step Setup Instructions
1. **Select Provider**: Choose OpenAI Embeddings, Cohere, Google Vertex AI, or Local Ollama.
2. **Input API Key**: Paste API Secret key to auto-fetch live embedding models.
3. **Configure Dimensions**: Select 1536 or 3072 vector dimensions and Cosine Similarity metric.
