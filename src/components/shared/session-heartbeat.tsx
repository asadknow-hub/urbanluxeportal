"use client";

import { useEffect, useRef } from "react";
import { startSession, heartbeatSession, closeSession } from "@/server/staff-sessions";

export function SessionHeartbeat() {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    async function init() {
      const result = await startSession();
      if (result.ok && result.data) {
        sessionIdRef.current = result.data.sessionId;

        heartbeatInterval = setInterval(async () => {
          if (sessionIdRef.current) {
            await heartbeatSession(sessionIdRef.current);
          }
        }, 60_000);
      }
    }

    init();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        if (sessionIdRef.current) {
          heartbeatSession(sessionIdRef.current);
        }
      }
    }

    function handleBeforeUnload() {
      if (sessionIdRef.current) {
        closeSession(sessionIdRef.current);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (sessionIdRef.current) {
        closeSession(sessionIdRef.current);
      }
    };
  }, []);

  return null;
}
