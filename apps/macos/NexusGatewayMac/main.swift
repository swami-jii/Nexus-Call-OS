import Cocoa
import AVFoundation

class AppDelegate: NSObject, NSApplicationDelegate {

    var statusItem: NSStatusItem?

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        statusItem?.button?.title = "⚡ Nexus Gateway"
        
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Status: Online (Active GSM Bridge)", action: nil, keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "Connect to Nexus Server...", action: #selector(connectServer), keyEquivalent: "c"))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit Nexus Gateway", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        statusItem?.menu = menu
    }

    @objc func connectServer() {
        print("Connecting to local Nexus Call OS server at ws://localhost:8000")
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
