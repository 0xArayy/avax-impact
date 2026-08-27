import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DecoderDemo } from "./app/DecoderDemo";
import "./app/globals.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing #root mount point");

createRoot(root).render(
  <StrictMode>
    <DecoderDemo />
  </StrictMode>,
);
