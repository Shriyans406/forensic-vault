"use client";
import { useEffect, useState } from "react";

interface ForensicLog {
  timestamp: string;
  protocol: string;
  payload: string;
}

export default function ForensicTable() {
  const [logs, setLogs] = useState<ForensicLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      // Connects to your Rust Axum server on port 4000
      const response = await fetch("http://localhost:4000/logs");
      const data = await response.json();
      setLogs(data.reverse()); // Show newest alerts at the top
      setLoading(false);
    } catch (error) {
      console.error("Forensic Link Error:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000); // Auto-refresh every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-black text-green-500 font-mono rounded-lg border border-green-900 shadow-2xl">
      <h2 className="text-xl mb-4 border-b border-green-900 pb-2">
        LIVE FORENSIC MONITOR
      </h2>
      {loading ? (
        <p className="animate-pulse">Searching for Hardware Bridge...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-green-800 uppercase text-sm">
                <th className="pb-3">Detection Time</th>
                <th className="pb-3">Protocol</th>
                <th className="pb-3">Status/Payload</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {logs.map((log, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-900 hover:bg-gray-950"
                >
                  <td className="py-3 text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 text-blue-500 font-bold">
                    {log.protocol}
                  </td>
                  <td className="py-3 text-red-600 italic font-medium">
                    {log.payload}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
