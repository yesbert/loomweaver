import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";

const tailwindEntryPoint = fileURLToPath(new URL("./src/styles.css", import.meta.url));

export default tseslint.config(
    {
        ignores: ["dist/**", "test-results/**", ".angular/**", "e2e/**"]
    },
    {
        files: ["**/*.ts"],
        extends: [
            ...tseslint.configs.recommended,
            ...angular.configs.tsRecommended
        ],
        processor: angular.processInlineTemplates,
        rules: {
            "@angular-eslint/component-max-inline-declarations": ["error"],
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: {
                        memberTypes: [
                            "signature",
                            "field",
                            "constructor",
                            ["public-get", "public-set", "public-method"],
                            ["protected-get", "protected-set", "protected-method"],
                            ["private-get", "private-set", "private-method", "#private-method"]
                        ]
                    }
                }
            ]
        }
    },
    {
        files: ["**/*.html"],
        extends: [...angular.configs.templateRecommended],
        plugins: { "better-tailwindcss": betterTailwindcss },
        settings: {
            "better-tailwindcss": {
                entryPoint: tailwindEntryPoint,
                attributes: ["class"]
            }
        },
        rules: {
            "better-tailwindcss/no-unknown-classes": ["error", { ignore: ["^lw-", "^demo-"] }],
            "better-tailwindcss/enforce-consistent-class-order": "warn"
        }
    }
);
