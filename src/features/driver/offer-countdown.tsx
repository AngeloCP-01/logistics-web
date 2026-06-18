import { useEffect, useRef, useState } from "react";

function remainingSeconds(expiresAt: string): number {
  return Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
}

export function OfferCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(expiresAt));
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const id = setInterval(() => {
      const next = remainingSeconds(expiresAt);
      setSeconds(next);
      if (next === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className="text-sm font-medium text-amber-700">
      {seconds === 0 ? "Expired" : `Expires in ${seconds}s`}
    </span>
  );
}
