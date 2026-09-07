import SwiftUI
import Combine
import AVFoundation
import UIKit

class GatewayViewModel: ObservableObject {
    // Connection Settings
    @Published var serverUrl: String = "ws://192.168.1.33:8000"
    @Published var deviceId: String = "ios-companion-\(UIDevice.current.name.lowercased().replacingOccurrences(of: " ", with: "-"))"
    @Published var deviceToken: String = ""
    @Published var autoReconnect: Bool = true

    // State
    @Published var connectionState: ConnectionState = .disconnected
    @Published var micPermissionStatus: String = "Checking..."
    @Published var isMicAuthorized: Bool = false
    @Published var latencyMs: Int = 0
    @Published var logs: [String] = []
    @Published var isCallActive: Bool = false
    @Published var activeCallerName: String = ""
    @Published var activeCallUUID: UUID?

    // Device Metadata
    @Published var deviceModel: String = UIDevice.current.model
    @Published var osVersion: String = "iOS " + UIDevice.current.systemVersion
    @Published var batteryLevel: Int = 100

    private let wsBridge = WebSocketBridge()
    private let callKitManager = CallKitManager()
    private let audioEngine = AudioEngineManager()
    private var pushKitManager: PushKitManager?
    private var cancellables = Set<AnyCancellable>()

    init() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        updateBatteryLevel()
        checkMicrophonePermission()
        setupBindings()
        setupPushKit()
        addLog("Nexus Companion Initialized on \(deviceModel) (\(osVersion))")
    }

    private func setupPushKit() {
        pushKitManager = PushKitManager(callKitManager: callKitManager)
        pushKitManager?.onVoIPTokenReceived = { [weak self] token in
            self?.addLog("PushKit VoIP Token Registered: \(token.prefix(12))...")
            self?.wsBridge.sendJSON(dict: ["event": "REGISTER_VOIP_TOKEN", "voip_token": token])
        }
        pushKitManager?.registerForVoIPPushes()
    }

    private func setupBindings() {
        wsBridge.$connectionState
            .receive(on: DispatchQueue.main)
            .sink { [weak self] state in
                self?.connectionState = state
            }
            .store(in: &cancellables)

        wsBridge.$latencyMs
            .receive(on: DispatchQueue.main)
            .sink { [weak self] latency in
                self?.latencyMs = latency
            }
            .store(in: &cancellables)


        wsBridge.onCommandReceived = { [weak self] json in
            self?.handleServerCommand(json)
        }

        wsBridge.onIncomingAudio = { [weak self] audioData in
            self?.audioEngine.playAudioChunk(data: audioData)
        }

        audioEngine.onMicrophoneData = { [weak self] micData in
            if self?.isCallActive == true {
                self?.wsBridge.sendAudio(data: micData)
            }
        }

        callKitManager.onCallAnswered = { [weak self] uuid in
            self?.addLog("Call answered via CallKit (UUID: \(uuid.uuidString.prefix(8)))")
            self?.isCallActive = true
            self?.audioEngine.start()
            self?.wsBridge.sendJSON(dict: ["event": "CALL_ANSWERED", "uuid": uuid.uuidString])
        }

        callKitManager.onCallEnded = { [weak self] uuid in
            self?.addLog("Call ended (UUID: \(uuid.uuidString.prefix(8)))")
            self?.isCallActive = false
            self?.activeCallUUID = nil
            self?.audioEngine.stop()
            self?.wsBridge.sendJSON(dict: ["event": "CALL_ENDED", "uuid": uuid.uuidString])
        }
    }

    func connect() {
        addLog("Connecting to \(serverUrl)...")
        wsBridge.connect(serverUrlString: serverUrl, deviceId: deviceId, token: deviceToken.isEmpty ? nil : deviceToken)
    }

    func disconnect() {
        addLog("Disconnecting...")
        wsBridge.disconnect()
        if isCallActive, let uuid = activeCallUUID {
            callKitManager.endCall(uuid: uuid) { _ in }
        }
    }

    func checkMicrophonePermission() {
        switch AVAudioSession.sharedInstance().recordPermission {
        case .granted:
            micPermissionStatus = "Authorized"
            isMicAuthorized = true
        case .denied:
            micPermissionStatus = "Denied"
            isMicAuthorized = false
        case .undetermined:
            micPermissionStatus = "Not Determined"
            isMicAuthorized = false
        @unknown default:
            micPermissionStatus = "Unknown"
            isMicAuthorized = false
        }
    }

    func requestMicrophonePermission() {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                self?.isMicAuthorized = granted
                self?.micPermissionStatus = granted ? "Authorized" : "Denied"
                self?.addLog(granted ? "Microphone permission granted" : "Microphone permission denied")
            }
        }
    }

    func simulateIncomingCall(caller: String = "Demo Customer (+1 415 555 0199)") {
        let uuid = UUID()
        self.activeCallUUID = uuid
        self.activeCallerName = caller
        addLog("Triggering CallKit incoming call screen for: \(caller)")
        callKitManager.reportIncomingCall(uuid: uuid, handle: caller) { [weak self] error in
            if let error = error {
                self?.addLog("CallKit report error: \(error.localizedDescription)")
            }
        }
    }

    func addLog(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        logs.insert("[\(timestamp)] \(message)", at: 0)
        if logs.count > 50 {
            logs.removeLast()
        }
    }

    func clearLogs() {
        logs.removeAll()
    }

    private func updateBatteryLevel() {
        let level = UIDevice.current.batteryLevel
        batteryLevel = level >= 0 ? Int(level * 100) : 100
    }

    private func handleServerCommand(_ json: [String: Any]) {
        guard let event = json["event"] as? String ?? json["type"] as? String else { return }
        addLog("Event from server: \(event)")

        if event == "INCOMING_CALL" || event == "DIAL" {
            let caller = json["caller_id"] as? String ?? json["from_number"] as? String ?? "Nexus AI Caller"
            simulateIncomingCall(caller: caller)
        } else if event == "HANGUP" {
            if let uuid = activeCallUUID {
                callKitManager.endCall(uuid: uuid) { _ in }
            }
        }
    }
}
