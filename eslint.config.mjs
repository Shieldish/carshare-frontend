import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  // eslint-config-next 16 fournit directement la configuration au format "flat" : la charger
  // via FlatCompat fait planter ESLint au démarrage ("Converting circular structure to JSON").
  ...nextVitals,
  ...nextTs,
  {
    // Règles récentes du React Compiler, ajoutées par Next 16. Elles signalent du code existant
    // qui fonctionne (62 cas au moment de la réparation du lint) et le corriger touche des
    // parcours sensibles. En avertissement, pour les traiter peu à peu sans bloquer le lint.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
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
