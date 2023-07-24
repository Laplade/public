import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import pkg from "./package.json" assert { type: "json" };
// import tscnf from "./tsconfig.json" assert { type: "json" };

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      commonjs({
        include: ["node_modules/**"],
      }),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],
    external: [
      "react",
      "react-dom",
      "firebase",
      "firebase-admin",
      "firebase-functions",
      "puppeteer",
      "react-firebase-hooks",
    ],
  },
  {
    input: "dist/cjs/types/index.d.ts",
    output: [{ file: "dist/cjs/index.d.ts", format: "cjs" }],
    plugins: [dts()],
  },
  {
    input: "dist/esm/types/index.d.ts",
    output: [{ file: "dist/esm/index.d.ts", format: "esm" }],
    plugins: [dts()],
  },
];
