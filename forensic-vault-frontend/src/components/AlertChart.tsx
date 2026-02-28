"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AlertChart({ logs }: { logs: any[] }) {
  // 1. Transform logs into chart data
  const chartData = logs
    .map((log) => ({
      time: new Date(log.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      count: 1, // Each log is one event
    }))
    .reverse()
    .slice(-20); // Show last 20 events

  return (
    /* We add 'min-h-[250px]' here to prevent the chart from collapsing to 0px height */
    <div className="w-full min-h-[250px] bg-black border border-green-900 p-2 rounded relative">
      <h3 className="text-green-700 text-[10px] mb-2 uppercase">
        Live Forensic Traffic Load
      </h3>

      {logs.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-green-900 text-xs">
          WAITING FOR INCOMING DATA...
        </div>
      ) : (
        <div style={{ width: "100%", height: "220px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#064e3b"
                vertical={false}
              />
              <XAxis dataKey="time" hide />
              <YAxis
                stroke="#065f46"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000",
                  border: "1px solid #10b981",
                }}
                itemStyle={{ color: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: "#10b981" }}
                isAnimationActive={false} // Faster updates
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
