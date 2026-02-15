"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

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
      // Using the direct IP address for better stability
      const response = await axios.get("http://127.0.0.1:4000/logs");
      setLogs(response.data);
      setStatus("SYSTEM ONLINE // MONITORING");
    } catch (error) {
      console.error("Connection failed");
      setStatus("ERROR: BACKEND UNREACHABLE");
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-10 min-h-screen bg-black text-green-500 font-mono">
      <div className="border-2 border-green-500 p-6 mb-10 bg-green-900 bg-opacity-10">
        <h1 className="text-4xl font-bold tracking-tighter">
          VAULT_DASHBOARD_v1.1
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
            placeholder="Type 'admin123'..."
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
                <td className="p-4 text-sm">{log.timestamp}</td>
                <td className="p-4 font-bold text-white text-xs">
                  {log.protocol}
                </td>
                <td className="p-4 text-xs">
                  {password === "admin123" ? (
                    <span className="text-blue-400 font-bold tracking-widest">
                      {log.payload}
                    </span>
                  ) : (
                    <span className="text-green-900 select-none">
                      ••••••••••••••••
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="p-20 text-center text-green-900">
            NO DATA IN VAULT. RUN THE SIMULATOR COMMAND IN TERMINAL.
          </div>
        )}
      </div>
    </main>
  );
}
