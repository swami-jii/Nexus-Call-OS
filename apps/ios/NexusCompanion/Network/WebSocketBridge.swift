import Foundation
import Combine

enum ConnectionState: String {
    case disconnected = "Disconnected"
    case connecting = "Connecting..."
    case connected = "Connected (Ready)"
    case error = "Connection Error"
}

class WebSocketBridge: NSObject, ObservableObject, URLSessionWebSocketDelegate {
    @Published var connectionState: ConnectionState = .disconnected
    @Published var latencyMs: Int = 0
    @Published var lastError: String?

    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession?
    private var pingTimer: Timer?
    private var pingStartTime: TimeInterval = 0

    var onIncomingAudio: ((Data) -> Void)?
    var onCommandReceived: (([String: Any]) -> Void)?
    var onStateChanged: ((ConnectionState) -> Void)?

    override init() {
        super.init()
    }

    func connect(serverUrlString: String, deviceId: String, token: String? = nil) {
        var cleanUrl = serverUrlString.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanUrl.hasPrefix("http://") {
            cleanUrl = "ws://" + cleanUrl.dropFirst(7)
        } else if cleanUrl.hasPrefix("https://") {
            cleanUrl = "wss://" + cleanUrl.dropFirst(8)
        } else if !cleanUrl.hasPrefix("ws://") && !cleanUrl.hasPrefix("wss://") {
            cleanUrl = "ws://" + cleanUrl
        }

        if !cleanUrl.contains("/ws/bridge") {
            if cleanUrl.hasSuffix("/") {
                cleanUrl += "api/android-gateway/ws/bridge"
            } else {
                cleanUrl += "/api/android-gateway/ws/bridge"
            }
        }

        var urlComponents = URLComponents(string: cleanUrl)
        var queryItems = [URLQueryItem(name: "device_id", value: deviceId)]
        if let token = token, !token.isEmpty {
            queryItems.append(URLQueryItem(name: "token", value: token))
        }
        urlComponents?.queryItems = queryItems

        guard let finalUrl = urlComponents?.url else {
            self.connectionState = .error
            self.lastError = "Invalid server URL configuration"
            return
        }

        self.connectionState = .connecting
        self.onStateChanged?(.connecting)
        self.lastError = nil

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        session = URLSession(configuration: config, delegate: self, delegateQueue: .main)
        webSocketTask = session?.webSocketTask(with: finalUrl)
        webSocketTask?.resume()

        startListening()
        startPingTimer()
    }

    func disconnect() {
        stopPingTimer()
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        session?.invalidateAndCancel()
        session = nil
        self.connectionState = .disconnected
        self.onStateChanged?(.disconnected)
    }

    func sendAudio(data: Data) {
        guard connectionState == .connected else { return }
        let message = URLSessionWebSocketTask.Message.data(data)
        webSocketTask?.send(message) { [weak self] error in
            if let error = error {
                DispatchQueue.main.async {
                    self?.lastError = "Audio send failure: \(error.localizedDescription)"
                }
            }
        }
    }

    func sendJSON(dict: [String: Any]) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: dict),
              let jsonString = String(data: jsonData, encoding: .utf8) else { return }

        let message = URLSessionWebSocketTask.Message.string(jsonString)
        webSocketTask?.send(message) { [weak self] error in
            if let error = error {
                DispatchQueue.main.async {
                    self?.lastError = "JSON command failure: \(error.localizedDescription)"
                }
            }
        }
    }

    private func startListening() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    self.onIncomingAudio?(data)
                case .string(let text):
                    self.handleIncomingText(text)
                @unknown default:
                    break
                }
                self.startListening()

            case .failure(let error):
                DispatchQueue.main.async {
                    self.connectionState = .error
                    self.lastError = error.localizedDescription
                    self.onStateChanged?(.error)
                }
            }
        }
    }

    private func handleIncomingText(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return
        }

        DispatchQueue.main.async { [weak self] in
            if let type = json["type"] as? String ?? json["event"] as? String {
                if type == "PONG" {
                    if let start = self?.pingStartTime, start > 0 {
                        self?.latencyMs = Int((Date().timeIntervalSince1960 - start) * 1000)
                    }
                } else if type == "AUTH_SUCCESS" {
                    self?.connectionState = .connected
                    self?.onStateChanged?(.connected)
                } else if type == "AUTH_ERROR" {
                    self?.connectionState = .error
                    self?.lastError = json["error"] as? String ?? "Authentication Failed"
                }
            }
            self?.onCommandReceived?(json)
        }
    }

    private func startPingTimer() {
        stopPingTimer()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 8.0, repeats: true) { [weak self] _ in
            guard let self = self, self.connectionState == .connected || self.connectionState == .connecting else { return }
            self.pingStartTime = Date().timeIntervalSince1960
            self.sendJSON(dict: ["event": "PING", "timestamp": self.pingStartTime])
        }
    }

    private func stopPingTimer() {
        pingTimer?.invalidate()
        pingTimer = nil
    }

    // MARK: - URLSessionWebSocketDelegate
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        DispatchQueue.main.async {
            self.connectionState = .connected
            self.onStateChanged?(.connected)
        }
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        DispatchQueue.main.async {
            self.connectionState = .disconnected
            self.onStateChanged?(.disconnected)
        }
    }
}
