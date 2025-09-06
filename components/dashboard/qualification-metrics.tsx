"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  {
    name: "Qualified",
    value: 89,
    color: "#82ca9d",
  },
  {
    name: "In Progress",
    value: 45,
    color: "#ffc658",
  },
  {
    name: "Not Started",
    value: 111,
    color: "#8884d8",
  },
]

export function QualificationMetrics() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
