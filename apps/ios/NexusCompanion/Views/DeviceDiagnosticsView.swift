import SwiftUI

struct DeviceDiagnosticsView: View {
    @EnvironmentObject var viewModel: GatewayViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "cpu")
                    .foregroundColor(.purple)
                Text("Device Diagnostics")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                DiagnosticItem(title: "Device Model", value: viewModel.deviceModel, icon: "iphone")
                DiagnosticItem(title: "OS Version", value: viewModel.osVersion, icon: "applelogo")
                DiagnosticItem(title: "Battery Level", value: "\(viewModel.batteryLevel)%", icon: "battery.100")
                DiagnosticItem(title: "Stream Latency", value: "\(viewModel.latencyMs) ms", icon: "waveform.path.ecg")
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
}

struct DiagnosticItem: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .font(.caption)
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
                Text(value)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
            }
            Spacer()
        }
        .padding(8)
        .background(Color.black.opacity(0.2))
        .cornerRadius(8)
    }
}
