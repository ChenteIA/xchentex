"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

// El script se inserta desde nuestro propio bundle (que lleva nonce), así que la
// CSP con 'strict-dynamic' lo permite sin abrir 'unsafe-inline'.
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export type TurnstileHandle = { reset: () => void };

type Props = {
  siteKey: string;
  action: "order" | "login";
  onToken: (token: string | null) => void;
  onError?: () => void;
};

/**
 * Widget de Cloudflare Turnstile (punto 12). Con "interaction-only" solo se
 * muestra cuando Cloudflare necesita que la persona haga clic.
 */
export const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ siteKey, action, onToken, onError }, ref) {
  const container = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const callbacks = useRef({ onToken, onError });

  useEffect(() => {
    callbacks.current = { onToken, onError };
  }, [onToken, onError]);

  useImperativeHandle(ref, () => ({
    reset() {
      callbacks.current.onToken(null);
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          size: "flexible",
          language: "es",
          action,
          callback: (t: string) => callbacks.current.onToken(t),
          "expired-callback": () => callbacks.current.onToken(null),
          "error-callback": () => {
            callbacks.current.onToken(null);
            callbacks.current.onError?.();
          },
        });
      })
      .catch(() => callbacks.current.onError?.());
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey, action]);

  return <div ref={container} />;
});
