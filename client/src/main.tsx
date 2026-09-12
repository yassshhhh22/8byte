import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/onest/wght.css";
import "@fontsource-variable/azeret-mono/wght.css";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
