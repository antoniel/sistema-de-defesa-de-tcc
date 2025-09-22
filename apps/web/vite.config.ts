import { reactRouter } from "@react-router/dev/vite";
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    codeInspectorPlugin({
      bundler: "vite",
      hotKeys: ['altKey', 'shiftKey']
    })
  ],
})
