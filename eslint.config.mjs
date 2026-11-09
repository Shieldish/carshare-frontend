import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  // eslint-config-next 16 fournit directement la configuration au format "flat" : la charger
  // via FlatCompat fait planter ESLint au démarrage ("Converting circular structure to JSON").
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
