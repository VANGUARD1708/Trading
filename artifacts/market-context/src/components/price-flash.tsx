import { useEffect, useRef, useState } from "react";

interface PriceFlashProps {
  value: number;
  prevValue?: number;
  flash?: "up" | "down" | null;
  decimals?: number;
  prefix?: string;
  className?: string;
  showArrow?: boolean;
}

export function PriceFlash({
  value,
  prevValue,
  flash,
  decimals = 2,
  prefix = "$",
  className = "",
  showArrow = false,
}: PriceFlashProps) {
  const [flashState, setFlashState] = useState<"up" | "down" | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const dir = flash ?? (value > prevRef.current ? "up" : value < prevRef.current ? "down" : null);
    if (dir) {
      setFlashState(dir);
      const t = setTimeout(() => setFlashState(null), 700);
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value, flash]);

  const formatted = prefix + value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={`tabular-nums transition-colors duration-150 ${className} ${
        flashState === "up"
          ? "text-emerald-400"
          : flashState === "down"
          ? "text-red-400"
          : ""
      }`}
      style={{
        textShadow:
          flashState === "up"
            ? "0 0 8px hsla(142,71%,45%,0.8)"
            : flashState === "down"
            ? "0 0 8px hsla(0,84%,60%,0.8)"
            : undefined,
      }}
    >
      {showArrow && flashState === "up" && "▲ "}
      {showArrow && flashState === "down" && "▼ "}
      {formatted}
    </span>
  );
}
