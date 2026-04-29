import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { TourProvider } from "./tour/TourController";
import { seedIfNeeded } from "./mock/seed";
import "./index.css";

const basename = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/";

(async () => {
  await seedIfNeeded();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <TourProvider>
          <App />
        </TourProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
})();
