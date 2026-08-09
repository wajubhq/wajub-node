import { defineConfig } from "tsup";
import { readFileSync } from "fs";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as { version: string };

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  platform: "node",
  target: "node18",
  define: {
    // Injected at build time so the User-Agent header reflects the published version.
    __SDK_VERSION__: JSON.stringify(version),
  },
});
