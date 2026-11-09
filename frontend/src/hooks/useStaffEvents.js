import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "../config";

/**
 * Custom hook managing real-time SSE pub/sub connection for the Staff Cockpit.
 * Automatically handles reconnection with exponential backoff and tracks connection state.
 *
 * @param {string|null} token - JWT bearer token
 * @param {object} handlers - Event handler callbacks
 */
export function useStaffEvents(token, handlers = {}) {
  // Connection states: 'connected' | 'reconnecting' | 'offline'
  const [connectionStatus, setConnectionStatus] = useState("offline");
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const backoffDelayRef = useRef(1000); // starts at 1s
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const connect = useCallback(() => {
    if (!token) {
      setConnectionStatus("offline");
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus((prev) => (prev === "offline" ? "reconnecting" : prev));

    const sseUrl = `${API_URL}/staff/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionStatus("connected");
      backoffDelayRef.current = 1000; // Reset backoff on successful connect
    };

    // Generic and specific event listeners
    const eventTypes = [
      "ticket_created",
      "ticket_updated",
      "approval_created",
      "approval_resolved",
      "audit_event",
      "kpi_update",
      "analytics_update",
      "new_customer_request"
    ];

    eventTypes.forEach((eventType) => {
      es.addEventListener(eventType, (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (handlersRef.current[eventType]) {
            handlersRef.current[eventType](parsed);
          }
          if (handlersRef.current.onEvent) {
            handlersRef.current.onEvent(eventType, parsed);
          }
        } catch (err) {
          console.error(`Failed to parse SSE event ${eventType}:`, err);
        }
      });
    });

    es.onerror = () => {
      setConnectionStatus("reconnecting");
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnect: 1s, 2s, 4s, 8s, max 16s
      const delay = backoffDelayRef.current;
      backoffDelayRef.current = Math.min(delay * 2, 16000);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [token]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnectionStatus("offline");
    };
  }, [connect]);

  return { connectionStatus };
}

export default useStaffEvents;
