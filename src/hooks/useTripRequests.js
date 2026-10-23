import { useCallback, useEffect, useState } from "react";

export const useTripRequests = (initialRequest = null, onAutoReject) => {
  const [request, setRequest] = useState(initialRequest);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!request || request.status !== "requested") return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          if (onAutoReject) onAutoReject();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [request, onAutoReject]);

  const acceptRequest = useCallback(() => {
    setRequest((prev) => ({ ...prev, status: "accepted" }));
  }, []);

  const rejectRequest = useCallback(() => {
    setRequest((prev) => ({ ...prev, status: "cancelled" }));
    setTimeLeft(15);
  }, []);

  return { request, timeLeft, acceptRequest, rejectRequest };
};
