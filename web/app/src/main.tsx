import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";

import "./main.css";

import { AppRouter } from "./components/AppRouter";
import { ToastList } from "./components/atoms/Toast";
import { createStore, Dispatch, useSelector } from "./store";

const store = createStore();

const MovieMatch = () => {
  const { route = "loading", translations, toasts } = useSelector([
    "route",
    "translations",
    "toasts",
  ]);

  const dispatch = useDispatch<Dispatch>();

  return (
    <>
      <AppRouter route={route} translations={translations} />
      <ToastList
        toasts={toasts}
        removeToast={(toast) =>
          dispatch({ type: "removeToast", payload: toast })}
      />
    </>
  );
};

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <Provider store={store}>
      <MovieMatch />
    </Provider>
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
