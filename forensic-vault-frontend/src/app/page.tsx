"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

// Standard Next.js structure ensures logic remains decoupled
interface ForensicLog {
  timestamp: string;
  protocol: string;
  payload: string;
}

export default function Home() {
  const [logs, setLogs] = useState<ForensicLog[]>([]);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("CONNECTING...");

  const fetchLogs = async () => {
    try {
      // Points to the Axum server running our Serial Bridge
      const response = await axios.get("http://127.0.0.1:4000/logs");
      // Reverse the array so that the newest hardware alerts appear at the top
      setLogs(response.data.reverse());
      setStatus("SYSTEM ONLINE // MONITORING SERIAL PORTS");
    } catch (error) {
      console.error("Connection failed");
      setStatus("ERROR: VAULT_BACKEND_OFFLINE");
    }
  };

  useEffect(() => {
    fetchLogs();
    // 2-second interval for faster real-time hardware reporting
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-10 min-h-screen bg-black text-green-500 font-mono">
      <div className="border-2 border-green-500 p-6 mb-10 bg-green-900 bg-opacity-10">
        <h1 className="text-4xl font-bold tracking-tighter">
          VAULT_DASHBOARD_v1.2
        </h1>
        <p
          className={`mt-2 text-xs ${status.includes("ERROR") ? "text-red-500 animate-pulse" : "text-green-700"}`}
        >
          {status}
        </p>

        <div className="mt-6 p-4 border border-green-800 bg-black">
          <label className="text-xs block mb-2 font-bold uppercase">
            Master Audit Key:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black border border-green-500 p-2 text-white w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-green-400"
            placeholder="Type 'admin123' to reveal payloads..."
          />
        </div>
      </div>

      <div className="border border-green-800 bg-black">
        <table className="w-full text-left border-collapse">
          <thead className="bg-green-900 bg-opacity-30">
            <tr>
              <th className="p-4 border-b border-green-800">TIMESTAMP</th>
              <th className="p-4 border-b border-green-800">PROTOCOL</th>
              <th className="p-4 border-b border-green-800">PAYLOAD</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr
                key={index}
                className="border-b border-green-900 hover:bg-green-800 hover:bg-opacity-20 transition cursor-pointer"
              >
                <td className="p-4 text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4 font-bold text-blue-400 text-xs uppercase">
                  {log.protocol}
                </td>
                <td className="p-4 text-xs">
                  {password === "admin123" ? (
                    <span className="text-red-500 font-bold tracking-tight">
                      {log.payload}
                    </span>
                  ) : (
                    <span className="text-green-900 select-none">
                      [DATA_ENCRYPTED_BY_VAULT]
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="p-20 text-center text-green-900 animate-pulse">
            IDLE // WAITING FOR HARDWARE INTERRUPT...
          </div>
        )}
      </div>
    </main>
  );
}
