import { defineConfig } from "tsup";

export const tsup = defineConfig({
  entry: [ "./index.ts" ],
  outDir: "./dist",
  format: [ "cjs", "esm" ],
  dts: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  clean: true,
  platform: "node",
  target: "es2022",
});
