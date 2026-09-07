package com.nexus.callos.companion.model

data class DeviceTelemetry(
    val manufacturer: String,
    val model: String,
    val osVersion: String,
    val sdkInt: Int,
    val buildNumber: String,
    val deviceId: String,
    val batteryLevel: Int,
    val isCharging: Boolean,
    val networkType: String,
    val carrierName: String,
    val signalDbm: Int,
    val isWifiConnected: Boolean,
    val latencyMs: Int,
    val uptimeSeconds: Long,
    val kernelVersion: String = "Linux 5.x",
    val securityPatch: String = "Up to date",
    val basebandVersion: String = "Integrated",
    val hardware: String = "Qualcomm/Exynos",
    val totalRamGb: String = "8.0 GB",
    val availRamGb: String = "4.0 GB",
    val totalStorageGb: String = "128 GB",
    val availStorageGb: String = "64 GB",
    val uploadMbps: String = "18.4 Mbps",
    val downloadMbps: String = "94.2 Mbps"
)
