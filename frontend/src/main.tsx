import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initialLang, loadLocale } from "./i18n";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

function render() {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Locale dictionaries are code-split (see i18n/index.ts), so the one this
// visitor actually reads has to be resident before the first render —
// otherwise a returning Russian or Uzbek speaker gets a frame of English
// that then swaps under them.
//
// It costs nothing for the default: English is bundled eagerly, so
// loadLocale("en") resolves in the same microtask and the render is not
// delayed at all. Everyone else pays one small (~4 KB gzipped) chunk
// fetch, in exchange for not carrying the other five languages on every
// visit. A failed fetch still renders — loadLocale resolves rather than
// rejects, and t() falls back to English.
loadLocale(initialLang()).then(render);
