import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss";
import { tanstackStart } from "@tanstack/react-start/plugin/rsbuild";

export default defineConfig({
  server: {
    port: 8323,
    // Bind to all interfaces so Docker (and PM2) can expose the port externally.
    // Without this, rsbuild preview only listens on 127.0.0.1 inside the container.
    host: "0.0.0.0",
  },
  plugins: [pluginReact(), tanstackStart(), pluginTailwindcss()],
});
