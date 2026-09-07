package com.nexus.callos.companion.network

import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.AiAgentInfo
import com.nexus.callos.companion.model.BackendOverview
import com.nexus.callos.companion.model.VoiceEngineInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class BackendApiClient {

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    fun getCleanBaseUrl(url: String): String {
        var clean = url.trim()
            .replace(Regex("^(ws|wss|http|https):/+(.*)$")) { "${it.groupValues[1]}://${it.groupValues[2]}" }
            .substringBefore("/api/")
            .substringBefore("/#")
            .trimEnd('/')

        // Map local frontend port 3000 to backend port 8000 for direct API access
        if (clean.contains(":3000") && (clean.contains("192.168.") || clean.contains("10.") || clean.contains("127.0.0.1") || clean.contains("localhost"))) {
            clean = clean.replace(":3000", ":8000")
        }

        val isSecure = clean.startsWith("wss://") || clean.startsWith("https://") ||
                clean.contains(".trycloudflare.com") || clean.contains(".pinggy.link") ||
                clean.contains(".lhr.life") || clean.contains(".ngrok")

        return if (isSecure) {
            clean.replace("wss://", "https://").replace("ws://", "https://").replace("http://", "https://")
        } else {
            clean.replace("ws://", "http://").replace("wss://", "http://").replace("https://", "http://")
        }
    }

    suspend fun fetchMobileOverview(baseUrl: String): BackendOverview? = withContext(Dispatchers.IO) {
        val httpUrl = getCleanBaseUrl(baseUrl)
        val endpoint = "$httpUrl/api/android-gateway/mobile-overview"

        try {
            val request = Request.Builder().url(endpoint).get().build()
            val response = httpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                NexusApplication.log("WARN", "BackendApi", "Overview fetch failed: HTTP ${response.code}")
                return@withContext null
            }

            val body = response.body?.string() ?: return@withContext null
            val json = JSONObject(body)

            val agentsJson = json.optJSONArray("active_agents")
            val agentsList = mutableListOf<AiAgentInfo>()
            if (agentsJson != null) {
                for (i in 0 until agentsJson.length()) {
                    val a = agentsJson.getJSONObject(i)
                    agentsList.add(
                        AiAgentInfo(
                            id = a.optString("id"),
                            name = a.optString("name", "Nexus Agent"),
                            role = a.optString("role", "AI Assistant"),
                            systemPrompt = a.optString("system_prompt", ""),
                            language = a.optString("language", "en-US"),
                            voiceEngine = a.optString("voice_engine", "ElevenLabs"),
                            llmModel = a.optString("llm_model", "gpt-4o"),
                            status = a.optString("status", "active"),
                            temperature = a.optDouble("temperature", 0.7),
                            provider = a.optString("provider", "openai"),
                            conversationsCount = a.optInt("conversations_count", 0),
                            successRate = a.optDouble("success_rate", 1.0),
                            avgDuration = a.optString("avg_duration", "1m 30s"),
                            speechSpeed = a.optDouble("speech_speed", 1.0),
                            speechStyle = a.optString("speech_style", "Natural")
                        )
                    )
                }
            }

            val llmProvidersJson = json.optJSONArray("llm_providers")
            val llmProvidersList = mutableListOf<com.nexus.callos.companion.model.ProviderInfo>()
            if (llmProvidersJson != null) {
                for (i in 0 until llmProvidersJson.length()) {
                    val p = llmProvidersJson.getJSONObject(i)
                    val modelsArr = p.optJSONArray("models")
                    val models = mutableListOf<String>()
                    if (modelsArr != null) {
                        for (j in 0 until modelsArr.length()) {
                            models.add(modelsArr.getString(j))
                        }
                    }
                    llmProvidersList.add(
                        com.nexus.callos.companion.model.ProviderInfo(
                            id = p.optString("id"),
                            name = p.optString("name"),
                            description = p.optString("description", ""),
                            pricingType = p.optString("pricing_type", ""),
                            group = p.optString("group", "cloud"),
                            isFree = p.optBoolean("is_free", false),
                            isActive = p.optBoolean("is_active", true),
                            models = models
                        )
                    )
                }
            }

            val voicesJson = json.optJSONArray("voice_engines")
            val voicesList = mutableListOf<VoiceEngineInfo>()
            if (voicesJson != null) {
                for (i in 0 until voicesJson.length()) {
                    val v = voicesJson.getJSONObject(i)
                    voicesList.add(
                        VoiceEngineInfo(
                            provider = v.optString("provider", v.optString("id")),
                            id = v.optString("id", v.optString("provider")),
                            name = v.optString("name"),
                            speed = v.optString("speed", "Realtime"),
                            status = v.optString("status", "READY")
                        )
                    )
                }
            }

            val sttJson = json.optJSONArray("stt_engines")
            val sttList = mutableListOf<VoiceEngineInfo>()
            if (sttJson != null) {
                for (i in 0 until sttJson.length()) {
                    val s = sttJson.getJSONObject(i)
                    sttList.add(
                        VoiceEngineInfo(
                            provider = s.optString("provider", s.optString("id")),
                            id = s.optString("id", s.optString("provider")),
                            name = s.optString("name"),
                            speed = s.optString("speed", "Streaming STT"),
                            status = s.optString("status", "READY")
                        )
                    )
                }
            }

            val languagesJson = json.optJSONArray("available_languages")
            val languagesList = mutableListOf<com.nexus.callos.companion.model.LanguageOption>()
            if (languagesJson != null) {
                for (i in 0 until languagesJson.length()) {
                    val l = languagesJson.getJSONObject(i)
                    languagesList.add(
                        com.nexus.callos.companion.model.LanguageOption(
                            code = l.optString("code"),
                            name = l.optString("name")
                        )
                    )
                }
            }

            val modelsJson = json.optJSONArray("available_models")
            val modelsList = mutableListOf<String>()
            if (modelsJson != null) {
                for (i in 0 until modelsJson.length()) {
                    modelsList.add(modelsJson.getString(i))
                }
            }

            val telStatus = json.optJSONObject("telephony_status")
            val pstn = telStatus?.optString("pstn_trunk", "Active") ?: "Active"
            val codec = telStatus?.optString("codec", "16kHz Linear PCM / Opus") ?: "16kHz Linear PCM / Opus"

            val netJson = json.optJSONObject("network")
            val tunnelWs = netJson?.optString("cloud_tunnel_ws_url")?.takeIf { it.isNotBlank() }
            val tunnelHttp = netJson?.optString("cloud_tunnel_http_url")?.takeIf { it.isNotBlank() }
            val localWs = netJson?.optString("local_ws_url")?.takeIf { it.isNotBlank() }
            val localHttp = netJson?.optString("local_http_url")?.takeIf { it.isNotBlank() }
            val lanIp = netJson?.optString("lan_ip")?.takeIf { it.isNotBlank() }

            NexusApplication.log("INFO", "BackendApi", "Fetched ${agentsList.size} agents, ${llmProvidersList.size} providers, and dynamic network metadata.")

            BackendOverview(
                activeAgents = agentsList,
                llmProviders = llmProvidersList,
                voiceEngines = voicesList,
                sttEngines = sttList,
                availableLanguages = languagesList,
                availableModels = modelsList,
                pstnTrunkStatus = pstn,
                audioCodec = codec,
                cloudTunnelWsUrl = tunnelWs,
                cloudTunnelHttpUrl = tunnelHttp,
                localLanWsUrl = localWs,
                localLanHttpUrl = localHttp,
                lanIp = lanIp
            )
        } catch (e: Exception) {
            NexusApplication.log("WARN", "BackendApi", "Error fetching mobile overview: ${e.message}")
            null
        }
    }

    suspend fun updateAgentConfig(
        baseUrl: String,
        agentId: String,
        name: String? = null,
        provider: String? = null,
        model: String? = null,
        voiceEngine: String? = null,
        language: String? = null,
        temperature: Double? = null,
        systemPrompt: String? = null
    ): Boolean = withContext(Dispatchers.IO) {
        val httpUrl = getCleanBaseUrl(baseUrl)
        val endpoint = "$httpUrl/api/android-gateway/agent/update"

        val jsonReq = JSONObject().apply {
            put("agent_id", agentId)
            if (name != null) put("name", name)
            if (provider != null) put("provider", provider)
            if (model != null) put("llm_model", model)
            if (voiceEngine != null) put("voice_id", voiceEngine)
            if (language != null) put("language", language)
            if (temperature != null) put("temperature", temperature)
            if (systemPrompt != null) put("system_prompt", systemPrompt)
        }

        try {
            val body = jsonReq.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder().url(endpoint).post(body).build()
            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                NexusApplication.log("INFO", "BackendApi", "Agent $agentId settings successfully saved to backend SSOT.")
                return@withContext true
            } else {
                NexusApplication.log("WARN", "BackendApi", "Agent update failed: HTTP ${response.code}")
            }
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "BackendApi", "Failed to update agent config: ${e.message}")
        }
        false
    }

    suspend fun fetchGatewayLogs(
        baseUrl: String,
        limit: Int = 100
    ): List<com.nexus.callos.companion.model.GatewayLogEntry> = withContext(Dispatchers.IO) {
        val httpUrl = getCleanBaseUrl(baseUrl)
        val endpoint = "$httpUrl/api/android-gateway/logs?limit=$limit"

        try {
            val request = Request.Builder().url(endpoint).get().build()
            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: return@withContext emptyList()
                val json = JSONObject(body)
                val logsJson = json.optJSONArray("logs")
                val list = mutableListOf<com.nexus.callos.companion.model.GatewayLogEntry>()
                if (logsJson != null) {
                    for (i in 0 until logsJson.length()) {
                        val item = logsJson.getJSONObject(i)
                        list.add(
                            com.nexus.callos.companion.model.GatewayLogEntry(
                                level = item.optString("level", "INFO"),
                                tag = item.optString("component", "Gateway"),
                                message = item.optString("message", "")
                            )
                        )
                    }
                }
                return@withContext list
            }
        } catch (e: Exception) {
            NexusApplication.log("WARN", "BackendApi", "Failed to fetch gateway logs: ${e.message}")
        }
        emptyList()
    }

    suspend fun exchangePairingToken(
        baseUrl: String,
        pairingToken: String,
        signature: String,
        deviceId: String,
        deviceName: String
    ): String? = withContext(Dispatchers.IO) {
        val httpUrl = getCleanBaseUrl(baseUrl)
        val endpoint = "$httpUrl/api/android-gateway/pair/exchange"

        val jsonReq = JSONObject().apply {
            put("pairing_token", pairingToken)
            put("signature", signature)
            put("device_id", deviceId)
            put("name", deviceName)
            put("device_type", "android")
        }

        try {
            val body = jsonReq.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder().url(endpoint).post(body).build()
            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val resStr = response.body?.string() ?: return@withContext null
                val resJson = JSONObject(resStr)
                return@withContext resJson.optString("device_token")
            }
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "BackendApi", "Pairing token exchange failed: ${e.message}")
        }
        null
    }

    suspend fun bindDevice(
        baseUrl: String,
        deviceId: String,
        agentId: String?,
        llmModel: String? = null,
        voiceId: String? = null,
        language: String? = null,
        autoAnswer: Boolean? = null,
        outboundAiEnabled: Boolean? = null
    ): Boolean = withContext(Dispatchers.IO) {
        val httpUrl = getCleanBaseUrl(baseUrl)
        val endpoint = "$httpUrl/api/android-gateway/devices/$deviceId/bind"

        val jsonReq = JSONObject().apply {
            if (agentId != null) put("agent_id", agentId)
            if (llmModel != null) put("llm_model", llmModel)
            if (voiceId != null) put("voice_id", voiceId)
            if (language != null) put("language", language)
            if (autoAnswer != null) put("auto_answer", autoAnswer)
            if (outboundAiEnabled != null) put("outbound_ai_enabled", outboundAiEnabled)
        }

        try {
            val body = jsonReq.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder().url(endpoint).post(body).build()
            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                NexusApplication.log("INFO", "BackendApi", "Device $deviceId matrix successfully bound on backend SSOT.")
                return@withContext true
            }
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "BackendApi", "Device bind failed: ${e.message}")
        }
        false
    }
}
