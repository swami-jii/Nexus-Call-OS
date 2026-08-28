import SwiftUI

struct PermissionsCardView: View {
    @EnvironmentObject var viewModel: GatewayViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "shield.lefthalf.filled")
                    .foregroundColor(.blue)
                Text("System Permissions")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }

            // 1. Microphone Permission
            HStack {
                Image(systemName: "mic.fill")
                    .foregroundColor(viewModel.isMicAuthorized ? .green : .orange)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Microphone Access")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    Text("Required for live AI voice call duplex streaming")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }

                Spacer()

                if viewModel.isMicAuthorized {
                    Label("Granted", systemImage: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                } else {
                    Button(action: {
                        viewModel.requestMicrophonePermission()
                    }) {
                        Text("Grant")
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
            }

            Divider().background(Color.gray.opacity(0.3))

            // 2. CallKit Integration
            HStack {
                Image(systemName: "phone.circle.fill")
                    .foregroundColor(.green)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text("CallKit Integration")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    Text("Native iOS Incoming & Active Call Screen")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }

                Spacer()

                Text("Available")
                    .font(.caption)
                    .foregroundColor(.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.15))
                    .cornerRadius(6)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
}
