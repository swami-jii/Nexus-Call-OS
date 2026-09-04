---
name: knowledge_rag
title: Knowledge Base & FAQ Search RAG
description: Searches enterprise documents, policy guidelines, and clinical/business FAQs for grounded answers.
category: support
icon: BookOpen
triggers:
  - how
  - what is
  - policy
  - faq
  - hours
  - where
  - location
  - rules
  - guidelines
sample_phrase: According to our policy documents, our services operate with 99.98% uptime and support 104+ global languages.
---

# Knowledge Base & FAQ Search RAG Skill

## Objective
Retrieve accurate, factual grounded answers from the enterprise Vector Database and internal knowledge base articles to eliminate hallucination.

## System Prompt Directive
Answer the caller's query strictly using grounded knowledge base snippets. If information is not present in documents, politely clarify and offer to transfer to a human specialist.

## Conversational Guardrails
1. Never guess unverified business policies or pricing.
2. Quote relevant clinic/company policies accurately.
3. Keep explanation concise and optimized for spoken speech.
