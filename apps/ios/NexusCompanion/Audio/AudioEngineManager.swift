import Foundation
import AVFoundation

class AudioEngineManager: ObservableObject {
    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()

    @Published var isRunning = false
    var onMicrophoneData: ((Data) -> Void)?

    func start() {
        let inputNode = engine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)

        // Desired format: 16kHz Mono 16-bit PCM for AI Telephony
        guard let standardFormat = AVAudioFormat(commonFormat: .pcmFormatInt16,
                                                 sampleRate: 16000,
                                                 channels: 1,
                                                 interleaved: true) else {
            print("[AudioEngine] Failed to create desired audio format")
            return
        }

        engine.attach(playerNode)
        engine.connect(playerNode, to: engine.mainMixerNode, format: standardFormat)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] (buffer, _) in
            guard let self = self else { return }
            // Convert to 16-bit PCM bytes
            let audioData = self.convertBufferToData(buffer: buffer)
            if !audioData.isEmpty {
                self.onMicrophoneData?(audioData)
            }
        }

        do {
            try engine.start()
            playerNode.play()
            DispatchQueue.main.async {
                self.isRunning = true
            }
        } catch {
            print("[AudioEngine] Error starting audio engine: \(error.localizedDescription)")
        }
    }

    func stop() {
        engine.inputNode.removeTap(onBus: 0)
        playerNode.stop()
        engine.stop()
        DispatchQueue.main.async {
            self.isRunning = false
        }
    }

    func playAudioChunk(data: Data) {
        guard isRunning else { return }
        guard let format = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 16000, channels: 1, interleaved: true),
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(data.count / 2)) else {
            return
        }
        buffer.frameLength = buffer.frameCapacity
        data.withUnsafeBytes { rawBufferPointer in
            if let baseAddress = rawBufferPointer.baseAddress {
                memcpy(buffer.int16ChannelData?[0], baseAddress, data.count)
            }
        }
        playerNode.scheduleBuffer(buffer, completionHandler: nil)
    }

    private func convertBufferToData(buffer: AVAudioPCMBuffer) -> Data {
        guard let channelData = buffer.int16ChannelData else {
            // Fallback for float buffer conversion
            guard let floatData = buffer.floatChannelData else { return Data() }
            let frameCount = Int(buffer.frameLength)
            var int16Data = [Int16](repeating: 0, count: frameCount)
            for i in 0..<frameCount {
                let sample = max(-1.0, min(1.0, floatData[0][i]))
                int16Data[i] = Int16(sample * 32767.0)
            }
            return Data(bytes: int16Data, count: frameCount * MemoryLayout<Int16>.size)
        }
        let frameCount = Int(buffer.frameLength)
        return Data(bytes: channelData[0], count: frameCount * MemoryLayout<Int16>.size)
    }
}
