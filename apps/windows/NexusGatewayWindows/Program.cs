using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Nexus.CallOS.Companion
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.Title = "Nexus Call OS - Windows Gateway Node v2.4";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=================================================");
            Console.WriteLine(" Nexus Call OS - Windows Cellular & Audio Gateway");
            Console.WriteLine("=================================================");
            Console.ResetColor();

            string serverUrl = args.Length > 0 ? args[0] : "ws://localhost:8000/api/android-gateway/ws/bridge";
            Console.WriteLine($"\n[INFO] Connecting to Nexus WebSocket Bridge: {serverUrl}");

            using (ClientWebSocket ws = new ClientWebSocket())
            {
                try
                {
                    await ws.ConnectAsync(new Uri(serverUrl), CancellationToken.None);
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[ONLINE] Connected! USB GSM Modem & Audio Bridge Active.\n");
                    Console.ResetColor();

                    byte[] buffer = new byte[1024 * 4];
                    while (ws.State == WebSocketState.Open)
                    {
                        var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                        if (result.MessageType == WebSocketMessageType.Close)
                        {
                            await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"[ERROR] Connection error: {ex.Message}");
                    Console.ResetColor();
                }
            }
        }
    }
}
