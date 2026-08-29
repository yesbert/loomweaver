import { fileURLToPath } from "node:url";
import nx from "@nx/eslint-plugin";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import regexp from "eslint-plugin-regexp";
import unicorn from "eslint-plugin-unicorn";
import * as angularTemplateParser from "@angular-eslint/template-parser";

// Tailwind v4 is CSS-first: the class registry is derived from this entry point
// (@import 'tailwindcss' + @source + @theme). Absolute so it resolves regardless of cwd.
const tailwindEntryPoint = fileURLToPath(
    new URL("apps/loom-testbed/src/styles.css", import.meta.url)
);

export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist",
            "**/out-tsc",
            // Angular's build cache: generated copies of files that are linted at their source.
            "**/.angular"
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
        // A pattern that can be driven into backtracking is a denial of service waiting for the one
        // input nobody tried. This is the analysis SonarQube runs for the same finding, moved to the
        // pull request: `no-super-linear-move` is not in the plugin's recommended set and carries
        // three of the four patterns this repository had, so it is named here on purpose.
        // Test files are exempt: a pattern in a spec never meets an input it did not choose.
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
        ignores: [
            "**/*.spec.ts",
            "**/*.spec.js"
        ],
        plugins: { regexp },
        rules: {
            "regexp/no-super-linear-backtracking": "error",
            "regexp/no-super-linear-move": "error"
        }
    },
    {
        // Modern JavaScript, enforced rather than written down: the API that exists now over the
        // one it replaced, a condition without a needless negation, a Set where membership is what
        // is asked. SonarQube ships a large part of this set as its own S77xx rules, which is how
        // most of the 93 issues cleared in August arrived in the first place; here they are caught
        // in the pull request instead of the nightly scan.
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
        plugins: { unicorn },
        rules: {
            ...unicorn.configs.recommended.rules,

            // Four the workspace does not take, each for a reason that outlives the rule:

            // It rewrites a single-line `/** ... */` to `//`, which unmakes every JSDoc line on the
            // published contract — the very lines api-docs-check requires and an IDE reads.
            "unicorn/single-line-block-comment-style": "off",

            // It wants private members first; engineering-standards.md wants the public surface
            // first, so a reader meets the contract before the machinery. member-ordering below
            // enforces ours, and two orders cannot both hold.
            "unicorn/consistent-class-member-order": "off",

            // It bans `null`. Angular and the DOM hand us `null` (queryParamMap.get, querySelector)
            // and our own signatures return it; banning the literal would only move the seam.
            "unicorn/no-null": "off",

            // Abbreviations are expanded, except the ones that are names rather than shorthand:
            // `ctx` is what every plugin author knows the context by, `args`, `ref` and `deps` sit
            // in the published contract or in type names built on it.
            "unicorn/name-replacements": [
                "error",
                {
                    replacements: {
                        arg: false,
                        args: false,
                        ctx: false,
                        dep: false,
                        deps: false,
                        param: false,
                        params: false,
                        prop: false,
                        props: false,
                        ref: false,
                        refs: false
                    }
                }
            ],

            // Everything below is switched off only until its findings are cleared, one pull
            // request per group. A rule that is not in this list is enforced.
            "unicorn/catch-error-name": "off",
            "unicorn/consistent-boolean-name": "off",
            "unicorn/consistent-conditional-object-spread": "off",
            "unicorn/consistent-existence-index-check": "off",
            "unicorn/consistent-function-scoping": "off",
            "unicorn/dom-node-dataset": "off",
            "unicorn/explicit-length-check": "off",
            "unicorn/explicit-timer-delay": "off",
            "unicorn/import-style": "off",
            "unicorn/isolated-functions": "off",
            "unicorn/max-nested-calls": "off",
            "unicorn/name-replacements": "off",
            "unicorn/no-array-callback-reference": "off",
            "unicorn/no-array-reduce": "off",
            "unicorn/no-array-sort": "off",
            "unicorn/no-await-expression-member": "off",
            "unicorn/no-break-in-nested-loop": "off",
            "unicorn/no-computed-property-existence-check": "off",
            "unicorn/no-declarations-before-early-exit": "off",
            "unicorn/no-for-each": "off",
            "unicorn/no-global-object-property-assignment": "off",
            "unicorn/no-negated-array-predicate": "off",
            "unicorn/no-negated-condition": "off",
            "unicorn/no-object-as-default-parameter": "off",
            "unicorn/no-optional-chaining-on-undeclared-variable": "off",
            "unicorn/no-process-exit": "off",
            "unicorn/no-return-array-push": "off",
            "unicorn/no-top-level-assignment-in-function": "off",
            "unicorn/no-top-level-side-effects": "off",
            "unicorn/no-unnecessary-boolean-comparison": "off",
            "unicorn/no-unnecessary-global-this": "off",
            "unicorn/no-unnecessary-string-trim": "off",
            "unicorn/no-unreadable-for-of-expression": "off",
            "unicorn/no-unsafe-string-replacement": "off",
            "unicorn/no-useless-coercion": "off",
            "unicorn/no-useless-collection-argument": "off",
            "unicorn/no-useless-concat": "off",
            "unicorn/no-useless-promise-resolve-reject": "off",
            // `f(undefined)` is not `f()` when the parameter is required, and `() => undefined`
            // may not become `() => {}` while no-empty-function forbids exactly that.
            "unicorn/no-useless-undefined": [
                "error",
                { checkArguments: false, checkArrowFunctionBody: false }
            ],
            "unicorn/numeric-separators-style": "off",
            "unicorn/prefer-add-event-listener": "off",
            "unicorn/prefer-add-event-listener-options": "off",
            "unicorn/prefer-array-from-map": "off",
            "unicorn/prefer-at": "off",
            "unicorn/prefer-await": "off",
            "unicorn/prefer-continue": "off",
            "unicorn/prefer-dom-node-append": "off",
            "unicorn/prefer-dom-node-html-methods": "off",
            "unicorn/prefer-dom-node-replace-children": "off",
            "unicorn/prefer-early-return": "off",
            "unicorn/prefer-else-if": "off",
            "unicorn/prefer-export-from": "off",
            "unicorn/prefer-global-number-constants": "off",
            "unicorn/prefer-global-this": "off",
            "unicorn/prefer-includes-over-repeated-comparisons": "off",
            "unicorn/prefer-direct-iteration": "off",
            "unicorn/prefer-iterator-helpers": "off",
            "unicorn/prefer-iterator-to-array": "off",
            "unicorn/prefer-minimal-ternary": "off",
            "unicorn/prefer-module": "off",
            "unicorn/prefer-number-coercion": "off",
            "unicorn/prefer-number-is-safe-integer": "off",
            "unicorn/prefer-number-properties": "off",
            "unicorn/prefer-object-define-properties": "off",
            "unicorn/prefer-promise-try": "off",
            "unicorn/prefer-scoped-selector": "off",
            "unicorn/prefer-set-has": "off",
            "unicorn/prefer-simple-condition-first": "off",
            "unicorn/prefer-simplified-conditions": "off",
            "unicorn/prefer-split-limit": "off",
            "unicorn/prefer-spread": "off",
            "unicorn/prefer-string-raw": "off",
            "unicorn/prefer-string-repeat": "off",
            "unicorn/prefer-string-replace-all": "off",
            "unicorn/prefer-structured-clone": "off",
            "unicorn/prefer-then-catch": "off",
            "unicorn/prefer-toggle-attribute": "off",
            "unicorn/prefer-top-level-await": "off",
            "unicorn/prefer-unicode-code-point-escapes": "off",
            "unicorn/require-array-sort-compare": "off",
            "unicorn/require-css-escape": "off",
            "unicorn/switch-case-braces": "off",
            "unicorn/text-encoding-identifier-case": "off"
        }
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
