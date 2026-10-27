// AI-assisted: see docs/AI_LOG.md #4
import { useCallback, useEffect, useState } from "react";

export const useTripRequests = (initialRequest = null, onAutoReject) => {
  const [request, setRequest] = useState(initialRequest);
  const [timeLeft, setTimeLeft] = useState(15);

  const isPending = request?.status === "requested";

  // Cuenta regresiva: el updater solo calcula el nuevo valor (sin efectos secundarios)
  useEffect(() => {
    if (!isPending) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => Math.max(prevTime - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPending]);

  // Al llegar a 0 se rechaza automáticamente, una sola vez
  useEffect(() => {
    if (!isPending || timeLeft > 0) return;

    setRequest((prev) => ({ ...prev, status: "cancelled" }));
    if (onAutoReject) onAutoReject();
  }, [isPending, timeLeft, onAutoReject]);

  const acceptRequest = useCallback(() => {
    setRequest((prev) => ({ ...prev, status: "accepted" }));
  }, []);

  const rejectRequest = useCallback(() => {
    setRequest((prev) => ({ ...prev, status: "cancelled" }));
    setTimeLeft(15);
  }, []);

  return { request, timeLeft, acceptRequest, rejectRequest };
};
