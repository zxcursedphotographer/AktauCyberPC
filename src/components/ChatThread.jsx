"use client";
import { useEffect, useRef } from "react";

export default function ChatThread({ meId, initial }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [initial.length]);
  return (
    <div ref={ref} className="flex-1 space-y-1 overflow-y-auto pr-1 text-sm">
      {initial.map((m) => (
        <p
          key={m.id}
          className={`max-w-[75%] rounded-lg px-3 py-1.5 ${
            m.senderId === meId ? "ml-auto bg-accent text-white" : "bg-slate-200 dark:bg-white/10"
          }`}
        >
          {m.text}
        </p>
      ))}
    </div>
  );
}