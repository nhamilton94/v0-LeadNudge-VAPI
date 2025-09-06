"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  {
    name: "Jan",
    total: 45,
    qualified: 12,
    inProgress: 23,
  },
  {
    name: "Feb",
    total: 52,
    qualified: 18,
    inProgress: 27,
  },
  {
    name: "Mar",
    total: 61,
    qualified: 24,
    inProgress: 29,
  },
  {
    name: "Apr",
    total: 58,
    qualified: 28,
    inProgress: 21,
  },
  {
    name: "May",
    total: 65,
    qualified: 32,
    inProgress: 24,
  },
  {
    name: "Jun",
    total: 71,
    qualified: 38,
    inProgress: 25,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="qualified" stroke="#82ca9d" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="inProgress" stroke="#ffc658" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
