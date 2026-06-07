// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Raw Tailwind color-scale utilities are banned everywhere: color carries
 * meaning in DronOps, so all of it must flow through semantic tokens
 * (bg-surface, text-fg-muted, text-status-warn, …). See DESIGN_SYSTEM §2.7.
 */
const RAW_TAILWIND_COLOR =
  String.raw`(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide|placeholder)` +
  String.raw`-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)` +
  String.raw`-(?:50|100|200|300|400|500|600|700|800|900|950)`;

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/drizzle/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/\\b${RAW_TAILWIND_COLOR}\\b/]`,
          message:
            "Raw Tailwind color-scale classes are banned. Use semantic tokens (bg-surface, text-fg-muted, text-status-*). See DESIGN_SYSTEM §2.7.",
        },
        {
          selector: `TemplateElement[value.raw=/\\b${RAW_TAILWIND_COLOR}\\b/]`,
          message:
            "Raw Tailwind color-scale classes are banned. Use semantic tokens (bg-surface, text-fg-muted, text-status-*). See DESIGN_SYSTEM §2.7.",
        },
      ],
    },
  },
  prettier,
);
