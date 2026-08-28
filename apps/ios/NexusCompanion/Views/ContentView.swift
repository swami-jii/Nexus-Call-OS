import SwiftUI

struct ContentView: View {
    @EnvironmentObject var viewModel: GatewayViewModel
    @State private var showingSettings = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 18) {
                    // 1. Header & Branding
                    HeaderView()

                    // 2. Live Connection Status Card
                    ConnectionStatusCard()

                    // 3. System Permissions
                    PermissionsCardView()

                    // 4. CallKit Call Screening Test
                    CallKitActionCard()

                    // 5. Hardware Diagnostics
                    DeviceDiagnosticsView()

                    // 6. Real-time Event Console
                    LiveEventLogsView()
                }
                .padding()
            }
            .background(Color(UIColor.systemBackground).edgesIgnoringSafeArea(.all))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        Image(systemName: "waveform.badge.magnifyingglass")
                            .foregroundColor(.blue)
                        Text("Nexus Companion")
                            .font(.headline)
                            .fontWeight(.bold)
                    }
                }
            }
        }
    }
}

// MARK: - Subviews
struct HeaderView: View {
    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 54, height: 54)
                Image(systemName: "phone.bubble.left.fill")
                    .font(.title2)
                    .foregroundColor(.white)
            }
            Text("Nexus Call OS Gateway")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)
            Text("iOS Voice Telephony Companion Client")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(.top, 4)
    }
}

struct ConnectionStatusCard: View {
    @EnvironmentObject var viewModel: GatewayViewModel

    var body: some View {
        VStack(spacing: 14) {
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 10, height: 10)
                Text(viewModel.connectionState.rawValue)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                Spacer()
                if viewModel.connectionState == .connected {
                    Text("\(viewModel.latencyMs)ms")
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.2))
                        .foregroundColor(.green)
                        .cornerRadius(4)
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Backend Gateway URL")
                    .font(.caption2)
                    .foregroundColor(.gray)
                TextField("ws://192.168.1.34:8000", text: $viewModel.serverUrl)
                    .font(.system(size: 13, design: .monospaced))
                    .padding(10)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(8)
                    .foregroundColor(.white)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
            }

            HStack {
                Button(action: {
                    if viewModel.connectionState == .connected || viewModel.connectionState == .connecting {
                        viewModel.disconnect()
                    } else {
                        viewModel.connect()
                    }
                }) {
                    HStack {
                        Image(systemName: viewModel.connectionState == .connected ? "stop.fill" : "play.fill")
                        Text(viewModel.connectionState == .connected ? "Disconnect Gateway" : "Connect Gateway")
                    }
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(viewModel.connectionState == .connected ? Color.red : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var statusColor: Color {
        switch viewModel.connectionState {
        case .connected: return .green
        case .connecting: return .yellow
        case .disconnected: return .gray
        case .error: return .red
        }
    }
}

struct CallKitActionCard: View {
    @EnvironmentObject var viewModel: GatewayViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "phone.badge.checkmark")
                    .foregroundColor(.green)
                Text("CallKit Screen Test")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }

            Text("Test triggering the genuine native iOS full-screen incoming call UI via CallKit framework:")
                .font(.caption2)
                .foregroundColor(.gray)

            Button(action: {
                viewModel.simulateIncomingCall(caller: "Nexus AI Assistant (+1 415 555 0199)")
            }) {
                HStack {
                    Image(systemName: "phone.arrow.down.left.fill")
                    Text("Trigger Native CallKit Screen")
                }
                .font(.caption)
                .fontWeight(.bold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.green.opacity(0.2))
                .foregroundColor(.green)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.green.opacity(0.4), lineWidth: 1)
                )
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
}

struct LiveEventLogsView: View {
    @EnvironmentObject var viewModel: GatewayViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "terminal.fill")
                    .foregroundColor(.gray)
                Text("Event Diagnostics Console")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Button("Clear") {
                    viewModel.clearLogs()
                }
                .font(.caption2)
                .foregroundColor(.blue)
            }

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 4) {
                    if viewModel.logs.isEmpty {
                        Text("No logs recorded yet.")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.gray)
                    } else {
                        ForEach(viewModel.logs, id: \.self) { log in
                            Text(log)
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundColor(.green)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(height: 100)
            .padding(8)
            .background(Color.black.opacity(0.4))
            .cornerRadius(8)
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
}
