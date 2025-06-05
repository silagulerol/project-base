import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
     files: ["**/*.{js,mjs,cjs}"], 
     plugins: { js }, 
     languageOptions:{
       globals: globals.browser,
      sourceType: "commonjs",
     },
     rules: {
      "no-unused-vars": "off", // or "error" or "off"
    },
     extends: ["js/recommended"] 
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
]);
