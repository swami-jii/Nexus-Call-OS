import os
import httpx
from typing import Any

"""
Dynamic Multi-Provider Model & Voice Registry Service
Queries live provider endpoints dynamically for models and voices.
"""


class DynamicRegistryService:
    @staticmethod
    def get_provider_catalog() -> dict[str, list[dict[str, Any]]]:
        """Single backend source of truth for all provider metadata, documentation URLs, and capabilities."""
        return {
            "llm": [
                # 🟢 1. Free / Free-Tier Friendly Providers
                {"id": "google", "name": "Google AI Studio / Gemini", "description": "Gemini 2.0 Flash / Pro with 1M-2M Context (Free tier available)", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://aistudio.google.com/app/apikey", "docsUrl": "https://ai.google.dev/docs", "dashboardUrl": "https://aistudio.google.com/", "supports_llm": True, "supports_voice": True, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Free Tier Available (60 RPM)", "contextWindow": "1M - 2M Tokens"},
                {"id": "groq", "name": "Groq Cloud", "description": "Ultra-fast LPU inference (Llama 3.3 70B, Qwen 2.5, DeepSeek R1)", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://console.groq.com/keys", "docsUrl": "https://console.groq.com/docs", "dashboardUrl": "https://console.groq.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Generous Free Tier", "contextWindow": "128k Tokens"},
                {"id": "cerebras", "name": "Cerebras Cloud", "description": "World's fastest inference (2000+ tokens/sec on CS-3 Wafer)", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://cloud.cerebras.ai/", "docsUrl": "https://inference-docs.cerebras.ai/", "dashboardUrl": "https://cloud.cerebras.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Free Tier (1M tokens/day)", "contextWindow": "128k Tokens"},
                {"id": "sambanova", "name": "SambaNova Cloud", "description": "Ultra-fast full-precision RDU inference (Llama 3.3 70B & 405B)", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://cloud.sambanova.ai/apis", "docsUrl": "https://docs.sambanova.ai/", "dashboardUrl": "https://cloud.sambanova.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Free Tier Available", "contextWindow": "128k Tokens"},
                {"id": "openrouter", "name": "OpenRouter", "description": "Unified gateway routing to 300+ models & free tier models", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://openrouter.ai/keys", "docsUrl": "https://openrouter.ai/docs", "dashboardUrl": "https://openrouter.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": True, "pricingType": "Free & Low-Cost Routing", "contextWindow": "128k - 2M Tokens"},
                {"id": "mistral", "name": "Mistral AI", "description": "Frontier open models (Mistral Large, Codestral, Pixtral)", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://console.mistral.ai/api-keys/", "docsUrl": "https://docs.mistral.ai/", "dashboardUrl": "https://console.mistral.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": True, "pricingType": "Free Experimentation Tier", "contextWindow": "128k Tokens"},
                {"id": "cohere", "name": "Cohere", "description": "Command R+ & RAG Enterprise Reasoning", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://dashboard.cohere.com/api-keys", "docsUrl": "https://docs.cohere.com/", "dashboardUrl": "https://dashboard.cohere.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": True, "pricingType": "Free Trial API Key", "contextWindow": "128k Tokens"},
                {"id": "cloudflare", "name": "Cloudflare Workers AI", "description": "Serverless edge inference across 300+ cities", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://dash.cloudflare.com/profile/api-tokens", "docsUrl": "https://developers.cloudflare.com/workers-ai/", "dashboardUrl": "https://dash.cloudflare.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "10,000 req/day Free", "contextWindow": "64k Tokens"},
                {"id": "github_models", "name": "GitHub Models / Azure AI", "description": "Free prototyping playground for GPT-4o, Llama 3.3 & Mistral", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://github.com/settings/tokens", "docsUrl": "https://docs.github.com/en/github-models", "dashboardUrl": "https://github.com/marketplace/models", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": True, "pricingType": "Free GitHub Tier", "contextWindow": "128k Tokens"},
                {"id": "huggingface", "name": "Hugging Face Inference", "description": "Serverless Inference API for 100,000+ open-source models", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://huggingface.co/settings/tokens", "docsUrl": "https://huggingface.co/docs/api-inference", "dashboardUrl": "https://huggingface.co/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": True, "pricingType": "Free Community Tier", "contextWindow": "32k - 128k Tokens"},
                {"id": "nvidia", "name": "NVIDIA NIM / API", "description": "Enterprise GPU-accelerated microservices & open models", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://build.nvidia.com/explore/discover", "docsUrl": "https://docs.api.nvidia.com/", "dashboardUrl": "https://build.nvidia.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "1,000 Free Credits", "contextWindow": "128k Tokens"},
                {"id": "chutes", "name": "Chutes AI", "description": "Decentralized high-throughput open model inference", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://chutes.ai/app/keys", "docsUrl": "https://docs.chutes.ai/", "dashboardUrl": "https://chutes.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Free Tier & Low Cost", "contextWindow": "128k Tokens"},
                {"id": "deepinfra", "name": "DeepInfra", "description": "Cost-effective serverless inference for Llama 3 & DeepSeek", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://deepinfra.com/dash/api_keys", "docsUrl": "https://deepinfra.com/docs", "dashboardUrl": "https://deepinfra.com/dash", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Free Trial Credits", "contextWindow": "128k Tokens"},

                # 🟡 2. Trial / Low-Cost / Fast Cloud Providers
                {"id": "together", "name": "Together AI", "description": "Over 200+ open-source models with dedicated endpoints", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://api.together.xyz/settings/api-keys", "docsUrl": "https://docs.together.ai/", "dashboardUrl": "https://api.together.xyz/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "$5-$25 Trial Credits", "contextWindow": "128k Tokens"},
                {"id": "fireworks", "name": "Fireworks AI", "description": "Ultra low-latency production inference engine", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://fireworks.ai/api-keys", "docsUrl": "https://readme.fireworks.ai/", "dashboardUrl": "https://fireworks.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "$1 Free Credits", "contextWindow": "128k Tokens"},
                {"id": "deepseek", "name": "DeepSeek AI", "description": "State-of-the-art DeepSeek-V3 & DeepSeek-R1 reasoning", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://platform.deepseek.com/api_keys", "docsUrl": "https://platform.deepseek.com/api-docs", "dashboardUrl": "https://platform.deepseek.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Ultra Cheap Pay-As-You-Go", "contextWindow": "64k - 128k Tokens"},
                {"id": "alibaba", "name": "Alibaba Cloud / Qwen", "description": "DashScope Qwen 2.5 72B / Max / Plus reasoning suite", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://dashscope.console.aliyun.com/apiKey", "docsUrl": "https://help.aliyun.com/document_detail/2712574.html", "dashboardUrl": "https://dashscope.console.aliyun.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "128k Tokens"},
                {"id": "moonshot", "name": "Moonshot AI / Kimi", "description": "Kimi ultra-long context window reasoning models (128k-2M)", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://platform.moonshot.cn/console/api-keys", "docsUrl": "https://platform.moonshot.cn/docs", "dashboardUrl": "https://platform.moonshot.cn/console", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "128k - 2M Tokens"},
                {"id": "minimax", "name": "MiniMax", "description": "MiniMax-Text-01 & abab6.5 MoE multimodal models", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://platform.minimaxi.com/user-center/basic-information/interface-key", "docsUrl": "https://platform.minimaxi.com/document/fast_start", "dashboardUrl": "https://platform.minimaxi.com/", "supports_llm": True, "supports_voice": True, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "128k - 1M Tokens"},
                {"id": "perplexity", "name": "Perplexity AI", "description": "Live search-augmented reasoning (Sonar Online & Reasoning Pro)", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://www.perplexity.ai/settings/api", "docsUrl": "https://docs.perplexity.ai/", "dashboardUrl": "https://www.perplexity.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Pay-per-token API", "contextWindow": "128k Tokens"},
                {"id": "ai21", "name": "AI21 Labs", "description": "Jamba 1.5 Large / Mini SSM-Transformer Hybrid models", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://studio.ai21.com/account/api-key", "docsUrl": "https://docs.ai21.com/", "dashboardUrl": "https://studio.ai21.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "$10 Free Trial Credits", "contextWindow": "256k Tokens"},
                {"id": "nebius", "name": "Nebius AI Studio", "description": "High-performance European GPU cloud inference", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://studio.nebius.ai/settings/api-keys", "docsUrl": "https://docs.nebius.ai/", "dashboardUrl": "https://studio.nebius.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Trial Credits Available", "contextWindow": "128k Tokens"},
                {"id": "novita", "name": "Novita AI", "description": "Low latency open-source LLM inference & image API", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://novita.ai/settings/key-management", "docsUrl": "https://novita.ai/docs", "dashboardUrl": "https://novita.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "128k Tokens"},
                {"id": "siliconflow", "name": "SiliconFlow", "description": "SiliconCloud high-speed inference for Qwen, DeepSeek & Llama", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://cloud.siliconflow.cn/account/ak", "docsUrl": "https://docs.siliconflow.cn/", "dashboardUrl": "https://cloud.siliconflow.cn/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "20M Free Tokens", "contextWindow": "128k Tokens"},
                {"id": "aiml_api", "name": "AIML API", "description": "200+ AI models accessible via one unified OpenAI-compatible key", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://aimlapi.com/app/keys", "docsUrl": "https://docs.aimlapi.com/", "dashboardUrl": "https://aimlapi.com/", "supports_llm": True, "supports_voice": True, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Free Trial Balance", "contextWindow": "128k Tokens"},
                {"id": "portkey", "name": "Portkey AI Gateway", "description": "Enterprise AI routing, caching, fallbacks & observability", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://app.portkey.ai/", "docsUrl": "https://docs.portkey.ai/", "dashboardUrl": "https://app.portkey.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Free Developer Plan", "contextWindow": "Multi-Provider"},
                {"id": "litellm", "name": "LiteLLM Proxy", "description": "Unified 100+ LLMs proxy with load balancing & rate limits", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://docs.litellm.ai/docs/proxy/quick_start", "docsUrl": "https://docs.litellm.ai/", "dashboardUrl": "http://localhost:4000/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Open Source & Hosted", "contextWindow": "Multi-Provider"},
                {"id": "featherless", "name": "Featherless AI", "description": "1,000+ open-source models available instantly on demand", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://featherless.ai/keys", "docsUrl": "https://featherless.ai/docs", "dashboardUrl": "https://featherless.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Pay-per-token API", "contextWindow": "128k Tokens"},
                {"id": "hyperbolic", "name": "Hyperbolic AI", "description": "Decentralized GPU inference network with high speed", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://app.hyperbolic.xyz/settings", "docsUrl": "https://docs.hyperbolic.xyz/", "dashboardUrl": "https://app.hyperbolic.xyz/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "$10 Free Credits", "contextWindow": "128k Tokens"},
                {"id": "friendliai", "name": "FriendliAI", "description": "Ultra-fast Friendli Engine for generative AI serving", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://suite.friendli.ai/settings/tokens", "docsUrl": "https://docs.friendli.ai/", "dashboardUrl": "https://suite.friendli.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "128k Tokens"},
                {"id": "upstage", "name": "Upstage AI", "description": "Solar Pro 22B LLM & Document Intelligence", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://console.upstage.ai/api-keys", "docsUrl": "https://developers.upstage.ai/docs", "dashboardUrl": "https://console.upstage.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "64k Tokens"},
                {"id": "predibase", "name": "Predibase", "description": "High-throughput fine-tuned LoRA model serving", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://app.predibase.com/settings/api-tokens", "docsUrl": "https://docs.predibase.com/", "dashboardUrl": "https://app.predibase.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Free Developer Tier", "contextWindow": "128k Tokens"},
                {"id": "lemonfox", "name": "Lemonfox AI", "description": "Cost-effective OpenAI-compatible API for open models", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://www.lemonfox.ai/dashboard", "docsUrl": "https://www.lemonfox.ai/docs", "dashboardUrl": "https://www.lemonfox.ai/", "supports_llm": True, "supports_voice": True, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Low Cost Pay-as-you-go", "contextWindow": "128k Tokens"},
                {"id": "replicate", "name": "Replicate", "description": "Cloud API to run thousands of open-source models", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://replicate.com/account/api-tokens", "docsUrl": "https://replicate.com/docs", "dashboardUrl": "https://replicate.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Pay-per-second API", "contextWindow": "128k Tokens"},
                {"id": "anyscale", "name": "Anyscale Endpoints", "description": "Production Ray-powered LLM serving platform", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://app.endpoints.anyscale.com/credentials", "docsUrl": "https://docs.endpoints.anyscale.com/", "dashboardUrl": "https://app.endpoints.anyscale.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Trial Credits", "contextWindow": "128k Tokens"},
                {"id": "modal", "name": "Modal Labs", "description": "Serverless GPU LLM inference infrastructure", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://modal.com/settings", "docsUrl": "https://modal.com/docs", "dashboardUrl": "https://modal.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "$30/mo Free Compute", "contextWindow": "128k Tokens"},
                {"id": "baseten", "name": "Baseten", "description": "High performance dedicated model deployment & serving", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://app.baseten.co/settings/api_keys", "docsUrl": "https://docs.baseten.co/", "dashboardUrl": "https://app.baseten.co/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "$30 Free Credits", "contextWindow": "128k Tokens"},
                {"id": "runpod", "name": "RunPod Serverless", "description": "Serverless GPU vLLM worker endpoints", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://www.runpod.io/console/serverless/user/settings", "docsUrl": "https://docs.runpod.io/", "dashboardUrl": "https://www.runpod.io/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Pay-as-you-go GPU", "contextWindow": "128k Tokens"},
                {"id": "lambda", "name": "Lambda Cloud", "description": "High performance AI GPU inference cloud", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://cloud.lambdalabs.com/api-keys", "docsUrl": "https://docs.lambdalabs.com/", "dashboardUrl": "https://cloud.lambdalabs.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Pay-per-hour GPU", "contextWindow": "128k Tokens"},
                {"id": "digitalocean", "name": "DigitalOcean Gradient AI", "description": "Managed GenAI inference platform & serverless endpoints", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://cloud.digitalocean.com/account/api/tokens", "docsUrl": "https://docs.digitalocean.com/products/gradient/", "dashboardUrl": "https://cloud.digitalocean.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "$200 Trial Credits", "contextWindow": "128k Tokens"},
                {"id": "nscale", "name": "Nscale Cloud AI", "description": "European GPU cloud specialized in LLM inference", "category": "cloud", "group": "credits_low_cost", "apiKeyUrl": "https://nscale.com/", "docsUrl": "https://docs.nscale.com/", "dashboardUrl": "https://nscale.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Cloud Credits", "contextWindow": "128k Tokens"},
                {"id": "vercel_ai", "name": "Vercel AI Gateway", "description": "Unified edge AI gateway with multi-provider routing", "category": "cloud", "group": "free_tier", "apiKeyUrl": "https://vercel.com/account/tokens", "docsUrl": "https://sdk.vercel.ai/docs", "dashboardUrl": "https://vercel.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Free Hobby Tier", "contextWindow": "Multi-Provider"},

                # 🔵 3. Major Frontier & Proprietary Labs
                {"id": "openai", "name": "OpenAI", "description": "GPT-4o, GPT-4o-mini, o1, and o3-mini frontier intelligence", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://platform.openai.com/api-keys", "docsUrl": "https://platform.openai.com/docs", "dashboardUrl": "https://platform.openai.com/", "supports_llm": True, "supports_voice": True, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Pay-per-token API", "contextWindow": "128k Tokens"},
                {"id": "anthropic", "name": "Anthropic", "description": "Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://console.anthropic.com/settings/keys", "docsUrl": "https://docs.anthropic.com/", "dashboardUrl": "https://console.anthropic.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Pay-per-token API", "contextWindow": "200k Tokens"},
                {"id": "xai", "name": "xAI (Grok)", "description": "Grok-2 & Grok-2 Vision real-time frontier reasoning", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://console.x.ai/", "docsUrl": "https://docs.x.ai/", "dashboardUrl": "https://console.x.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "$25/mo Tier / Pay-per-token", "contextWindow": "128k Tokens"},
                {"id": "azure_openai", "name": "Azure OpenAI / AI Foundry", "description": "Enterprise SLA GPT-4o, o1, and Microsoft Phi models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://portal.azure.com/", "docsUrl": "https://learn.microsoft.com/azure/ai-services/openai/", "dashboardUrl": "https://portal.azure.com/", "supports_llm": True, "supports_voice": True, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "Enterprise Azure Billing", "contextWindow": "128k Tokens"},
                {"id": "aws_bedrock", "name": "AWS Bedrock", "description": "Amazon Bedrock foundation models (Claude, Nova, Llama)", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://console.aws.amazon.com/bedrock/", "docsUrl": "https://docs.aws.amazon.com/bedrock/", "dashboardUrl": "https://console.aws.amazon.com/bedrock/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "AWS Cloud Billing", "contextWindow": "200k Tokens"},
                {"id": "google_vertex", "name": "Google Vertex AI", "description": "Enterprise Gemini 1.5 / 2.0 Pro with VPC & IAM security", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://console.cloud.google.com/vertex-ai", "docsUrl": "https://cloud.google.com/vertex-ai/docs", "dashboardUrl": "https://console.cloud.google.com/vertex-ai", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Google Cloud Billing", "contextWindow": "1M - 2M Tokens"},
                {"id": "ibm_watsonx", "name": "IBM watsonx.ai", "description": "IBM Granite & enterprise foundational models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://cloud.ibm.com/iam/apikeys", "docsUrl": "https://dataplatform.cloud.ibm.com/docs", "dashboardUrl": "https://cloud.ibm.com/watsonx", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Enterprise IBM Cloud", "contextWindow": "128k Tokens"},
                {"id": "oracle_ai", "name": "Oracle Cloud Generative AI", "description": "OCI enterprise Cohere & Llama dedicated inference", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://cloud.oracle.com/", "docsUrl": "https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm", "dashboardUrl": "https://cloud.oracle.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Oracle Cloud Billing", "contextWindow": "128k Tokens"},
                {"id": "databricks", "name": "Databricks Mosaic AI", "description": "DBRX & enterprise secure model serving endpoints", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://databricks.com/", "docsUrl": "https://docs.databricks.com/en/generative-ai/generative-ai.html", "dashboardUrl": "https://databricks.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Databricks DBUs", "contextWindow": "128k Tokens"},
                {"id": "snowflake", "name": "Snowflake Cortex AI", "description": "Secure serverless LLM functions running on enterprise data", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://snowflake.com/", "docsUrl": "https://docs.snowflake.com/en/user-guide/snowflake-cortex/llm-functions", "dashboardUrl": "https://snowflake.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Snowflake Credits", "contextWindow": "128k Tokens"},
                {"id": "writer", "name": "Writer Palmyra", "description": "Enterprise Palmyra-X & Palmyra-Med reasoning models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://app.writer.com/admin/api-keys", "docsUrl": "https://dev.writer.com/", "dashboardUrl": "https://app.writer.com/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Enterprise Tier", "contextWindow": "128k Tokens"},
                {"id": "aleph_alpha", "name": "Aleph Alpha", "description": "European sovereign Luminous enterprise AI models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://app.aleph-alpha.com/keys", "docsUrl": "https://docs.aleph-alpha.com/", "dashboardUrl": "https://app.aleph-alpha.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Pay-per-token API", "contextWindow": "64k Tokens"},
                {"id": "zhipu", "name": "Zhipu AI (GLM)", "description": "GLM-4 & GLM-4-Flash bilingual Chinese-English models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://open.bigmodel.cn/usercenter/apikeys", "docsUrl": "https://open.bigmodel.cn/dev/api", "dashboardUrl": "https://open.bigmodel.cn/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "128k Tokens"},
                {"id": "01_ai", "name": "01.AI (Yi)", "description": "Yi-Lightning & Yi-Large high-performance LLMs", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://platform.01.ai/api-keys", "docsUrl": "https://platform.01.ai/docs", "dashboardUrl": "https://platform.01.ai/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Trial Balance", "contextWindow": "128k Tokens"},
                {"id": "tencent_hunyuan", "name": "Tencent Hunyuan", "description": "Tencent Hunyuan-Large & Hunyuan-Pro frontier models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://console.cloud.tencent.com/hunyuan", "docsUrl": "https://cloud.tencent.com/document/product/1729", "dashboardUrl": "https://console.cloud.tencent.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Free Trial Credits", "contextWindow": "256k Tokens"},
                {"id": "baidu_qianfan", "name": "Baidu Qianfan / ERNIE", "description": "ERNIE 4.0 Turbo & Speed high-concurrency enterprise models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://console.bce.baidu.com/qianfan/ais/console/onlineService", "docsUrl": "https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html", "dashboardUrl": "https://console.bce.baidu.com/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": False, "streaming": True, "is_free": False, "pricingType": "Free Trial Quota", "contextWindow": "128k Tokens"},
                {"id": "bytedance_doubao", "name": "ByteDance Doubao", "description": "Volcano Engine Doubao-pro & Doubao-lite low-cost models", "category": "cloud", "group": "frontier", "apiKeyUrl": "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey", "docsUrl": "https://www.volcengine.com/docs/82379/1099475", "dashboardUrl": "https://console.volcengine.com/ark", "supports_llm": True, "supports_voice": True, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": False, "pricingType": "500k Free Tokens", "contextWindow": "128k Tokens"},

                # 🖥️ 4. Local Hardware & Self-Hosted Engines
                {"id": "ollama", "name": "Ollama Server", "description": "Local offline LLM runner (Llama 3, DeepSeek-R1, Mistral)", "category": "local", "group": "local", "apiKeyUrl": "https://ollama.com/", "docsUrl": "https://github.com/ollama/ollama", "dashboardUrl": "http://localhost:11434/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "100% Free & Local", "contextWindow": "Configurable (32k-128k)"},
                {"id": "lm_studio", "name": "LM Studio", "description": "Local GUI model server with OpenAI-compatible API", "category": "local", "group": "local", "apiKeyUrl": "https://lmstudio.ai/", "docsUrl": "https://lmstudio.ai/docs", "dashboardUrl": "http://localhost:1234/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "100% Free & Local", "contextWindow": "Local GPU/CPU"},
                {"id": "vllm", "name": "vLLM Server", "description": "High-throughput PagedAttention inference engine", "category": "local", "group": "local", "apiKeyUrl": "https://github.com/vllm-project/vllm", "docsUrl": "https://docs.vllm.ai/", "dashboardUrl": "http://localhost:8000/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "100% Free & Local", "contextWindow": "Local GPU"},
                {"id": "localai", "name": "LocalAI Engine", "description": "Drop-in OpenAI replacement for local CPU/GPU machines", "category": "local", "group": "local", "apiKeyUrl": "https://localai.io/", "docsUrl": "https://localai.io/basics/getting_started/", "dashboardUrl": "http://localhost:8080/", "supports_llm": True, "supports_voice": True, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "100% Free & Local", "contextWindow": "Local CPU/GPU"},
                {"id": "textgen_webui", "name": "TextGen WebUI", "description": "Oobabooga WebUI OpenAI API extension", "category": "local", "group": "local", "apiKeyUrl": "https://github.com/oobabooga/text-generation-webui", "docsUrl": "https://github.com/oobabooga/text-generation-webui", "dashboardUrl": "http://localhost:5000/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "100% Free & Local", "contextWindow": "Local GPU"},
                {"id": "jan", "name": "Jan.ai Local Server", "description": "Open source alternative to ChatGPT running 100% offline", "category": "local", "group": "local", "apiKeyUrl": "https://jan.ai/", "docsUrl": "https://jan.ai/docs", "dashboardUrl": "http://localhost:1337/", "supports_llm": True, "supports_voice": False, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "100% Free & Local", "contextWindow": "Local Hardware"},
                {"id": "openai_compatible", "name": "Custom OpenAI-Compatible", "description": "Any self-hosted or proxy endpoint implementing /v1/chat/completions", "category": "local", "group": "local", "apiKeyUrl": "", "docsUrl": "https://platform.openai.com/docs/api-reference", "dashboardUrl": "http://localhost:8000/", "supports_llm": True, "supports_voice": False, "supports_vision": True, "supports_realtime": True, "streaming": True, "is_free": True, "pricingType": "Custom Endpoint", "contextWindow": "Dynamic"}
            ],
            "voice": [
                {"id": "elevenlabs", "name": "ElevenLabs Conversational TTS", "description": "Hyper-realistic voice synthesis for AI calling", "category": "cloud", "apiKeyUrl": "https://elevenlabs.io/app/settings/api-keys", "docsUrl": "https://elevenlabs.io/docs/api-reference", "dashboardUrl": "https://elevenlabs.io/app/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "cartesia", "name": "Cartesia Sonic (Ultra Fast Stream)", "description": "Ultra low-latency streaming speech model (<100ms)", "category": "cloud", "apiKeyUrl": "https://play.cartesia.ai/console", "docsUrl": "https://docs.cartesia.ai/", "dashboardUrl": "https://play.cartesia.ai/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "deepgram_aura", "name": "Deepgram Aura Conversational", "description": "Purpose-built real-time conversational TTS for phone calls", "category": "cloud", "apiKeyUrl": "https://console.deepgram.com/project/keys", "docsUrl": "https://developers.deepgram.com/", "dashboardUrl": "https://console.deepgram.com/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "openai_tts", "name": "OpenAI Voice TTS", "description": "GPT-4o realtime voice output suite", "category": "cloud", "apiKeyUrl": "https://platform.openai.com/api-keys", "docsUrl": "https://platform.openai.com/docs/guides/text-to-speech", "dashboardUrl": "https://platform.openai.com/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "playht", "name": "PlayHT 2.0 Turbo Realtime", "description": "Low-latency streaming voice API for telephony AI", "category": "cloud", "apiKeyUrl": "https://play.ht/studio/api-access", "docsUrl": "https://docs.play.ht/", "dashboardUrl": "https://play.ht/studio/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "amazon_polly", "name": "Amazon Polly Neural TTS", "description": "AWS Cloud Neural speech synthesizer", "category": "cloud", "apiKeyUrl": "https://console.aws.amazon.com/polly/", "docsUrl": "https://docs.aws.amazon.com/polly/", "dashboardUrl": "https://console.aws.amazon.com/polly/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "fish_audio", "name": "Fish Audio Realtime TTS", "description": "High quality real-time voice synthesis and cloning", "category": "cloud", "apiKeyUrl": "https://fish.audio/developer/api-keys", "docsUrl": "https://docs.fish.audio/", "dashboardUrl": "https://fish.audio/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "google_tts", "name": "Google Cloud Neural2 / Journey", "description": "Hyper-realistic Journey & Neural2 voices", "category": "cloud", "apiKeyUrl": "https://console.cloud.google.com/apis/credentials", "docsUrl": "https://cloud.google.com/text-to-speech/docs", "dashboardUrl": "https://console.cloud.google.com/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "azure_speech", "name": "Azure Cognitive Speech TTS", "description": "Microsoft Neural TTS calling voices", "category": "cloud", "apiKeyUrl": "https://portal.azure.com/", "docsUrl": "https://learn.microsoft.com/azure/ai-services/speech-service/", "dashboardUrl": "https://portal.azure.com/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "minimax", "name": "MiniMax Speech-01 TTS", "description": "Expressive state-of-the-art speech synthesis", "category": "cloud", "apiKeyUrl": "https://platform.minimaxi.com/user-center/basic-information/interface-key", "docsUrl": "https://platform.minimaxi.com/document/fast_start", "dashboardUrl": "https://platform.minimaxi.com/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "lmnt", "name": "LMNT Realtime Speech Synthesizer", "description": "Fast conversational speech synthesizer built for AI agents", "category": "cloud", "apiKeyUrl": "https://app.lmnt.com/account", "docsUrl": "https://docs.lmnt.com/", "dashboardUrl": "https://app.lmnt.com/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "piper", "name": "Local Piper C++ Engine", "description": "Ultra fast local lightweight TTS engine", "category": "local", "apiKeyUrl": "https://github.com/rhasspy/piper", "docsUrl": "https://github.com/rhasspy/piper", "dashboardUrl": "http://localhost:5000/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True},
                {"id": "kokoro", "name": "Kokoro 82M Ultra Light TTS", "description": "Open source 82M CPU voice engine", "category": "local", "apiKeyUrl": "https://github.com/hexgrad/kokoro", "docsUrl": "https://github.com/hexgrad/kokoro", "dashboardUrl": "http://localhost:8880/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True},
                {"id": "coqui", "name": "Local Coqui XTTS-v2 Engine", "description": "Local multi-lingual GPU voice cloning engine", "category": "local", "apiKeyUrl": "https://coqui.ai/", "docsUrl": "https://docs.coqui.ai/", "dashboardUrl": "http://localhost:8020/", "supports_llm": False, "supports_voice": True, "supports_vision": False, "supports_realtime": True, "streaming": True, "is_free": True}
            ],
            "stt": [
                {"id": "deepgram", "name": "Deepgram Nova-2 Realtime STT", "description": "Real-time low-latency speech transcription", "category": "cloud", "apiKeyUrl": "https://console.deepgram.com/project/keys", "docsUrl": "https://developers.deepgram.com/", "dashboardUrl": "https://console.deepgram.com/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "openai_whisper", "name": "OpenAI Whisper Cloud STT", "description": "OpenAI Whisper speech recognition API", "category": "cloud", "apiKeyUrl": "https://platform.openai.com/api-keys", "docsUrl": "https://platform.openai.com/docs/guides/speech-to-text", "dashboardUrl": "https://platform.openai.com/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": False, "streaming": False, "is_free": False},
                {"id": "assemblyai", "name": "AssemblyAI Conformer-2 Realtime", "description": "Realtime speech-to-text with speaker diarization", "category": "cloud", "apiKeyUrl": "https://www.assemblyai.com/app/account", "docsUrl": "https://docs.assemblyai.com/", "dashboardUrl": "https://www.assemblyai.com/app/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "google_speech", "name": "Google Cloud Speech-to-Text v2", "description": "Google Cloud telephony transcription engine", "category": "cloud", "apiKeyUrl": "https://console.cloud.google.com/speech", "docsUrl": "https://cloud.google.com/speech-to-text/docs", "dashboardUrl": "https://console.cloud.google.com/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "azure_speech_stt", "name": "Azure Speech Recognition", "description": "Microsoft Cognitive Speech-to-Text", "category": "cloud", "apiKeyUrl": "https://portal.azure.com/", "docsUrl": "https://learn.microsoft.com/azure/ai-services/speech-service/", "dashboardUrl": "https://portal.azure.com/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "groq_whisper", "name": "Groq LPU Whisper Large v3", "description": "Ultra fast LPU-accelerated Whisper transcription", "category": "cloud", "apiKeyUrl": "https://console.groq.com/keys", "docsUrl": "https://console.groq.com/docs", "dashboardUrl": "https://console.groq.com/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": False},
                {"id": "faster_whisper", "name": "Faster Whisper (GPU Native)", "description": "Local CTranslate2 Whisper implementation", "category": "local", "apiKeyUrl": "https://github.com/SYSTRAN/faster-whisper", "docsUrl": "https://github.com/SYSTRAN/faster-whisper", "dashboardUrl": "http://localhost:8000/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": True},
                {"id": "whisper_cpp", "name": "Whisper.cpp Light Engine", "description": "High performance local C/C++ Whisper engine", "category": "local", "apiKeyUrl": "https://github.com/ggerganov/whisper.cpp", "docsUrl": "https://github.com/ggerganov/whisper.cpp", "dashboardUrl": "http://localhost:8080/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": True},
                {"id": "nvidia_riva", "name": "NVIDIA Riva Speech Skills (GPU)", "description": "Enterprise GPU-accelerated speech ASR", "category": "local", "apiKeyUrl": "https://developer.nvidia.com/riva", "docsUrl": "https://docs.nvidia.com/deeplearning/riva/", "dashboardUrl": "http://localhost:50051/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": True},
                {"id": "vosk", "name": "Vosk Offline Speech Engine", "description": "Lightweight offline speech recognition toolkit", "category": "local", "apiKeyUrl": "https://alphacephei.com/vosk/", "docsUrl": "https://alphacephei.com/vosk/models", "dashboardUrl": "http://localhost:2700/", "supports_llm": False, "supports_voice": False, "supports_stt": True, "supports_realtime": True, "streaming": True, "is_free": True}
            ],
            "vad": [
                {"id": "silero_vad", "name": "Silero VAD v5 Native", "description": "Ultra fast low-latency neural voice activity detector", "category": "local", "apiKeyUrl": "", "docsUrl": "https://github.com/snakers4/silero-vad", "dashboardUrl": "http://localhost:8000/", "supports_vad": True, "is_free": True},
                {"id": "webrtc_vad", "name": "WebRTC VAD Engine", "description": "Standard C++ GMM voice activity detector", "category": "local", "apiKeyUrl": "", "docsUrl": "https://webrtc.org/", "dashboardUrl": "http://localhost:8000/", "supports_vad": True, "is_free": True},
                {"id": "deepgram_vad", "name": "Deepgram Live VAD Stream", "description": "Realtime cloud silence & speech chunking VAD", "category": "cloud", "apiKeyUrl": "https://console.deepgram.com/", "docsUrl": "https://developers.deepgram.com/", "dashboardUrl": "https://console.deepgram.com/", "supports_vad": True, "is_free": False},
                {"id": "krisp_ai", "name": "Krisp AI Noise Suppression", "description": "Enterprise background noise & echo cancellation VAD", "category": "cloud", "apiKeyUrl": "https://krisp.ai/", "docsUrl": "https://krisp.ai/docs", "dashboardUrl": "https://krisp.ai/", "supports_vad": True, "is_free": False}
            ],
            "embeddings": [
                {"id": "openai_embeddings", "name": "OpenAI Text-Embedding-3", "description": "Text-Embedding-3-small and text-embedding-3-large models", "category": "cloud", "apiKeyUrl": "https://platform.openai.com/api-keys", "docsUrl": "https://platform.openai.com/docs/guides/embeddings", "dashboardUrl": "https://platform.openai.com/", "supports_embeddings": True, "is_free": False},
                {"id": "cohere_embed", "name": "Cohere Embed v3 Multilingual", "description": "Multilingual vector search & reranking embeddings", "category": "cloud", "apiKeyUrl": "https://dashboard.cohere.com/api-keys", "docsUrl": "https://docs.cohere.com/docs/embeddings", "dashboardUrl": "https://dashboard.cohere.com/", "supports_embeddings": True, "is_free": False},
                {"id": "google_vertex_embed", "name": "Google Vertex AI Embeddings", "description": "Gecko multimodal & text embeddings for RAG", "category": "cloud", "apiKeyUrl": "https://console.cloud.google.com/vertex-ai", "docsUrl": "https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings", "dashboardUrl": "https://console.cloud.google.com/", "supports_embeddings": True, "is_free": False},
                {"id": "voyage_ai", "name": "Voyage AI Domain Embeddings", "description": "High accuracy code & finance vector embeddings", "category": "cloud", "apiKeyUrl": "https://dash.voyageai.com/api-keys", "docsUrl": "https://docs.voyageai.com/", "dashboardUrl": "https://dash.voyageai.com/", "supports_embeddings": True, "is_free": False},
                {"id": "local_bge", "name": "HuggingFace Local BGE Embedder", "description": "Fast CPU/GPU local vector embedding engine", "category": "local", "apiKeyUrl": "", "docsUrl": "https://huggingface.co/BAAI/bge-large-en-v1.5", "dashboardUrl": "http://localhost:8000/", "supports_embeddings": True, "is_free": True}
            ],
            "moderation": [
                {"id": "llama_guard", "name": "Llama Guard 3 Safety", "description": "Meta Llama Guard enterprise prompt safety & moderation", "category": "cloud", "apiKeyUrl": "https://console.groq.com/keys", "docsUrl": "https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-3/", "dashboardUrl": "https://console.groq.com/", "supports_moderation": True, "is_free": False},
                {"id": "openai_moderation", "name": "OpenAI Omni Moderation API", "description": "Multimodal speech & text safety moderation", "category": "cloud", "apiKeyUrl": "https://platform.openai.com/api-keys", "docsUrl": "https://platform.openai.com/docs/guides/moderation", "dashboardUrl": "https://platform.openai.com/", "supports_moderation": True, "is_free": False},
                {"id": "lakera_guard", "name": "Lakera Guard AI Security", "description": "Real-time prompt injection & PII data loss prevention", "category": "cloud", "apiKeyUrl": "https://platform.lakera.ai/", "docsUrl": "https://docs.lakera.ai/", "dashboardUrl": "https://platform.lakera.ai/", "supports_moderation": True, "is_free": False}
            ],
            "translation": [
                {"id": "deepl", "name": "DeepL Pro Realtime Translation", "description": "High fidelity multi-lingual telephony speech translator", "category": "cloud", "apiKeyUrl": "https://www.deepl.com/pro-api", "docsUrl": "https://www.deepl.com/docs-api", "dashboardUrl": "https://www.deepl.com/your-account/keys", "supports_translation": True, "is_free": False},
                {"id": "azure_translator", "name": "Azure AI Speech Translator", "description": "Microsoft Cognitive multi-lingual call translation", "category": "cloud", "apiKeyUrl": "https://portal.azure.com/", "docsUrl": "https://learn.microsoft.com/azure/ai-services/translator/", "dashboardUrl": "https://portal.azure.com/", "supports_translation": True, "is_free": False},
                {"id": "google_translate", "name": "Google Cloud Translation v3", "description": "Neural translation engine for global call centers", "category": "cloud", "apiKeyUrl": "https://console.cloud.google.com/apis/credentials", "docsUrl": "https://cloud.google.com/translate/docs", "dashboardUrl": "https://console.cloud.google.com/", "supports_translation": True, "is_free": False}
            ],
            "ocr": [
                {"id": "unstructured_io", "name": "Unstructured.io Document AI", "description": "Structural PDF, table, and form layout extraction engine", "category": "cloud", "apiKeyUrl": "https://unstructured.io/", "docsUrl": "https://docs.unstructured.io/", "dashboardUrl": "https://unstructured.io/", "supports_ocr": True, "is_free": False},
                {"id": "azure_doc_intelligence", "name": "Azure Document Intelligence", "description": "Microsoft Cognitive form, invoice, and passport parser", "category": "cloud", "apiKeyUrl": "https://portal.azure.com/", "docsUrl": "https://learn.microsoft.com/azure/ai-services/document-intelligence/", "dashboardUrl": "https://portal.azure.com/", "supports_ocr": True, "is_free": False},
                {"id": "amazon_textract", "name": "Amazon Textract Document OCR", "description": "AWS Cloud table and key-value pair OCR extractor", "category": "cloud", "apiKeyUrl": "https://console.aws.amazon.com/textract/", "docsUrl": "https://docs.aws.amazon.com/textract/", "dashboardUrl": "https://console.aws.amazon.com/", "supports_ocr": True, "is_free": False},
                {"id": "llama_parse", "name": "LlamaParse Structural OCR", "description": "Complex table-to-markdown document parser for RAG", "category": "cloud", "apiKeyUrl": "https://cloud.llamaindex.ai/", "docsUrl": "https://docs.cloud.llamaindex.ai/", "dashboardUrl": "https://cloud.llamaindex.ai/", "supports_ocr": True, "is_free": False},
                {"id": "local_tesseract", "name": "Tesseract Local C++ OCR", "description": "Local CPU lightweight document image OCR engine", "category": "local", "apiKeyUrl": "", "docsUrl": "https://github.com/tesseract-ocr/tesseract", "dashboardUrl": "http://localhost:8000/", "supports_ocr": True, "is_free": True}
            ],
            "vision": [
                {"id": "gpt4o_vision", "name": "GPT-4o Multimodal Vision", "description": "High resolution image understanding & UI bounding box analysis", "category": "cloud", "apiKeyUrl": "https://platform.openai.com/api-keys", "docsUrl": "https://platform.openai.com/docs/guides/vision", "dashboardUrl": "https://platform.openai.com/", "supports_vision": True, "is_free": False},
                {"id": "claude_vision", "name": "Claude 3.5 Sonnet Vision", "description": "Document layout, chart, and diagram reasoning", "category": "cloud", "apiKeyUrl": "https://console.anthropic.com/settings/keys", "docsUrl": "https://docs.anthropic.com/en/docs/build-with-claude/vision", "dashboardUrl": "https://console.anthropic.com/", "supports_vision": True, "is_free": False},
                {"id": "gemini_vision", "name": "Gemini 2.0 Flash Vision", "description": "Realtime video stream and multi-image vision", "category": "cloud", "apiKeyUrl": "https://aistudio.google.com/app/apikey", "docsUrl": "https://ai.google.dev/docs/vision", "dashboardUrl": "https://aistudio.google.com/", "supports_vision": True, "is_free": False},
                {"id": "pixtral_vision", "name": "Mistral Pixtral 12B Vision", "description": "Open weights multi-image vision & document understanding", "category": "cloud", "apiKeyUrl": "https://console.mistral.ai/api-keys/", "docsUrl": "https://docs.mistral.ai/", "dashboardUrl": "https://console.mistral.ai/", "supports_vision": True, "is_free": False}
            ],
            "vision_doc": [
                {"id": "gpt4o_vision", "name": "GPT-4o Multimodal Vision", "description": "High resolution image understanding & UI bounding box analysis", "category": "cloud", "apiKeyUrl": "https://platform.openai.com/api-keys", "docsUrl": "https://platform.openai.com/docs/guides/vision", "dashboardUrl": "https://platform.openai.com/", "supports_vision": True, "is_free": False},
                {"id": "claude_vision", "name": "Claude 3.5 Sonnet Vision", "description": "Document layout, chart, and diagram reasoning", "category": "cloud", "apiKeyUrl": "https://console.anthropic.com/settings/keys", "docsUrl": "https://docs.anthropic.com/en/docs/build-with-claude/vision", "dashboardUrl": "https://console.anthropic.com/", "supports_vision": True, "is_free": False},
                {"id": "unstructured_io", "name": "Unstructured.io Document AI", "description": "Structural PDF, table, and form layout extraction engine", "category": "cloud", "apiKeyUrl": "https://unstructured.io/", "docsUrl": "https://docs.unstructured.io/", "dashboardUrl": "https://unstructured.io/", "supports_ocr": True, "is_free": False},
                {"id": "azure_doc_intelligence", "name": "Azure Document Intelligence", "description": "Microsoft Cognitive form, invoice, and passport parser", "category": "cloud", "apiKeyUrl": "https://portal.azure.com/", "docsUrl": "https://learn.microsoft.com/azure/ai-services/document-intelligence/", "dashboardUrl": "https://portal.azure.com/", "supports_ocr": True, "is_free": False},
                {"id": "amazon_textract", "name": "Amazon Textract Document OCR", "description": "AWS Cloud table and key-value pair OCR extractor", "category": "cloud", "apiKeyUrl": "https://console.aws.amazon.com/textract/", "docsUrl": "https://docs.aws.amazon.com/textract/", "dashboardUrl": "https://console.aws.amazon.com/", "supports_ocr": True, "is_free": False},
                {"id": "llama_parse", "name": "LlamaParse Structural OCR", "description": "Complex table-to-markdown document parser for RAG", "category": "cloud", "apiKeyUrl": "https://cloud.llamaindex.ai/", "docsUrl": "https://docs.cloud.llamaindex.ai/", "dashboardUrl": "https://cloud.llamaindex.ai/", "supports_ocr": True, "is_free": False},
                {"id": "local_tesseract", "name": "Tesseract Local C++ OCR", "description": "Local CPU lightweight document image OCR engine", "category": "local", "apiKeyUrl": "", "docsUrl": "https://github.com/tesseract-ocr/tesseract", "dashboardUrl": "http://localhost:8000/", "supports_ocr": True, "is_free": True}
            ]
        }
    @staticmethod
    def resolve_endpoint(provider: str, custom_endpoint: str | None = None) -> str:
        """Single backend source of truth for resolving provider default local/remote endpoints."""
        target = (custom_endpoint or "").strip()
        if target:
            return target
        p = provider.lower().strip()
        defaults = {
            "ollama": "http://localhost:11434",
            "lmstudio": "http://localhost:1234/v1",
            "lm_studio": "http://localhost:1234/v1",
            "localai": "http://localhost:8080/v1",
            "vllm": "http://localhost:8000/v1",
            "textgen_webui": "http://localhost:5000/v1",
            "piper": "http://localhost:5000",
            "coqui": "http://localhost:5002",
            "xtts": "http://localhost:5002",
            "kokoro": "http://localhost:8880",
            "whisper_local": "http://localhost:9000",
        }
        return defaults.get(p, "http://localhost:11434")

    @staticmethod
    async def get_llm_models(provider: str, api_key: str | None = None, endpoint: str | None = None) -> list[dict[str, Any]]:
        """
        Dynamically query live provider REST model discovery endpoints using credentials.
        Zero hardcoded models - queries live provider API dynamically.
        """
        p = provider.lower().strip()
        models = []
        clean_key = (api_key or "").strip()
        if "•" in clean_key or "*" in clean_key or "..." in clean_key:
            clean_key = ""

        # Endpoint mappings for major cloud providers
        CLOUD_MODEL_ENDPOINTS = {
            "google": {"url": "https://generativelanguage.googleapis.com/v1beta/models?key={key}", "type": "google", "env": "GEMINI_API_KEY"},
            "gemini": {"url": "https://generativelanguage.googleapis.com/v1beta/models?key={key}", "type": "google", "env": "GEMINI_API_KEY"},
            "google_ai_studio": {"url": "https://generativelanguage.googleapis.com/v1beta/models?key={key}", "type": "google", "env": "GEMINI_API_KEY"},
            "openai": {"url": "https://api.openai.com/v1/models", "type": "openai", "env": "OPENAI_API_KEY"},
            "anthropic": {"url": "https://api.anthropic.com/v1/models", "type": "anthropic", "env": "ANTHROPIC_API_KEY"},
            "groq": {"url": "https://api.groq.com/openai/v1/models", "type": "openai", "env": "GROQ_API_KEY"},
            "cerebras": {"url": "https://api.cerebras.ai/v1/models", "type": "openai", "env": "CEREBRAS_API_KEY"},
            "sambanova": {"url": "https://api.sambanova.ai/v1/models", "type": "openai", "env": "SAMBANOVA_API_KEY"},
            "openrouter": {"url": "https://openrouter.ai/api/v1/models", "type": "openrouter", "env": "OPENROUTER_API_KEY"},
            "mistral": {"url": "https://api.mistral.ai/v1/models", "type": "openai", "env": "MISTRAL_API_KEY"},
            "together": {"url": "https://api.together.xyz/v1/models", "type": "openai", "env": "TOGETHER_API_KEY"},
            "fireworks": {"url": "https://api.fireworks.ai/inference/v1/models", "type": "openai", "env": "FIREWORKS_API_KEY"},
            "deepseek": {"url": "https://api.deepseek.com/models", "type": "openai", "env": "DEEPSEEK_API_KEY"},
            "deepinfra": {"url": "https://api.deepinfra.com/v1/openai/models", "type": "openai", "env": "DEEPINFRA_API_KEY"},
            "xai": {"url": "https://api.x.ai/v1/models", "type": "openai", "env": "XAI_API_KEY"},
            "grok": {"url": "https://api.x.ai/v1/models", "type": "openai", "env": "XAI_API_KEY"},
            "perplexity": {"url": "https://api.perplexity.ai/models", "type": "openai", "env": "PERPLEXITY_API_KEY"},
            "cohere": {"url": "https://api.cohere.com/v2/models", "type": "cohere", "env": "COHERE_API_KEY"},
            "ai21": {"url": "https://api.ai21.com/studio/v1/models", "type": "openai", "env": "AI21_API_KEY"},
            "nvidia": {"url": "https://integrate.api.nvidia.com/v1/models", "type": "openai", "env": "NVIDIA_API_KEY"},
            "github_models": {"url": "https://models.inference.ai.azure.com/models", "type": "openai", "env": "GITHUB_TOKEN"},
            "huggingface": {"url": "https://api-inference.huggingface.co/v1/models", "type": "openai", "env": "HUGGINGFACE_API_KEY"},
            "cloudflare": {"url": "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/models/search", "type": "openai", "env": "CLOUDFLARE_API_KEY"},
            "alibaba": {"url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models", "type": "openai", "env": "DASHSCOPE_API_KEY"},
            "qwen": {"url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models", "type": "openai", "env": "DASHSCOPE_API_KEY"},
            "moonshot": {"url": "https://api.moonshot.cn/v1/models", "type": "openai", "env": "MOONSHOT_API_KEY"},
            "kimi": {"url": "https://api.moonshot.cn/v1/models", "type": "openai", "env": "MOONSHOT_API_KEY"},
            "minimax": {"url": "https://api.minimaxi.chat/v1/models", "type": "openai", "env": "MINIMAX_API_KEY"},
            "nebius": {"url": "https://api.studio.nebius.ai/v1/models", "type": "openai", "env": "NEBIUS_API_KEY"},
            "novita": {"url": "https://api.novita.ai/v3/openai/models", "type": "openai", "env": "NOVITA_API_KEY"},
            "siliconflow": {"url": "https://api.siliconflow.cn/v1/models", "type": "openai", "env": "SILICONFLOW_API_KEY"},
            "aiml_api": {"url": "https://api.aimlapi.com/v1/models", "type": "openai", "env": "AIML_API_KEY"},
            "portkey": {"url": "https://api.portkey.ai/v1/models", "type": "openai", "env": "PORTKEY_API_KEY"},
            "litellm": {"url": "http://localhost:4000/v1/models", "type": "openai", "env": "LITELLM_API_KEY"},
            "featherless": {"url": "https://api.featherless.ai/v1/models", "type": "openai", "env": "FEATHERLESS_API_KEY"},
            "hyperbolic": {"url": "https://api.hyperbolic.xyz/v1/models", "type": "openai", "env": "HYPERBOLIC_API_KEY"},
            "friendliai": {"url": "https://inference.friendli.ai/v1/models", "type": "openai", "env": "FRIENDLI_API_KEY"},
            "upstage": {"url": "https://api.upstage.ai/v1/solar/models", "type": "openai", "env": "UPSTAGE_API_KEY"},
            "predibase": {"url": "https://serving.app.predibase.com/v1/models", "type": "openai", "env": "PREDIBASE_API_KEY"},
            "lemonfox": {"url": "https://api.lemonfox.ai/v1/models", "type": "openai", "env": "LEMONFOX_API_KEY"},
            "writer": {"url": "https://api.writer.com/v1/models", "type": "openai", "env": "WRITER_API_KEY"},
            "aleph_alpha": {"url": "https://api.aleph-alpha.com/models", "type": "openai", "env": "ALEPH_ALPHA_API_KEY"},
            "zhipu": {"url": "https://open.bigmodel.cn/api/paas/v4/models", "type": "openai", "env": "ZHIPU_API_KEY"},
            "01_ai": {"url": "https://api.01.ai/v1/models", "type": "openai", "env": "ZEROONE_API_KEY"},
            "chutes": {"url": "https://llm.chutes.ai/v1/models", "type": "openai", "env": "CHUTES_API_KEY"},
            "anyscale": {"url": "https://api.endpoints.anyscale.com/v1/models", "type": "openai", "env": "ANYSCALE_API_KEY"},
            "azure_openai": {"url": "https://models.inference.ai.azure.com/models", "type": "openai", "env": "AZURE_OPENAI_API_KEY"},
            "voyage": {"url": "https://api.voyageai.com/v1/models", "type": "openai", "env": "VOYAGE_API_KEY"},
            "jina": {"url": "https://api.jina.ai/v1/models", "type": "openai", "env": "JINA_API_KEY"}
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                matched_key = next((k for k in CLOUD_MODEL_ENDPOINTS if k == p or k in p), None)
                
                # Check if this is a known cloud provider with custom or default endpoint
                if matched_key and not (endpoint and ("localhost" in endpoint or "127.0.0.1" in endpoint)):
                    cfg = CLOUD_MODEL_ENDPOINTS[matched_key]
                    effective_key = clean_key or os.getenv(cfg.get("env", ""), "") or os.getenv("LLM_API_KEY", "")

                    if cfg["type"] == "google":
                        if effective_key:
                            url = cfg["url"].format(key=effective_key)
                            res = await client.get(url)
                            if res.status_code == 200:
                                for m in res.json().get("models", []):
                                    m_name = m.get("name", "").replace("models/", "")
                                    display_name = m.get("displayName", m_name)
                                    models.append({"id": m_name, "label": display_name, "contextWindow": "1M - 2M Tokens"})

                    elif cfg["type"] == "anthropic":
                        if effective_key:
                            res = await client.get(cfg["url"], headers={"x-api-key": effective_key, "anthropic-version": "2023-06-01"})
                            if res.status_code == 200:
                                for m in res.json().get("data", []):
                                    m_id = m.get("id", "")
                                    models.append({"id": m_id, "label": m.get("display_name", m_id), "contextWindow": "200k Tokens"})

                    elif cfg["type"] == "cohere":
                        if effective_key:
                            res = await client.get(cfg["url"], headers={"Authorization": f"Bearer {effective_key}"})
                            if res.status_code == 200:
                                for m in res.json().get("models", []):
                                    m_name = m.get("name", "")
                                    models.append({"id": m_name, "label": m_name, "contextWindow": "128k Tokens"})

                    elif cfg["type"] == "openrouter":
                        headers = {"Authorization": f"Bearer {effective_key}"} if effective_key else {}
                        res = await client.get(cfg["url"], headers=headers)
                        if res.status_code == 200:
                            for m in res.json().get("data", []):
                                m_id = m.get("id", "")
                                ctx = m.get("context_length")
                                ctx_str = f"{int(ctx/1000)}k Tokens" if ctx and isinstance(ctx, (int, float)) else "Dynamic API"
                                models.append({"id": m_id, "label": m.get("name", m_id), "contextWindow": ctx_str})

                    else:
                        # OpenAI standard endpoint format
                        if effective_key:
                            req_url = cfg["url"]
                            if endpoint and not ("localhost" in endpoint or "127.0.0.1" in endpoint):
                                req_url = f"{endpoint.rstrip('/')}/models" if not endpoint.endswith("/models") else endpoint
                            
                            res = await client.get(req_url, headers={"Authorization": f"Bearer {effective_key}", "Accept": "application/json"})
                            if res.status_code == 200:
                                raw = res.json()
                                raw_list = raw.get("data") or raw.get("models") or (raw if isinstance(raw, list) else [])
                                if isinstance(raw_list, list):
                                    for m in raw_list:
                                        m_id = m.get("id") if isinstance(m, dict) else str(m)
                                        if m_id:
                                            lbl = m.get("name", m_id) if isinstance(m, dict) else m_id
                                            models.append({"id": m_id, "label": lbl, "contextWindow": "Live API"})

                # Local Hardware Engines or Custom Self-Hosted Endpoints
                if not models:
                    target_url = DynamicRegistryService.resolve_endpoint(p, endpoint)
                    base = target_url.rstrip("/")
                    headers = {}
                    if clean_key:
                        headers["Authorization"] = f"Bearer {clean_key}"

                    # 1. Ollama /api/tags & /v1/models probe
                    if "11434" in base or p == "ollama":
                        try:
                            res = await client.get(f"{base}/api/tags", headers=headers)
                            if res.status_code == 200:
                                for m in res.json().get("models", []):
                                    m_id = m.get("name") or m.get("model")
                                    if m_id:
                                        details = m.get("details") or {}
                                        param_size = details.get("parameter_size") or ""
                                        quant = details.get("quantization_level") or ""
                                        ctx_len = details.get("context_length")
                                        ctx_str = f"{round(ctx_len / 1024)}k Context" if ctx_len else ""
                                        
                                        meta_parts = [p for p in [param_size, quant, ctx_str] if p]
                                        context_desc = " • ".join(meta_parts) if meta_parts else "Local Engine"
                                        
                                        models.append({
                                            "id": m_id,
                                            "label": f"{m_id} (Ollama)",
                                            "contextWindow": context_desc
                                        })
                        except Exception:
                            pass

                    # 2. OpenAI-compatible probe across common paths
                    if not models or p in ["vllm", "lmstudio", "lm_studio", "localai"]:
                        for path in ["/v1/models", "/models", "/api/v1/models"]:
                            try:
                                url = base if base.endswith(path) else f"{base}{path}"
                                res = await client.get(url, headers=headers)
                                if res.status_code == 200:
                                    data = res.json()
                                    raw_list = data.get("data") or data.get("models") or (data if isinstance(data, list) else [])
                                    if isinstance(raw_list, list):
                                        for m in raw_list:
                                            m_id = m.get("id") if isinstance(m, dict) else str(m)
                                            if m_id and not any(existing["id"] == m_id for existing in models):
                                                lbl = m.get("name", m_id) if isinstance(m, dict) else m_id
                                                models.append({"id": m_id, "label": lbl, "contextWindow": "Local Engine"})
                                        if models:
                                            break
                            except Exception:
                                pass

        except Exception as e:
            print(f"Error fetching dynamic models for provider {provider}: {e}")

        # Deduplicate and sort models cleanly
        seen_ids = set()
        unique_models = []
        for m in models:
            if m["id"] and m["id"] not in seen_ids:
                seen_ids.add(m["id"])
                unique_models.append(m)

        return unique_models

    @staticmethod
    async def get_voice_models(provider: str, api_key: str | None = None, endpoint: str | None = None) -> list[dict[str, Any]]:
        """
        100% Real-Time Live API Provider Voice Catalog Query Service.
        Strictly queries live provider REST API endpoints dynamically using API credentials.
        """
        p = provider.lower().strip()
        voices = []
        clean_key = (api_key or "").strip()
        
        has_valid_key = bool(clean_key and len(clean_key) > 5 and "•" not in clean_key and "*" not in clean_key and "..." not in clean_key)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 1. ElevenLabs (Live REST API)
                if p in ["elevenlabs", "eleven_labs"]:
                    headers = {}
                    key = clean_key if has_valid_key else os.getenv("ELEVENLABS_API_KEY", "")
                    if key:
                        headers["xi-api-key"] = key
                    res = await client.get("https://api.elevenlabs.io/v1/voices", headers=headers)
                    if res.status_code == 200:
                        for v in res.json().get("voices", []):
                            labels = v.get("labels", {}) or {}
                            gender = labels.get("gender") or "Unknown"
                            accent = labels.get("accent") or "Unknown"
                            v_name = v.get("name") or v.get("voice_id") or "Unknown"
                            voices.append({
                                "id": v.get("voice_id"),
                                "name": v_name,
                                "label": v_name,
                                "gender": gender.capitalize() if gender != "Unknown" else "Unknown",
                                "accent": accent.capitalize() if accent != "Unknown" else "Unknown",
                                "preview_url": v.get("preview_url") or "Unknown",
                                "category": v.get("category") or "ElevenLabs Conversational",
                                "description": v.get("description") or "Hyper-realistic voice synthesis"
                            })

                # 2. Cartesia Sonic (Live REST API)
                elif p in ["cartesia", "cartesia_sonic"]:
                    key = clean_key if has_valid_key else os.getenv("CARTESIA_API_KEY", "")
                    if key:
                        res = await client.get("https://api.cartesia.ai/voices", headers={"X-API-Key": key, "Cartesia-Version": "2024-06-10"})
                        if res.status_code == 200:
                            for v in res.json():
                                v_name = v.get("name") or v.get("id") or "Unknown"
                                voices.append({
                                    "id": v.get("id") or v_name,
                                    "name": v_name,
                                    "label": v_name,
                                    "gender": "Unknown",
                                    "accent": v.get("language") or "en-US",
                                    "preview_url": "Unknown",
                                    "category": "Cartesia Sonic",
                                    "description": v.get("description") or "Ultra low-latency streaming voice"
                                })

                # 3. Deepgram Aura Conversational (Live REST API - Parses 'tts' models array)
                elif p in ["deepgram", "deepgram_aura", "deepgram-aura"]:
                    key = clean_key if has_valid_key else os.getenv("DEEPGRAM_API_KEY", "")
                    headers = {}
                    if key:
                        headers["Authorization"] = f"Token {key}"
                    res = await client.get("https://api.deepgram.com/v1/models", headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        tts_models = data.get("tts", []) or data.get("models", [])
                        
                        v1_telephony_voices = []
                        v2_experimental_voices = []
                        other_voices = []

                        for m in tts_models:
                            m_name = m.get("name") or "Unknown"
                            canonical = m.get("canonical_name") or m_name
                            meta = m.get("metadata", {}) or {}
                            raw_disp = meta.get("display_name")
                            display_name = raw_disp if raw_disp else canonical.replace("aura-", "").replace("-en", "").capitalize()
                            
                            tags = meta.get("tags", [])
                            gender = "Female" if "feminine" in tags else ("Male" if "masculine" in tags else "Unknown")
                            accent = meta.get("accent") or (m.get("languages", ["en-US"])[0] if m.get("languages") else "en-US")
                            
                            v_id = canonical or m_name
                            is_v2 = "aura-2" in v_id.lower() or "aura-2" in canonical.lower()

                            voice_item = {
                                "id": v_id,
                                "name": f"{'⚡ Realtime Boosted Heavy v2:' if is_v2 else '⚡ Realtime:'} {display_name} ({gender} • {accent})",
                                "label": display_name,
                                "gender": gender,
                                "accent": accent,
                                "preview_url": meta.get("sample") or "Unknown",
                                "category": "Deepgram Aura",
                                "description": f"{m.get('architecture', 'aura')} realtime calling voice (auto-speed optimized)"
                            }
                            
                            # Prioritize v1 Telephony Aura voices at the top for zero latency
                            if not is_v2 and ("aura" in v_id.lower() or "aura" in (m.get("architecture") or "").lower()):
                                if "en" in str(m.get("languages")).lower() or "en" in accent.lower():
                                    v1_telephony_voices.append(voice_item)
                                else:
                                    other_voices.append(voice_item)
                            elif is_v2:
                                v2_experimental_voices.append(voice_item)
                            else:
                                other_voices.append(voice_item)

                        # Primary sort v1 telephony voices so Stella/Asteria/Athena appear first
                        v1_telephony_voices.sort(key=lambda x: (0 if "stella" in x["id"] else 1 if "asteria" in x["id"] else 2 if "athena" in x["id"] else 3 if "luna" in x["id"] else 4 if "helios" in x["id"] else 5))
                        voices.extend(v1_telephony_voices + v2_experimental_voices + other_voices)

                # 4. Fish Audio Realtime (Live REST API - Queries /model endpoint)
                elif p in ["fish_audio", "fish-audio", "fishaudio"]:
                    key = clean_key if has_valid_key else os.getenv("FISH_AUDIO_API_KEY", "")
                    headers = {}
                    if key:
                        headers["Authorization"] = f"Bearer {key}"
                    res = await client.get("https://api.fish.audio/model", headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        items = data.get("items") or (data if isinstance(data, list) else [])
                        for item in items:
                            if isinstance(item, dict):
                                m_id = item.get("_id") or item.get("id") or "Unknown"
                                m_name = item.get("title") or item.get("name") or m_id
                                tags = item.get("tags") or []
                                gender = "Female" if "female" in tags else ("Male" if "male" in tags else "Unknown")
                                voices.append({
                                    "id": m_id,
                                    "name": m_name,
                                    "label": m_name,
                                    "gender": gender,
                                    "accent": (item.get("languages") or ["en"])[0],
                                    "preview_url": "Unknown",
                                    "category": "Fish Audio Realtime",
                                    "description": item.get("description") or "Fish Audio voice model"
                                })

                # 5. OpenAI Voice TTS (Official OpenAI Speech Models Specification)
                elif p in ["openai", "openai_tts", "openai-tts"]:
                    voices.extend([
                        {"id": "alloy", "name": "Alloy (Neutral SDR)", "label": "Alloy", "gender": "Neutral", "accent": "en-US", "category": "OpenAI Neural TTS", "description": "Versatile neutral tone for AI reception"},
                        {"id": "ash", "name": "Ash (Expressive Male)", "label": "Ash", "gender": "Male", "accent": "en-US", "category": "OpenAI Realtime TTS", "description": "Clear expressive conversational tone"},
                        {"id": "ballad", "name": "Ballad (Warm Male)", "label": "Ballad", "gender": "Male", "accent": "en-US", "category": "OpenAI Realtime TTS", "description": "Smooth melodic telephony tone"},
                        {"id": "cedar", "name": "Cedar (Deep Executive)", "label": "Cedar", "gender": "Male", "accent": "en-US", "category": "OpenAI Realtime TTS", "description": "Rich deep authoritative tone"},
                        {"id": "coral", "name": "Coral (Bright Support)", "label": "Coral", "gender": "Female", "accent": "en-US", "category": "OpenAI Realtime TTS", "description": "Bright friendly female customer care tone"},
                        {"id": "echo", "name": "Echo (Male Telephony)", "label": "Echo", "gender": "Male", "accent": "en-US", "category": "OpenAI Neural TTS", "description": "Warm & smooth male conversational tone"},
                        {"id": "fable", "name": "Fable (British Accent)", "label": "Fable", "gender": "Neutral", "accent": "en-GB", "category": "OpenAI Neural TTS", "description": "Expressive British accent"},
                        {"id": "marin", "name": "Marin (Realtime Female)", "label": "Marin", "gender": "Female", "accent": "en-US", "category": "OpenAI Realtime TTS", "description": "Modern conversational voice for telephony"},
                        {"id": "nova", "name": "Nova (Warm Female)", "label": "Nova", "gender": "Female", "accent": "en-US", "category": "OpenAI Neural TTS", "description": "Energetic warm female voice"},
                        {"id": "onyx", "name": "Onyx (Deep Sales)", "label": "Onyx", "gender": "Male", "accent": "en-US", "category": "OpenAI Neural TTS", "description": "Deep authoritative sales male tone"},
                        {"id": "sage", "name": "Sage (Calm Assistant)", "label": "Sage", "gender": "Female", "accent": "en-US", "category": "OpenAI Realtime TTS", "description": "Calm professional female tone"},
                        {"id": "shimmer", "name": "Shimmer (Expressive Female)", "label": "Shimmer", "gender": "Female", "accent": "en-US", "category": "OpenAI Neural TTS", "description": "Clear expressive female tone"},
                        {"id": "verse", "name": "Verse (Dynamic Telephony)", "label": "Verse", "gender": "Neutral", "accent": "en-US", "category": "OpenAI Realtime TTS", "description": "Dynamic storytelling and conversational tone"}
                    ])

                # 6. PlayHT 2.0 Turbo (Live REST API)
                elif p in ["playht", "play_ht", "play-ht"]:
                    key = clean_key if has_valid_key else os.getenv("PLAYHT_API_KEY", "")
                    user_id = os.getenv("PLAYHT_USER_ID", "")
                    if key:
                        res = await client.get("https://api.play.ht/api/v2/voices", headers={"AUTHORIZATION": key, "X-USER-ID": user_id})
                        if res.status_code == 200:
                            for v in res.json():
                                v_name = v.get("name") or v.get("id") or "Unknown"
                                voices.append({
                                    "id": v.get("id") or v.get("value") or v_name,
                                    "name": v_name,
                                    "label": v_name,
                                    "gender": (v.get("gender") or "Unknown").capitalize(),
                                    "accent": v.get("language") or "en-US",
                                    "preview_url": v.get("sample") or "Unknown",
                                    "category": "PlayHT Turbo",
                                    "description": "Realtime low-latency PlayHT voice"
                                })

                # 7. Google Cloud Speech / TTS (Live REST API)
                elif p in ["google", "google_tts", "google_cloud", "google-tts"]:
                    key = clean_key if has_valid_key else (os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", ""))
                    if key:
                        res = await client.get(f"https://texttospeech.googleapis.com/v1/voices?key={key}")
                        if res.status_code == 200:
                            for v in res.json().get("voices", []):
                                name = v.get("name") or "Unknown"
                                ssml_gender = v.get("ssmlGender") or "Unknown"
                                lang_list = v.get("languageCodes") or []
                                lang = lang_list[0] if lang_list else "en-US"
                                voices.append({
                                    "id": name,
                                    "name": name,
                                    "label": name,
                                    "gender": ssml_gender.capitalize() if ssml_gender != "Unknown" else "Unknown",
                                    "accent": lang,
                                    "preview_url": "Unknown",
                                    "category": "Cloud Google TTS",
                                    "description": f"Google Cloud {name} TTS"
                                })

                # 8. Azure Cognitive Speech TTS (Live REST API)
                elif p in ["azure", "azure_speech", "azure-speech"]:
                    key = clean_key if has_valid_key else os.getenv("AZURE_SPEECH_KEY", "")
                    region = os.getenv("AZURE_SPEECH_REGION", "eastus")
                    if key:
                        res = await client.get(
                            f"https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list",
                            headers={"Ocp-Apim-Subscription-Key": key}
                        )
                        if res.status_code == 200:
                            for v in res.json():
                                v_name = v.get("LocalName") or v.get("DisplayName") or v.get("ShortName") or "Unknown"
                                voices.append({
                                    "id": v.get("ShortName") or v_name,
                                    "name": v_name,
                                    "label": v_name,
                                    "gender": (v.get("Gender") or "Unknown").capitalize(),
                                    "accent": v.get("Locale") or "en-US",
                                    "preview_url": "Unknown",
                                    "category": "Azure Neural TTS",
                                    "description": "Microsoft Azure Cognitive Neural TTS"
                                })

                # 9. LMNT Realtime Speech Synthesizer (Live REST API)
                elif p in ["lmnt", "lmnt_speech"]:
                    key = clean_key if has_valid_key else os.getenv("LMNT_API_KEY", "")
                    if key:
                        res = await client.get("https://api.lmnt.com/v1/voices", headers={"X-API-Key": key})
                        if res.status_code == 200:
                            for v in res.json():
                                v_name = v.get("name") or v.get("id") or "Unknown"
                                voices.append({
                                    "id": v.get("id") or v_name,
                                    "name": v_name,
                                    "label": v_name,
                                    "gender": (v.get("gender") or "Unknown").capitalize(),
                                    "accent": v.get("language") or "en-US",
                                    "preview_url": "Unknown",
                                    "category": "LMNT Realtime",
                                    "description": "Conversational LMNT voice"
                                })

                # 10. Local Hardware Engines & Self-Hosted Custom Endpoints (Live REST API)
                elif endpoint or p not in ["elevenlabs", "cartesia", "deepgram", "playht", "fish_audio", "google_tts", "azure_speech", "lmnt", "openai_tts"]:
                    target_url = (endpoint or "").strip().rstrip("/")
                    if target_url:
                        for path in ["/v1/audio/voices", "/v1/models", "/api/tags", "/voices"]:
                            try:
                                res = await client.get(f"{target_url}{path}")
                                if res.status_code == 200:
                                    data = res.json()
                                    items = data.get("voices") or data.get("models") or data.get("data") or data
                                    if isinstance(items, list):
                                        for item in items:
                                            i_id = item.get("id") or item.get("name") if isinstance(item, dict) else str(item)
                                            i_name = item.get("name") or i_id if isinstance(item, dict) else str(item)
                                            voices.append({
                                                "id": i_id,
                                                "name": i_name,
                                                "label": i_name,
                                                "gender": "Unknown",
                                                "accent": "Unknown",
                                                "preview_url": "Unknown",
                                                "category": "Local Hardware Engine",
                                                "description": "Local voice engine"
                                            })
                                        if voices:
                                            break
                            except Exception:
                                pass

        except Exception as e:
            print(f"Dynamic voice query exception for {provider}: {e}")

        return voices

registry_service = DynamicRegistryService()

