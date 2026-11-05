"use client";
import { useEffect, useState } from "react";

// Formats in the viewer's own time zone (the server's zone may differ).
export function LocalTime({ iso, withTime = true, precise = false }: { iso: string; withTime?: boolean; precise?: boolean }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(new Date(iso).toLocaleString(undefined, withTime
      ? { dateStyle: "medium", timeStyle: precise ? "medium" : "short" } : { dateStyle: "medium" }));
  }, [iso, withTime, precise]);
  return <time dateTime={iso}>{text || "\u00a0"}</time>;
}
