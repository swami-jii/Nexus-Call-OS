package com.nexus.callos.companion.model

data class AiAgentInfo(
    val id: String,
    val name: String,
    val role: String,
    val systemPrompt: String = "",
    val language: String = "en-US",
    val voiceEngine: String = "ElevenLabs",
    val llmModel: String = "gpt-4o",
    val status: String = "active",
    val temperature: Double = 0.7,
    val provider: String? = "openai",
    val conversationsCount: Int = 0,
    val successRate: Double = 1.0,
    val avgDuration: String = "1m 30s",
    val speechSpeed: Double = 1.0,
    val speechStyle: String = "Natural"
)

data class ProviderInfo(
    val id: String,
    val name: String,
    val description: String = "",
    val pricingType: String = "",
    val group: String = "cloud",
    val isFree: Boolean = false,
    val isActive: Boolean = true,
    val models: List<String> = emptyList()
)

data class VoiceEngineInfo(
    val provider: String,
    val id: String = "",
    val name: String,
    val speed: String = "Realtime",
    val status: String = "READY"
)

data class LanguageOption(
    val code: String,
    val name: String
) {
    val label: String get() = name
}

data class BackendOverview(
    val activeAgents: List<AiAgentInfo>,
    val llmProviders: List<ProviderInfo> = emptyList(),
    val voiceEngines: List<VoiceEngineInfo> = emptyList(),
    val sttEngines: List<VoiceEngineInfo> = emptyList(),
    val availableLanguages: List<LanguageOption> = emptyList(),
    val availableModels: List<String> = emptyList(),
    val pstnTrunkStatus: String = "Active",
    val audioCodec: String = "16kHz Linear PCM / Opus",
    val cloudTunnelWsUrl: String? = null,
    val cloudTunnelHttpUrl: String? = null,
    val localLanWsUrl: String? = null,
    val localLanHttpUrl: String? = null,
    val lanIp: String? = null
)
