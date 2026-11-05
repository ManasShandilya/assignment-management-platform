"use client";
import { useEffect, useState } from "react";

function describe(deadline: number, now: number) {
  const diff = deadline - now;
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86400000), h = Math.floor((abs % 86400000) / 3600000), m = Math.floor((abs % 3600000) / 60000);
  const text = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${Math.max(m, 1)}m`;
  return diff >= 0 ? `${text} left` : `${text} overdue`;
}

export function RemainingTime({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const tick = () => setText(describe(new Date(iso).getTime(), Date.now()));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [iso]);
  return <span>{text || "\u00a0"}</span>;
}
