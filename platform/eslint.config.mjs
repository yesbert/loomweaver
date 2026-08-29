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
                        String.raw`^.*/eslint(\.base)?\.config\.[cm]?[jt]s$`
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

            // It wants every boolean to start with is/has/can. Two of its 132 findings are on
            // the published contract (`meetsAccess`, `SettingToggle.value`), where renaming costs
            // a major version, and `SettingToggle.value` is right as it stands: it is the value of
            // the toggle. The rest are domain words — a view is `retained`, a capability is
            // `granted` — and `isRetained` reads no better, only longer.
            "unicorn/consistent-boolean-name": "off",

            // It bans `null`. Angular and the DOM hand us `null` (queryParamMap.get, querySelector)
            // and our own signatures return it; banning the literal would only move the seam.
            "unicorn/no-null": "off",

            // Abbreviations are expanded, except the ones that are names rather than shorthand:
            // `ctx` is what every plugin author knows the context by, `args`, `ref` and `deps` sit
            // in the published contract or in type names built on it.
            // Off for now: what its fixer could rename safely is renamed, and the 50 left
            // need a reader. `e` is an event in one place and an entry in the next, and the
            // rule offers `event_` for both.
            "unicorn/name-replacements": [
                "off",
                {
                    // A filename follows the framework that reads it: proxy.conf.js is what
                    // Angular looks for, and renaming it would only break the reference.
                    checkFilenames: false,
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
                        refs: false,
                        // Where the rule offers several spellings it cannot choose between,
                        // the workspace names one so the fix is not left to whoever reads it.
                        dir: { directory: true },
                        str: { text: true }
                    }
                }
            ],

            // Everything below is switched off only until its findings are cleared, one pull
            // request per group. A rule that is not in this list is enforced. Where a rule
            // carries a note, its fixer was tried and did damage: read the note before
            // reaching for --fix.
            "unicorn/consistent-function-scoping": "off",
            // `dataset` lives on HTMLElement, and these call sites hold an Element
            "unicorn/dom-node-dataset": "off",
            // assumes a property named `size` is never negative; ours is a
            // percentage from a plugin declaration, and its fixer turned `size <= 0` into
            // `size === 0`, which stopped reporting negative sizes
            "unicorn/explicit-length-check": "off",
            "unicorn/import-style": "off",
            "unicorn/isolated-functions": "off",
            "unicorn/max-nested-calls": "off",
            "unicorn/no-array-callback-reference": "off",
            "unicorn/no-array-reduce": "off",
            "unicorn/no-await-expression-member": "off",
            "unicorn/no-break-in-nested-loop": "off",
            "unicorn/no-computed-property-existence-check": "off",
            "unicorn/no-declarations-before-early-exit": "off",
            "unicorn/no-for-each": "off",
            "unicorn/no-global-object-property-assignment": "off",
            "unicorn/no-object-as-default-parameter": "off",
            "unicorn/no-optional-chaining-on-undeclared-variable": "off",
            "unicorn/no-process-exit": "off",
            "unicorn/no-return-array-push": "off",
            "unicorn/no-top-level-assignment-in-function": "off",
            "unicorn/no-top-level-side-effects": "off",
            // `globalThis.X` yields undefined where a bare `X` throws a ReferenceError,
            // which is exactly what a test that stubs a global relies on
            "unicorn/no-unnecessary-global-this": "off",
            "unicorn/no-unreadable-for-of-expression": "off",
            "unicorn/no-unsafe-string-replacement": "off",
            // `f(undefined)` is not `f()` when the parameter is required, and `() => undefined`
            // may not become `() => {}` while no-empty-function forbids exactly that.
            "unicorn/no-useless-undefined": [
                "error",
                { checkArguments: false, checkArrowFunctionBody: false }
            ],
            "unicorn/prefer-add-event-listener": "off",
            "unicorn/prefer-array-from-map": "off",
            // `.at(-1)` returns `T | undefined`, which is honest and needs each of the
            // 17 call sites to say what it does when the collection is empty
            "unicorn/prefer-at": "off",
            "unicorn/prefer-await": "off",
            // `getHTML()` is a 2024 DOM API that jsdom does not have, so the tests
            // that read rendered markup fail on it
            "unicorn/prefer-dom-node-html-methods": "off",
            // adds lines by design, see switch-case-braces
            "unicorn/prefer-early-return": "off",
            "unicorn/prefer-else-if": "off",
            "unicorn/prefer-includes-over-repeated-comparisons": "off",
            "unicorn/prefer-direct-iteration": "off",
            "unicorn/prefer-iterator-helpers": "off",
            "unicorn/prefer-iterator-to-array": "off",
            "unicorn/prefer-module": "off",
            "unicorn/prefer-number-coercion": "off",
            "unicorn/prefer-promise-try": "off",
            "unicorn/prefer-scoped-selector": "off",
            "unicorn/prefer-simple-condition-first": "off",
            "unicorn/prefer-structured-clone": "off",
            "unicorn/prefer-then-catch": "off",
            "unicorn/prefer-toggle-attribute": "off",
            "unicorn/prefer-top-level-await": "off",
            "unicorn/require-array-sort-compare": "off",
            // adds lines by design, and two files already sit over the 400-line ratchet
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
