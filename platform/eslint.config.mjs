import { fileURLToPath } from "node:url";
import nx from "@nx/eslint-plugin";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import * as angularTemplateParser from "@angular-eslint/template-parser";

// Tailwind v4 is CSS-first: the class registry is derived from this entry point
// (@import 'tailwindcss' + @source + @theme). Absolute so it resolves regardless of cwd.
const tailwindEntryPoint = fileURLToPath(
    new URL("./apps/loom-testbed/src/styles.css", import.meta.url)
);

export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist",
            "**/out-tsc"
        ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        "^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"
                    ],
                    depConstraints: [
                        {
                            // Platform stays domain-pure: never depend on a weaver.
                            sourceTag: "scope:platform",
                            onlyDependOnLibsWithTags: [
                                "scope:platform"
                            ]
                        },
                        {
                            // A weaver may only consume the public contract, no core internals.
                            sourceTag: "scope:weaver",
                            onlyDependOnLibsWithTags: [
                                "scope:weaver",
                                "scope:integration",
                                "type:contract"
                            ]
                        },
                        {
                            // A distribution is the one composition root where the platform meets
                            // its weaver bundles (VS Code's product layer): it may consume the
                            // platform, weavers and the contract to wire a shippable product.
                            sourceTag: "scope:distribution",
                            onlyDependOnLibsWithTags: [
                                "scope:distribution",
                                "scope:platform",
                                "scope:weaver",
                                "scope:integration",
                                "type:contract"
                            ]
                        },
                        {
                            // Runtime adapters to a third-party protocol: may reach the public
                            // contract and each other, never the shell or a weaver. They run in the
                            // user's browser, unlike scope:tooling, which runs while you build.
                            sourceTag: "scope:integration",
                            onlyDependOnLibsWithTags: [
                                "scope:integration",
                                "type:contract"
                            ]
                        },
                        {
                            // Dev-time tooling (the scaffolding devkit): may reach the public
                            // contract for validation, never a weaver's or the shell's internals.
                            sourceTag: "scope:tooling",
                            onlyDependOnLibsWithTags: [
                                "scope:tooling",
                                "type:contract"
                            ]
                        },
                        {
                            sourceTag: "*",
                            onlyDependOnLibsWithTags: [
                                "*"
                            ]
                        }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        // Override or add rules here
        rules: {}
    },
    {
        // House member order (engineering-standards.md): fields -> constructor ->
        // methods public -> protected -> private. Accessors sort with the methods
        // of their visibility; a property holding an arrow function counts as a
        // method of its visibility (the rule's own classification).
        files: [
            "**/*.ts",
            "**/*.tsx"
        ],
        rules: {
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
        // Tailwind guardrail on Angular templates (see docs/reference/design-tokens.md):
        // catch typo'd / non-existent utility classes (Tailwind ignores them silently)
        // and keep class order stable. Own hand-written CSS classes use the `lw-` prefix.
        files: ["**/*.html"],
        languageOptions: { parser: angularTemplateParser },
        plugins: { "better-tailwindcss": betterTailwindcss },
        settings: {
            "better-tailwindcss": {
                entryPoint: tailwindEntryPoint,
                // Only the static `class` attribute. Angular `[class.x]="expr"` bindings
                // carry the class in the attribute *name*; their value is a boolean
                // expression whose string literals would otherwise be misread as classes.
                attributes: ["class"]
            }
        },
        rules: {
            "better-tailwindcss/no-unknown-classes": [
                "error",
                { ignore: ["^lw-"] }
            ],
            "better-tailwindcss/enforce-consistent-class-order": "warn"
        }
    }
];
