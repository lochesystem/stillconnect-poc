import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Deve coincidir com o slug do repositório em GitHub Pages (repo atual: stillconnect-poc).
  base: command === "build" ? "/stillconnect-poc/" : "/",
}));
