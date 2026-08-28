import SwiftUI
import AVFoundation

@main
struct NexusCompanionApp: App {
    @StateObject private var viewModel = GatewayViewModel()

    init() {
        setupAudioSession()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(viewModel)
                .preferredColorScheme(.dark)
        }
    }

    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .defaultToSpeaker])
            try session.setActive(true)
        } catch {
            print("[NexusApp] Failed to configure AVAudioSession: \(error.localizedDescription)")
        }
    }
}
