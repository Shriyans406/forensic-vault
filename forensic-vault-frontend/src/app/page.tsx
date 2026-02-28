"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import AlertChart from "@/components/AlertChart";

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
      const response = await axios.get("http://127.0.0.1:4000/logs");
      setLogs(response.data.reverse());
      setStatus("SYSTEM ONLINE // MONITORING");
    } catch (error) {
      setStatus("ERROR: VAULT_OFFLINE");
    }
  };

  // Optional: A function to clear logs for a fresh demo
  const clearVault = async () => {
    if (confirm("Permanently wipe all forensic logs?")) {
      try {
        await axios.post("http://127.0.0.1:4000/simulate", {
          timestamp: new Date().toISOString(),
          protocol: "SYSTEM",
          payload: "VAULT_WIPED_BY_ADMIN",
        });
        alert("Vault Reset Successful");
      } catch (e) {
        alert("Reset Failed");
      }
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-10 min-h-screen bg-black text-green-500 font-mono">
      <div className="border-2 border-green-500 p-6 mb-10 bg-green-900 bg-opacity-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Vault_Dashboard_v1.3
            </h1>
            <p
              className={`mt-2 text-xs ${status.includes("ERROR") ? "text-red-500 animate-pulse" : "text-green-700"}`}
            >
              {status}
            </p>
          </div>
          <button
            onClick={clearVault}
            className="text-[10px] border border-red-900 text-red-900 px-2 py-1 hover:bg-red-900 hover:text-white transition"
          >
            WIPE_DATA
          </button>
        </div>

        <div className="mt-6 p-4 border border-green-800 bg-black flex gap-4 items-center">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black border border-green-500 p-2 text-white w-full max-w-xs focus:outline-none"
            placeholder="Enter Master Audit Key..."
          />
        </div>
      </div>

      {/* --- ANALYTICS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <AlertChart logs={logs} />
        </div>
        <div className="bg-green-900 bg-opacity-10 border border-green-800 p-8 flex flex-col justify-center items-center">
          <span className="text-xs text-green-800 uppercase font-bold">
            Live Counter
          </span>
          <span className="text-7xl font-black text-white">{logs.length}</span>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="border border-green-800 bg-black overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-green-900 bg-opacity-30 text-[10px] uppercase">
            <tr>
              <th className="p-4 border-b border-green-800">Time</th>
              <th className="p-4 border-b border-green-800">Protocol</th>
              <th className="p-4 border-b border-green-800">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr
                key={index}
                className="border-b border-green-900 hover:bg-green-800 hover:bg-opacity-10 transition"
              >
                <td className="p-4 text-[10px] text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="p-4 font-bold text-blue-500 text-xs">
                  {log.protocol}
                </td>
                <td className="p-4 text-xs font-bold">
                  {password === "admin123" ? (
                    <span className="text-red-600">{log.payload}</span>
                  ) : (
                    <span className="text-green-900 opacity-30">
                      [ENCRYPTED]
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
