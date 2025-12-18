import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { OpticaProvider } from "./context/OpticaContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <OpticaProvider>
        <App />
      </OpticaProvider>
    </BrowserRouter>
  </React.StrictMode>
);

