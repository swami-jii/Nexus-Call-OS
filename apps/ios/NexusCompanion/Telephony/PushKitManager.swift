import Foundation
import PushKit
import CallKit

class PushKitManager: NSObject, PKPushRegistryDelegate {
    private var voipRegistry: PKPushRegistry?
    private let callKitManager: CallKitManager

    var onVoIPTokenReceived: ((String) -> Void)?

    init(callKitManager: CallKitManager) {
        self.callKitManager = callKitManager
        super.init()
    }

    func registerForVoIPPushes() {
        voipRegistry = PKPushRegistry(queue: DispatchQueue.main)
        voipRegistry?.delegate = self
        voipRegistry?.desiredPushTypes = [.voIP]
    }

    // MARK: - PKPushRegistryDelegate
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            let token = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
            print("[PushKit] VoIP Push Token generated: \(token)")
            onVoIPTokenReceived?(token)
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
        guard type == .voIP else {
            completion()
            return
        }

        // Apple strictly requires reporting a CallKit call immediately upon receiving a VoIP push
        let data = payload.dictionaryPayload
        let callerId = data["caller_id"] as? String ?? data["from_number"] as? String ?? "Nexus AI Caller"
        let uuidString = data["uuid"] as? String ?? UUID().uuidString
        let uuid = UUID(uuidString: uuidString) ?? UUID()

        callKitManager.reportIncomingCall(uuid: uuid, handle: callerId) { error in
            if let error = error {
                print("[PushKit] Failed to report CallKit call from VoIP push: \(error.localizedDescription)")
            }
            completion()
        }
    }

    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        print("[PushKit] VoIP Push Token invalidated")
    }
}
