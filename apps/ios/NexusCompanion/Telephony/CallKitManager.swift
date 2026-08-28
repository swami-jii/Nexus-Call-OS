import Foundation
import CallKit
import AVFoundation

class CallKitManager: NSObject, CXProviderDelegate {
    private let provider: CXProvider
    private let callController = CXCallController()

    var onCallAnswered: ((UUID) -> Void)?
    var onCallEnded: ((UUID) -> Void)?
    var onAudioSessionActivated: ((AVAudioSession) -> Void)?

    override init() {
        let config = CXProviderConfiguration()
        config.supportsVideo = false
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.phoneNumber, .generic]
        config.includesCallsInRecents = true

        self.provider = CXProvider(configuration: config)
        super.init()
        self.provider.setDelegate(self, queue: DispatchQueue.main)
    }


    func reportIncomingCall(uuid: UUID, handle: String, hasVideo: Bool = false, completion: @escaping (Error?) -> Void) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .phoneNumber, value: handle)
        update.localizedCallerName = "Nexus AI (\(handle))"
        update.hasVideo = hasVideo
        update.supportsDTMF = true
        update.supportsHolding = true
        update.supportsGrouping = false
        update.supportsUngrouping = false

        provider.reportNewIncomingCall(with: uuid, update: update) { error in
            completion(error)
        }
    }

    func endCall(uuid: UUID, completion: @escaping (Error?) -> Void) {
        let endAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endAction)
        callController.request(transaction) { error in
            completion(error)
        }
    }

    // MARK: - CXProviderDelegate
    func providerDidReset(_ provider: CXProvider) {
        // Stop all audio and clear active call sessions
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        action.fulfill()
        onCallAnswered?(action.callUUID)
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        action.fulfill()
        onCallEnded?(action.callUUID)
    }

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        onAudioSessionActivated?(audioSession)
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        // Audio session deactivated by OS
    }
}
