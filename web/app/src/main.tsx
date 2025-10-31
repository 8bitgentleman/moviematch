import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import "./main.css";

import { AppRouter } from "./components/AppRouter";
import { ToastList } from "./components/atoms/Toast";
import { initializeWebSocket } from "./store/websocket";
import { useAuthStore } from "./store/authStore";
import { useUIStore } from "./store/uiStore";

// Initialize WebSocket connection
initializeWebSocket();

const MovieMatch = () => {
  const route = useUIStore((state) => state.route);
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);
  const translations = useAuthStore((state) => state.translations);

  return (
    <>
      <AppRouter route={route} translations={translations} />
      <ToastList toasts={toasts} removeToast={removeToast} />
    </>
  );
};

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <MovieMatch />
  </StrictMode>
);

if (
  window.innerHeight !==
    document.querySelector("body")?.getBoundingClientRect().height &&
  (!(navigator as unknown as Record<string, unknown>).standalone)
) {
  document.body.style.setProperty("--vh", window.innerHeight / 100 + "px");
  window.addEventListener("resize", () => {
    document.body.style.setProperty("--vh", window.innerHeight / 100 + "px");
  });
}

window.addEventListener("keyup", (e) => {
  if (e.key === "Tab") {
    document.body.classList.add("show-focus-ring");
  }
});

window.addEventListener("mouseup", () => {
  document.body.classList.remove("show-focus-ring");
});
